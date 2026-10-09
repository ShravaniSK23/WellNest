import { Router } from 'express';
import { CommunityController } from '../controllers/community.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

// Public / Authenticated Reads with Helpline Metadata (SF-1, SF-2)
router.get('/channels', CommunityController.getChannels);
router.get('/posts', CommunityController.getPosts);
router.get('/posts/:postId/comments', CommunityController.getComments);

// Authenticated Posting & Reporting
router.post('/posts', requireAuth, CommunityController.createPost);
router.post('/posts/:postId/comments', requireAuth, CommunityController.createComment);
router.post('/reports', requireAuth, CommunityController.reportContent);

export const communityRouter = router;
