import { Request, Response } from 'express';
import { AuthUtils } from '../utils/auth';
import { prisma } from '../index';
import { 
  RegisterRequest, 
  LoginRequest, 
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest
} from '../types';

// In-memory store for reset codes (in production, use Redis or database)
const resetCodes = new Map<string, { code: string; expiresAt: Date }>();

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, name }: RegisterRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Validate email format
      if (!AuthUtils.validateEmail(email)) {
        res.status(400).json({ error: 'Invalid email format' });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthUtils.validatePassword(password);
      if (!passwordValidation.valid) {
        res.status(400).json({ error: passwordValidation.message });
        return;
      }

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Hash password
      const passwordHash = await AuthUtils.hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name
        },
        select: {
          id: true,
          email: true,
          name: true
        }
      });

      // Generate token
      const token = AuthUtils.generateToken(user.id, user.email);

      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined
        }
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password }: LoginRequest = req.body;

      // Validate input
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required' });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          email: true,
          name: true,
          passwordHash: true
        }
      });

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Verify password
      const isValidPassword = await AuthUtils.comparePassword(password, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = AuthUtils.generateToken(user.id, user.email);

      const response: AuthResponse = {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name || undefined
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Forgot password - request reset code
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email }: ForgotPasswordRequest = req.body;

      if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Don't reveal that user doesn't exist for security
        res.status(200).json({ message: 'If an account exists with this email, a reset code has been sent' });
        return;
      }

      // Generate reset code
      const code = AuthUtils.generateResetCode();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset code (in production, use database or Redis)
      resetCodes.set(email, { code, expiresAt });

      // In production, send email with code
      console.log(`Reset code for ${email}: ${code} (expires at ${expiresAt})`);

      res.status(200).json({ 
        message: 'If an account exists with this email, a reset code has been sent',
        // In development, return the code for testing
        ...(process.env.NODE_ENV === 'development' && { code })
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Reset password with code
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, code, newPassword }: ResetPasswordRequest = req.body;

      if (!email || !code || !newPassword) {
        res.status(400).json({ error: 'Email, code, and new password are required' });
        return;
      }

      // Validate password strength
      const passwordValidation = AuthUtils.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ error: passwordValidation.message });
        return;
      }

      // Check if reset code exists and is valid
      const resetData = resetCodes.get(email);
      if (!resetData) {
        res.status(400).json({ error: 'Invalid or expired reset code' });
        return;
      }

      if (resetData.code !== code) {
        res.status(400).json({ error: 'Invalid reset code' });
        return;
      }

      if (resetData.expiresAt < new Date()) {
        resetCodes.delete(email);
        res.status(400).json({ error: 'Reset code has expired' });
        return;
      }

      // Find user
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Hash new password
      const passwordHash = await AuthUtils.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash }
      });

      // Remove used reset code
      resetCodes.delete(email);

      res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Change password (authenticated)
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({ error: 'Current password and new password are required' });
        return;
      }

      // Validate new password strength
      const passwordValidation = AuthUtils.validatePassword(newPassword);
      if (!passwordValidation.valid) {
        res.status(400).json({ error: passwordValidation.message });
        return;
      }

      // Get user with password hash
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { passwordHash: true }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Verify current password
      const isValidPassword = await AuthUtils.comparePassword(currentPassword, user.passwordHash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Current password is incorrect' });
        return;
      }

      // Hash new password
      const newPasswordHash = await AuthUtils.hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newPasswordHash }
      });

      res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Get current user profile
  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          name: true,
          distanceUnit: true,
          fuelUnit: true,
          temperatureUnit: true,
          currency: true,
          theme: true,
          fontSize: true,
          maintenanceReminders: true,
          serviceDueAlerts: true,
          promotionalOffers: true,
          diagnosticAlerts: true,
          allowAnonymousData: true,
          allowAnalytics: true,
          allowThirdPartyData: true,
          marketingEmails: true,
          transactionalEmails: true
        }
      });

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const profile = {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        preferences: {
          distanceUnit: user.distanceUnit as 'kilometers' | 'miles',
          fuelUnit: user.fuelUnit as 'liters' | 'gallons',
          temperatureUnit: user.temperatureUnit as 'celsius' | 'fahrenheit',
          currency: user.currency,
          theme: user.theme as 'light' | 'dark' | 'auto',
          fontSize: user.fontSize as 'small' | 'medium' | 'large'
        },
        notificationSettings: {
          maintenanceReminders: user.maintenanceReminders,
          serviceDueAlerts: user.serviceDueAlerts,
          promotionalOffers: user.promotionalOffers,
          diagnosticAlerts: user.diagnosticAlerts
        },
        privacySettings: {
          allowAnonymousData: user.allowAnonymousData,
          allowAnalytics: user.allowAnalytics,
          allowThirdPartyData: user.allowThirdPartyData
        },
        emailPreferences: {
          marketingEmails: user.marketingEmails,
          transactionalEmails: user.transactionalEmails
        }
      };

      res.status(200).json(profile);
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      const updates = req.body;

      // Validate updates
      const allowedUpdates = ['name', 'distanceUnit', 'fuelUnit', 'temperatureUnit', 'currency', 'theme', 'fontSize'];
      const updateData: any = {};

      for (const key of Object.keys(updates)) {
        if (allowedUpdates.includes(key)) {
          updateData[key] = updates[key];
        }
      }

      if (Object.keys(updateData).length === 0) {
        res.status(400).json({ error: 'No valid fields to update' });
        return;
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          distanceUnit: true,
          fuelUnit: true,
          temperatureUnit: true,
          currency: true,
          theme: true,
          fontSize: true
        }
      });

      const profile = {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name || undefined,
        preferences: {
          distanceUnit: updatedUser.distanceUnit as 'kilometers' | 'miles',
          fuelUnit: updatedUser.fuelUnit as 'liters' | 'gallons',
          temperatureUnit: updatedUser.temperatureUnit as 'celsius' | 'fahrenheit',
          currency: updatedUser.currency,
          theme: updatedUser.theme as 'light' | 'dark' | 'auto',
          fontSize: updatedUser.fontSize as 'small' | 'medium' | 'large'
        }
      };

      res.status(200).json(profile);
    } catch (error) {
      console.error('Update profile error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  // Delete account
  static async deleteAccount(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        res.status(401).json({ error: 'Not authenticated' });
        return;
      }

      // Delete user (Prisma will cascade delete related records)
      await prisma.user.delete({
        where: { id: userId }
      });

      res.status(200).json({ message: 'Account deleted successfully' });
    } catch (error) {
      console.error('Delete account error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}