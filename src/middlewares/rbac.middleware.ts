import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { ForbiddenError } from '../utils/errors.js';

export const requireRole = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Role '${req.user.role}' is not authorized to perform this operation. Required role(s): ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};

export const requireOwnership = (paramName: string = 'userId') => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const resourceOwnerId = req.params[paramName] || req.body[paramName];
    const isSelf = req.user.userId === resourceOwnerId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return next(new ForbiddenError('You do not have permission to access or modify another user\'s resource'));
    }

    next();
  };
};
