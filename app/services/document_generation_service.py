"""
Document Generation Service
Generowanie spersonalizowanych dokumentów prawnych na podstawie analizy AI
"""

import os
import logging
from typing import Optional, Dict, Any, List
from datetime import datetime
from pathlib import Path
import json
from jinja2 import Environment, FileSystemLoader, Template
from sqlalchemy.orm import Session

from app.models.case import Case, Analysis, LegalDocument
from app.models.user import User

# Configure logging
logger = logging.getLogger(__name__)

class DocumentGenerationService:
    """Service do generowania spersonalizowanych dokumentów prawnych"""
    
    def __init__(self, db: Session):
        self.db = db
        self.templates_dir = Path("app/templates/legal_documents")
        self.output_dir = Path("uploads/generated_documents")
        
        # Ensure directories exist
        self.templates_dir.mkdir(parents=True, exist_ok=True)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(self.templates_dir),
            autoescape=True
        )
        
        # Add custom filters
        self._add_custom_filters()
    
    def _add_custom_filters(self):
        """Dodaj niestandardowe filtry Jinja2"""
        
        def format_date(date, format='%d.%m.%Y'):
            """Format date for Polish legal documents"""
            if isinstance(date, str):
                try:
                    date = datetime.fromisoformat(date.replace('Z', '+00:00'))
                except:
                    return date
            return date.strftime(format) if date else ""
        
        def format_currency(amount):
            """Format currency for Polish documents"""
            if amount is None:
                return "0,00 zł"
            return f"{amount:,.2f} zł".replace(',', ' ').replace('.', ',')
        
        def upper_first(text):
            """Capitalize first letter"""
            return text[0].upper() + text[1:] if text else ""
        
        self.jinja_env.filters['format_date'] = format_date
        self.jinja_env.filters['format_currency'] = format_currency
        self.jinja_env.filters['upper_first'] = upper_first
    
    def get_document_templates(self) -> List[Dict[str, Any]]:
        """Pobierz dostępne szablony dokumentów"""
        templates = [
            {
                "type": "pozew",
                "name": "Pozew o zapłatę",
                "description": "Szablon pozwu o zapłatę należności",
                "file": "pozew_o_zaplate.html",
                "required_fields": ["defendant_name", "amount", "reason", "court_name"]
            },
            {
                "type": "wezwanie",
                "name": "Wezwanie do zapłaty",
                "description": "Formalne wezwanie do zapłaty przed pozwem",
                "file": "wezwanie_do_zaplaty.html",
                "required_fields": ["debtor_name", "amount", "due_date", "description"]
            },
            {
                "type": "wniosek",
                "name": "Wniosek procesowy",
                "description": "Uniwersalny wniosek procesowy do sądu",
                "file": "wniosek_procesowy.html",
                "required_fields": ["court_name", "case_number", "request_content"]
            },
            {
                "type": "odpowiedz",
                "name": "Odpowiedź na pozew",
                "description": "Szablon odpowiedzi na pozew sądowy",
                "file": "odpowiedz_na_pozew.html",
                "required_fields": ["court_name", "case_number", "plaintiff_name", "defense_arguments"]
            },
            {
                "type": "pismo",
                "name": "Pismo procesowe",
                "description": "Ogólne pismo procesowe do sądu",
                "file": "pismo_procesowe.html",
                "required_fields": ["court_name", "case_number", "content"]
            },
            {
                "type": "skarga",
                "name": "Skarga na postanowienie",
                "description": "Szablon skargi na postanowienie sądu",
                "file": "skarga_na_postanowienie.html",
                "required_fields": ["court_name", "case_number", "decision_date", "complaint_reasons"]
            }
        ]
        return templates
    
    def create_default_templates(self):
        """Utwórz domyślne szablony dokumentów"""
        templates = {
            "pozew_o_zaplate.html": """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Pozew o zapłatę</title>
    <style>
        body { font-family: Times, serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
        .header { text-align: right; margin-bottom: 30px; }
        .court { font-weight: bold; margin-bottom: 20px; }
        .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 30px 0; }
        .content { text-align: justify; }
        .signature { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        {{ client.full_name }}<br>
        {{ client.address }}<br>
        tel. {{ client.phone | default('') }}<br>
        email: {{ client.email }}
    </div>

    <div class="court">
        {{ court_name | default('Sąd Rejonowy') }}
    </div>

    <div class="title">
        POZEW O ZAPŁATĘ
    </div>

    <div class="content">
        <p><strong>Powód:</strong> {{ client.full_name }}, {{ client.address }}</p>
        <p><strong>Pozwany:</strong> {{ defendant_name }}, {{ defendant_address | default('adres nieznany') }}</p>
        
        <h3>Żądanie pozwu:</h3>
        <p>Zasądzenie od pozwanego na rzecz powoda kwoty <strong>{{ amount | format_currency }}</strong> wraz z ustawowymi odsetkami od dnia {{ due_date | format_date }} do dnia zapłaty oraz zwrot kosztów postępowania.</p>
        
        <h3>Uzasadnienie:</h3>
        <p>{{ reason | default('Pozwany zaciągnął wobec powoda zobowiązanie, które nie zostało zrealizowane w terminie.') }}</p>
        
        {% if analysis_summary %}
        <h3>Analiza prawna:</h3>
        <p>{{ analysis_summary }}</p>
        {% endif %}
        
        <h3>Dowody:</h3>
        <ul>
        {% for document in documents %}
            <li>{{ document.original_filename }}</li>
        {% endfor %}
        </ul>
        
        <p>Na podstawie powyższego wnoszę jak w petitum.</p>
    </div>

    <div class="signature">
        <p>{{ current_date | format_date }}</p>
        <p>{{ client.full_name }}</p>
    </div>
</body>
</html>
            """,
            
            "wezwanie_do_zaplaty.html": """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Wezwanie do zapłaty</title>
    <style>
        body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
        .header { text-align: right; margin-bottom: 30px; }
        .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 30px 0; }
        .content { text-align: justify; }
        .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; margin: 20px 0; }
        .signature { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        {{ client.full_name }}<br>
        {{ client.address }}<br>
        tel. {{ client.phone | default('') }}<br>
        email: {{ client.email }}<br><br>
        {{ current_date | format_date }}
    </div>

    <p><strong>Do:</strong> {{ debtor_name }}<br>
    {{ debtor_address | default('') }}</p>

    <div class="title">
        WEZWANIE DO ZAPŁATY
    </div>

    <div class="content">
        <p>Szanowni Państwo,</p>
        
        <p>Niniejszym wzywam do zapłaty kwoty <strong>{{ amount | format_currency }}</strong> z tytułu {{ description | default('należności') }}, która była wymagalna w dniu {{ due_date | format_date }}.</p>
        
        <div class="warning">
            <strong>UWAGA:</strong> W przypadku braku zapłaty w terminie 14 dni od otrzymania niniejszego wezwania, zobowiązany zostanę do wystąpienia na drogę sądową, co wiąże się z dodatkowymi kosztami postępowania oraz odsetkami ustawowymi.
        </div>
        
        <p>Jednocześnie informuję, że w przypadku braku kontaktu z Państwa strony w powyższym terminie, sprawa zostanie przekazana do dalszego postępowania prawnego.</p>
        
        <p>Płatność proszę dokonać na konto:</p>
        <p><strong>{{ bank_account | default('Nr konta: podać numer konta') }}</strong></p>
        
        <p>Z poważaniem,</p>
    </div>

    <div class="signature">
        <p>{{ client.full_name }}</p>
    </div>
</body>
</html>
            """,
            
            "wniosek_procesowy.html": """
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Wniosek procesowy</title>
    <style>
        body { font-family: Times, serif; font-size: 12pt; line-height: 1.6; margin: 40px; }
        .header { text-align: right; margin-bottom: 30px; }
        .court { font-weight: bold; margin-bottom: 20px; }
        .title { text-align: center; font-weight: bold; font-size: 14pt; margin: 30px 0; }
        .content { text-align: justify; }
        .signature { margin-top: 50px; text-align: right; }
    </style>
</head>
<body>
    <div class="header">
        {{ client.full_name }}<br>
        {{ client.address }}<br>
        tel. {{ client.phone | default('') }}<br>
        email: {{ client.email }}
    </div>

    <div class="court">
        {{ court_name | default('Sąd Rejonowy') }}<br>
        {% if case_number %}Sygn. akt {{ case_number }}{% endif %}
    </div>

    <div class="title">
        WNIOSEK PROCESOWY
    </div>

    <div class="content">
        <p><strong>Wnioskodawca:</strong> {{ client.full_name }}, {{ client.address }}</p>
        
        <h3>Treść wniosku:</h3>
        <p>{{ request_content }}</p>
        
        <h3>Uzasadnienie:</h3>
        <p>{{ justification | default('Zgodnie z przepisami prawa, wniosek jest uzasadniony następującymi okolicznościami:') }}</p>
        
        {% if analysis_summary %}
        <h3>Analiza prawna:</h3>
        <p>{{ analysis_summary }}</p>
        {% endif %}
        
        <p>Na podstawie powyższego wnoszę jak wyżej.</p>
    </div>

    <div class="signature">
        <p>{{ current_date | format_date }}</p>
        <p>{{ client.full_name }}</p>
    </div>
</body>
</html>
            """
        }
        
        for filename, content in templates.items():
            template_path = self.templates_dir / filename
            if not template_path.exists():
                with open(template_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                logger.info(f"Utworzono szablon: {filename}")
    
    def generate_document_from_analysis(self, case_id: int, document_type: str, custom_data: Optional[Dict] = None) -> Optional[LegalDocument]:
        """Generuje dokument na podstawie analizy sprawy"""
        
        # Pobierz sprawę i analizę
        case = self.db.query(Case).filter(Case.id == case_id).first()
        if not case:
            logger.error(f"Nie znaleziono sprawy o ID {case_id}")
            return None
        
        analysis = self.db.query(Analysis).filter(Analysis.case_id == case_id).first()
        
        # Przygotuj dane do szablonu
        template_data = self._prepare_template_data(case, analysis, custom_data or {})
        
        # Generuj dokument
        generated_file = self._generate_document_file(document_type, template_data)
        if not generated_file:
            return None
        
        # Read generated HTML content
        html_content = ""
        try:
            with open(generated_file, 'r', encoding='utf-8') as f:
                html_content = f.read()
        except Exception as e:
            logger.error(f"Błąd podczas czytania wygenerowanego pliku: {e}")
        
        # Zapisz w bazie danych
        legal_document = LegalDocument(
            case_id=case_id,
            document_type=document_type,
            document_name=f"{document_type.title()} - {case.title}",
            content=html_content,
            price=0.0,  # Free by default
            is_purchased=False,
            is_preview=True,  # Draft by default
            instructions=f"Dokument wygenerowany automatycznie na podstawie analizy sprawy."
        )
        
        self.db.add(legal_document)
        self.db.commit()
        self.db.refresh(legal_document)
        
        logger.info(f"Wygenerowano dokument {document_type} dla sprawy {case_id}")
        return legal_document
    
    def _prepare_template_data(self, case: Case, analysis: Optional[Analysis], custom_data: Dict) -> Dict[str, Any]:
        """Przygotuj dane do szablonu dokumentu"""
        
        # Base template data
        data = {
            "current_date": datetime.now(),
            "case": {
                "id": case.id,
                "title": case.title,
                "description": case.description,
                "client_notes": case.client_notes,
                "client_context": case.client_context,
                "status": case.status.value if case.status else None,
                "created_at": case.created_at
            },
            "client": {
                "full_name": f"{case.user.first_name or ''} {case.user.last_name or ''}".strip() or case.user.email,
                "email": case.user.email,
                "phone": getattr(case.user, 'phone', ''),
                "address": getattr(case.user, 'address', '')
            },
            "documents": []
        }
        
        # Add analysis data if available
        if analysis:
            data["analysis_summary"] = analysis.summary
            data["analysis_recommendations"] = analysis.recommendations
            data["analysis_actions"] = analysis.possible_actions
        
        # Add document information
        for doc in case.documents:
            data["documents"].append({
                "id": doc.id,
                "original_filename": doc.original_filename,
                "document_type": doc.document_type.value if doc.document_type else None,
                "file_size": doc.file_size,
                "uploaded_at": doc.uploaded_at
            })
        
        # Extract key information from analysis metadata
        if analysis and analysis.metadata:
            try:
                metadata = json.loads(analysis.metadata) if isinstance(analysis.metadata, str) else analysis.metadata
                data.update(metadata)
            except (json.JSONDecodeError, TypeError):
                pass
        
        # Apply custom data (overwrites defaults)
        data.update(custom_data)
        
        return data
    
    def _generate_document_file(self, document_type: str, data: Dict[str, Any]) -> Optional[Path]:
        """Generuje plik dokumentu HTML"""
        
        template_file = f"{document_type}.html"
        
        try:
            # Get template
            template = self.jinja_env.get_template(template_file)
            
            # Render content
            html_content = template.render(**data)
            
            # Generate output filename
            case_id = data.get("case", {}).get("id", "unknown")
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_filename = f"{document_type}_case_{case_id}_{timestamp}.html"
            output_path = self.output_dir / output_filename
            
            # Write file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            logger.info(f"Wygenerowano dokument: {output_path}")
            return output_path
            
        except Exception as e:
            logger.error(f"Błąd podczas generowania dokumentu {document_type}: {e}")
            return None
    
    def update_document(self, document_id: int, custom_data: Dict[str, Any]) -> Optional[LegalDocument]:
        """Aktualizuje istniejący dokument"""
        
        document = self.db.query(LegalDocument).filter(LegalDocument.id == document_id).first()
        if not document:
            logger.error(f"Nie znaleziono dokumentu o ID {document_id}")
            return None
        
        # Get case and analysis
        case = self.db.query(Case).filter(Case.id == document.case_id).first()
        analysis = self.db.query(Analysis).filter(Analysis.case_id == document.case_id).first()
        
        # Merge existing metadata with new data
        existing_metadata = {}
        if document.metadata:
            try:
                existing_metadata = json.loads(document.metadata) if isinstance(document.metadata, str) else document.metadata
            except (json.JSONDecodeError, TypeError):
                pass
        
        existing_metadata.update(custom_data)
        
        # Regenerate document
        template_data = self._prepare_template_data(case, analysis, existing_metadata)
        new_file = self._generate_document_file(document.document_type, template_data)
        
        if new_file:
            # Read generated HTML content
            try:
                with open(new_file, 'r', encoding='utf-8') as f:
                    html_content = f.read()
                
                # Update database record
                document.content = html_content
                document.instructions = f"Dokument zaktualizowany {datetime.now().strftime('%d.%m.%Y %H:%M')}"
                
                self.db.commit()
                self.db.refresh(document)
                
                logger.info(f"Zaktualizowano dokument {document_id}")
            except Exception as e:
                logger.error(f"Błąd podczas aktualizowania dokumentu: {e}")
            
        return document
    
    def finalize_document(self, document_id: int) -> bool:
        """Finalizuje dokument (oznacza jako gotowy)"""
        
        document = self.db.query(LegalDocument).filter(LegalDocument.id == document_id).first()
        if not document:
            return False
        
        document.is_preview = False  # No longer a preview
        document.instructions = f"Dokument sfinalizowany {datetime.now().strftime('%d.%m.%Y %H:%M')}"
        
        self.db.commit()
        
        logger.info(f"Sfinalizowano dokument {document_id}")
        return True
    
    def get_case_documents(self, case_id: int) -> List[LegalDocument]:
        """Pobierz wszystkie wygenerowane dokumenty dla sprawy"""
        return self.db.query(LegalDocument).filter(LegalDocument.case_id == case_id).order_by(LegalDocument.created_at.desc()).all()


# Factory function
def create_document_generation_service(db: Session) -> DocumentGenerationService:
    """Factory function do tworzenia instancji serwisu"""
    service = DocumentGenerationService(db)
    service.create_default_templates()  # Ensure templates exist
    return service