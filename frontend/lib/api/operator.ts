// API client for operator operations
import { authAPI } from './auth';

export interface OperatorCase {
  id: number;
  title: string;
  description?: string;
  client_notes?: string;
  status: "paid" | "processing" | "analysis_ready" | "documents_ready" | "completed";
  package_type?: string;
  package_price?: number;
  created_at: string;
  updated_at: string;
  deadline?: string;
  user_id: number;
  operator_id?: number;
  
  // Client info
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  
  // Related data
  documents: Array<{
    id: number;
    filename: string;
    original_filename: string;
    file_type: string;
    file_size: number;
    uploaded_at: string;
  }>;
  analysis?: OperatorAnalysis;
  legal_documents: OperatorLegalDocument[];
}

export interface OperatorAnalysis {
  id: number;
  case_id: number;
  content: string;
  summary?: string;
  recommendations?: string;
  possible_actions?: string;
  confidence_score?: number;
  is_preview: boolean;
  created_at: string;
  updated_at: string;
  operator_id?: number;
}

export interface OperatorLegalDocument {
  id: number;
  case_id: number;
  document_name: string;
  document_type: string;
  content: string;
  price: number;
  is_purchased: boolean;
  is_preview: boolean;
  instructions?: string;
  created_at: string;
  purchased_at?: string;
  operator_id?: number;
}

export interface CreateAnalysisData {
  case_id: number;
  content: string;
  summary?: string;
  recommendations?: string;
  possible_actions?: string;
  confidence_score?: number;
}

export interface CreateLegalDocumentData {
  case_id: number;
  document_name: string;
  document_type: string;
  content: string;
  price: number;
  instructions?: string;
}

export interface CaseStatusUpdate {
  status: "paid" | "processing" | "analysis_ready" | "documents_ready" | "completed";
  operator_id?: number;
}

class OperatorAPI {
  private baseUrl = '/operator';

  async getCases(statusFilter?: string): Promise<{ cases: OperatorCase[] | null; error: string | null }> {
    try {
      const url = statusFilter ? `${this.baseUrl}/cases?status_filter=${statusFilter}` : `${this.baseUrl}/cases`;
      const cases = await authAPI.makeRequest<OperatorCase[]>('GET', url, null, true);
      return { cases, error: null };
    } catch (error) {
      return {
        cases: null,
        error: error instanceof Error ? error.message : 'Failed to get cases'
      };
    }
  }

  async getCase(caseId: number): Promise<{ case: OperatorCase | null; error: string | null }> {
    try {
      const caseData = await authAPI.makeRequest<OperatorCase>('GET', `${this.baseUrl}/cases/${caseId}`, null, true);
      return { case: caseData, error: null };
    } catch (error) {
      return {
        case: null,
        error: error instanceof Error ? error.message : 'Failed to get case'
      };
    }
  }

  async createAnalysis(analysisData: CreateAnalysisData): Promise<{ analysis: OperatorAnalysis | null; error: string | null }> {
    try {
      const analysis = await authAPI.makeRequest<OperatorAnalysis>(
        'POST', 
        `${this.baseUrl}/cases/${analysisData.case_id}/analysis`,
        analysisData, 
        true
      );
      return { analysis, error: null };
    } catch (error) {
      return {
        analysis: null,
        error: error instanceof Error ? error.message : 'Failed to create analysis'
      };
    }
  }

  async createLegalDocument(documentData: CreateLegalDocumentData): Promise<{ document: OperatorLegalDocument | null; error: string | null }> {
    try {
      const document = await authAPI.makeRequest<OperatorLegalDocument>(
        'POST',
        `${this.baseUrl}/cases/${documentData.case_id}/legal-documents`,
        documentData,
        true
      );
      return { document, error: null };
    } catch (error) {
      return {
        document: null,
        error: error instanceof Error ? error.message : 'Failed to create legal document'
      };
    }
  }

  async updateCaseStatus(caseId: number, statusData: CaseStatusUpdate): Promise<{ success: boolean; error: string | null }> {
    try {
      await authAPI.makeRequest(
        'PUT',
        `${this.baseUrl}/cases/${caseId}/status`,
        statusData,
        true
      );
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update case status'
      };
    }
  }

  async assignCase(caseId: number): Promise<{ success: boolean; error: string | null }> {
    try {
      await authAPI.makeRequest(
        'POST',
        `${this.baseUrl}/cases/${caseId}/assign`,
        null,
        true
      );
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to assign case'
      };
    }
  }

  async downloadDocument(caseId: number, documentId: number): Promise<Blob | null> {
    try {
      const response = await fetch(`${authAPI.getBaseUrl()}/api/v1/cases/${caseId}/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${authAPI.getToken()}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      return await response.blob();
    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  // Communication methods
  async sendClientMessage(caseId: number, message: string, template?: string): Promise<{ success: boolean; error: string | null }> {
    try {
      await authAPI.makeRequest(
        'POST',
        `${this.baseUrl}/cases/${caseId}/messages`,
        { message_content: message, template_id: template },
        true
      );
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send message'
      };
    }
  }

  // AI Document Analysis Methods
  async triggerAIAnalysis(caseId: number): Promise<{ success: boolean; analysis?: OperatorAnalysis; error: string | null }> {
    try {
      const analysis = await authAPI.makeRequest<OperatorAnalysis>(
        'POST',
        `${this.baseUrl}/cases/${caseId}/analyze-ai`,
        undefined,
        true
      );
      return { success: true, analysis, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate AI analysis'
      };
    }
  }

  async getDocumentsSummary(caseId: number): Promise<{
    success: boolean;
    summary?: {
      case_id: number;
      summary: {
        total_documents: number;
        processed_documents: number;
        document_types: Record<string, number>;
        total_text_length: number;
        has_ocr_text: number;
      };
      generated_at: string;
    };
    error: string | null;
  }> {
    try {
      const summary = await authAPI.makeRequest<{
        case_id: number;
        summary: {
          total_documents: number;
          processed_documents: number;
          document_types: Record<string, number>;
          total_text_length: number;
          has_ocr_text: number;
        };
        generated_at: string;
      }>(
        'GET',
        `${this.baseUrl}/cases/${caseId}/documents-summary`,
        undefined,
        true
      );
      return { success: true, summary, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get documents summary'
      };
    }
  }
}

export const operatorAPI = new OperatorAPI();