import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import axios from 'axios';
import { getCache, setCache } from '../cache/redis';
import { AppError } from '../middleware/errorHandler';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:5000';
const AI_TIMEOUT = parseInt(process.env.AI_SERVICE_TIMEOUT || '30000');

export async function getInsights(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { symbol } = req.params;

    // Check cache
    const cacheKey = `ai:insights:${symbol}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Call AI service
    const response = await axios.post(
      `${AI_SERVICE_URL}/api/insights`,
      { symbol, userId },
      { timeout: AI_TIMEOUT }
    );

    // Cache for 5 minutes
    await setCache(cacheKey, response.data, 300);

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}

export async function getPricePrediction(req: AuthRequest, res: Response) {
  try {
    const { symbol } = req.params;
    const { timeframe = '24h' } = req.query;

    const cacheKey = `ai:prediction:${symbol}:${timeframe}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/predict`,
      { symbol, timeframe },
      { timeout: AI_TIMEOUT }
    );

    await setCache(cacheKey, response.data, 600); // 10 minutes

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}

export async function getRiskAssessment(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;

    const cacheKey = `ai:risk:${userId}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/risk-assessment`,
      { userId },
      { timeout: AI_TIMEOUT }
    );

    await setCache(cacheKey, response.data, 300);

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}

export async function getRecommendations(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { riskTolerance = 'medium' } = req.query;

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/recommendations`,
      { userId, riskTolerance },
      { timeout: AI_TIMEOUT }
    );

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}

export async function analyzeTradeOpportunity(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { symbol, side, quantity, price } = req.body;

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/analyze-trade`,
      { userId, symbol, side, quantity, price },
      { timeout: AI_TIMEOUT }
    );

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}

export async function getMarketSentiment(req: AuthRequest, res: Response) {
  try {
    const { symbol } = req.params;

    const cacheKey = `ai:sentiment:${symbol}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const response = await axios.post(
      `${AI_SERVICE_URL}/api/sentiment`,
      { symbol },
      { timeout: AI_TIMEOUT }
    );

    await setCache(cacheKey, response.data, 180); // 3 minutes

    res.json(response.data);
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new AppError('AI service unavailable', 503);
    }
    throw error;
  }
}
