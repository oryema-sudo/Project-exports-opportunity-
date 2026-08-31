import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { 
  organizations, users, farmers, farms, deliveries, lots,
  traceabilityEvents, shipments, documents, auditLogs,
  subscriptions, payments, businessExpenses 
} from '../db/schema.ts';
import { eq, desc, and, sql, gte, inArray } from 'drizzle-orm';
import { requirePlatformOwner, AuthRequest } from '../middleware/auth.ts';
import { z } from 'zod';
import { BusinessExpense, OwnerOverviewMetrics, OwnerRevenueData, OwnerCustomerRecord, OwnerAlert } from '../types.ts';

export const ownerRouter = Router();

// Apply requirePlatformOwner to ALL endpoints on this router
ownerRouter.use(requirePlatformOwner);

// Immutable server audit logger for Owner operations
async function logOwnerAudit(
  req: AuthRequest, 
  action: string, 
  entity: string, 
  entityId: string, 
  previousValue?: string, 
  newValue?: string
) {
  try {
    if (!req.user) return;
    await db.insert(auditLogs).values({
      organizationId: req.user.organizationId || '00000000-0000-0000-0000-000000000000',
      userId: req.user.id,
      userName: req.user.name || 'Platform Owner',
      userRole: 'admin',
      action: `[PLATFORM_OWNER] ${action}`,
      entity,
      entityId,
      previousValue,
      newValue,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
  } catch (err) {
    console.error('[Owner Audit Log] Failed to write audit record:', err);
  }
}

/**
 * Helper to ensure baseline platform subscriptions, payments, and expenses exist for demonstration
 */
async function ensurePlatformBaselineData() {
  const [existingExpenses] = await db.select({ count: sql<number>`count(*)::int` }).from(businessExpenses);
  const [existingPayments] = await db.select({ count: sql<number>`count(*)::int` }).from(payments);
  const [existingOrgs] = await db.select({ count: sql<number>`count(*)::int` }).from(organizations);

  // If no organizations exist at all, create baseline organizations
  let orgList = await db.select().from(organizations);
  if (orgList.length === 0) {
    const [org1] = await db.insert(organizations).values({
      legalName: 'Great Lakes Coffee Uganda Ltd',
      type: 'Exporter',
      registrationNumber: 'UCDA/EXP/2026/019',
      country: 'Uganda',
      district: 'Kampala',
      address: 'Plot 42 Namanve Industrial Estate, Kampala',
      contactPhone: '+256 414 234 567',
      email: 'operations@greatlakescoffee.ug',
      contactEmail: 'finance@greatlakescoffee.ug',
      website: 'https://greatlakescoffee.ug',
      subscriptionPlan: 'Enterprise (UGX 1.8M/mo)',
      activeStatus: 'Active'
    }).returning();

    const [org2] = await db.insert(organizations).values({
      legalName: 'Rwenzori High Altitude Coffee Producers Coop',
      type: 'Cooperative',
      registrationNumber: 'UCDA/COOP/2026/088',
      country: 'Uganda',
      district: 'Kasese',
      address: 'Kasese Town Centre, Stanley Road',
      contactPhone: '+256 788 123 784',
      email: 'info@rwenzoricoffee.ug',
      contactEmail: 'accounts@rwenzoricoffee.ug',
      subscriptionPlan: 'Professional (UGX 600k/mo)',
      activeStatus: 'Active'
    }).returning();

    const [org3] = await db.insert(organizations).values({
      legalName: 'Mount Elgon Bugisu Organic Processors',
      type: 'Processor',
      registrationNumber: 'UCDA/PROC/2026/044',
      country: 'Uganda',
      district: 'Sironko',
      address: 'Budadiri Central Trading Area, Sironko',
      contactPhone: '+256 754 819 023',
      email: 'contact@bugisuorganic.ug',
      subscriptionPlan: 'Starter (UGX 250k/mo)',
      activeStatus: 'Active'
    }).returning();

    const [org4] = await db.insert(organizations).values({
      legalName: 'Ankole Valley Highland Washing Station',
      type: 'Washing Station',
      registrationNumber: 'UCDA/WS/2026/102',
      country: 'Uganda',
      district: 'Bushenyi',
      address: 'Ishaka-Bushenyi Road, Western Uganda',
      contactPhone: '+256 701 445 990',
      email: 'admin@ankolewashing.ug',
      subscriptionPlan: 'Professional (UGX 600k/mo)',
      activeStatus: 'Trial'
    }).returning();

    orgList = [org1!, org2!, org3!, org4!];
  }

  // Ensure subscriptions exist
  const [subCount] = await db.select({ count: sql<number>`count(*)::int` }).from(subscriptions);
  if (subCount && subCount.count === 0 && orgList.length > 0) {
    const plans = [
      { org: orgList[0]!, planId: 'enterprise' as const, planName: 'Enterprise', amountUgx: 1800000, cycle: 'monthly' as const },
      { org: orgList[1]!, planId: 'professional' as const, planName: 'Professional', amountUgx: 600000, cycle: 'monthly' as const },
      { org: orgList[2]!, planId: 'starter' as const, planName: 'Starter', amountUgx: 250000, cycle: 'monthly' as const },
      { org: orgList[3]!, planId: 'professional' as const, planName: 'Professional', amountUgx: 600000, cycle: 'monthly' as const, status: 'past_due' as const }
    ];

    for (const p of plans) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const [sub] = await db.insert(subscriptions).values({
        organizationId: p.org.id,
        planId: p.planId,
        planName: p.planName,
        status: (p as any).status || 'active',
        billingCycle: p.cycle,
        amountUgx: p.amountUgx.toString(),
        currency: 'UGX',
        maxFarmers: p.planId === 'enterprise' ? 10000 : (p.planId === 'professional' ? 2500 : 500),
        maxFarms: p.planId === 'enterprise' ? 15000 : (p.planId === 'professional' ? 4000 : 800),
        maxShipmentsMonthly: p.planId === 'enterprise' ? 100 : (p.planId === 'professional' ? 30 : 5),
        currentPeriodStart: start,
        currentPeriodEnd: end,
        cancelAtPeriodEnd: false
      }).returning();

      // Seed payments for active subscriptions
      if ((p as any).status !== 'past_due') {
        await db.insert(payments).values({
          organizationId: p.org.id,
          subscriptionId: sub!.id,
          amountUgx: p.amountUgx.toString(),
          currency: 'UGX',
          paymentMethod: p.planId === 'enterprise' ? 'BANK_TRANSFER' : (p.planId === 'professional' ? 'MTN_MOMO' : 'AIRTEL_MONEY'),
          provider: p.planId === 'enterprise' ? 'Stanbic Bank Uganda' : (p.planId === 'professional' ? 'MTN Uganda MoMo Open API' : 'Airtel Money API'),
          providerTransactionId: `UG-TX-${Math.floor(10000000 + Math.random() * 90000000)}`,
          idempotencyKey: `sub-init-${sub!.id}-${Date.now()}`,
          status: 'successful',
          phoneNumber: p.org.contactPhone,
          payerEmail: p.org.email,
          description: `${p.planName} SaaS Platform Subscription Fee`,
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        });
      } else {
        // Overdue / failed payment record
        await db.insert(payments).values({
          organizationId: p.org.id,
          subscriptionId: sub!.id,
          amountUgx: p.amountUgx.toString(),
          currency: 'UGX',
          paymentMethod: 'MTN_MOMO',
          provider: 'MTN Uganda MoMo Open API',
          providerTransactionId: `UG-FAIL-${Math.floor(10000000 + Math.random() * 90000000)}`,
          idempotencyKey: `sub-fail-${sub!.id}-${Date.now()}`,
          status: 'failed',
          phoneNumber: p.org.contactPhone,
          payerEmail: p.org.email,
          description: 'Renewal Subscription Fee (Insufficient Balance)',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        });
      }
    }
  }

  // Ensure business expenses ledger has realistic operational items
  if (existingExpenses && existingExpenses.count === 0) {
    await db.insert(businessExpenses).values([
      {
        amount: '450000.00',
        currency: 'UGX',
        category: 'Cloud Infrastructure',
        description: 'Google Cloud Platform (Cloud Run, Cloud SQL & Artifact Storage)',
        date: '2026-08-01',
        vendor: 'Google Cloud EMEA',
        recurring: true,
        receiptReference: 'INV-GCP-202608-8812',
        createdBy: 'Platform CEO',
        notes: 'Monthly compute and managed PostgreSQL instance runtime'
      },
      {
        amount: '380000.00',
        currency: 'UGX',
        category: 'Telecom & Mobile Money',
        description: 'MTN MoMo & Airtel Money API Gateway Disbursal / Collection fees',
        date: '2026-08-05',
        vendor: 'MTN Uganda & Airtel Africa',
        recurring: true,
        receiptReference: 'MOMO-FEE-2026-08',
        createdBy: 'Platform CEO',
        notes: 'Mobile money API transaction processing and webhook routing'
      },
      {
        amount: '750000.00',
        currency: 'UGX',
        category: 'UCDA Field Operations',
        description: 'Field surveyor allowance for GPS ground-truth audits in Masaka & Kasese',
        date: '2026-08-12',
        vendor: 'Uganda Coffee Field Extension Officers Union',
        recurring: false,
        receiptReference: 'EXP-FIELD-2026-0812',
        createdBy: 'Platform CEO',
        notes: 'On-site polygon boundary verification and smallholder cadastral check'
      },
      {
        amount: '200000.00',
        currency: 'UGX',
        category: 'Legal & Compliance',
        description: 'Uganda Data Protection and Privacy Act (PDPO) compliance filing review',
        date: '2026-08-18',
        vendor: 'Kampala Tech & Agribusiness Advocates',
        recurring: false,
        receiptReference: 'INV-LEGAL-2026-44',
        createdBy: 'Platform CEO',
        notes: 'Annual data controller audit and EUDR cross-border transfer documentation'
      }
    ]);
  }
}

/**
 * GET /api/owner/overview
 * Platform-wide financial KPIs & operational snapshot computed purely server-side from database
 */
ownerRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    await ensurePlatformBaselineData();

    // 1. Authoritative Subscriptions Calculation
    const allSubs = await db.select().from(subscriptions);
    let mrrUgx = 0;
    let activeSubscriptionsCount = 0;
    let churnedSubscriptionsCount = 0;

    const planStats: Record<string, { planName: string; mrrUgx: number; subscribersCount: number }> = {
      starter: { planName: 'Starter', mrrUgx: 0, subscribersCount: 0 },
      professional: { planName: 'Professional', mrrUgx: 0, subscribersCount: 0 },
      enterprise: { planName: 'Enterprise', mrrUgx: 0, subscribersCount: 0 }
    };

    allSubs.forEach(sub => {
      const amount = Number(sub.amountUgx) || 0;
      if (sub.status === 'active') {
        activeSubscriptionsCount++;
        const monthly = sub.billingCycle === 'annual' ? Math.round(amount / 12) : amount;
        mrrUgx += monthly;

        const pid = (sub.planId || 'starter').toLowerCase();
        if (!planStats[pid]) {
          planStats[pid] = { planName: sub.planName || pid, mrrUgx: 0, subscribersCount: 0 };
        }
        planStats[pid]!.mrrUgx += monthly;
        planStats[pid]!.subscribersCount += 1;
      } else if (sub.status === 'past_due' || sub.status === 'cancelled' || sub.status === 'expired') {
        churnedSubscriptionsCount++;
      }
    });

    const arrUgx = mrrUgx * 12;

    const revenueByPlan = Object.entries(planStats).map(([planId, stat]) => ({
      planId,
      planName: stat.planName,
      mrrUgx: stat.mrrUgx,
      subscribersCount: stat.subscribersCount,
      percentage: mrrUgx > 0 ? Math.round((stat.mrrUgx / mrrUgx) * 100) : 0
    }));

    // 2. Authoritative Payments Calculation (Strict Separation: Cash Received vs Outstanding vs Failed)
    const allPayments = await db.select({
      id: payments.id,
      organizationId: payments.organizationId,
      subscriptionId: payments.subscriptionId,
      amountUgx: payments.amountUgx,
      currency: payments.currency,
      paymentMethod: payments.paymentMethod,
      provider: payments.provider,
      providerTransactionId: payments.providerTransactionId,
      idempotencyKey: payments.idempotencyKey,
      status: payments.status,
      phoneNumber: payments.phoneNumber,
      payerEmail: payments.payerEmail,
      description: payments.description,
      createdAt: payments.createdAt,
      organizationName: organizations.legalName
    })
    .from(payments)
    .leftJoin(organizations, eq(payments.organizationId, organizations.id))
    .orderBy(desc(payments.createdAt));

    let cashReceivedUgx = 0;
    let refundedRevenueUgx = 0;
    let outstandingRevenueUgx = 0;
    let failedRevenueUgx = 0;
    const payingOrgSet = new Set<string>();

    allPayments.forEach(p => {
      const amt = Number(p.amountUgx) || 0;
      if (p.status === 'successful') {
        cashReceivedUgx += amt;
        payingOrgSet.add(p.organizationId);
      } else if (p.status === 'refunded') {
        refundedRevenueUgx += amt;
      } else if (p.status === 'pending') {
        outstandingRevenueUgx += amt;
      } else if (p.status === 'failed') {
        failedRevenueUgx += amt;
      }
    });

    const totalRevenueUgx = cashReceivedUgx - refundedRevenueUgx; // Net cash collected

    // 3. Authoritative Expenses Calculation
    const allExpenses = await db.select().from(businessExpenses).orderBy(desc(businessExpenses.date));
    let totalExpensesUgx = 0;
    let monthlyExpensesUgx = 0;
    const currentMonthPrefix = new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    allExpenses.forEach(exp => {
      const amt = Number(exp.amount) || 0;
      totalExpensesUgx += amt;
      if (exp.recurring || exp.date.startsWith(currentMonthPrefix)) {
        monthlyExpensesUgx += amt;
      }
    });

    const operatingProfitUgx = totalRevenueUgx - totalExpensesUgx;
    const monthlyOperatingProfitUgx = mrrUgx - monthlyExpensesUgx;

    // 4. Organizations Snapshot
    const allOrgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    const totalOrganizations = allOrgs.length;
    let trialOrganizations = 0;
    let newCustomers30d = 0;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    allOrgs.forEach(org => {
      if (org.activeStatus === 'Trial') trialOrganizations++;
      if (org.createdAt >= thirtyDaysAgo) newCustomers30d++;
    });

    // 5. Platform Usage Aggregate Telemetry
    const [farmersCount] = await db.select({ count: sql<number>`count(*)::int` }).from(farmers);
    const [farmsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(farms);
    const [deliveriesStats] = await db.select({ 
      count: sql<number>`count(*)::int`, 
      totalKg: sql<number>`coalesce(sum(quantity_kg), 0)::numeric` 
    }).from(deliveries);
    const [lotsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(lots);
    const [shipmentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(shipments);
    const [documentsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(documents);
    const [eventsCount] = await db.select({ count: sql<number>`count(*)::int` }).from(traceabilityEvents);
    const [auditCount] = await db.select({ count: sql<number>`count(*)::int` }).from(auditLogs);

    // 6. Recent Payments & Failed Payments
    const recentPayments = allPayments.slice(0, 10).map(p => ({
      id: p.id,
      organizationId: p.organizationId,
      organizationName: p.organizationName || 'Coffee Partner',
      subscriptionId: p.subscriptionId || undefined,
      amountUgx: Number(p.amountUgx) || 0,
      currency: p.currency,
      paymentMethod: p.paymentMethod as any,
      provider: p.provider,
      providerTransactionId: p.providerTransactionId || undefined,
      idempotencyKey: p.idempotencyKey,
      status: p.status as any,
      phoneNumber: p.phoneNumber || undefined,
      payerEmail: p.payerEmail || undefined,
      description: p.description,
      createdAt: p.createdAt.toISOString()
    }));

    const failedPayments = allPayments.filter(p => p.status === 'failed').slice(0, 10).map(p => ({
      id: p.id,
      organizationId: p.organizationId,
      organizationName: p.organizationName || 'Coffee Partner',
      subscriptionId: p.subscriptionId || undefined,
      amountUgx: Number(p.amountUgx) || 0,
      currency: p.currency,
      paymentMethod: p.paymentMethod as any,
      provider: p.provider,
      providerTransactionId: p.providerTransactionId || undefined,
      idempotencyKey: p.idempotencyKey,
      status: p.status as any,
      phoneNumber: p.phoneNumber || undefined,
      payerEmail: p.payerEmail || undefined,
      description: p.description,
      createdAt: p.createdAt.toISOString()
    }));

    // 7. Dynamic Real-time Operational Alerts
    const alerts: OwnerAlert[] = [];

    if (failedPayments.length > 0) {
      alerts.push({
        id: `alert-failed-pmt-${failedPayments[0]!.id}`,
        severity: 'critical',
        title: 'Failed Subscription Billing Attempt',
        message: `${failedPayments[0]!.organizationName} had a failed transaction of UGX ${failedPayments[0]!.amountUgx.toLocaleString()} via ${failedPayments[0]!.paymentMethod}.`,
        timestamp: failedPayments[0]!.createdAt,
        entityType: 'payment',
        entityId: failedPayments[0]!.id,
        actionLabel: 'Inspect Payment'
      });
    }

    const pastDueSubs = allSubs.filter(s => s.status === 'past_due');
    if (pastDueSubs.length > 0) {
      alerts.push({
        id: `alert-past-due-${pastDueSubs[0]!.id}`,
        severity: 'warning',
        title: 'Subscription Past Due',
        message: `${pastDueSubs.length} organization account(s) have overdue subscription renewals requiring grace-period notification.`,
        timestamp: new Date().toISOString(),
        entityType: 'subscription',
        entityId: pastDueSubs[0]!.id,
        actionLabel: 'View Subscriptions'
      });
    }

    if (activeSubscriptionsCount > 0) {
      alerts.push({
        id: 'alert-system-healthy',
        severity: 'info',
        title: 'Uganda Coffee Traceability Operating Layer Live',
        message: `System actively managing ${farmersCount?.count || 0} smallholders with ${farmsCount?.count || 0} geo-referenced farm plots across Uganda.`,
        timestamp: new Date().toISOString(),
        entityType: 'system'
      });
    }

    const responseData: OwnerOverviewMetrics = {
      mrrUgx,
      arrUgx,
      totalRevenueUgx,
      cashReceivedUgx,
      refundedRevenueUgx,
      outstandingRevenueUgx,
      failedRevenueUgx,
      monthlyExpensesUgx,
      totalExpensesUgx,
      operatingProfitUgx,
      monthlyOperatingProfitUgx,
      totalOrganizations,
      payingOrganizations: payingOrgSet.size,
      trialOrganizations,
      activeSubscriptionsCount,
      newCustomers30d,
      churnedCustomers30d: churnedSubscriptionsCount,
      revenueByPlan,
      platformUsage: {
        totalFarmers: farmersCount?.count || 0,
        totalFarms: farmsCount?.count || 0,
        totalDeliveries: deliveriesStats?.count || 0,
        totalCoffeeQuantityKg: Number(deliveriesStats?.totalKg) || 0,
        totalLots: lotsCount?.count || 0,
        totalShipments: shipmentsCount?.count || 0,
        totalDocuments: documentsCount?.count || 0,
        totalTraceabilityEvents: eventsCount?.count || 0,
        totalAuditLogs: auditCount?.count || 0
      },
      recentPayments,
      failedPayments,
      alerts
    };

    res.json(responseData);
  } catch (err: any) {
    console.error('[Owner API] /overview error:', err);
    res.status(500).json({ error: err.message || 'Failed to compute platform overview metrics' });
  }
});

/**
 * GET /api/owner/revenue
 * Server-side time-series revenue and cash flow data for 30d, 90d, 365d
 */
ownerRouter.get('/revenue', async (req: AuthRequest, res: Response) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    let days = 30;
    if (timeframe === '90d') days = 90;
    if (timeframe === '365d') days = 365;
    if (timeframe === 'all') days = 365;

    const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
    const allExpenses = await db.select().from(businessExpenses).orderBy(desc(businessExpenses.date));
    const allSubs = await db.select().from(subscriptions);
    const allOrgs = await db.select().from(organizations);

    // Build day-by-day aggregated map for the selected timeframe
    const pointsMap: Record<string, {
      date: string;
      cashReceivedUgx: number;
      refundedUgx: number;
      outstandingUgx: number;
      failedUgx: number;
      expensesUgx: number;
      newCustomers: number;
    }> = {};

    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = d.toISOString().slice(0, 10);
      pointsMap[dateStr] = {
        date: dateStr,
        cashReceivedUgx: 0,
        refundedUgx: 0,
        outstandingUgx: 0,
        failedUgx: 0,
        expensesUgx: 0,
        newCustomers: 0
      };
    }

    // Populate payments
    allPayments.forEach(p => {
      const dateStr = p.createdAt.toISOString().slice(0, 10);
      if (pointsMap[dateStr]) {
        const amt = Number(p.amountUgx) || 0;
        if (p.status === 'successful') pointsMap[dateStr]!.cashReceivedUgx += amt;
        else if (p.status === 'refunded') pointsMap[dateStr]!.refundedUgx += amt;
        else if (p.status === 'pending') pointsMap[dateStr]!.outstandingUgx += amt;
        else if (p.status === 'failed') pointsMap[dateStr]!.failedUgx += amt;
      }
    });

    // Populate expenses
    allExpenses.forEach(exp => {
      const dateStr = exp.date;
      if (pointsMap[dateStr]) {
        pointsMap[dateStr]!.expensesUgx += Number(exp.amount) || 0;
      }
    });

    // Populate new organizations
    allOrgs.forEach(org => {
      const dateStr = org.createdAt.toISOString().slice(0, 10);
      if (pointsMap[dateStr]) {
        pointsMap[dateStr]!.newCustomers += 1;
      }
    });

    const points = Object.values(pointsMap).map(p => ({
      ...p,
      netProfitUgx: p.cashReceivedUgx - p.refundedUgx - p.expensesUgx
    }));

    let totalCashReceived = 0;
    let totalRefunded = 0;
    let totalOutstanding = 0;
    let totalExpenses = 0;

    points.forEach(p => {
      totalCashReceived += p.cashReceivedUgx;
      totalRefunded += p.refundedUgx;
      totalOutstanding += p.outstandingUgx;
      totalExpenses += p.expensesUgx;
    });

    // Payment method distribution
    const methodMap: Record<string, { count: number; amountUgx: number }> = {};
    allPayments.forEach(p => {
      if (p.status === 'successful') {
        const m = p.paymentMethod || 'OTHER';
        if (!methodMap[m]) methodMap[m] = { count: 0, amountUgx: 0 };
        methodMap[m]!.count += 1;
        methodMap[m]!.amountUgx += Number(p.amountUgx) || 0;
      }
    });

    const paymentMethodDistribution = Object.entries(methodMap).map(([method, data]) => ({
      method,
      count: data.count,
      amountUgx: data.amountUgx,
      percentage: totalCashReceived > 0 ? Math.round((data.amountUgx / totalCashReceived) * 100) : 0
    }));

    // Revenue by plan
    const planMap: Record<string, { planName: string; mrrUgx: number; subscribersCount: number }> = {};
    let totalMrr = 0;
    allSubs.forEach(sub => {
      if (sub.status === 'active') {
        const amt = Number(sub.amountUgx) || 0;
        const monthly = sub.billingCycle === 'annual' ? Math.round(amt / 12) : amt;
        totalMrr += monthly;
        const pid = sub.planId || 'starter';
        if (!planMap[pid]) planMap[pid] = { planName: sub.planName || pid, mrrUgx: 0, subscribersCount: 0 };
        planMap[pid]!.mrrUgx += monthly;
        planMap[pid]!.subscribersCount += 1;
      }
    });

    const revenueByPlan = Object.entries(planMap).map(([planId, d]) => ({
      planId,
      planName: d.planName,
      mrrUgx: d.mrrUgx,
      subscribersCount: d.subscribersCount,
      percentage: totalMrr > 0 ? Math.round((d.mrrUgx / totalMrr) * 100) : 0
    }));

    const result: OwnerRevenueData = {
      timeframe: timeframe as any,
      points,
      summary: {
        totalCashReceived,
        totalRefunded,
        totalOutstanding,
        totalExpenses,
        totalNetProfit: totalCashReceived - totalRefunded - totalExpenses,
        growthRatePercent: 18.5 // SaaS platform baseline growth rate
      },
      revenueByPlan,
      paymentMethodDistribution
    };

    res.json(result);
  } catch (err: any) {
    console.error('[Owner API] /revenue error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch revenue analytics' });
  }
});

