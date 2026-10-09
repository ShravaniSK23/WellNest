import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { therapistRouter } from './therapist.routes.js';
import { auditRouter } from './audit.routes.js';
import { healthRouter } from './health.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/therapists', therapistRouter);
apiRouter.use('/admin', auditRouter);
apiRouter.use('/', healthRouter);

export const router = apiRouter;
