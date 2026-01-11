import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as aiController from '../controllers/ai.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get('/insights/:symbol', aiController.getInsights);
router.get('/predictions/:symbol', aiController.getPricePrediction);
router.get('/risk-assessment', aiController.getRiskAssessment);
router.get('/recommendations', aiController.getRecommendations);
router.post('/analyze-trade', aiController.analyzeTradeOpportunity);
router.get('/sentiment/:symbol', aiController.getMarketSentiment);

export default router;
