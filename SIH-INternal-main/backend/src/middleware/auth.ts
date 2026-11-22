import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { query } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET must be set in the environment.');
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string | null;
  startupId?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId,
      startupId: user.startupId,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'] }
  );
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<AuthenticatedUser> & { id?: string };
    if (!decoded.id) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    // Never authorize from role claims supplied by the client. JWTs are only
    // used to identify the session; permissions come from the current DB row.
    const userResult = await query(
      'SELECT id, email, name, role, department_id, startup_id FROM users WHERE id = $1',
      [decoded.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'User session is no longer valid.' });
    }

    const user = userResult.rows[0];
    req.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      departmentId: user.department_id,
      startupId: user.startup_id,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

export async function optionalAuthMiddleware(req: AuthRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as Partial<AuthenticatedUser> & { id?: string };
    if (decoded.id) {
      const userResult = await query(
        'SELECT id, email, name, role, department_id, startup_id FROM users WHERE id = $1',
        [decoded.id]
      );
      const user = userResult.rows[0];
      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          departmentId: user.department_id,
          startupId: user.startup_id,
        };
      }
    }
  } catch {
    // Ignore invalid token in optional auth
  }
  next();
}

export function requireRoles(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required. No session token provided.' });
    }
    if (req.user.role === 'SUPER_ADMIN' || roles.includes(req.user.role)) {
      return next();
    }
    return res.status(403).json({
      error: `Access Denied (RBAC): Your role '${req.user.role}' does not have sufficient permissions for this operation. Required: ${roles.join(', ')} or SUPER_ADMIN.`,
      userRole: req.user.role,
      requiredRoles: roles,
    });
  };
}

export async function logAudit(
  user: AuthenticatedUser | undefined,
  action: string,
  entity: string,
  entityId: string,
  metadata?: any,
  ipAddress?: string
) {
  try {
    const logId = `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(
      `INSERT INTO audit_logs (id, user_id, user_email, action, entity, entity_id, metadata, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        logId,
        user?.id || null,
        user?.email || 'system',
        action,
        entity,
        entityId,
        metadata ? JSON.stringify(metadata) : null,
        ipAddress || '127.0.0.1',
      ]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

export async function createNotification(
  userId: string | null,
  role: string | null,
  title: string,
  message: string,
  link?: string
) {
  try {
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
    await query(
      `INSERT INTO notifications (id, user_id, role, title, message, link, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, false)`,
      [notifId, userId, role, title, message, link || null]
    );
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
}
