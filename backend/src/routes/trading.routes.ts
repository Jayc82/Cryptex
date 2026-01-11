import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { tradingLimiter } from '../middleware/rateLimiter';
import { validateTradeOrder, validatePagination } from '../middleware/validation';
import * as tradingController from '../controllers/trading.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Order management
router.post('/orders', tradingLimiter, validateTradeOrder, tradingController.createOrder);
router.get('/orders', validatePagination, tradingController.getOrders);
router.get('/orders/:orderId', tradingController.getOrderById);
router.delete('/orders/:orderId', tradingController.cancelOrder);
router.delete('/orders', tradingController.cancelAllOrders);

// Trade history
router.get('/trades', tradingController.getTrades);
router.get('/trades/:tradeId', tradingController.getTradeById);

// Order book
router.get('/orderbook/:symbol', tradingController.getOrderBook);

export default router;