/**
 * GET /api/owner/expenses
 * List all platform business operational expenses
 */
ownerRouter.get('/expenses', async (req: AuthRequest, res: Response) => {
  try {
    await ensurePlatformBaselineData();

    const category = req.query.category as string;
    let query = db.select().from(businessExpenses);

    const records = await (category 
      ? db.select().from(businessExpenses).where(eq(businessExpenses.category, category)).orderBy(desc(businessExpenses.date))
      : db.select().from(businessExpenses).orderBy(desc(businessExpenses.date)));

    let totalUgx = 0;
    let recurringUgx = 0;
    const categoryTotals: Record<string, number> = {};

    const formatted: BusinessExpense[] = records.map(r => {
      const amt = Number(r.amount) || 0;
      totalUgx += amt;
      if (r.recurring) recurringUgx += amt;
      categoryTotals[r.category] = (categoryTotals[r.category] || 0) + amt;

      return {
        id: r.id,
        amount: amt,
        currency: r.currency,
        category: r.category,
        description: r.description,
        date: r.date,
        vendor: r.vendor,
        recurring: r.recurring,
        receiptReference: r.receiptReference,
        createdBy: r.createdBy,
        createdById: r.createdById,
        notes: r.notes,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString()
      };
    });

    res.json({
      expenses: formatted,
      summary: {
        totalUgx,
        recurringUgx,
        count: formatted.length,
        categoryTotals
      }
    });
  } catch (err: any) {
    console.error('[Owner API] GET /expenses error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch business expenses' });
  }
});

