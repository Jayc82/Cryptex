import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDatabase } from '../database/connection';
import { setCache } from '../cache/redis';
import { AppError } from '../middleware/errorHandler';

export async function register(req: Request, res: Response) {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    // Validation
    if (!email || !username || !password) {
      throw new AppError('Email, username, and password are required', 400);
    }

    const db = getDatabase();

    // Check if user exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('User already exists', 409);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, created_at`,
      [email, username, passwordHash, firstName, lastName]
    );

    const user = result.rows[0];

    // Create default wallets for major currencies
    const currencies = ['BTC', 'ETH', 'USDT'];
    for (const currency of currencies) {
      await db.query(
        'INSERT INTO wallets (user_id, currency) VALUES ($1, $2)',
        [user.id, currency]
      );
    }

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    throw error;
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      throw new AppError('Email and password are required', 400);
    }

    const db = getDatabase();

    // Get user
    const result = await db.query(
      'SELECT id, email, username, password_hash, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid credentials', 401);
    }

    const user = result.rows[0];

    if (!user.is_active) {
      throw new AppError('Account is inactive', 403);
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
      throw new Error('JWT secrets not configured');
    }
    
    const accessToken = jwt.sign(
      { userId: user.id },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtRefreshSecret,
      { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
    );

    // Store refresh token
    await db.query(
      `INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '7 days')`,
      [user.id, refreshToken, req.ip, req.get('user-agent')]
    );

    // Update last login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });
  } catch (error) {
    throw error;
  }
}

export async function refreshToken(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      throw new AppError('Refresh token is required', 400);
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as { userId: string };

    const db = getDatabase();

    // Check if refresh token exists
    const result = await db.query(
      'SELECT user_id FROM user_sessions WHERE refresh_token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Generate new access token
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    
    const accessToken = jwt.sign(
      { userId: decoded.userId },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' } as jwt.SignOptions
    );

    res.json({ accessToken });
  } catch (error) {
    throw error;
  }
}

export async function logout(req: Request, res: Response) {
  try {
    const { refreshToken } = req.body;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const accessToken = authHeader.substring(7);
      // Add access token to blacklist (expires in 24h)
      await setCache(`blacklist:${accessToken}`, true, 86400);
    }

    if (refreshToken) {
      const db = getDatabase();
      await db.query(
        'DELETE FROM user_sessions WHERE refresh_token = $1',
        [refreshToken]
      );
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    throw error;
  }
}

export async function forgotPassword(_req: Request, res: Response) {
  // Implementation for password reset email
  res.json({ message: 'Password reset email sent' });
}

export async function resetPassword(_req: Request, res: Response) {
  // Implementation for password reset
  res.json({ message: 'Password reset successful' });
}

export async function verifyEmail(_req: Request, res: Response) {
  // Implementation for email verification
  res.json({ message: 'Email verified' });
}

export async function enable2FA(_req: Request, res: Response) {
  // Implementation for 2FA setup
  res.json({ message: '2FA enabled' });
}

export async function verify2FA(_req: Request, res: Response) {
  // Implementation for 2FA verification
  res.json({ message: '2FA verified' });
}
