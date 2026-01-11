import { Router } from 'express';
import { getFeatures } from '../controllers/policy.controller';

const router = Router();

/**
 * @route GET /api/v1/policy/features
 * @desc Get region-aware feature flags and disclosures
 * @access PUBLIC
 */
router.get('/features', getFeatures);

export default router;
