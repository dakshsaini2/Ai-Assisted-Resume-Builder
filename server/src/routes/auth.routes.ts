import { Router } from 'express';
import { register, login, getMe } from '../controllers/auth.controller';
import { authenticateUser } from '../middleware/auth.middleware';
import { authRegisterLimiter, authLoginLimiter } from '../middleware/rateLimit.middleware';

const router = Router();

router.post('/register', authRegisterLimiter, register);
router.post('/login', authLoginLimiter, login);
router.get('/me', authenticateUser, getMe);

export default router;
