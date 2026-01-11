import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getTaxReport, exportTrades, exportStaking, exportMining } from '../controllers/tax.controller';

const router = Router();

// All tax endpoints require authentication
router.use(authenticate);

/**
 * @route GET /api/v1/tax/report
 * @query year, basis=fifo|lifo
 * @desc Get annual tax report summary
 */
router.get('/report', getTaxReport);

/**
 * @route GET /api/v1/tax/exports/trades.csv
 * @desc Export user trades CSV for tax purposes
 */
router.get('/exports/trades.csv', exportTrades);

/**
 * @route GET /api/v1/tax/exports/staking.csv
 * @desc Export user staking rewards CSV
 */
router.get('/exports/staking.csv', exportStaking);

/**
 * @route GET /api/v1/tax/exports/mining.csv
 * @desc Export user mining payouts CSV
 */
router.get('/exports/mining.csv', exportMining);

export default router;
