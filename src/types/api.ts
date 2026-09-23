export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, unknown> | unknown;
  meta?: Record<string, unknown>;
}

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: Record<string, unknown> | unknown;

  constructor(message: string, statusCode: number = 500, errors?: Record<string, unknown> | unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  requiresAuth?: boolean;
}

