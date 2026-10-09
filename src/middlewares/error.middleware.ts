import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    logger.warn({ err: { message: err.message, code: err.code, statusCode: err.statusCode }, path: req.path }, 'Application error');
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details || null,
        timestamp: new Date().toISOString(),
      },
    });
    return;
  }

  logger.error({ err, path: req.path }, 'Unhandled server exception');
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal server error occurred.',
      details: null,
      timestamp: new Date().toISOString(),
    },
  });
};
