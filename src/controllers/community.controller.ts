import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { CommunityService } from '../services/community.service.js';

export class CommunityController {
  public static getChannels(req: Request, res: Response) {
    const data = CommunityService.getChannels();
    res.status(200).json(data);
  }

  public static async createPost(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const post = await CommunityService.createPost(req.user!.userId, req.body);
      res.status(201).json({ post });
    } catch (error) {
      next(error);
    }
  }

  public static async getPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = req.query.channel as string;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;

      const result = await CommunityService.getPosts(channel, page, limit);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async createComment(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const comment = await CommunityService.createComment(req.user!.userId, postId, req.body);
      res.status(201).json({ comment });
    } catch (error) {
      next(error);
    }
  }

  public static async getComments(req: Request, res: Response, next: NextFunction) {
    try {
      const { postId } = req.params;
      const comments = await CommunityService.getComments(postId);
      res.status(200).json({ comments });
    } catch (error) {
      next(error);
    }
  }

  public static async reportContent(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const result = await CommunityService.reportContent(req.user!.userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
