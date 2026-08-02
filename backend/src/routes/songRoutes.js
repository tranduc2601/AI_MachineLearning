import express from 'express';
import { getSongs } from '../controllers/songController.js';

const router = express.Router();
router.get('/', getSongs);

export default router;
