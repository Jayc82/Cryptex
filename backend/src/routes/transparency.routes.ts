import express from 'express';
import { authenticate } from '../middleware/auth';
import {
  getValidators,
  getValidatorHistory,
  getUserValidatorPreferences,
  setValidatorPreferences,
  getFeeConfigurations,
  getYieldBreakdown,
  getReserveSnapshots,
  getCurrentReserveRatios,
  getAirdrops,
  getUserAirdrops,
  getInsuranceFund,
  getUserInsuranceClaims,
  submitInsuranceClaim,
  getTransparencyMetrics,
} from '../controllers/transparency.controller';

const router = express.Router();

/**
 * ============================================================================
 * TRANSPARENCY ROUTES
 * ============================================================================
 * These are the endpoints that differentiate Cryptex from traditional CEXs
 * Most are PUBLIC (no authentication) to prove trustworthiness
 * ============================================================================
 */

// ============================================================================
// VALIDATOR REGISTRY (Mostly Public)
// ============================================================================

/**
 * @route GET /api/v1/transparency/validators
 * @desc Get all validators with performance metrics
 * @access PUBLIC
 */
router.get('/validators', getValidators);

/**
 * @route GET /api/v1/transparency/validators/:validatorId/history
 * @desc Get validator performance history
 * @access PUBLIC
 */
router.get('/validators/:validatorId/history', getValidatorHistory);

/**
 * @route GET /api/v1/transparency/validators/preferences
 * @desc Get user's validator preferences
 * @access PRIVATE
 */
router.get('/validators/preferences', authenticate, getUserValidatorPreferences);

/**
 * @route POST /api/v1/transparency/validators/preferences
 * @desc Set user's validator preferences
 * @access PRIVATE
 */
router.post('/validators/preferences', authenticate, setValidatorPreferences);

// ============================================================================
// FEE TRANSPARENCY (Public)
// ============================================================================

/**
 * @route GET /api/v1/transparency/fees
 * @desc Get all fee configurations (with immutable caps)
 * @access PUBLIC
 */
router.get('/fees', getFeeConfigurations);

/**
 * @route GET /api/v1/transparency/yield-breakdown/:stakeId
 * @desc Get detailed yield breakdown for a stake
 * @access PRIVATE (user sees their own breakdown)
 */
router.get('/yield-breakdown/:stakeId', authenticate, getYieldBreakdown);

// ============================================================================
// PROOF OF RESERVES (Public)
// ============================================================================

/**
 * @route GET /api/v1/transparency/reserves
 * @desc Get reserve snapshots
 * @access PUBLIC
 */
router.get('/reserves', getReserveSnapshots);

/**
 * @route GET /api/v1/transparency/reserves/current
 * @desc Get current reserve ratios (summary)
 * @access PUBLIC
 */
router.get('/reserves/current', getCurrentReserveRatios);

// ============================================================================
// AIRDROP TRANSPARENCY (Mostly Public)
// ============================================================================

/**
 * @route GET /api/v1/transparency/airdrops
 * @desc Get all airdrops with 100% pass-through policy
 * @access PUBLIC
 */
router.get('/airdrops', getAirdrops);

/**
 * @route GET /api/v1/transparency/airdrops/mine
 * @desc Get user's airdrop allocations
 * @access PRIVATE
 */
router.get('/airdrops/mine', authenticate, getUserAirdrops);

// ============================================================================
// INSURANCE FUND (Public + Private)
// ============================================================================

/**
 * @route GET /api/v1/transparency/insurance
 * @desc Get insurance fund status
 * @access PUBLIC
 */
router.get('/insurance', getInsuranceFund);

/**
 * @route GET /api/v1/transparency/insurance/claims
 * @desc Get user's insurance claims
 * @access PRIVATE
 */
router.get('/insurance/claims', authenticate, getUserInsuranceClaims);

/**
 * @route POST /api/v1/transparency/insurance/claims
 * @desc Submit insurance claim
 * @access PRIVATE
 */
router.post('/insurance/claims', authenticate, submitInsuranceClaim);

// ============================================================================
// PUBLIC METRICS DASHBOARD
// ============================================================================

/**
 * @route GET /api/v1/transparency/metrics
 * @desc Get public transparency metrics
 * @access PUBLIC
 */
router.get('/metrics', getTransparencyMetrics);

export default router;
