// Placeholder REST client replaced with fetch; integrate with RTK Query later if needed
import { ChatbotResponse } from '@/utils/types/chatbot';

export interface SendMessageRequest {
  message: string;
  sessionId?: string;
  context?: {
    paperIds?: string[];
    searchQuery?: string;
  };
}

export interface SendMessageResponse {
  success: boolean;
  data: {
    response: ChatbotResponse;
    sessionId: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

class ChatbotApi {
  private baseUrl = '/api/v1/chatbot';

  async sendMessage(request: SendMessageRequest): Promise<SendMessageResponse> {
    try {
      const res = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      return await res.json();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to send message');
    }
  }

  async getChatHistory(sessionId: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/sessions/${sessionId}`);
      return await res.json();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get chat history');
    }
  }

  async getSessions(): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/sessions`);
      return await res.json();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get sessions');
    }
  }

  async createSession(title: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title }),
      });
      return await res.json();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to create session');
    }
  }

  async deleteSession(sessionId: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}/sessions/${sessionId}`, { method: 'DELETE' });
      return await res.json();
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to delete session');
    }
  }
}

export const chatbotApi = new ChatbotApi(); 