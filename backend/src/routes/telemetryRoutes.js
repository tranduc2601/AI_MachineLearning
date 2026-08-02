import express from 'express';
import { logTelemetry } from '../controllers/telemetryController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();
// Ghi log yêu cầu phải có token
router.post('/log', verifyToken, logTelemetry);

export default router;
