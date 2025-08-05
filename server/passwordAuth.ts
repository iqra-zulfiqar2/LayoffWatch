import bcrypt from 'bcrypt';
import { Express, RequestHandler } from 'express';
import { storage } from './storage';
import { signupSchema, loginSchema, SignupRequest, LoginRequest } from '@shared/schema';

const SALT_ROUNDS = 10;

export function setupPasswordAuth(app: Express) {
  // Email/Password signup
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const validation = signupSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues
        });
      }

      const { firstName, lastName, email, password }: SignupRequest = validation.data;

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

      // Create user
      const user = await storage.createEmailUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        authProvider: 'email',
        isEmailVerified: true // Auto-verify for now, can add email verification later
      });

      // Create session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: 'email'
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.status(201).json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Email/Password login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const validation = loginSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validation.error.issues
        });
      }

      const { email, password }: LoginRequest = validation.data;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user || user.authProvider !== 'email' || !user.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      // Update last login
      await storage.updateUserLastLogin(user.id);

      // Create session
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        authProvider: 'email'
      };

      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      res.json({
        success: true,
        redirectTo: '/pricing',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Logout (works for all auth methods)
  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: 'Failed to logout' });
      }
      res.clearCookie('connect.sid');
      res.json({ success: true, redirectTo: '/' });
    });
  });

  // GET logout route for direct browser redirects
  app.get('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error('Logout error:', err);
        return res.redirect('/?error=logout_failed');
      }
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
}

// Middleware to check if user is authenticated (email/password)
export const isEmailAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const sessionUser = (req.session as any)?.user;
    
    if (!sessionUser || !sessionUser.id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Get full user data
    const user = await storage.getUser(sessionUser.id);
    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Attach user to request
    (req as any).user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Combined middleware that accepts both Replit and email authentication
export const isAuthenticatedAny: RequestHandler = async (req, res, next) => {
  // Try email authentication first
  const sessionUser = (req.session as any)?.user;
  if (sessionUser && sessionUser.id) {
    try {
      const user = await storage.getUser(sessionUser.id);
      if (user) {
        (req as any).user = user;
        return next();
      }
    } catch (error) {
      console.error('Email auth check error:', error);
    }
  }

  // Try Replit authentication
  try {
    const replitUser = (req as any).user;
    if (req.isAuthenticated && req.isAuthenticated() && replitUser?.claims?.sub) {
      const userId = replitUser.claims.sub;
      const user = await storage.getUser(userId);
      if (user) {
        (req as any).user = user;
        return next();
      }
    }
  } catch (error) {
    console.error('Replit auth check error:', error);
  }

  return res.status(401).json({ message: "Unauthorized" });
};