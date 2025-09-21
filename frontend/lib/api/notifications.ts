import { authAPI } from './auth';

// Types for notifications
export interface Notification {
  id: number;
  user_id: number;
  case_id?: number;
  type: string;
  template: string;
  subject?: string;
  content: string;
  recipient_phone?: string;
  recipient_email?: string;
  status: string;
  external_id?: string;
  error_message?: string;
  created_at: string;
  sent_at?: string;
  read_at?: string;
}

export interface NotificationsResponse {
  notifications?: Notification[];
  error?: string;
}

export interface UnreadCountResponse {
  unread_count?: number;
  error?: string;
}

export interface MarkReadResponse {
  message?: string;
  error?: string;
}

// Notifications API client
export const notificationsApi = {
  /**
   * Get user notifications
   */
  async getUserNotifications(unreadOnly = false, limit = 50): Promise<NotificationsResponse> {
    try {
      const params = new URLSearchParams();
      if (unreadOnly) params.set('unread_only', 'true');
      if (limit) params.set('limit', limit.toString());
      
      const response = await authAPI.makeRequest(
        'GET', 
        `/notifications/?${params.toString()}`, 
        undefined, 
        true
      ) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const notifications = await response.json();
      return { notifications };
    } catch (error) {
      console.error('Get notifications error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Get unread notifications count
   */
  async getUnreadCount(): Promise<UnreadCountResponse> {
    try {
      const response = await authAPI.makeRequest('GET', '/notifications/unread-count/', undefined, true) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const data = await response.json();
      return { unread_count: data.unread_count };
    } catch (error) {
      console.error('Get unread count error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<MarkReadResponse> {
    try {
      const response = await authAPI.makeRequest(
        'POST', 
        '/notifications/mark-read/', 
        { notification_id: notificationId }, 
        true
      ) as Response;
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          error: errorData.detail || `HTTP ${response.status}: ${response.statusText}` 
        };
      }

      const data = await response.json();
      return { message: data.message };
    } catch (error) {
      console.error('Mark as read error:', error);
      return { 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      };
    }
  }
};