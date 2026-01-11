import { Router } from 'express';
import {
  getSubscriptionPlans,
  getUserSubscription,
  upgradeSubscription,
  cancelSubscription,
  getSubscriptionComparison,
  getPlatformFeeStats
} from '../controllers/subscription.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

// Public routes
router.get('/plans', getSubscriptionPlans);
router.get('/comparison', getSubscriptionComparison);

// Protected routes
router.get('/my-subscription', authenticate, getUserSubscription);
router.post('/upgrade', authenticate, upgradeSubscription);
router.post('/cancel', authenticate, cancelSubscription);

// Admin routes (add admin middleware in production)
router.get('/stats/fees', authenticate, getPlatformFeeStats);

export default router;
