import { Router } from 'express';
import { optionalAuth } from '../middleware/auth';
import * as marketController from '../controllers/market.controller';

const router = Router();

// Public market data
router.get('/ticker/:symbol', optionalAuth, marketController.getTicker);
router.get('/tickers', optionalAuth, marketController.getAllTickers);
router.get('/klines/:symbol', optionalAuth, marketController.getKlines);
router.get('/depth/:symbol', optionalAuth, marketController.getDepth);
router.get('/trades/:symbol', optionalAuth, marketController.getRecentTrades);
router.get('/pairs', optionalAuth, marketController.getTradingPairs);
router.get('/stats/:symbol', optionalAuth, marketController.get24hrStats);

export default router;
