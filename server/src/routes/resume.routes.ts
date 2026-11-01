import { Router } from 'express';
import {
  getResumes,
  createResume,
  getResumeById,
  updateResume,
  deleteResume,
} from '../controllers/resume.controller';
import { authenticateUser } from '../middleware/auth.middleware';

const router = Router();

// All resume routes require authentication
router.use(authenticateUser);

router.get('/', getResumes);
router.post('/', createResume);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;
