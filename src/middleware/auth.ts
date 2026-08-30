import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users, organizations } from '../db/schema.ts';
import { eq, and } from 'drizzle-orm';
import { UserRole } from '../types.ts';

export interface AuthenticatedUser {
  id: string; // Database UUID
  uid: string; // Firebase UID
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  title?: string | null;
  isActive: boolean;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  decodedToken?: DecodedIdToken;
}

/**
 * Extracts and verifies Firebase ID Token without requiring an existing organization membership.
 * Used for onboarding and invitation acceptance routes.
 */
export const verifyFirebaseToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenErr: any) {
      console.error('[Auth Middleware] Token verification failed:', tokenErr.message || tokenErr);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
    }

    req.decodedToken = decodedToken;
    next();
  } catch (error) {
    console.error('[Auth Middleware] Internal verification error:', error);
    return res.status(500).json({ error: 'Internal error validating authentication' });
  }
};

/**
 * Strict Multi-Tenant Authentication Middleware.
 * Enforces that the user is authenticated with Firebase AND has an active user account in an active Organization.
 */
export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: Missing or malformed Authorization header' });
    }

    const token = authHeader.split('Bearer ')[1];
    let decodedToken: DecodedIdToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(token);
    } catch (tokenErr: any) {
      console.error('[Auth Middleware] Token verification failed:', tokenErr.message || tokenErr);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
    }

    req.decodedToken = decodedToken;
    const uid = decodedToken.uid;

    // Look up the user record by Firebase UID
    const existingUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existingUsers.length === 0) {
      // Check if this is the very first user in the database or an unassigned user
      const totalOrgs = await db.select().from(organizations).limit(1);
      
      if (totalOrgs.length === 0) {
        // Zero organizations exist in entire system - trigger initial organization onboarding requirement
        return res.status(403).json({
          code: 'ONBOARDING_REQUIRED',
          error: 'No organization configured. Please complete initial organization onboarding.',
          email: decodedToken.email || '',
          name: decodedToken.name || ''
        });
      }

      // Check if user is associated by email to any organization (e.g. created by admin before first login)
      if (decodedToken.email) {
        const userByEmail = await db.select().from(users).where(eq(users.email, decodedToken.email.toLowerCase())).limit(1);
        if (userByEmail.length > 0 && (!userByEmail[0]!.uid || userByEmail[0]!.uid.startsWith('temp_'))) {
          // Link Firebase UID to existing user profile
          const [linkedUser] = await db.update(users)
            .set({ uid, updatedAt: new Date() })
            .where(eq(users.id, userByEmail[0]!.id))
            .returning();
          
          req.user = {
            id: linkedUser!.id,
            uid: linkedUser!.uid,
            email: linkedUser!.email,
            name: linkedUser!.name,
            role: linkedUser!.role as UserRole,
            organizationId: linkedUser!.organizationId,
            title: linkedUser!.title,
            isActive: linkedUser!.isActive
          };
          return next();
        }
      }

      // User has no organization membership
      return res.status(403).json({
        code: 'MEMBERSHIP_REQUIRED',
        error: 'You do not have access to an organization. Please request an invitation from your organization administrator or create a new organization.',
        email: decodedToken.email || '',
        name: decodedToken.name || ''
      });
    }

    const dbUser = existingUsers[0]!;

    if (!dbUser.isActive) {
      return res.status(403).json({
        code: 'ACCOUNT_DEACTIVATED',
        error: 'Your account has been deactivated. Please contact your organization administrator.'
      });
    }

    // Verify user's organization is active
    const org = await db.select().from(organizations).where(eq(organizations.id, dbUser.organizationId)).limit(1);
    if (org.length === 0 || org[0]!.activeStatus === 'Suspended') {
      return res.status(403).json({
        code: 'ORGANIZATION_INACTIVE',
        error: 'Your organization account is inactive or suspended.'
      });
    }

    req.user = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as UserRole,
      organizationId: dbUser.organizationId,
      title: dbUser.title,
      isActive: dbUser.isActive
    };

    return next();
  } catch (error) {
    console.error('[Auth Middleware] Internal error during authentication:', error);
    return res.status(500).json({ error: 'Internal server error during authentication verification' });
  }
};

/**
 * Role-Based Access Control (RBAC) Guard
 * Validates that the authenticated user possesses one of the required roles.
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: User authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role. Current role: ${req.user.role}`
      });
    }

    next();
  };
};
