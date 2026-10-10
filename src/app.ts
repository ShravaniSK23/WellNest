import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';
import { router } from './routes/index.js';
import { errorMiddleware } from './middlewares/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const openApiSpec = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs', 'openapi.json'), 'utf-8'));

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// API Documentation Foundation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiSpec));

// API Routes Base
app.use('/api/v1', router);

// Error Handling Middleware
app.use(errorMiddleware);

export default app;
