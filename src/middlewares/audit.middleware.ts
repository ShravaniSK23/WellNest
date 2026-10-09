import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.middleware.js';
import { AuditService } from '../services/audit.service.js';

export const auditLogMiddleware = (actionName: string, resourceName: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    res.on('finish', () => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        AuditService.logAction({
          userId: req.user?.userId,
          action: actionName,
          resource: resourceName,
          ipAddress: req.ip || req.socket.remoteAddress,
          userAgent: req.get('User-Agent'),
          payloadSummary: {
            method: req.method,
            path: req.originalUrl,
            params: req.params,
            statusCode: res.statusCode,
          },
        });
      }
    });
    next();
  };
};