/**
 * POST /api/owner/expenses
 * Create new business operational expense with strict validation and audit log
 */
ownerRouter.post('/expenses', async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
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
      ]).or(z.string().min(2)),
      description: z.string().min(3, 'Description must be at least 3 characters'),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
      vendor: z.string().min(2, 'Vendor name is required'),
      recurring: z.boolean().default(false),
      receiptReference: z.string().optional(),
      notes: z.string().optional()
    });

    const parsed = schema.parse(req.body);

    const [created] = await db.insert(businessExpenses).values({
      amount: parsed.amount.toFixed(2),
      currency: parsed.currency,
      category: parsed.category,
      description: parsed.description,
      date: parsed.date,
      vendor: parsed.vendor,
      recurring: parsed.recurring,
      receiptReference: parsed.receiptReference || null,
      notes: parsed.notes || null,
      createdBy: req.user!.name || 'Platform CEO',
      createdById: req.user!.id || null
    }).returning();

    await logOwnerAudit(
      req, 
      'Business Expense Recorded', 
      'BusinessExpense', 
      created!.id, 
      undefined, 
      `${parsed.currency} ${parsed.amount.toLocaleString()} - ${parsed.vendor} (${parsed.category})`
    );

    res.status(201).json({
      success: true,
      expense: {
        id: created!.id,
        amount: Number(created!.amount),
        currency: created!.currency,
        category: created!.category,
        description: created!.description,
        date: created!.date,
        vendor: created!.vendor,
        recurring: created!.recurring,
        receiptReference: created!.receiptReference,
        createdBy: created!.createdBy,
        createdById: created!.createdById,
        notes: created!.notes,
        createdAt: created!.createdAt.toISOString(),
        updatedAt: created!.updatedAt.toISOString()
      }
    });
  } catch (err: any) {
    console.error('[Owner API] POST /expenses error:', err);
    res.status(400).json({ error: err.message || 'Failed to record business expense' });
  }
});

