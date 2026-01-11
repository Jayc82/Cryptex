import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Password validation - enforce strong passwords
export function isValidPassword(password: string): boolean {
  if (password.length < 8) return false;
  if (password.length > 128) return false; // Prevent DoS
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Username validation
export function isValidUsername(username: string): boolean {
  if (username.length < 3 || username.length > 30) return false;
  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  return usernameRegex.test(username);
}

// Symbol validation (crypto trading pairs)
export function isValidSymbol(symbol: string): boolean {
  const symbolRegex = /^[A-Z]{2,10}\/[A-Z]{2,10}$/;
  return symbolRegex.test(symbol);
}

// Sanitize string input to prevent XSS
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and > to prevent HTML injection
    .trim()
    .substring(0, 1000); // Limit length to prevent DoS
}

// Validate numeric parameters
export function validateNumeric(value: any, min?: number, max?: number): number {
  const num = Number(value);
  if (isNaN(num)) {
    throw new AppError('Invalid numeric value', 400);
  }
  if (min !== undefined && num < min) {
    throw new AppError(`Value must be at least ${min}`, 400);
  }
  if (max !== undefined && num > max) {
    throw new AppError(`Value must be at most ${max}`, 400);
  }
  return num;
}

// Validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Request body sanitization middleware
export function sanitizeBody(req: Request, res: Response, next: NextFunction) {
  if (req.body) {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    }
  }
  next();
}

// Validation middleware factories
export function validateRegistration(req: Request, res: Response, next: NextFunction) {
  const { email, username, password, firstName, lastName } = req.body;

  if (!email || !username || !password) {
    throw new AppError('Email, username, and password are required', 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  if (!isValidUsername(username)) {
    throw new AppError('Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens', 400);
  }

  if (!isValidPassword(password)) {
    throw new AppError(
      'Password must be at least 8 characters and contain uppercase, lowercase, number, and special character',
      400
    );
  }

  if (firstName && firstName.length > 50) {
    throw new AppError('First name is too long', 400);
  }

  if (lastName && lastName.length > 50) {
    throw new AppError('Last name is too long', 400);
  }

  next();
}

export function validateLogin(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required', 400);
  }

  if (!isValidEmail(email)) {
    throw new AppError('Invalid email format', 400);
  }

  next();
}

export function validateTradeOrder(req: Request, res: Response, next: NextFunction) {
  const { symbol, side, type, quantity, price } = req.body;

  if (!symbol || !side || !type || !quantity) {
    throw new AppError('Missing required fields', 400);
  }

  if (!['buy', 'sell'].includes(side)) {
    throw new AppError('Invalid order side', 400);
  }

  if (!['market', 'limit', 'stop_loss', 'stop_loss_limit'].includes(type)) {
    throw new AppError('Invalid order type', 400);
  }

  const qty = validateNumeric(quantity, 0.00000001);
  if (qty <= 0) {
    throw new AppError('Quantity must be positive', 400);
  }

  if (type === 'limit' || type === 'stop_loss_limit') {
    if (!price) {
      throw new AppError('Price is required for limit orders', 400);
    }
    const priceNum = validateNumeric(price, 0);
    if (priceNum <= 0) {
      throw new AppError('Price must be positive', 400);
    }
  }

  next();
}

export function validatePagination(req: Request, res: Response, next: NextFunction) {
  if (req.query.limit) {
    const limit = validateNumeric(req.query.limit, 1, 1000);
    req.query.limit = limit.toString();
  }

  if (req.query.offset) {
    const offset = validateNumeric(req.query.offset, 0);
    req.query.offset = offset.toString();
  }

  next();
}

export function validateStake(req: Request, res: Response, next: NextFunction) {
  const { poolId, amount } = req.body;

  if (!poolId) {
    throw new AppError('Pool ID is required', 400);
  }

  if (!isValidUUID(poolId)) {
    throw new AppError('Invalid pool ID format', 400);
  }

  if (!amount) {
    throw new AppError('Amount is required', 400);
  }

  const amountNum = validateNumeric(amount, 0.00000001);
  if (amountNum <= 0) {
    throw new AppError('Amount must be positive', 400);
  }

  next();
}

export function validateMinerConfig(req: Request, res: Response, next: NextFunction) {
  const { poolId, minerName, walletId } = req.body;

  if (!poolId) {
    throw new AppError('Pool ID is required', 400);
  }

  if (!isValidUUID(poolId)) {
    throw new AppError('Invalid pool ID format', 400);
  }

  if (!walletId) {
    throw new AppError('Wallet ID is required', 400);
  }

  if (!isValidUUID(walletId)) {
    throw new AppError('Invalid wallet ID format', 400);
  }

  if (minerName && (minerName.length < 3 || minerName.length > 100)) {
    throw new AppError('Miner name must be 3-100 characters', 400);
  }

  next();
}

export function validateWorker(req: Request, res: Response, next: NextFunction) {
  const { workerName } = req.body;

  if (!workerName) {
    throw new AppError('Worker name is required', 400);
  }

  if (workerName.length < 3 || workerName.length > 100) {
    throw new AppError('Worker name must be 3-100 characters', 400);
  }

  // Validate worker name format (alphanumeric, dash, underscore)
  if (!/^[a-zA-Z0-9_-]+$/.test(workerName)) {
    throw new AppError('Worker name can only contain letters, numbers, dashes, and underscores', 400);
  }

  next();
}
