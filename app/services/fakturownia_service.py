"""
Fakturownia.pl API Integration Service
Provides billing and invoice management for AI Prawnik PL
"""

import os
import logging
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime, date
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class InvoiceItem:
    """Single item on an invoice"""
    name: str
    quantity: float
    price_net: float
    tax_rate: float = 23.0  # 23% VAT in Poland
    
    @property
    def price_gross(self) -> float:
        return self.price_net * (1 + self.tax_rate / 100)
    
    @property 
    def total_net(self) -> float:
        return self.price_net * self.quantity
    
    @property
    def total_gross(self) -> float:
        return self.price_gross * self.quantity

@dataclass
class Client:
    """Client information for invoicing"""
    name: str
    email: str
    address: Optional[str] = None
    city: Optional[str] = None
    postal_code: Optional[str] = None
    nip: Optional[str] = None  # Tax ID in Poland
    phone: Optional[str] = None

class FakturowniaService:
    """Service for managing invoices through Fakturownia.pl API"""
    
    def __init__(self):
        # Fakturownia API configuration
        self.api_token = os.environ.get("FAKTUROWNIA_API_TOKEN")
        self.account_slug = os.environ.get("FAKTUROWNIA_ACCOUNT_SLUG")  # your-account.fakturownia.pl
        
        self.is_configured = bool(self.api_token and self.account_slug)
        
        if self.is_configured:
            self.base_url = f"https://{self.account_slug}.fakturownia.pl"
            logger.info("Fakturownia service initialized")
        else:
            logger.warning("Fakturownia service not configured - missing API credentials")
    
    def create_invoice(
        self,
        client: Client,
        items: List[InvoiceItem],
        case_title: str,
        due_days: int = 14,
        payment_method: str = "transfer",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """Create new invoice in Fakturownia"""
        
        if not self.is_configured:
            return {
                "success": False,
                "error": "Fakturownia service not configured",
                "invoice_id": None,
                "invoice_url": None
            }
        
        try:
            # Calculate totals
            total_net = sum(item.total_net for item in items)
            total_gross = sum(item.total_gross for item in items)
            
            # Prepare invoice data
            invoice_data = {
                "invoice": {
                    "kind": "vat",  # VAT invoice
                    "number": None,  # Auto-generate
                    "sell_date": date.today().isoformat(),
                    "issue_date": date.today().isoformat(),
                    "payment_to": self._calculate_due_date(due_days),
                    "buyer_name": client.name,
                    "buyer_email": client.email,
                    "buyer_phone": client.phone,
                    "buyer_street": client.address,
                    "buyer_city": client.city,
                    "buyer_post_code": client.postal_code,
                    "buyer_nip": client.nip,
                    "buyer_country": "PL",
                    "description": f"Usługi prawne - {case_title}",
                    "payment_type": payment_method,
                    "status": "issued",
                    "lang": "pl",
                    "currency": "PLN",
                    "exchange_currency": "PLN",
                    "positions": [
                        {
                            "name": item.name,
                            "quantity": item.quantity,
                            "price_net": item.price_net,
                            "tax": item.tax_rate,
                            "total_price_gross": item.total_gross
                        }
                        for item in items
                    ]
                }
            }
            
            # Add notes if provided
            if notes:
                invoice_data["invoice"]["additional_info"] = notes
            
            # Send request to Fakturownia API
            response = requests.post(
                f"{self.base_url}/invoices.json",
                json=invoice_data,
                params={"api_token": self.api_token},
                headers={"Content-Type": "application/json"}
            )
            
            if response.ok:
                result = response.json()
                invoice_id = result.get("id")
                invoice_number = result.get("number")
                
                logger.info(f"Invoice created successfully: {invoice_number} (ID: {invoice_id})")
                
                return {
                    "success": True,
                    "invoice_id": invoice_id,
                    "invoice_number": invoice_number,
                    "invoice_url": f"{self.base_url}/invoices/{invoice_id}",
                    "pdf_url": f"{self.base_url}/invoices/{invoice_id}.pdf?api_token={self.api_token}",
                    "total_net": total_net,
                    "total_gross": total_gross,
                    "due_date": self._calculate_due_date(due_days),
                    "error": None
                }
            else:
                error_data = response.json() if response.headers.get("content-type", "").startswith("application/json") else {}
                error_message = error_data.get("error", f"HTTP {response.status_code}")
                logger.error(f"Fakturownia API error: {error_message}")
                
                return {
                    "success": False,
                    "error": f"Invoice creation failed: {error_message}",
                    "invoice_id": None,
                    "invoice_url": None
                }
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error creating invoice: {e}")
            return {
                "success": False,
                "error": f"Network error: {str(e)}",
                "invoice_id": None,
                "invoice_url": None
            }
        except Exception as e:
            logger.error(f"Unexpected error creating invoice: {e}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "invoice_id": None,
                "invoice_url": None
            }
    
    def get_invoice(self, invoice_id: int) -> Dict[str, Any]:
        """Get invoice details from Fakturownia"""
        
        if not self.is_configured:
            return {"success": False, "error": "Fakturownia service not configured"}
        
        try:
            response = requests.get(
                f"{self.base_url}/invoices/{invoice_id}.json",
                params={"api_token": self.api_token}
            )
            
            if response.ok:
                invoice_data = response.json()
                return {
                    "success": True,
                    "invoice": invoice_data,
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "error": f"Invoice not found or API error: {response.status_code}",
                    "invoice": None
                }
                
        except Exception as e:
            logger.error(f"Error fetching invoice {invoice_id}: {e}")
            return {
                "success": False,
                "error": f"Error fetching invoice: {str(e)}",
                "invoice": None
            }
    
    def mark_invoice_paid(self, invoice_id: int, payment_date: Optional[date] = None) -> Dict[str, Any]:
        """Mark invoice as paid in Fakturownia"""
        
        if not self.is_configured:
            return {"success": False, "error": "Fakturownia service not configured"}
        
        try:
            payment_data = {
                "invoice": {
                    "status": "paid",
                    "paid": True,
                    "payment_date": (payment_date or date.today()).isoformat()
                }
            }
            
            response = requests.put(
                f"{self.base_url}/invoices/{invoice_id}.json",
                json=payment_data,
                params={"api_token": self.api_token},
                headers={"Content-Type": "application/json"}
            )
            
            if response.ok:
                logger.info(f"Invoice {invoice_id} marked as paid")
                return {"success": True, "error": None}
            else:
                return {
                    "success": False,
                    "error": f"Failed to mark invoice as paid: {response.status_code}"
                }
                
        except Exception as e:
            logger.error(f"Error marking invoice {invoice_id} as paid: {e}")
            return {
                "success": False,
                "error": f"Error updating invoice: {str(e)}"
            }
    
    def get_invoices_list(self, limit: int = 25, page: int = 1) -> Dict[str, Any]:
        """Get list of invoices from Fakturownia"""
        
        if not self.is_configured:
            return {"success": False, "error": "Fakturownia service not configured"}
        
        try:
            params = {
                "api_token": self.api_token,
                "per_page": limit,
                "page": page
            }
            
            response = requests.get(
                f"{self.base_url}/invoices.json",
                params=params
            )
            
            if response.ok:
                invoices = response.json()
                return {
                    "success": True,
                    "invoices": invoices,
                    "count": len(invoices),
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to fetch invoices: {response.status_code}",
                    "invoices": []
                }
                
        except Exception as e:
            logger.error(f"Error fetching invoices list: {e}")
            return {
                "success": False,
                "error": f"Error fetching invoices: {str(e)}",
                "invoices": []
            }
    
    def create_client(self, client: Client) -> Dict[str, Any]:
        """Create or update client in Fakturownia"""
        
        if not self.is_configured:
            return {"success": False, "error": "Fakturownia service not configured"}
        
        try:
            client_data = {
                "client": {
                    "name": client.name,
                    "email": client.email,
                    "phone": client.phone,
                    "street": client.address,
                    "city": client.city,
                    "post_code": client.postal_code,
                    "nip": client.nip,
                    "country": "PL"
                }
            }
            
            response = requests.post(
                f"{self.base_url}/clients.json",
                json=client_data,
                params={"api_token": self.api_token},
                headers={"Content-Type": "application/json"}
            )
            
            if response.ok:
                result = response.json()
                return {
                    "success": True,
                    "client_id": result.get("id"),
                    "error": None
                }
            else:
                return {
                    "success": False,
                    "error": f"Failed to create client: {response.status_code}",
                    "client_id": None
                }
                
        except Exception as e:
            logger.error(f"Error creating client: {e}")
            return {
                "success": False,
                "error": f"Error creating client: {str(e)}",
                "client_id": None
            }
    
    def _calculate_due_date(self, due_days: int) -> str:
        """Calculate due date for invoice"""
        from datetime import timedelta
        due_date = date.today() + timedelta(days=due_days)
        return due_date.isoformat()
    
    # Predefined invoice templates for common legal services
    def create_analysis_invoice(self, client: Client, case_title: str, analysis_price: float = 99.0) -> Dict[str, Any]:
        """Create invoice for legal document analysis"""
        items = [
            InvoiceItem(
                name="Analiza dokumentów prawnych przez AI i prawnika",
                quantity=1,
                price_net=analysis_price / 1.23,  # Convert gross to net (23% VAT)
                tax_rate=23.0
            )
        ]
        
        return self.create_invoice(
            client=client,
            items=items,
            case_title=case_title,
            notes="Analiza dokumentów prawnych z wykorzystaniem sztucznej inteligencji i weryfikacją przez kwalifikowanego prawnika."
        )
    
    def create_document_invoice(self, client: Client, case_title: str, document_name: str, document_price: float) -> Dict[str, Any]:
        """Create invoice for legal document preparation"""
        items = [
            InvoiceItem(
                name=f"Przygotowanie dokumentu prawnego: {document_name}",
                quantity=1,
                price_net=document_price / 1.23,  # Convert gross to net
                tax_rate=23.0
            )
        ]
        
        return self.create_invoice(
            client=client,
            items=items,
            case_title=case_title,
            notes="Przygotowanie spersonalizowanego dokumentu prawnego na podstawie analizy sprawy."
        )
    
    def create_consultation_invoice(self, client: Client, case_title: str, duration_minutes: int, hourly_rate: float = 300.0) -> Dict[str, Any]:
        """Create invoice for legal consultation"""
        hours = duration_minutes / 60
        items = [
            InvoiceItem(
                name=f"Konsultacja prawna ({duration_minutes} min)",
                quantity=hours,
                price_net=(hourly_rate / 1.23),  # Convert gross to net
                tax_rate=23.0
            )
        ]
        
        return self.create_invoice(
            client=client,
            items=items,
            case_title=case_title,
            notes="Konsultacja prawna z kwalifikowanym prawnikiem."
        )

# Global Fakturownia service instance
fakturownia_service = FakturowniaService()