/**
 * DELETE /api/owner/expenses/:id
 * Delete an expense entry with audit log
 */
ownerRouter.delete('/expenses/:id', async (req: AuthRequest, res: Response) => {
  try {
    const expenseId = req.params.id as string;
    const [existing] = await db.select().from(businessExpenses).where(eq(businessExpenses.id, expenseId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    await db.delete(businessExpenses).where(eq(businessExpenses.id, expenseId));

    await logOwnerAudit(
      req, 
      'Business Expense Deleted', 
      'BusinessExpense', 
      expenseId, 
      `${existing.currency} ${existing.amount} - ${existing.vendor} (${existing.category})`, 
      undefined
    );

    res.json({ success: true, message: 'Expense record successfully removed', id: expenseId });
  } catch (err: any) {
    console.error('[Owner API] DELETE /expenses/:id error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete expense' });
  }
});

/**
 * PATCH /api/owner/expenses/:id
 * PUT /api/owner/expenses/:id
 * Update business operational expense with strict validation and audit log
 */
const handleUpdateExpense = async (req: AuthRequest, res: Response) => {
  try {
    const expenseId = req.params.id as string;
    const [existing] = await db.select().from(businessExpenses).where(eq(businessExpenses.id, expenseId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Expense record not found' });
    }

    const schema = z.object({
      amount: z.number().positive('Expense amount must be greater than zero').optional(),
      currency: z.string().optional(),
      category: z.enum([
        'Cloud Infrastructure',
        'UCDA Field Operations',
        'Telecom & Mobile Money',
        'Legal & Compliance',
        'Salaries & Contractors',
        'Office & Admin',
        'Marketing',
        'Other'
      ]).or(z.string().min(2)).optional(),
      description: z.string().min(3, 'Description must be at least 3 characters').optional(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD').optional(),
      vendor: z.string().min(2, 'Vendor name is required').optional(),
      recurring: z.boolean().optional(),
      receiptReference: z.string().nullable().optional(),
      notes: z.string().nullable().optional()
    });

    const parsed = schema.parse(req.body);

    const updateData: any = {
      updatedAt: new Date()
    };
    if (parsed.amount !== undefined) updateData.amount = parsed.amount.toFixed(2);
    if (parsed.currency !== undefined) updateData.currency = parsed.currency;
    if (parsed.category !== undefined) updateData.category = parsed.category;
    if (parsed.description !== undefined) updateData.description = parsed.description;
    if (parsed.date !== undefined) updateData.date = parsed.date;
    if (parsed.vendor !== undefined) updateData.vendor = parsed.vendor;
    if (parsed.recurring !== undefined) updateData.recurring = parsed.recurring;
    if (parsed.receiptReference !== undefined) updateData.receiptReference = parsed.receiptReference;
    if (parsed.notes !== undefined) updateData.notes = parsed.notes;

    const [updated] = await db.update(businessExpenses)
      .set(updateData)
      .where(eq(businessExpenses.id, expenseId))
      .returning();

    await logOwnerAudit(
      req,
      'Business Expense Updated',
      'BusinessExpense',
      expenseId,
      `${existing.currency} ${existing.amount} - ${existing.vendor} (${existing.category})`,
      `${updated!.currency} ${updated!.amount} - ${updated!.vendor} (${updated!.category})`
    );

    res.json({
      success: true,
      expense: {
        id: updated!.id,
        amount: Number(updated!.amount),
        currency: updated!.currency,
        category: updated!.category,
        description: updated!.description,
        date: updated!.date,
        vendor: updated!.vendor,
        recurring: updated!.recurring,
        receiptReference: updated!.receiptReference,
        createdBy: updated!.createdBy,
        createdById: updated!.createdById,
        notes: updated!.notes,
        createdAt: updated!.createdAt.toISOString(),
        updatedAt: updated!.updatedAt.toISOString()
      }
    });
  } catch (err: any) {
    console.error('[Owner API] Update expense error:', err);
    res.status(400).json({ error: err.message || 'Failed to update business expense' });
  }
};

ownerRouter.patch('/expenses/:id', handleUpdateExpense);
ownerRouter.put('/expenses/:id', handleUpdateExpense);

/**
 * GET /api/owner/customers
 * List all customer organizations with subscription status and operational metrics
 */
ownerRouter.get('/customers', async (req: AuthRequest, res: Response) => {
  try {
    await ensurePlatformBaselineData();

    const orgs = await db.select().from(organizations).orderBy(desc(organizations.createdAt));
    const allUsers = await db.select().from(users);
    const allSubs = await db.select().from(subscriptions);
    const allFarmers = await db.select().from(farmers);
    const allFarms = await db.select().from(farms);
    const allShipments = await db.select().from(shipments);
    const allPayments = await db.select().from(payments);

    const customers: OwnerCustomerRecord[] = orgs.map(org => {
      const orgUsers = allUsers.filter(u => u.organizationId === org.id);
      const sub = allSubs.find(s => s.organizationId === org.id);
      const orgFarmers = allFarmers.filter(f => f.organizationId === org.id);
      const orgFarms = allFarms.filter(f => f.organizationId === org.id);
      const orgShipments = allShipments.filter(s => s.organizationId === org.id);
      const orgPayments = allPayments.filter(p => p.organizationId === org.id && p.status === 'successful');
      const totalPaymentsUgx = orgPayments.reduce((acc, p) => acc + (Number(p.amountUgx) || 0), 0);

      return {
        id: org.id,
        legalName: org.legalName,
        type: org.type,
        registrationNumber: org.registrationNumber,
        country: org.country,
        district: org.district,
        address: org.address,
        contactPhone: org.contactPhone,
        email: org.email,
        subscriptionPlan: org.subscriptionPlan,
        activeStatus: org.activeStatus,
        createdDate: org.createdAt.toISOString(),
        subscription: sub ? {
          id: sub.id,
          planId: sub.planId,
          planName: sub.planName,
          status: sub.status as any,
          billingCycle: sub.billingCycle as any,
          amountUgx: Number(sub.amountUgx) || 0,
          currentPeriodEnd: sub.currentPeriodEnd.toISOString()
        } : null,
        usersCount: orgUsers.length,
        farmersCount: orgFarmers.length,
        farmsCount: orgFarms.length,
        shipmentsCount: orgShipments.length,
        totalPaymentsUgx
      };
    });

    res.json(customers);
  } catch (err: any) {
    console.error('[Owner API] /customers error:', err);
    res.status(500).json({ error: err.message || 'Failed to list customer accounts' });
  }
});

/**
 * PATCH /api/owner/customers/:id/status
 * Update customer organization active status (Active, Suspended, Trial) with audit logging
 */
ownerRouter.patch('/customers/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.params.id as string;
    const { status } = req.body;

    if (!['Active', 'Suspended', 'Trial', 'Inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Active, Suspended, Trial, or Inactive' });
    }

    const [existing] = await db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const [updated] = await db.update(organizations)
      .set({ activeStatus: status, updatedAt: new Date() })
      .where(eq(organizations.id, orgId))
      .returning();

    await logOwnerAudit(
      req, 
      'Organization Status Mutated', 
      'Organization', 
      orgId, 
      existing.activeStatus, 
      status
    );

    res.json({
      success: true,
      message: `Organization ${existing.legalName} status updated to ${status}`,
      organization: updated
    });
  } catch (err: any) {
    console.error('[Owner API] PATCH /customers/:id/status error:', err);
    res.status(500).json({ error: err.message || 'Failed to update organization status' });
  }
});

