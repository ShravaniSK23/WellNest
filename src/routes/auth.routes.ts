import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', AuthController.register);
router.post('/login', AuthController.login);
router.post('/mfa/setup', requireAuth, AuthController.setupMfa);
router.post('/mfa/verify', AuthController.verifyMfa);
router.post('/logout', requireAuth, AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export const authRouter = router;
