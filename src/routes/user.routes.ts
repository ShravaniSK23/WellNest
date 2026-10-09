import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/me', UserController.getProfile);
router.put('/me', UserController.updateProfile);
router.post('/me/password', UserController.changePassword);
router.delete('/me', UserController.deleteAccount);

export const userRouter = router;
