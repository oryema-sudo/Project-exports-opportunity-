import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';
import { db } from '../db/index.ts';
import { users, organizations } from '../db/schema.ts';
import { eq } from 'drizzle-orm';
import { UserRole } from '../types.ts';

export interface AuthenticatedUser {
  id: string; // Database UUID
  uid: string; // Firebase UID
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  title?: string | null;
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  decodedToken?: DecodedIdToken;
}

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
    } catch (tokenErr) {
      console.error('[Auth Middleware] Token verification failed:', tokenErr);
      return res.status(401).json({ error: 'Unauthorized: Invalid or expired authentication token' });
    }

    req.decodedToken = decodedToken;
    const uid = decodedToken.uid;
    const email = decodedToken.email || `user_${uid.slice(0, 8)}@ugandacoffee.org`;
    const name = decodedToken.name || email.split('@')[0] || 'Coffee Officer';

    // Query user in PostgreSQL
    const existingUsers = await db.select().from(users).where(eq(users.uid, uid)).limit(1);

    if (existingUsers.length > 0) {
      const dbUser = existingUsers[0]!;
      req.user = {
        id: dbUser.id,
        uid: dbUser.uid,
        email: dbUser.email,
        name: dbUser.name,
        role: dbUser.role as UserRole,
        organizationId: dbUser.organizationId,
        title: dbUser.title
      };
      return next();
    }

    // If user does not exist yet in DB, check if a default organization exists or create one for this initial pilot user
    const existingOrgs = await db.select().from(organizations).limit(1);
    let organizationId: string;

    if (existingOrgs.length > 0) {
      organizationId = existingOrgs[0]!.id;
    } else {
      const [newOrg] = await db.insert(organizations).values({
        legalName: 'Uganda Coffee Producers & Exporters Alliance Ltd',
        type: 'Exporter',
        registrationNumber: 'UCDA/EXP/2026/0491',
        country: 'Uganda',
        district: 'Kampala',
        address: 'Plot 14B Jinja Road, Industrial Area, Kampala',
        contactPhone: '+256 414 256 890',
        email: email,
        contactEmail: email,
        website: 'https://ugandacoffee.org',
        subscriptionPlan: 'Professional (UGX 600k/mo)',
        activeStatus: 'Active'
      }).returning();
      organizationId = newOrg!.id;
    }

    // Insert user as Admin (if first user in org) or Staff
    const role: UserRole = existingOrgs.length === 0 ? 'admin' : 'staff';
    const [newUser] = await db.insert(users).values({
      uid,
      email,
      name,
      role,
      organizationId,
      title: 'Compliance & Export Operations Lead'
    }).returning();

    req.user = {
      id: newUser!.id,
      uid: newUser!.uid,
      email: newUser!.email,
      name: newUser!.name,
      role: newUser!.role as UserRole,
      organizationId: newUser!.organizationId,
      title: newUser!.title
    };

    return next();
  } catch (error) {
    console.error('[Auth Middleware] Internal error during authentication:', error);
    return res.status(500).json({ error: 'Internal server error during authentication verification' });
  }
};

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
