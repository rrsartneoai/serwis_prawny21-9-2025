import { authAPI } from './auth';

export interface Payment {
  id: number;
  case_id?: number;
  amount: number;
  currency: string;
  payment_type: 'analysis' | 'legal_document' | 'package';
  description?: string;
  provider: 'PAYU' | 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled';
  payment_url?: string;
  external_payment_id?: string;
  created_at: string;
  paid_at?: string;
}

export interface PaymentCreate {
  case_id: number;
  amount: number;
  payment_type?: 'analysis' | 'legal_document' | 'package';
  provider?: 'PAYU' | 'STRIPE' | 'PAYPAL' | 'BANK_TRANSFER';
  description?: string;
  promo_code?: string;
}

export interface PaymentResponse {
  payment?: Payment;
  error?: string;
}

export interface PaymentsResponse {
  payments?: Payment[];
  error?: string;
}

export const paymentsApi = {
  /**
   * Create a new payment for a case
   */
  async createPayment(paymentData: PaymentCreate): Promise<PaymentResponse> {
    try {
      const response = await authAPI.makeRequest('POST', '/payments/', paymentData, true) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const payment = await response.json();
      return { payment };
    } catch (error) {
      console.error('Create payment error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get all payments for current user
   */
  async getUserPayments(): Promise<PaymentsResponse> {
    try {
      const response = await authAPI.makeRequest('GET', '/payments/', undefined, true) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const payments = await response.json();
      return { payments };
    } catch (error) {
      console.error('Get payments error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get specific payment details
   */
  async getPayment(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await authAPI.makeRequest('GET', `/payments/${paymentId}/`, undefined, true) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const payment = await response.json();
      return { payment };
    } catch (error) {
      console.error('Get payment error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Update payment status (for webhook integration)
   */
  async updatePaymentStatus(
    paymentId: number, 
    status: Payment['status'], 
    externalPaymentId?: string, 
    paymentUrl?: string
  ): Promise<PaymentResponse> {
    try {
      const updateData: any = { status };
      if (externalPaymentId) updateData.external_payment_id = externalPaymentId;
      if (paymentUrl) updateData.payment_url = paymentUrl;

      const response = await authAPI.makeRequest(
        'PATCH', 
        `/payments/${paymentId}/status`, 
        updateData, 
        true
      ) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const payment = await response.json();
      return { payment };
    } catch (error) {
      console.error('Update payment status error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Simulate successful payment (for development/testing)
   */
  async simulatePaymentSuccess(paymentId: number): Promise<PaymentResponse> {
    try {
      const response = await authAPI.makeRequest(
        'POST', 
        `/payments/simulate-success/${paymentId}`, 
        {}, 
        true
      ) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const result = await response.json();
      return { payment: result.payment };
    } catch (error) {
      console.error('Simulate payment success error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};