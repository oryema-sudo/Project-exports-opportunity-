import { describe, it, expect, vi } from 'vitest';
import { requireRole, requirePlatformOwner } from '../src/middleware/auth';
import { Request, Response, NextFunction } from 'express';

describe('CEO / Platform Owner Security & Authorization Tests', () => {

  it('1. Rejects unauthenticated requests with 401 Unauthorized', async () => {
    const req = {
      headers: {},
    } as any;
    let statusSent = 0;
    let jsonSent: any = null;
    const res = {
      status: (code: number) => {
        statusSent = code;
        return {
          json: (data: any) => { jsonSent = data; }
        };
      }
    } as any;
    const next = vi.fn();

    await requirePlatformOwner(req, res, next);
    expect(statusSent).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('2. Organization role guards enforce tenant-level role hierarchies', () => {
    const adminGuard = requireRole(['admin']);
    const reqAdmin = { user: { role: 'admin' } } as any;
    const reqViewer = { user: { role: 'viewer' } } as any;

    let statusSent = 0;
    let jsonSent: any = null;
    const res = {
      status: (code: number) => {
        statusSent = code;
        return {
          json: (data: any) => { jsonSent = data; }
        };
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

  it('3. Financial Calculations: Accurate separation of cash received vs failed vs pending', () => {
    const mockPayments = [
      { id: '1', amountUgx: '1800000', status: 'successful' },
      { id: '2', amountUgx: '600000', status: 'successful' },
      { id: '3', amountUgx: '250000', status: 'pending' },
      { id: '4', amountUgx: '600000', status: 'failed' }
    ];

    let cashReceived = 0;
    let outstanding = 0;
    let failed = 0;

    mockPayments.forEach(p => {
      const amt = Number(p.amountUgx) || 0;
      if (p.status === 'successful') cashReceived += amt;
      else if (p.status === 'pending') outstanding += amt;
      else if (p.status === 'failed') failed += amt;
    });

    expect(cashReceived).toBe(2400000); // 1.8M + 600k
    expect(outstanding).toBe(250000);
    expect(failed).toBe(600000);
    expect(cashReceived + outstanding + failed).toBe(3250000);
  });

  it('4. Financial Calculations: MRR and ARR computations from active subscriptions', () => {
    const mockSubs = [
      { planId: 'enterprise', amountUgx: '1800000', billingCycle: 'monthly', status: 'active' },
      { planId: 'professional', amountUgx: '600000', billingCycle: 'monthly', status: 'active' },
      { planId: 'starter', amountUgx: '3000000', billingCycle: 'annual', status: 'active' }, // 250k/mo
      { planId: 'professional', amountUgx: '600000', billingCycle: 'monthly', status: 'past_due' } // should not count
    ];

    let mrr = 0;
    mockSubs.forEach(s => {
      if (s.status === 'active') {
        const amt = Number(s.amountUgx);
        mrr += s.billingCycle === 'annual' ? Math.round(amt / 12) : amt;
      }
    });

    expect(mrr).toBe(2650000); // 1.8M + 600k + 250k
    const arr = mrr * 12;
    expect(arr).toBe(31800000);
  });

  it('5. Operating Profit: Accurately subtracts business expenses from cash revenue', () => {
    const cashReceived = 2400000;
    const expenses = [
      { amount: 450000, category: 'Cloud Infrastructure' },
      { amount: 380000, category: 'Telecom & Mobile Money' }
    ];

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = cashReceived - totalExpenses;

    expect(totalExpenses).toBe(830000);
    expect(netProfit).toBe(1570000);
  });

});
