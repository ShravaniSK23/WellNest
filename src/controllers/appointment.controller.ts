import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { AppointmentService } from '../services/appointment.service.js';
import { videoService } from '../services/video.service.js';

export class AppointmentController {
  public static async submitBookingRequest(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await AppointmentService.submitBookingRequest(req.user!.userId, req.body);
      res.status(202).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async confirmAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await AppointmentService.confirmAppointment(req.user!.userId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async declineAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await AppointmentService.declineAppointment(req.user!.userId, id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async rescheduleAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await AppointmentService.rescheduleAppointment(req.user!.userId, id, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async cancelAppointment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await AppointmentService.cancelAppointment(req.user!.userId, id, reason);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getVideoToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const videoSession = await videoService.generateSessionToken(id, req.user!.userId);
      res.status(200).json(videoSession);
    } catch (error) {
      next(error);
    }
  }
}
