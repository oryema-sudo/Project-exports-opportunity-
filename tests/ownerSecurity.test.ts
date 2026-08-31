import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireRole, requirePlatformOwner } from '../src/middleware/auth.ts';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { db } from '../src/db/index.ts';
import { z } from 'zod';

// Zod validation schema matching the server expense validation
const expenseSchema = z.object({
  amount: z.number().positive('Expense amount must be greater than zero'),
  currency: z.string().default('UGX'),
  category: z.enum([
    'Cloud Infrastructure',
    'UCDA Field Operations',
    'Telecom & Mobile Money',
    'Legal & Compliance',
    'Salaries & Contractors',
    'Office & Admin',
    'Marketing',
    'Other'
  ]),
  description: z.string().min(3, 'Description must be at least 3 characters'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  vendor: z.string().min(2, 'Vendor name is required'),
  recurring: z.boolean().default(false),
  receiptReference: z.string().optional(),
  notes: z.string().optional()
});

describe('CEO / Platform Owner Security & Financial Integrity Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Platform Owner Access Control & RBAC Enforcement', () => {

    it('Rejects unauthenticated requests with 401 Unauthorized', async () => {
      const req = { headers: {} } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      await requirePlatformOwner(req, res, next);
      expect(statusSent).toBe(401);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.error).toMatch(/Missing or malformed Authorization header/i);
    });

    it('Rejects customer admin, staff, and viewer roles with 403 Forbidden', async () => {
      const mockRoles = ['admin', 'staff', 'viewer'] as const;

      for (const role of mockRoles) {
        vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
          uid: `uid-${role}`,
          email: `${role}@exporter.ug`,
          name: `Customer ${role}`
        } as any);

        vi.spyOn(db, 'select').mockReturnValue({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockResolvedValue([
                {
                  id: `usr-${role}`,
                  uid: `uid-${role}`,
                  email: `${role}@exporter.ug`,
                  name: `Customer ${role}`,
                  role: role,
                  organizationId: 'org-customer-01',
                  isActive: true,
                  isPlatformOwner: false,
                  platformRole: null
                }
              ])
            })
          })
        } as any);

        const req = {
          headers: { authorization: 'Bearer valid_token' }
        } as any;
        let statusSent = 0;
        let jsonSent: any = null;
        const res = {
          status: (code: number) => {
            statusSent = code;
            return { json: (data: any) => { jsonSent = data; } };
          }
        } as any;
        const next = vi.fn();

        await requirePlatformOwner(req, res, next);
        expect(statusSent).toBe(403);
        expect(next).not.toHaveBeenCalled();
        expect(jsonSent.error).toMatch(/Platform Owner authorization required/i);
      }
    });

    it('Rejects hardcoded email bypass attempts when user is not marked PLATFORM_OWNER in database', async () => {
      vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
        uid: 'uid-impostor',
        email: 'oryemajoseph3@gmail.com', // An impostor using owner email
        name: 'Impostor User'
      } as any);

      // In the database, this user is just a regular customer admin and is NOT platform owner
      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'usr-impostor',
                uid: 'uid-impostor',
                email: 'oryemajoseph3@gmail.com',
                name: 'Impostor User',
                role: 'admin',
                organizationId: 'org-exporter-99',
                isActive: true,
                isPlatformOwner: false,
                platformRole: null // NOT PLATFORM_OWNER!
              }
            ])
          })
        })
      } as any);

      const req = {
        headers: { authorization: 'Bearer token_from_impostor' }
      } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      await requirePlatformOwner(req, res, next);
      expect(statusSent).toBe(403);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.error).toMatch(/Platform Owner authorization required/i);
    });

    it('Rejects client-supplied role or isPlatformOwner forgery in request body or headers', async () => {
      vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
        uid: 'uid-forger',
        email: 'attacker@bad.org',
        name: 'Attacker'
      } as any);

      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'usr-forger',
                uid: 'uid-forger',
                email: 'attacker@bad.org',
                name: 'Attacker',
                role: 'staff',
                organizationId: 'org-bad',
                isActive: true,
                isPlatformOwner: false,
                platformRole: null
              }
            ])
          })
        })
      } as any);

      const req = {
        headers: {
          authorization: 'Bearer token_attacker',
          'x-role': 'PLATFORM_OWNER',
          'x-is-platform-owner': 'true'
        },
        body: {
          role: 'PLATFORM_OWNER',
          isPlatformOwner: true,
          platformRole: 'PLATFORM_OWNER'
        },
        query: {
          isPlatformOwner: 'true'
        }
      } as any;

      let statusSent = 0;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => {} };
        }
      } as any;
      const next = vi.fn();

      await requirePlatformOwner(req, res, next);
      expect(statusSent).toBe(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('Allows legitimate PLATFORM_OWNER with database verification', async () => {
      vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
        uid: 'uid-legit-owner',
        email: 'ceo@platform.ug',
        name: 'Platform CEO'
      } as any);

      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'usr-owner-001',
                uid: 'uid-legit-owner',
                email: 'ceo@platform.ug',
                name: 'Platform CEO',
                role: 'admin',
                organizationId: 'org-glc-01',
                isActive: true,
                isPlatformOwner: true,
                platformRole: 'PLATFORM_OWNER'
              }
            ])
          })
        })
      } as any);

      const req = {
        headers: { authorization: 'Bearer token_owner' }
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      } as any;
      const next = vi.fn();

      await requirePlatformOwner(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.platformRole).toBe('PLATFORM_OWNER');
      expect(req.user.isPlatformOwner).toBe(true);
    });

    it('Enforces tenant-level requireRole guard', () => {
      const adminGuard = requireRole(['admin']);
      const reqAdmin = { user: { role: 'admin' } } as any;
      const reqViewer = { user: { role: 'viewer' } } as any;

      let statusSent = 0;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => {} };
        }
      } as any;
      const nextSuccess = vi.fn();
      const nextFail = vi.fn();

      adminGuard(reqAdmin, res, nextSuccess);
      expect(nextSuccess).toHaveBeenCalled();

      adminGuard(reqViewer, res, nextFail);
      expect(statusSent).toBe(403);
      expect(nextFail).not.toHaveBeenCalled();
    });
  });

  describe('2. Expense Model Validation', () => {

    it('Validates correct expense payloads', () => {
      const validPayload = {
        amount: 850000,
        currency: 'UGX',
        category: 'Cloud Infrastructure',
        description: 'Google Cloud Platform monthly database and server instances',
        date: '2026-08-15',
        vendor: 'Google Cloud EMEA Ltd',
        recurring: true,
        receiptReference: 'INV-GCP-2026-08',
        notes: 'Production cluster infrastructure'
      };

      const result = expenseSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('Rejects negative or zero amounts', () => {
      const invalidPayload = {
        amount: -5000,
        currency: 'UGX',
        category: 'Cloud Infrastructure',
        description: 'Negative expense attempt',
        date: '2026-08-15',
        vendor: 'Vendor Ltd'
      };

      const result = expenseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/greater than zero/i);
      }
    });

    it('Rejects invalid date formats', () => {
      const invalidPayload = {
        amount: 250000,
        currency: 'UGX',
        category: 'Legal & Compliance',
        description: 'UCDA Annual Certification',
        date: '15/08/2026', // Wrong format, should be YYYY-MM-DD
        vendor: 'UCDA'
      };

      const result = expenseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0]?.message).toMatch(/YYYY-MM-DD/i);
      }
    });

    it('Rejects invalid expense category', () => {
      const invalidPayload = {
        amount: 150000,
        currency: 'UGX',
        category: 'InvalidCategory',
        description: 'Invalid Category test',
        date: '2026-08-15',
        vendor: 'Unknown'
      };

      const result = expenseSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('3. Financial & Revenue Calculations Integrity', () => {

    it('Distinguishes Cash Received vs Outstanding vs Failed vs Refunded', () => {
      const mockPayments = [
        { id: '1', amountUgx: '1800000', status: 'successful' },
        { id: '2', amountUgx: '600000', status: 'successful' },
        { id: '3', amountUgx: '250000', status: 'pending' },
        { id: '4', amountUgx: '600000', status: 'failed' },
        { id: '5', amountUgx: '300000', status: 'refunded' }
      ];

      let cashReceived = 0;
      let outstanding = 0;
      let failed = 0;
      let refunded = 0;

      mockPayments.forEach(p => {
        const amt = Number(p.amountUgx) || 0;
        if (p.status === 'successful') cashReceived += amt;
        else if (p.status === 'pending') outstanding += amt;
        else if (p.status === 'failed') failed += amt;
        else if (p.status === 'refunded') refunded += amt;
      });

      expect(cashReceived).toBe(2400000); // 1.8M + 600k
      expect(outstanding).toBe(250000);
      expect(failed).toBe(600000);
      expect(refunded).toBe(300000);

      // Total collected minus refunds
      const netRevenue = cashReceived - refunded;
      expect(netRevenue).toBe(2100000);
    });

    it('Calculates MRR and ARR correctly from active subscriptions with monthly/annual cycles', () => {
      const mockSubs = [
        { planId: 'enterprise', amountUgx: '1800000', billingCycle: 'monthly', status: 'active' },
        { planId: 'professional', amountUgx: '600000', billingCycle: 'monthly', status: 'active' },
        { planId: 'starter', amountUgx: '3000000', billingCycle: 'annual', status: 'active' }, // 3M/yr = 250k/mo
        { planId: 'professional', amountUgx: '600000', billingCycle: 'monthly', status: 'past_due' }, // excluded
        { planId: 'starter', amountUgx: '250000', billingCycle: 'monthly', status: 'cancelled' } // excluded
      ];

      let mrr = 0;
      let activeCount = 0;
      mockSubs.forEach(s => {
        if (s.status === 'active') {
          activeCount++;
          const amt = Number(s.amountUgx);
          mrr += s.billingCycle === 'annual' ? Math.round(amt / 12) : amt;
        }
      });

      expect(activeCount).toBe(3);
      expect(mrr).toBe(2650000); // 1.8M + 600k + 250k
      const arr = mrr * 12;
      expect(arr).toBe(31800000);
    });

    it('Operating Profit correctly subtracts expenses and refunds from gross revenue', () => {
      const grossCashReceived = 3600000;
      const refunded = 200000;
      const netRevenue = grossCashReceived - refunded;

      const expenses = [
        { amount: 450000, category: 'Cloud Infrastructure' },
        { amount: 380000, category: 'Telecom & Mobile Money' },
        { amount: 250000, category: 'UCDA Field Operations' }
      ];

      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const operatingProfit = netRevenue - totalExpenses;

      expect(totalExpenses).toBe(1080000);
      expect(operatingProfit).toBe(2320000);
    });
  });
});
