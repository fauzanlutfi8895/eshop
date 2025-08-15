export class AppError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly isOperational: boolean = true,
    public readonly details?: any
  ) {
    super(message);
    Error.captureStackTrace(this);
  }
}

// Not found error
export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404);
  }
}

// Validation error (use for Joi/zod/react-hook-form validation error)
export class ValidationError extends AppError {
  constructor(message = "Invalid request data", details?: any) {
    super(message, 400, true, details);
  }
}

// Authentication error
export class AuthError extends AppError {
  constructor(message = "Unauthorizes"){
    super(message, 401)
  }
}

// Forbidden error (Permission)
export class ForbiddenError extends AppError {
  constructor(message = "Forbidden access"){
    super(message, 403)
  }
}

// Database error (MongoDB/Postgres error)
export class DatabaseError extends AppError {
  constructor(message: "Database error", details?: any){
    super(message, 500, true, details)
  }
}

// Rate-limit error (If user exceeds API limit)
export class RateLimitError extends AppError {
  constructor(message: "Too many request, please try again later"){
    super(message, 429)
  }
}