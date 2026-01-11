import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateMinerConfig, validateWorker, validatePagination } from '../middleware/validation';
import * as miningController from '../controllers/mining.controller';

const router = Router();

// Public routes - view mining pools
router.get('/pools', miningController.getMiningPools);
router.get('/pools/:poolId', miningController.getMiningPool);

// Protected routes - require authentication
router.use(authenticate);

// Mining configuration
router.get('/miners', miningController.getUserMiners);
router.post('/miners', validateMinerConfig, miningController.createMiner);

// Workers management
router.get('/miners/:minerId/workers', miningController.getWorkers);
router.post('/miners/:minerId/workers', validateWorker, miningController.addWorker);
router.put('/workers/:workerId/status', miningController.updateWorkerStatus);

// Share submission (called by mining software)
router.post('/shares', miningController.submitShare);

// Statistics and analytics
router.get('/stats', miningController.getMiningStats);
router.get('/dashboard', miningController.getDashboard);

// Payouts
router.get('/payouts', validatePagination, miningController.getPayouts);
router.post('/payouts/request', miningController.requestPayout);

export default router;
