// API client for document management using FastAPI backend
import { authAPI } from './auth';

export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  documents: DocumentResponse[];
  errors: string[];
}

export interface DocumentResponse {
  id: number;
  case_id: number;
  filename: string;
  content_type: string;
  size: number;
  file_path: string;
  document_type: 'photo' | 'pdf' | 'word' | 'other';
  ocr_text?: string;
  processing_status: string;
  created_at: string;
  updated_at: string;
}

export interface FileUploadLimits {
  max_file_size_mb: number;
  max_files_per_case: number;
  allowed_file_types: string[];
}

class DocumentsApi {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  private async getHeaders() {
    const token = await authAPI.getToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }

  async uploadDocuments(caseId: number, files: File[]): Promise<DocumentUploadResponse> {
    try {
      const headers = await this.getHeaders();
      const formData = new FormData();
      
      files.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch(`${this.baseUrl}/api/v1/documents/upload/${caseId}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to upload documents');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
        documents: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  async getCaseDocuments(caseId: number): Promise<DocumentResponse[]> {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/v1/documents/case/${caseId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch documents error:', error);
      return [];
    }
  }

  async deleteDocument(documentId: number): Promise<boolean> {
    try {
      const headers = await this.getHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/v1/documents/${documentId}`, {
        method: 'DELETE',
        headers,
      });

      return response.ok;
    } catch (error) {
      console.error('Delete document error:', error);
      return false;
    }
  }

  async getUploadLimits(): Promise<FileUploadLimits> {
    try {
      const response = await fetch(`${this.baseUrl}/api/v1/documents/limits`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch upload limits');
      }

      return await response.json();
    } catch (error) {
      console.error('Fetch limits error:', error);
      // Return default limits if API call fails
      return {
        max_file_size_mb: 50,
        max_files_per_case: 10,
        allowed_file_types: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx']
      };
    }
  }
}

export const documentsApi = new DocumentsApi();