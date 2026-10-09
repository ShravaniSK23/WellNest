import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { TherapistService } from '../services/therapist.service.js';

export class TherapistController {
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
