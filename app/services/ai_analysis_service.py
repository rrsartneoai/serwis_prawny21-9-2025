"""
AI Analysis Service for Document Processing
Uses Gemini AI for OCR, text analysis, and legal document processing
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any
from google import genai
from google.genai import types
from pydantic import BaseModel
import base64
from pathlib import Path
import fitz  # PyMuPDF for PDF processing
from PIL import Image
import io

logger = logging.getLogger(__name__)

# Initialize Gemini client
client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

class DocumentAnalysisResult(BaseModel):
    """Result of document analysis"""
    document_type: str
    confidence: float
    extracted_text: str
    key_information: Dict[str, Any]
    legal_assessment: Dict[str, Any]
    suggestions: List[str]
    compliance_check: Dict[str, Any]
    risk_level: str  # LOW, MEDIUM, HIGH
    action_items: List[str]

class LegalDocumentClassification(BaseModel):
    """Classification of legal document type"""
    document_type: str
    confidence: float
    subcategory: Optional[str] = None

class KeyInformationExtraction(BaseModel):
    """Extracted key information from legal document"""
    parties: List[str]
    dates: List[str]
    amounts: List[str]
    deadlines: List[str]
    court_info: Optional[str] = None
    case_number: Optional[str] = None
    jurisdiction: Optional[str] = None

class AIAnalysisService:
    """Service for AI-powered document analysis"""
    
    def __init__(self):
        self.model_name = "gemini-2.5-pro"
        self.flash_model = "gemini-2.5-flash"
        
    async def analyze_document(self, file_path: str, user_context: str = "") -> DocumentAnalysisResult:
        """
        Comprehensive document analysis including OCR, classification, and legal assessment
        """
        try:
            # Extract text from document
            extracted_text = await self._extract_text_from_file(file_path)
            
            # Classify document type
            classification = await self._classify_document(extracted_text)
            
            # Extract key information
            key_info = await self._extract_key_information(extracted_text)
            
            # Perform legal assessment
            legal_assessment = await self._perform_legal_assessment(
                extracted_text, classification.document_type, user_context
            )
            
            # Generate suggestions
            suggestions = await self._generate_suggestions(
                extracted_text, classification.document_type, key_info, user_context
            )
            
            # Assess compliance and risk
            compliance_check = await self._check_compliance(extracted_text, classification.document_type)
            risk_level = await self._assess_risk_level(extracted_text, legal_assessment)
            
            # Generate action items
            action_items = await self._generate_action_items(
                extracted_text, classification.document_type, legal_assessment, user_context
            )
            
            return DocumentAnalysisResult(
                document_type=classification.document_type,
                confidence=classification.confidence,
                extracted_text=extracted_text,
                key_information=key_info.dict(),
                legal_assessment=legal_assessment,
                suggestions=suggestions,
                compliance_check=compliance_check,
                risk_level=risk_level,
                action_items=action_items
            )
            
        except Exception as e:
            logger.error(f"Error analyzing document: {e}")
            raise Exception(f"Document analysis failed: {str(e)}")
    
    async def _extract_text_from_file(self, file_path: str) -> str:
        """Extract text from PDF or image file using OCR"""
        try:
            file_extension = Path(file_path).suffix.lower()
            
            if file_extension == '.pdf':
                return await self._extract_text_from_pdf(file_path)
            elif file_extension in ['.jpg', '.jpeg', '.png']:
                return await self._extract_text_from_image(file_path)
            else:
                raise ValueError(f"Unsupported file type: {file_extension}")
                
        except Exception as e:
            logger.error(f"Error extracting text from {file_path}: {e}")
            raise
    
    async def _extract_text_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF and Gemini OCR"""
        try:
            # First try to extract text directly from PDF
            doc = fitz.open(file_path)
            text_content = ""
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                text_content += page.get_text()
            
            doc.close()
            
            # If direct text extraction yields substantial content, use it
            if len(text_content.strip()) > 100:
                return text_content
            
            # Otherwise, convert PDF pages to images and use OCR
            doc = fitz.open(file_path)
            full_text = ""
            
            for page_num in range(min(len(doc), 10)):  # Limit to first 10 pages
                page = doc.load_page(page_num)
                pix = page.get_pixmap()
                img_data = pix.tobytes("png")
                
                # Use Gemini for OCR
                page_text = await self._ocr_with_gemini(img_data, "image/png")
                full_text += f"\n--- Strona {page_num + 1} ---\n{page_text}\n"
            
            doc.close()
            return full_text
            
        except Exception as e:
            logger.error(f"Error extracting text from PDF: {e}")
            raise
    
    async def _extract_text_from_image(self, file_path: str) -> str:
        """Extract text from image using Gemini OCR"""
        try:
            with open(file_path, "rb") as f:
                image_data = f.read()
            
            # Determine MIME type
            file_extension = Path(file_path).suffix.lower()
            mime_type = f"image/{file_extension[1:]}"  # Remove the dot
            
            return await self._ocr_with_gemini(image_data, mime_type)
            
        except Exception as e:
            logger.error(f"Error extracting text from image: {e}")
            raise
    
    async def _ocr_with_gemini(self, image_data: bytes, mime_type: str) -> str:
        """Use Gemini for OCR on image data"""
        try:
            prompt = """
            Proszę wyodrębnić cały tekst z tego dokumentu. 
            Zachowaj oryginalną strukturę i formatowanie tekstu.
            Zwróć szczególną uwagę na:
            - Daty i liczby
            - Nazwy własne i instytucji
            - Kwoty pieniężne
            - Adresy i dane kontaktowe
            
            Zwróć tylko wyodrębniony tekst, bez dodatkowych komentarzy.
            """
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=[
                    types.Part.from_bytes(data=image_data, mime_type=mime_type),
                    prompt
                ]
            )
            
            return response.text if response.text else ""
            
        except Exception as e:
            logger.error(f"Error with Gemini OCR: {e}")
            raise
    
    async def _classify_document(self, text: str) -> LegalDocumentClassification:
        """Classify the type of legal document"""
        try:
            prompt = f"""
            Przeanalizuj poniższy tekst i sklasyfikuj typ dokumentu prawnego.
            
            Tekst dokumentu:
            {text[:2000]}  # Limit to first 2000 characters
            
            Zwróć odpowiedź w formacie JSON:
            {{
                "document_type": "typ dokumentu (np. 'Nakaz zapłaty', 'Pozew', 'Wezwanie komornika', 'Umowa', 'Upomnienie', 'Inne')",
                "confidence": wartość_od_0_do_1,
                "subcategory": "opcjonalna podkategoria"
            }}
            """
            
            response = client.models.generate_content(
                model=self.flash_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=LegalDocumentClassification,
                ),
            )
            
            if response.text:
                data = json.loads(response.text)
                return LegalDocumentClassification(**data)
            else:
                return LegalDocumentClassification(document_type="Nieznany", confidence=0.0)
                
        except Exception as e:
            logger.error(f"Error classifying document: {e}")
            return LegalDocumentClassification(document_type="Nieznany", confidence=0.0)
    
    async def _extract_key_information(self, text: str) -> KeyInformationExtraction:
        """Extract key information from legal document"""
        try:
            prompt = f"""
            Wyodrębnij kluczowe informacje z tego dokumentu prawnego:
            
            {text[:3000]}
            
            Zwróć odpowiedź w formacie JSON:
            {{
                "parties": ["lista stron/uczestników sprawy"],
                "dates": ["lista ważnych dat"],
                "amounts": ["lista kwot pieniężnych"],
                "deadlines": ["lista terminów do wykonania"],
                "court_info": "informacje o sądzie/instytucji",
                "case_number": "numer sprawy/sygnatury",
                "jurisdiction": "właściwość miejscowa"
            }}
            """
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=KeyInformationExtraction,
                ),
            )
            
            if response.text:
                data = json.loads(response.text)
                return KeyInformationExtraction(**data)
            else:
                return KeyInformationExtraction(parties=[], dates=[], amounts=[], deadlines=[])
                
        except Exception as e:
            logger.error(f"Error extracting key information: {e}")
            return KeyInformationExtraction(parties=[], dates=[], amounts=[], deadlines=[])
    
    async def _perform_legal_assessment(self, text: str, document_type: str, user_context: str) -> Dict[str, Any]:
        """Perform legal assessment of the document"""
        try:
            prompt = f"""
            Jako ekspert prawnik, przeanalizuj ten dokument pod kątem prawnym:
            
            Typ dokumentu: {document_type}
            Kontekst użytkownika: {user_context}
            
            Dokument:
            {text[:4000]}
            
            Dokonaj oceny prawnej i zwróć analizę w formacie JSON:
            {{
                "validity": "czy dokument jest prawnie ważny",
                "completeness": "czy dokument jest kompletny",
                "potential_issues": ["lista potencjalnych problemów"],
                "legal_basis": "podstawa prawna",
                "user_rights": ["prawa użytkownika"],
                "user_obligations": ["obowiązki użytkownika"],
                "next_steps": ["zalecane następne kroki"],
                "deadline_analysis": "analiza terminów"
            }}
            """
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            
            if response.text:
                return json.loads(response.text)
            else:
                return {"error": "Nie udało się przeprowadzić oceny prawnej"}
                
        except Exception as e:
            logger.error(f"Error performing legal assessment: {e}")
            return {"error": f"Błąd analizy prawnej: {str(e)}"}
    
    async def _generate_suggestions(self, text: str, document_type: str, key_info: KeyInformationExtraction, user_context: str) -> List[str]:
        """Generate actionable suggestions based on document analysis"""
        try:
            prompt = f"""
            Na podstawie analizy dokumentu, wygeneruj praktyczne sugestie dla użytkownika:
            
            Typ dokumentu: {document_type}
            Kontekst użytkownika: {user_context}
            Kluczowe informacje: {key_info.dict()}
            
            Zwróć listę konkretnych, praktycznych sugestii w formacie JSON:
            {{
                "suggestions": ["lista sugestii"]
            }}
            """
            
            response = client.models.generate_content(
                model=self.flash_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            
            if response.text:
                data = json.loads(response.text)
                return data.get("suggestions", [])
            else:
                return ["Przeprowadź dokładną analizę z prawnikiem"]
                
        except Exception as e:
            logger.error(f"Error generating suggestions: {e}")
            return ["Skonsultuj się z prawnikiem w sprawie tego dokumentu"]
    
    async def _check_compliance(self, text: str, document_type: str) -> Dict[str, Any]:
        """Check compliance with legal requirements"""
        try:
            prompt = f"""
            Sprawdź zgodność dokumentu z wymogami prawnymi:
            
            Typ dokumentu: {document_type}
            Dokument: {text[:3000]}
            
            Zwróć analizę zgodności w formacie JSON:
            {{
                "formal_requirements": "czy spełnia wymogi formalne",
                "missing_elements": ["lista brakujących elementów"],
                "compliance_score": wartość_od_0_do_100,
                "critical_issues": ["lista krytycznych problemów"]
            }}
            """
            
            response = client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            
            if response.text:
                return json.loads(response.text)
            else:
                return {"compliance_score": 0, "critical_issues": ["Nie można ocenić zgodności"]}
                
        except Exception as e:
            logger.error(f"Error checking compliance: {e}")
            return {"compliance_score": 0, "critical_issues": ["Błąd sprawdzania zgodności"]}
    
    async def _assess_risk_level(self, text: str, legal_assessment: Dict[str, Any]) -> str:
        """Assess risk level based on document content and legal assessment"""
        try:
            # Simple risk assessment based on potential issues
            potential_issues = legal_assessment.get("potential_issues", [])
            critical_issues = legal_assessment.get("critical_issues", [])
            
            if len(critical_issues) > 0 or len(potential_issues) > 3:
                return "HIGH"
            elif len(potential_issues) > 1:
                return "MEDIUM"
            else:
                return "LOW"
                
        except Exception as e:
            logger.error(f"Error assessing risk level: {e}")
            return "MEDIUM"
    
    async def _generate_action_items(self, text: str, document_type: str, legal_assessment: Dict[str, Any], user_context: str) -> List[str]:
        """Generate specific action items for the user"""
        try:
            prompt = f"""
            Na podstawie analizy prawnej, wygeneruj konkretne działania do podjęcia:
            
            Typ dokumentu: {document_type}
            Kontekst: {user_context}
            Ocena prawna: {json.dumps(legal_assessment, ensure_ascii=False)}
            
            Zwróć listę konkretnych działań w formacie JSON:
            {{
                "action_items": ["lista konkretnych działań z terminami"]
            }}
            """
            
            response = client.models.generate_content(
                model=self.flash_model,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                ),
            )
            
            if response.text:
                data = json.loads(response.text)
                return data.get("action_items", [])
            else:
                return ["Skonsultuj się z prawnikiem w ciągu 7 dni"]
                
        except Exception as e:
            logger.error(f"Error generating action items: {e}")
            return ["Skonsultuj się z prawnikiem w tej sprawie"]

# Global instance
ai_analysis_service = AIAnalysisService()