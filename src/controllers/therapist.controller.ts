import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { TherapistService } from '../services/therapist.service.js';

export class TherapistController {
  public static async searchTherapists(req: Request, res: Response, next: NextFunction) {
    try {
      const filters = {
        specialization: req.query.specialization as string,
        language: req.query.language as string,
        minFee: req.query.minFee ? parseFloat(req.query.minFee as string) : undefined,
        maxFee: req.query.maxFee ? parseFloat(req.query.maxFee as string) : undefined,
        availableDate: req.query.availableDate as string,
        page: req.query.page ? parseInt(req.query.page as string, 10) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string, 10) : 10,
      };
      const result = await TherapistService.searchTherapists(filters);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getTherapistProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const therapist = await TherapistService.getTherapistProfile(id);
      res.status(200).json({ therapist });
    } catch (error) {
      next(error);
    }
  }

  public static async createAvailabilitySlot(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const slot = await TherapistService.createAvailabilitySlot(req.user!.userId, req.body);
      res.status(201).json({ slot });
    } catch (error) {
      next(error);
    }
  }

  public static async getTherapistSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const slots = await TherapistService.getTherapistSlots(id);
      res.status(200).json({ slots });
    } catch (error) {
      next(error);
    }
  }

  public static async submitCredentials(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { documentType, documentUrl } = req.body;
      const credential = await TherapistService.submitCredentials(req.user!.userId, documentType, documentUrl);
      res.status(201).json({ message: 'Credentials submitted for verification', credential });
    } catch (error) {
      next(error);
    }
  }

  public static async getPendingVerifications(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const therapists = await TherapistService.getPendingVerifications();
      res.status(200).json({ therapists });
    } catch (error) {
      next(error);
    }
  }

  public static async verifyTherapist(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { decision, notes } = req.body;
      const therapist = await TherapistService.verifyTherapist(req.user!.userId, id, decision, notes);
      res.status(200).json({ message: `Therapist verification set to ${decision}`, therapist });
    } catch (error) {
      next(error);
    }
  }
}
