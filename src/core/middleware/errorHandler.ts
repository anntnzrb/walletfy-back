import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export class NotFoundError extends Error implements AppError {
  statusCode = 404;
  isOperational = true;

  constructor(resource: string) {
    super(`${resource} not found`);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error implements AppError {
  statusCode = 400;
  isOperational = true;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export const errorHandler = (
  error: Error | AppError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let statusCode = 500;
  let message = 'Internal Server Error';

  if (error instanceof ZodError) {
    statusCode = 400;
    message = 'Validation error';
    const errors = error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message,
    }));

    res.status(statusCode).json({
      error: message,
      details: errors,
    });
    return;
  }

  if ('statusCode' in error && error.statusCode) {
    statusCode = error.statusCode;
    message = error.message;
  }

  console.error(`[ERROR] ${new Date().toISOString()} - ${error.name}: ${error.message}`);
  console.error(error.stack);

  res.status(statusCode).json({
    error: message,
  });
};