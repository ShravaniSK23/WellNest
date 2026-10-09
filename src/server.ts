import app from './app.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 WellNest Backend Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
  logger.info(`📚 OpenAPI Documentation available at http://localhost:${env.PORT}/api-docs`);
});

process.on('unhandledRejection', (err) => {
  logger.error({ err }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught Exception');
  process.exit(1);
});