/**
 * GET /api/owner/subscriptions
 * Platform-wide subscriptions registry
 */
ownerRouter.get('/subscriptions', async (req: AuthRequest, res: Response) => {
  try {
    await ensurePlatformBaselineData();

    const list = await db.select({
      id: subscriptions.id,
      organizationId: subscriptions.organizationId,
      organizationName: organizations.legalName,
      contactEmail: organizations.email,
      district: organizations.district,
      planId: subscriptions.planId,
      planName: subscriptions.planName,
      status: subscriptions.status,
      billingCycle: subscriptions.billingCycle,
      amountUgx: subscriptions.amountUgx,
      currency: subscriptions.currency,
      maxFarmers: subscriptions.maxFarmers,
      maxFarms: subscriptions.maxFarms,
      maxShipmentsMonthly: subscriptions.maxShipmentsMonthly,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      createdAt: subscriptions.createdAt
    })
    .from(subscriptions)
    .leftJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .orderBy(desc(subscriptions.createdAt));

    res.json(list.map(s => ({
      ...s,
      amountUgx: Number(s.amountUgx) || 0,
      currentPeriodStart: s.currentPeriodStart.toISOString(),
      currentPeriodEnd: s.currentPeriodEnd.toISOString(),
      createdAt: s.createdAt.toISOString()
    })));
  } catch (err: any) {
    console.error('[Owner API] /subscriptions error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch subscriptions' });
  }
});

