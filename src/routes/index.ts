import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { userRouter } from './user.routes.js';
import { therapistRouter } from './therapist.routes.js';
import { auditRouter } from './audit.routes.js';
import { healthRouter } from './health.routes.js';
import { moodRouter } from './mood.routes.js';
import { journalRouter } from './journal.routes.js';
import { dashboardRouter } from './dashboard.routes.js';
import { appointmentRouter } from './appointment.routes.js';
import { paymentRouter } from './payment.routes.js';

const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/users', userRouter);
apiRouter.use('/therapists', therapistRouter);
apiRouter.use('/admin', auditRouter);
apiRouter.use('/moods', moodRouter);
apiRouter.use('/journals', journalRouter);
apiRouter.use('/dashboard', dashboardRouter);
apiRouter.use('/appointments', appointmentRouter);
apiRouter.use('/payments', paymentRouter);
apiRouter.use('/', healthRouter);

export const router = apiRouter;
