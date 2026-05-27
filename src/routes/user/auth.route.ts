import { Router } from 'express';
import { register, login, logout, getMe, verifyEmail, forgotPassword, resetPassword } from '../../controllers/authController';
import { protect } from '../../middleware/authMiddleware';
import { validate } from '../../middleware/validate';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from '../../utils/authValidation';

const router = Router();

// ─── AUTH ROUTES WITH VALIDATION ────────────────────────────
router.post('/register', validate(registerSchema), register);
router.get('/verify-email/:token', validate(verifyEmailSchema), verifyEmail);
router.post('/login', validate(loginSchema), login);
router.post('/logout', logout);
router.get('/me', protect, getMe);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.put('/reset-password/:token', validate(resetPasswordSchema), resetPassword);

export default router;