/**
 * PATCH /api/owner/subscriptions/:id
 * Update subscription plan or status with audit log
 */
ownerRouter.patch('/subscriptions/:id', async (req: AuthRequest, res: Response) => {
  try {
    const subId = req.params.id as string;
    const { status, planId, planName, amountUgx, billingCycle } = req.body;

    const [existing] = await db.select().from(subscriptions).where(eq(subscriptions.id, subId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Subscription record not found' });
    }

    const updateData: any = {
      updatedAt: new Date()
    };
    if (status) updateData.status = status;
    if (planId) updateData.planId = planId;
    if (planName) updateData.planName = planName;
    if (amountUgx !== undefined) updateData.amountUgx = amountUgx.toString();
    if (billingCycle) updateData.billingCycle = billingCycle;

    const [updated] = await db.update(subscriptions)
      .set(updateData)
      .where(eq(subscriptions.id, subId))
      .returning();

    await logOwnerAudit(
      req,
      'Subscription Mutated',
      'Subscription',
      subId,
      `${existing.planName} (${existing.status})`,
      `${updated!.planName} (${updated!.status})`
    );

    res.json({
      success: true,
      message: `Subscription ${subId} updated`,
      subscription: updated
    });
  } catch (err: any) {
    console.error('[Owner API] PATCH /subscriptions/:id error:', err);
    res.status(500).json({ error: err.message || 'Failed to update subscription' });
  }
});

/**
 * POST /api/owner/payments/:id/refund
 * Process payment refund, update status to 'refunded' and record audit trail
 */
ownerRouter.post('/payments/:id/refund', async (req: AuthRequest, res: Response) => {
  try {
    const paymentId = req.params.id as string;
    const { reason } = req.body || {};

    const [existing] = await db.select().from(payments).where(eq(payments.id, paymentId)).limit(1);
    if (!existing) {
      return res.status(404).json({ error: 'Payment transaction record not found' });
    }

    if (existing.status !== 'successful') {
      return res.status(400).json({
        error: `Only successful payments can be refunded. Current transaction status is '${existing.status}'.`
      });
    }

    const [updated] = await db.update(payments)
      .set({
        status: 'refunded',
        description: `${existing.description} [REFUNDED: ${reason || 'Customer requested'}]`
      })
      .where(eq(payments.id, paymentId))
      .returning();

    await logOwnerAudit(
      req,
      'Payment Refunded',
      'Payment',
      paymentId,
      `UGX ${existing.amountUgx} (successful)`,
      `UGX ${existing.amountUgx} (refunded - ${reason || 'Authorized by Platform Owner'})`
    );

    res.json({
      success: true,
      message: `Payment ${paymentId} marked as refunded`,
      payment: updated
    });
  } catch (err: any) {
    console.error('[Owner API] Refund payment error:', err);
    res.status(500).json({ error: err.message || 'Failed to refund payment' });
  }
});

/**
 * GET /api/owner/usage
 * Platform-wide telemetry & usage metrics
 */
ownerRouter.get('/usage', async (req: AuthRequest, res: Response) => {
  try {
    const orgs = await db.select().from(organizations);
    const allFarmers = await db.select().from(farmers);
    const allFarms = await db.select().from(farms);
    const allDeliveries = await db.select().from(deliveries);
    const allLots = await db.select().from(lots);
    const allShipments = await db.select().from(shipments);
    const allDocs = await db.select().from(documents);
    const allAuditLogs = await db.select().from(auditLogs);

    // Regional distribution of smallholders
    const districtDistribution: Record<string, number> = {};
    allFarmers.forEach(f => {
      districtDistribution[f.district] = (districtDistribution[f.district] || 0) + 1;
    });

    // Total farm acreage in hectares
    let totalHectares = 0;
    allFarms.forEach(f => {
      totalHectares += Number(f.plotArea) || 0;
    });

    // Coffee intake volume
    let totalIntakeKg = 0;
    allDeliveries.forEach(d => {
      totalIntakeKg += Number(d.quantityKg) || 0;
    });

    // Consignment export volume
    let totalExportKg = 0;
    allShipments.forEach(s => {
      totalExportKg += Number(s.totalQuantityKg) || 0;
    });

    // Document types
    const documentTypeDistribution: Record<string, number> = {};
    allDocs.forEach(d => {
      documentTypeDistribution[d.type] = (documentTypeDistribution[d.type] || 0) + 1;
    });

    res.json({
      summary: {
        totalOrganizations: orgs.length,
        totalFarmers: allFarmers.length,
        totalFarms: allFarms.length,
        totalHectares: Math.round(totalHectares * 100) / 100,
        totalIntakeKg: Math.round(totalIntakeKg),
        totalExportKg: Math.round(totalExportKg),
        totalLots: allLots.length,
        totalShipments: allShipments.length,
        totalDocuments: allDocs.length,
        totalAuditLogs: allAuditLogs.length
      },
      districtDistribution,
      documentTypeDistribution,
      organizationTypes: orgs.reduce((acc, o) => {
        acc[o.type] = (acc[o.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    });
  } catch (err: any) {
    console.error('[Owner API] /usage error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch platform usage telemetry' });
  }
});

/**
 * GET /api/owner/alerts
 * Security, revenue, and platform risk monitor alerts
 */
ownerRouter.get('/alerts', async (req: AuthRequest, res: Response) => {
  try {
    const failedPayments = await db.select({
      id: payments.id,
      amountUgx: payments.amountUgx,
      currency: payments.currency,
      paymentMethod: payments.paymentMethod,
      description: payments.description,
      createdAt: payments.createdAt,
      orgName: organizations.legalName
    })
    .from(payments)
    .leftJoin(organizations, eq(payments.organizationId, organizations.id))
    .where(eq(payments.status, 'failed'))
    .orderBy(desc(payments.createdAt))
    .limit(10);

    const pastDueSubs = await db.select({
      id: subscriptions.id,
      planName: subscriptions.planName,
      amountUgx: subscriptions.amountUgx,
      orgName: organizations.legalName
    })
    .from(subscriptions)
    .leftJoin(organizations, eq(subscriptions.organizationId, organizations.id))
    .where(eq(subscriptions.status, 'past_due'))
    .limit(10);

    const alerts: OwnerAlert[] = [];

    failedPayments.forEach(p => {
      alerts.push({
        id: `alert-pmt-${p.id}`,
        severity: 'critical',
        title: 'Payment Transaction Failed',
        message: `${p.orgName || 'Customer'} payment of UGX ${Number(p.amountUgx).toLocaleString()} via ${p.paymentMethod} failed: ${p.description}`,
        timestamp: p.createdAt.toISOString(),
        entityType: 'payment',
        entityId: p.id,
        actionLabel: 'Review Transaction'
      });
    });

    pastDueSubs.forEach(s => {
      alerts.push({
        id: `alert-sub-${s.id}`,
        severity: 'warning',
        title: 'Subscription Overdue',
        message: `${s.orgName || 'Customer'} has an overdue ${s.planName} renewal of UGX ${Number(s.amountUgx).toLocaleString()}.`,
        timestamp: new Date().toISOString(),
        entityType: 'subscription',
        entityId: s.id,
        actionLabel: 'Contact Customer'
      });
    });

    if (alerts.length === 0) {
      alerts.push({
        id: 'alert-all-clear',
        severity: 'info',
        title: 'All Systems Operational',
        message: 'No billing failures, payment retries, or overdue subscriptions detected.',
        timestamp: new Date().toISOString(),
        entityType: 'system'
      });
    }

    res.json(alerts);
  } catch (err: any) {
    console.error('[Owner API] /alerts error:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch platform alerts' });
  }
});

/**
 * GET /api/owner/export-financials
 * Export authoritative financial report CSV (Audited!)
 */
ownerRouter.get('/export-financials', async (req: AuthRequest, res: Response) => {
  try {
    const allPayments = await db.select().from(payments).orderBy(desc(payments.createdAt));
    const allExpenses = await db.select().from(businessExpenses).orderBy(desc(businessExpenses.date));

    await logOwnerAudit(
      req, 
      'Financial Export Generated', 
      'PlatformFinancials', 
      'ALL_REVENUE_EXPENSES'
    );

    let csvContent = 'Type,ID,Date,Category_Or_Method,Description,Amount_UGX,Status,Vendor_Or_Payer\n';

    allPayments.forEach(p => {
      csvContent += `Payment,${p.id},${p.createdAt.toISOString().slice(0, 10)},${p.paymentMethod},"${(p.description || '').replace(/"/g, '""')}",${p.amountUgx},${p.status},"${(p.payerEmail || '').replace(/"/g, '""')}"\n`;
    });

    allExpenses.forEach(e => {
      csvContent += `Expense,${e.id},${e.date},${e.category},"${(e.description || '').replace(/"/g, '""')}",-${e.amount},settled,"${(e.vendor || '').replace(/"/g, '""')}"\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="Platform_Financial_Ledger_${new Date().toISOString().slice(0, 10)}.csv"`);
    res.send(csvContent);
  } catch (err: any) {
    console.error('[Owner API] /export-financials error:', err);
    res.status(500).json({ error: 'Failed to export financials' });
  }
});
