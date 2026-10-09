import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';

export interface AuditParams {
  userId?: string;
  action: string;
  resource: string;
  ipAddress?: string;
  userAgent?: string;
  payloadSummary?: Record<string, any>;
}

export class AuditService {
  public static async logAction(params: AuditParams): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          userId: params.userId || null,
          action: params.action,
          resource: params.resource,
          ipAddress: params.ipAddress || '0.0.0.0',
          userAgent: params.userAgent || 'UNKNOWN',
          payloadSummary: params.payloadSummary ? params.payloadSummary : undefined,
        },
      });
      logger.info(
        { userId: params.userId, action: params.action, resource: params.resource },
        `[AUDIT LOG] ${params.action} on ${params.resource}`
      );
    } catch (error) {
      logger.error({ error, params }, 'Failed to record audit log entry');
    }
  }

  public static async getAuditLogs(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
            },
          },
        },
      }),
      prisma.auditLog.count(),
    ]);

    return { logs, total, page, totalPages: Math.ceil(total / limit) };
  }
}
