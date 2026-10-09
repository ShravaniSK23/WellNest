import { Request, Response } from 'express';
import { prisma } from '../db/prisma.js';

export class HealthController {
  public static async getHealth(req: Request, res: Response) {
    try {
      // Test DB Connectivity
      await prisma.$queryRaw`SELECT 1`;
      res.status(200).json({
        status: 'UP',
        timestamp: new Date().toISOString(),
        service: 'WellNest Platform Backend',
        database: 'CONNECTED',
        uptimeSeconds: Math.floor(process.uptime()),
      });
    } catch (error) {
      res.status(503).json({
        status: 'DOWN',
        timestamp: new Date().toISOString(),
        service: 'WellNest Platform Backend',
        database: 'DISCONNECTED',
        error: (error as Error).message,
      });
    }
  }
}
