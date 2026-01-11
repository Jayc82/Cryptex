import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validateStake, validatePagination } from '../middleware/validation';
import * as stakingController from '../controllers/staking.controller';
import { enforcePolicy } from '../middleware/policy';

const router = Router();

// Public routes - view staking pools
router.get('/pools', stakingController.getStakingPools);
router.get('/pools/:poolId', stakingController.getStakingPool);

// Protected routes - require authentication
router.use(authenticate);
// Region-aware compliance: restrict staking where not permitted
router.use(enforcePolicy('staking'));

// User stakes management
router.get('/stakes', stakingController.getUserStakes);
router.post('/stakes', validateStake, stakingController.createStake);
router.post('/stakes/:stakeId/unstake', stakingController.unstake);
router.post('/stakes/:stakeId/claim', stakingController.claimRewards);

// Rewards and statistics
router.get('/rewards', validatePagination, stakingController.getRewardsHistory);
router.get('/stats', stakingController.getStakingStats);

export default router;
