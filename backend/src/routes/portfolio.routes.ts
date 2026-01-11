import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as portfolioController from '../controllers/portfolio.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/', portfolioController.getPortfolio);
router.get('/balance', portfolioController.getBalance);
router.get('/performance', portfolioController.getPerformance);
router.get('/history', portfolioController.getHistory);
router.get('/allocations', portfolioController.getAllocations);

export default router;
