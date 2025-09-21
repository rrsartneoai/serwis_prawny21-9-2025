// API client for case management
import { authAPI } from './auth';

export interface Case {
  id: number;
  title: string;
  description?: string;
  client_notes?: string;
  status: string;
  package_type?: string;
  package_price?: number;
  created_at: string;
  updated_at: string;
  user_id: number;
  documents: Document[];
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

      const response = await authAPI.makeRequest<Case>('POST', '/cases', formData, true, true);
      return { case: response, error: null };
    } catch (error) {
      return {
        case: null,
        error: error instanceof Error ? error.message : 'Failed to create case'
      };
    }
  }

  async getCases(): Promise<CasesResponse> {
    try {
      const cases = await authAPI.makeRequest<Case[]>('GET', '/cases', null, true);
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
      const caseData = await authAPI.makeRequest<Case>('GET', `/cases/${caseId}`, null, true);
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