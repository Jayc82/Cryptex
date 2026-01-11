import { Router } from 'express';
import { authLimiter } from '../middleware/rateLimiter';
import { validateRegistration, validateLogin } from '../middleware/validation';
import * as authController from '../controllers/auth.controller';

const router = Router();

router.post('/register', authLimiter, validateRegistration, authController.register);
router.post('/login', authLimiter, validateLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authLimiter, authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-email', authController.verifyEmail);
router.post('/2fa/enable', authController.enable2FA);
router.post('/2fa/verify', authController.verify2FA);

export default router;
