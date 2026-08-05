export class ApiError extends Error {
  public code: string;
  public status: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', status: number = 500) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }

  static BadRequest(message: string) {
    return new ApiError(message, 'BAD_REQUEST', 400);
  }

  static Unauthorized(message: string = 'Unauthorized') {
    return new ApiError(message, 'UNAUTHORIZED', 401);
  }

  static Forbidden(message: string = 'Forbidden') {
    return new ApiError(message, 'FORBIDDEN', 403);
  }

  static NotFound(message: string = 'Not Found') {
    return new ApiError(message, 'NOT_FOUND', 404);
  }
}
