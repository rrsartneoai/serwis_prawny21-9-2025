// API client for case management
import { authAPI } from './auth';

// Enhanced interfaces for frontend compatibility
export interface Analysis {
  id: string;
  caseId: string;
  content: string;
  summary: string;
  recommendations: string[];
  possibleDocuments: PossibleDocument[];
  price: number;
  status: "completed" | "pending" | "in_progress";
  previewContent: string;
  createdAt: Date;
}

export interface PossibleDocument {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  category: string;
}

// Enhanced Case interface for frontend compatibility
export interface Case {
  id: string; // Convert from number to string for frontend
  title: string;
  name?: string; // Alias for title
  description?: string;
  client_notes?: string;
  clientNotes?: string; // Alias for client_notes
  client_context?: string;
  client_agreement?: string;
  status: "draft" | "submitted" | "analyzing" | "analysis_ready" | "completed" | "cancelled" | "documents_ready" | "new" | "rejected";
  package_type?: string;
  package_price?: number;
  created_at?: string;
  updated_at?: string;
  createdAt: Date;
  updatedAt: Date;
  user_id?: number;
  client_id?: string;
  clientId?: string; // Alias for client_id
  documents: EnhancedDocument[];
  analysis?: Analysis;
  generatedDocuments?: EnhancedDocument[];
}

export interface EnhancedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  size: number;
  caseId?: string;
}

export interface Document {
  id: number;
  filename: string;
  original_filename: string;
  file_type: string;
  file_size: number;
  uploaded_at: string;
  case_id: number;
}

export interface CreateCaseData {
  title: string;
  description?: string;
  client_notes?: string;
  client_context?: string;
  client_agreement?: string;
  package_type?: string;
  package_price?: number;
  files?: File[];
}

export interface CaseResponse {
  case: Case | null;
  error: string | null;
}

export interface CasesResponse {
  cases: Case[] | null;
  error: string | null;
}

class CasesApi {
  private baseUrl = '/api/v1/cases';

  async createCase(data: CreateCaseData): Promise<CaseResponse> {
    try {
      const formData = new FormData();
      formData.append('title', data.title);
      
      if (data.description) {
        formData.append('description', data.description);
      }
      
      if (data.client_notes) {
        formData.append('client_notes', data.client_notes);
      }
      
      if (data.client_context) {
        formData.append('client_context', data.client_context);
      }
      
      if (data.client_agreement) {
        formData.append('client_agreement', data.client_agreement);
      }
      
      if (data.package_type) {
        formData.append('package_type', data.package_type);
      }
      
      if (data.package_price !== undefined) {
        formData.append('package_price', data.package_price.toString());
      }
      
      // Add files
      if (data.files) {
        for (const file of data.files) {
          formData.append('files', file);
        }
      }

      const backendCase = await authAPI.makeRequest<any>('POST', '/cases', formData, true);
      const caseData = this.transformCase(backendCase);
      return { case: caseData, error: null };
    } catch (error) {
      return {
        case: null,
        error: error instanceof Error ? error.message : 'Failed to create case'
      };
    }
  }

  // Transform backend case data to frontend format
  private transformCase(backendCase: any): Case {
    return {
      id: backendCase.id.toString(),
      title: backendCase.title,
      name: backendCase.title, // Alias
      description: backendCase.description,
      client_notes: backendCase.client_notes,
      clientNotes: backendCase.client_notes, // Alias
      client_context: backendCase.client_context,
      client_agreement: backendCase.client_agreement,
      status: backendCase.status,
      package_type: backendCase.package_type,
      package_price: backendCase.package_price,
      created_at: backendCase.created_at,
      updated_at: backendCase.updated_at,
      createdAt: new Date(backendCase.created_at),
      updatedAt: new Date(backendCase.updated_at),
      user_id: backendCase.user_id,
      client_id: backendCase.client_id?.toString(),
      clientId: backendCase.client_id?.toString(), // Alias
      documents: (backendCase.documents || []).map((doc: Document) => ({
        id: doc.id.toString(),
        name: doc.original_filename || doc.filename,
        type: doc.file_type,
        url: `/api/v1/cases/${backendCase.id}/documents/${doc.id}/download`,
        uploadedAt: new Date(doc.uploaded_at),
        size: doc.file_size,
        caseId: backendCase.id.toString(),
      })),
      analysis: backendCase.analysis ? {
        id: backendCase.analysis.id.toString(),
        caseId: backendCase.id.toString(),
        content: backendCase.analysis.content || '',
        summary: backendCase.analysis.summary || '',
        recommendations: backendCase.analysis.recommendations || [],
        possibleDocuments: (backendCase.analysis.possible_documents || []).map((doc: any) => ({
          id: doc.id?.toString() || Math.random().toString(),
          name: doc.name || doc.title || '',
          description: doc.description || '',
          price: doc.price || 0,
          estimatedTime: doc.estimated_time || doc.estimatedTime || '',
          category: doc.category || '',
        })),
        price: backendCase.analysis.price || 0,
        status: backendCase.analysis.status || 'pending',
        previewContent: backendCase.analysis.preview_content || backendCase.analysis.content?.substring(0, 200) + '...',
        createdAt: new Date(backendCase.analysis.created_at),
      } : undefined,
      generatedDocuments: [],
    };
  }

  async getCases(): Promise<CasesResponse> {
    try {
      const backendCases = await authAPI.makeRequest<any[]>('GET', '/cases', null, true);
      const cases = backendCases.map(this.transformCase.bind(this));
      return { cases, error: null };
    } catch (error) {
      return {
        cases: null,
        error: error instanceof Error ? error.message : 'Failed to get cases'
      };
    }
  }

  async getCase(caseId: number): Promise<CaseResponse> {
    try {
      const backendCase = await authAPI.makeRequest<any>('GET', `/cases/${caseId}`, null, true);
      const caseData = this.transformCase(backendCase);
      return { case: caseData, error: null };
    } catch (error) {
      return {
        case: null,
        error: error instanceof Error ? error.message : 'Failed to get case'
      };
    }
  }

  async updateCase(caseId: number, updates: Partial<CreateCaseData>): Promise<CaseResponse> {
    try {
      const caseData = await authAPI.makeRequest<Case>('PUT', `/cases/${caseId}`, updates, true);
      return { case: caseData, error: null };
    } catch (error) {
      return {
        case: null,
        error: error instanceof Error ? error.message : 'Failed to update case'
      };
    }
  }

  async deleteCase(caseId: number): Promise<{ success: boolean; error: string | null }> {
    try {
      await authAPI.makeRequest('DELETE', `/cases/${caseId}`, null, true);
      return { success: true, error: null };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to delete case'
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
}

export const casesApi = new CasesApi();