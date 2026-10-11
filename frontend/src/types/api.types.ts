export interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
    details?: any;
    timestamp?: string;
  };
  message?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
}
