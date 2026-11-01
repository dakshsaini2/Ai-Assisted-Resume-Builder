import { Router } from 'express';
import {
  getResumes,
  createResume,
  getResumeById,
  updateResume,
  deleteResume,
  getResumeRenderData,
  downloadResumePdf,
} from '../controllers/resume.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { pdfDownloadLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.get('/:id/render-data', getResumeRenderData);

router.use(authenticateUser);

router.get('/', getResumes);
router.post('/', createResume);
router.get('/:id/pdf', pdfDownloadLimiter, downloadResumePdf);
router.get('/:id', getResumeById);
router.put('/:id', updateResume);
router.delete('/:id', deleteResume);

export default router;
