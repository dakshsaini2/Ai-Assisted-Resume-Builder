import { Router } from 'express';
import {
  getResumes,
  createResume,
  getResumeById,
  updateResume,
  deleteResume,
  getResumeRenderData,
} from '../controllers/resume.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// Dedicated render data endpoint authenticated via short-lived HMAC export token
// Registered before authenticateUser so headless renderer can authenticate with ?token=...
router.get('/:id/render-data', getResumeRenderData);

// All subsequent resume routes require standard Bearer JWT authentication
router.use(authenticateUser);

router.get('/', getResumes);
router.post('/', createResume);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;
