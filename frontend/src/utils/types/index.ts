export * from './auth';
export * from './papers';
export * from './search';
export * from './analytics';
export * from './chatbot';

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface LoadingState {
  isLoading: boolean;
  error: string | null;
}