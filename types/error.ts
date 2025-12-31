export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export interface FieldValidationError {
  field: string;
  message: string;
}

// HTTP Error structure (what Axios/HTTP clients provide)
export interface HttpError {
  response?: {
    data?: ApiError;
    status: number;
  };
  message?: string;
  name?: string;
}
