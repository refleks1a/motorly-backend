import { Request, Response, NextFunction } from 'express';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../index';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = AuthUtils.verifyToken(token);
      
      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true }
      });

      if (!user) {
        res.status(401).json({ error: 'User no longer exists' });
        return;
      }

      req.user = {
        id: user.id,
        email: user.email
      };

      next();
    } catch (error) {
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
    return;
  }
};

export const optionalAuthenticate = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next(); // Continue without authentication
      return;
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = AuthUtils.verifyToken(token);
      
      // Check if user still exists
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email
        };
      }

      next();
    } catch (error) {
      // Token is invalid, but we continue without authentication
      next();
      return;
    }
  } catch (error) {
    console.error('Optional authentication error:', error);
    next(); // Continue without authentication on error
    return;
  }
};