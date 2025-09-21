// Authentication API client for FastAPI backend
export interface AuthResponse {
  user: any;
  error: string | null;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  email: string;
  is_active: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export class AuthAPIClient {
  private baseUrl: string;
  private token: string | null = null;

  constructor() {
    // Use the backend URL - in development it's localhost:8000, in production use the domain
    this.baseUrl = typeof window !== 'undefined' && window.location.hostname !== 'localhost' 
      ? `https://${process.env.REPLIT_DEV_DOMAIN || window.location.hostname}:8000`
      : 'http://localhost:8000';
  }

  async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: any,
    includeAuth = false,
    isFormData = false
  ): Promise<T> {
    const url = `${this.baseUrl}/api/v1${endpoint}`;
    
    const headers: Record<string, string> = {};

    if (includeAuth && this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config: RequestInit = {
      method,
      headers,
    };

    if (data) {
      if (method === 'POST' && endpoint === '/users/token') {
        // For login endpoint, use form data
        const formData = new URLSearchParams();
        formData.append('username', data.username);
        formData.append('password', data.password);
        config.body = formData;
        headers['Content-Type'] = 'application/x-www-form-urlencoded';
      } else if (isFormData) {
        // For file uploads, data is already FormData
        config.body = data;
        // Don't set Content-Type for FormData - browser will set it with boundary
      } else {
        config.body = JSON.stringify(data);
        headers['Content-Type'] = 'application/json';
      }
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.makeRequest<User>('POST', '/users/register/', {
        email,
        password
      });
      
      return { user, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'Registration failed' 
      };
    }
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    try {
      // First get the token
      const tokenResponse = await this.makeRequest<LoginResponse>('POST', '/users/token', {
        username: email, // FastAPI uses username field for email
        password
      });
      
      this.token = tokenResponse.access_token;
      
      // Then get user info
      const user = await this.makeRequest<User>('GET', '/users/me/', null, true);
      
      return { user: { ...user, token: this.token }, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'Login failed' 
      };
    }
  }

  async getCurrentUser(): Promise<AuthResponse> {
    if (!this.token) {
      return { user: null, error: 'No token available' };
    }

    try {
      const user = await this.makeRequest<User>('GET', '/users/me/', null, true);
      return { user: { ...user, token: this.token }, error: null };
    } catch (error) {
      return { 
        user: null, 
        error: error instanceof Error ? error.message : 'Failed to get user info' 
      };
    }
  }

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getToken(): string | null {
    return this.token;
  }
}

export const authAPI = new AuthAPIClient();