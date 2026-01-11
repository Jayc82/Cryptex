import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { getDatabase } from '../database/connection';
import bcrypt from 'bcrypt';
import { AppError } from '../middleware/errorHandler';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const result = await db.query(
      `SELECT id, email, username, first_name, last_name, phone,
              two_factor_enabled, kyc_status, kyc_level, last_login, created_at
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    throw error;
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { firstName, lastName, phone } = req.body;

    const db = getDatabase();
    const result = await db.query(
      `UPDATE users 
       SET first_name = COALESCE($1, first_name),
           last_name = COALESCE($2, last_name),
           phone = COALESCE($3, phone)
       WHERE id = $4
       RETURNING id, email, username, first_name, last_name, phone`,
      [firstName, lastName, phone, userId]
    );

    res.json({ user: result.rows[0] });
  } catch (error) {
    throw error;
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new AppError('Current and new password are required', 400);
    }

    const db = getDatabase();

    // Verify current password
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const isValid = await bcrypt.compare(
      currentPassword,
      userResult.rows[0].password_hash
    );

    if (!isValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    // Invalidate all sessions except current
    await db.query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    throw error;
  }
}

export async function getSecuritySettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const result = await db.query(
      `SELECT two_factor_enabled, last_login
       FROM users WHERE id = $1`,
      [userId]
    );

    res.json({ security: result.rows[0] });
  } catch (error) {
    throw error;
  }
}

export async function updateSecuritySettings(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { twoFactorEnabled } = req.body;

    const db = getDatabase();
    await db.query(
      'UPDATE users SET two_factor_enabled = $1 WHERE id = $2',
      [twoFactorEnabled, userId]
    );

    res.json({ message: 'Security settings updated' });
  } catch (error) {
    throw error;
  }
}

export async function getSessions(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const db = getDatabase();

    const result = await db.query(
      `SELECT id, ip_address, user_agent, created_at, expires_at
       FROM user_sessions 
       WHERE user_id = $1 AND expires_at > NOW()
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({ sessions: result.rows });
  } catch (error) {
    throw error;
  }
}

export async function revokeSession(req: AuthRequest, res: Response) {
  try {
    const userId = req.userId!;
    const { sessionId } = req.params;

    const db = getDatabase();
    await db.query(
      'DELETE FROM user_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );

    res.json({ message: 'Session revoked successfully' });
  } catch (error) {
    throw error;
  }
}
