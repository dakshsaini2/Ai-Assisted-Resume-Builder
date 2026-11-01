import { Router } from 'express';
import { authenticateUser } from '../middleware/auth.middleware';
import { validate } from '../middleware/validation.middleware';
import { heavyAiLimiter, lightAiLimiter } from '../middleware/rateLimit.middleware';
import {
  generateSummary,
  improveContent,
  analyzeResume,
  matchJobDescription,
  getAnalysisById,
  getJobMatchById,
  generateCoverLetter,
  saveCoverLetter,
  listCoverLetters,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter,
} from '../controllers/ai.controller';
import {
  generateSummarySchema,
  improveTextSchema,
  analyzeResumeSchema,
  jobMatchSchema,
  generateCoverLetterSchema,
  createCoverLetterSchema,
  updateCoverLetterSchema,
} from '../validators/ai.validator';

const router = Router();

router.use(authenticateUser);

router.post('/summary', heavyAiLimiter, validate(generateSummarySchema), generateSummary);
router.post('/analyze', heavyAiLimiter, validate(analyzeResumeSchema), analyzeResume);
router.post('/job-match', heavyAiLimiter, validate(jobMatchSchema), matchJobDescription);
router.post(
  '/cover-letters/generate',
  heavyAiLimiter,
  validate(generateCoverLetterSchema),
  generateCoverLetter
);

router.post('/improve', lightAiLimiter, validate(improveTextSchema), improveContent);

router.get('/analyses/:id', getAnalysisById);
router.get('/job-matches/:id', getJobMatchById);

router.post('/cover-letters', validate(createCoverLetterSchema), saveCoverLetter);
router.get('/cover-letters', listCoverLetters);
router.get('/cover-letters/:id', getCoverLetterById);
router.put('/cover-letters/:id', validate(updateCoverLetterSchema), updateCoverLetter);
router.delete('/cover-letters/:id', deleteCoverLetter);

export default router;
