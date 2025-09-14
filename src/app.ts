import express from 'express';
import { logger } from './core/middleware/logger';
import { errorHandler } from './core/middleware/errorHandler';
import eventRoutes from './api/events/event.routes';

const app = express();

const startTime = Date.now();

app.use(express.json());

app.use(logger);

app.get('/health', (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  res.status(200).json({
    status: 'ok',
    uptime: `${uptime}s`,
  });
});

app.use('/api', eventRoutes);

app.use(errorHandler);

export default app;