import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './config/db.js';
import logger from './utils/logger.js';

import authRoutes from './routes/authRoutes.js';
import songRoutes from './routes/songRoutes.js';
import telemetryRoutes from './routes/telemetryRoutes.js';
import recommendationRoutes from './routes/recommendationRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/songs', songRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date(),
    service: 'Music Recommender Backend (Node.js API Gateway)'
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database then start server
initDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`Express Server is running on http://localhost:${PORT}`);
    logger.info(`Architecture: Hybrid (Backend: Node.js, AI Engine: Python on Port 8000)`);
    logger.info(`Available endpoints mounted: /api/auth, /api/songs, /api/telemetry, /api/recommendations, /api/analytics`);
  });
}).catch(err => {
  logger.error('Failed to initialize database. Server not started.', err);
});
