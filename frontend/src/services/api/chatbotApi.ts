import { baseApi } from './baseApi';
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
      const response = await baseApi.post(`${this.baseUrl}/send`, request);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to send message');
    }
  }

  async getChatHistory(sessionId: string): Promise<any> {
    try {
      const response = await baseApi.get(`${this.baseUrl}/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get chat history');
    }
  }

  async getSessions(): Promise<any> {
    try {
      const response = await baseApi.get(`${this.baseUrl}/sessions`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to get sessions');
    }
  }

  async createSession(title: string): Promise<any> {
    try {
      const response = await baseApi.post(`${this.baseUrl}/sessions`, { title });
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to create session');
    }
  }

  async deleteSession(sessionId: string): Promise<any> {
    try {
      const response = await baseApi.delete(`${this.baseUrl}/sessions/${sessionId}`);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.error?.message || 'Failed to delete session');
    }
  }
}

export const chatbotApi = new ChatbotApi(); 