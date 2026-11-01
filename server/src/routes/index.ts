import { Router } from 'express';
import authRoutes from './auth.routes';
import resumeRoutes from './resume.routes';
import aiRoutes from './ai.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/resumes', resumeRoutes);
router.use('/ai', aiRoutes);

export default router;
