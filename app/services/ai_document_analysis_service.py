"""
AI Document Analysis Service
Automatyczna analiza dokumentów prawnych z użyciem AI
"""

import os
import io
import logging
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime
try:
    import google.generativeai as genai
except ImportError:
    genai = None
import fitz  # PyMuPDF
import pytesseract
from PIL import Image
from sqlalchemy.orm import Session

from app.models.case import Case, Document, Analysis, DocumentType
from app.models.user import User


# Configure logging
logger = logging.getLogger(__name__)

# Konfiguracja Google Gemini API
GEMINI_API_KEY = os.getenv("GOOGLE_AI_API_KEY")
if GEMINI_API_KEY and genai:
    genai.configure(api_key=GEMINI_API_KEY)

class AIDocumentAnalysisService:
    """Service do automatycznej analizy dokumentów prawnych z użyciem AI"""
    
    def __init__(self, db: Session):
        self.db = db
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp') if GEMINI_API_KEY and genai else None
    
    def extract_text_from_pdf(self, file_path: str) -> str:
        """Ekstrakt tekstu z pliku PDF"""
        try:
            doc = fitz.open(file_path)
            text = ""
            for page in doc:
                text += page.get_text()
            doc.close()
            return text.strip()
        except Exception as e:
            logger.error(f"Błąd podczas ekstraktowania tekstu z PDF {file_path}: {e}")
            return ""
    
    def extract_text_from_image(self, file_path: str) -> str:
        """Ekstrakt tekstu z obrazu za pomocą OCR (Tesseract)"""
        try:
            image = Image.open(file_path)
            # Konfiguracja OCR dla polskiego języka
            config = '-l pol --oem 3 --psm 6'
            text = pytesseract.image_to_string(image, config=config)
            return text.strip()
        except Exception as e:
            logger.error(f"Błąd podczas OCR dla {file_path}: {e}")
            return ""
    
    def extract_text_from_document(self, document: Document) -> str:
        """Główna funkcja ekstraktowania tekstu z dokumentu"""
        file_path_str = str(document.file_path) if hasattr(document.file_path, '__str__') else document.file_path
        
        if not os.path.exists(file_path_str):
            logger.error(f"Plik nie istnieje: {file_path_str}")
            return ""
        
        text = ""
        
        if document.document_type == DocumentType.PDF:
            text = self.extract_text_from_pdf(file_path_str)
        elif document.document_type in [DocumentType.PHOTO, DocumentType.IMAGE]:
            text = self.extract_text_from_image(file_path_str)
        elif document.document_type == DocumentType.SCAN:
            # Próbuj najpierw jako PDF, potem jako obraz
            text = self.extract_text_from_pdf(file_path_str)
            if not text:
                text = self.extract_text_from_image(file_path_str)
        
        # Zaktualizuj OCR text w bazie danych - need to update the document object properly
        # This will be handled by the caller
        
        return text
    
    def generate_legal_analysis(self, case: Case, documents_text: str, client_context: Optional[str] = None) -> Dict[str, Any]:
        """Generuje analizę prawną za pomocą AI"""
        
        if not self.model:
            logger.error("Brak klucza API dla Google Gemini")
            return self._create_error_analysis("Brak konfiguracji AI")
        
        try:
            # Przygotuj prompt dla AI
            system_prompt = """
            Jesteś doświadczonym prawnikiem specjalizującym się w prawie polskim. 
            Twoim zadaniem jest przeprowadzenie szczegółowej analizy dokumentów prawnych.
            
            Przeanalizuj otrzymane dokumenty i przygotuj:
            1. STRESZCZENIE - krótkie podsumowanie sytuacji prawnej
            2. SZCZEGÓŁOWA ANALIZA - dogłębna analiza prawna z powołaniem na przepisy
            3. REKOMENDACJE - zalecane działania i możliwe opcje postępowania
            4. MOŻLIWE DZIAŁANIA - konkretne kroki które klient może podjąć
            
            Zawsze podkreślaj, że analiza wymaga weryfikacji przez kwalifikowanego prawnika.
            Używaj profesjonalnej terminologii prawnej, ale wyjaśniaj skomplikowane pojęcia.
            """
            
            # Convert fields to strings safely
            case_title = str(case.title) if hasattr(case.title, '__str__') else case.title or "Bez tytułu"
            case_description = str(case.description) if case.description else 'Brak opisu'
            case_client_notes = str(case.client_notes) if case.client_notes else 'Brak uwag'
            case_client_context = str(case.client_context) if case.client_context else 'Brak dodatkowego kontekstu'
            case_client_agreement = str(case.client_agreement) if case.client_agreement else 'Brak informacji o stanowisku'
            
            user_prompt = f"""
            SPRAWA: {case_title}
            
            OPIS SPRAWY: {case_description}
            
            UWAGI KLIENTA: {case_client_notes}
            
            KONTEKST KLIENTA: {client_context or case_client_context}
            
            STAN SPRAWY KLIENTA: {case_client_agreement}
            
            TREŚĆ DOKUMENTÓW:
            {documents_text}
            
            Przygotuj szczegółową analizę prawną tej sprawy.
            """
            
            # Generuj analizę za pomocą AI
            response = self.model.generate_content(user_prompt)
            
            # Przetwórz odpowiedź AI
            analysis_text = response.text
            
            # Podziel analizę na sekcje (heurystyka)
            summary = self._extract_section(analysis_text, "STRESZCZENIE")
            content = analysis_text  # Pełna analiza
            recommendations = self._extract_section(analysis_text, "REKOMENDACJE")
            possible_actions = self._extract_section(analysis_text, "MOŻLIWE DZIAŁANIA")
            
            return {
                "content": content,
                "summary": summary or analysis_text[:500] + "..." if len(analysis_text) > 500 else analysis_text,
                "recommendations": recommendations or "Szczegółowe rekomendacje znajdują się w pełnej analizie.",
                "possible_actions": possible_actions or "Możliwe działania opisane są w analizie.",
                "confidence_score": 0.85,  # Standardowa pewność
                "is_ai_generated": True
            }
            
        except Exception as e:
            logger.error(f"Błąd podczas generowania analizy AI: {e}")
            return self._create_error_analysis(f"Błąd AI: {str(e)}")
    
    def _extract_section(self, text: str, section_name: str) -> Optional[str]:
        """Pomocnicza funkcja do wyciągania sekcji z tekstu AI"""
        try:
            lines = text.split('\n')
            in_section = False
            section_content = []
            
            for line in lines:
                if section_name.upper() in line.upper():
                    in_section = True
                    continue
                elif in_section and any(keyword in line.upper() for keyword in ['SZCZEGÓŁOWA', 'REKOMENDACJE', 'MOŻLIWE', 'PODSUMOWANIE']):
                    break
                elif in_section:
                    section_content.append(line)
            
            result = '\n'.join(section_content).strip()
            return result if result else None
            
        except Exception:
            return None
    
    def _create_error_analysis(self, error_message: str) -> Dict[str, Any]:
        """Tworzy analizę błędu gdy AI nie może wygenerować analizy"""
        return {
            "content": f"Nie udało się wygenerować automatycznej analizy. Przyczyna: {error_message}. Sprawa zostanie przekazana do operatora do ręcznej analizy.",
            "summary": "Wymagana ręczna analiza przez operatora",
            "recommendations": "Sprawa zostanie przeanalizowana przez doświadczonego operatora.",
            "possible_actions": "Oczekiwanie na analizę operatora",
            "confidence_score": 0.0,
            "is_ai_generated": True
        }
    
    def analyze_case_documents(self, case_id: int, operator_id: Optional[int] = None) -> Optional[Analysis]:
        """Główna funkcja do automatycznej analizy wszystkich dokumentów sprawy"""
        
        # Pobierz sprawę z dokumentami
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            logger.error(f"Nie znaleziono sprawy o ID {case_id}")
            return None
        
        # Pobierz dokumenty sprawy
        documents = self.db.query(Document).filter(Document.case_id == case_id).all()
        if not documents:
            logger.warning(f"Brak dokumentów dla sprawy {case_id}")
            return None
        
        # Ekstraktuj tekst ze wszystkich dokumentów
        all_documents_text = ""
        processed_docs = 0
        
        for doc in documents:
            doc_text = self.extract_text_from_document(doc)
            if doc_text:
                # Update the document with extracted text
                doc.ocr_text = doc_text
                doc.is_processed = True
                
                original_filename = str(doc.original_filename) if hasattr(doc.original_filename, '__str__') else doc.original_filename
                all_documents_text += f"\n\n=== DOKUMENT: {original_filename} ===\n{doc_text}"
                processed_docs += 1
        
        if not all_documents_text.strip():
            logger.warning(f"Nie udało się wyekstraktować tekstu z żadnego dokumentu sprawy {case_id}")
            # Stwórz analizę informującą o problemie
            analysis_data = self._create_error_analysis("Nie udało się odczytać treści dokumentów")
        else:
            # Generuj analizę AI
            analysis_data = self.generate_legal_analysis(case, all_documents_text, case.client_context)
        
        # Sprawdź czy analiza już istnieje
        existing_analysis = self.db.query(Analysis).filter(Analysis.case_id == case_id).first()
        
        if existing_analysis:
            # Zaktualizuj istniejącą analizę - use proper SQLAlchemy update
            existing_analysis.content = analysis_data["content"]
            existing_analysis.summary = analysis_data["summary"]
            existing_analysis.recommendations = analysis_data["recommendations"]
            existing_analysis.possible_actions = analysis_data["possible_actions"]
            existing_analysis.confidence_score = analysis_data["confidence_score"]
            existing_analysis.updated_at = datetime.utcnow()
            if operator_id:
                existing_analysis.operator_id = operator_id
            
            analysis = existing_analysis
        else:
            # Stwórz nową analizę
            analysis = Analysis(
                case_id=case_id,
                content=analysis_data["content"],
                summary=analysis_data["summary"],
                recommendations=analysis_data["recommendations"],
                possible_actions=analysis_data["possible_actions"],
                confidence_score=analysis_data["confidence_score"],
                is_preview=True,  # Początkowo tylko podgląd
                operator_id=operator_id,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            
            self.db.add(analysis)
        
        # Zaktualizuj status sprawy
        current_status = str(case.status.value) if hasattr(case.status, 'value') else str(case.status)
        if current_status in ['new', 'paid']:
            from app.models.case import CaseStatus
            case.status = CaseStatus.ANALYSIS_READY
            case.updated_at = datetime.utcnow()
        
        # Zapisz wszystko
        self.db.commit()
        self.db.refresh(analysis)
        
        logger.info(f"Wygenerowano analizę AI dla sprawy {case_id}, przetworzono {processed_docs} dokumentów")
        
        # Wyślij powiadomienie do klienta
        try:
            from app.services.notification_service import notification_service
            notification_service.send_analysis_ready(self.db, case)
        except Exception as e:
            logger.error(f"Błąd podczas wysyłania powiadomienia: {e}")
        
        return analysis
    
    def get_case_documents_summary(self, case_id: int) -> Dict[str, Any]:
        """Pobiera podsumowanie dokumentów sprawy"""
        documents = self.db.query(Document).filter(Document.case_id == case_id).all()
        
        summary = {
            "total_documents": len(documents),
            "processed_documents": len([d for d in documents if getattr(d, 'is_processed', False)]),
            "document_types": {},
            "total_text_length": 0,
            "has_ocr_text": 0
        }
        
        for doc in documents:
            doc_type = doc.document_type.value if doc.document_type and hasattr(doc.document_type, 'value') else "unknown"
            summary["document_types"][doc_type] = summary["document_types"].get(doc_type, 0) + 1
            
            ocr_text = str(doc.ocr_text) if doc.ocr_text else None
            if ocr_text:
                summary["total_text_length"] += len(ocr_text)
                summary["has_ocr_text"] += 1
        
        return summary


# Instance dla łatwego użycia
def create_ai_document_service(db: Session) -> AIDocumentAnalysisService:
    """Factory function do tworzenia instancji service"""
    return AIDocumentAnalysisService(db)