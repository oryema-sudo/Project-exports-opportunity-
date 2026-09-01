import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Building2, 
  Users, 
  Receipt, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Activity, 
  Layers, 
  Compass, 
  FileSpreadsheet,
  HelpCircle,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { AppState } from '../services/store';
import { 
  OwnerOverviewMetrics, 
  OwnerRevenueData, 
  BusinessExpense, 
  OwnerCustomerRecord, 
  OwnerAlert,
  ExpenseCategory 
} from '../types';

interface OwnerDashboardViewProps {
  state: AppState;
}

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({ state }) => {
  const [overview, setOverview] = useState<OwnerOverviewMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<OwnerRevenueData | null>(null);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<OwnerCustomerRecord[]>([]);
  const [usageTelemetry, setUsageTelemetry] = useState<any>(null);
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);

  const [activeSubTab, setActiveSubTab] = useState<'financials' | 'expenses' | 'customers' | 'usage' | 'alerts'>('financials');
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | '365d'>('30d');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // New Expense Modal State
  const [showAddExpenseModal, setShowAddExpenseModal] = useState<boolean>(false);
  const [submittingExpense, setSubmittingExpense] = useState<boolean>(false);
  const [newExpense, setNewExpense] = useState({
    amount: '',
    currency: 'UGX',
    category: 'Cloud Infrastructure' as ExpenseCategory,
    description: '',
    date: new Date().toISOString().slice(0, 10),
    vendor: '',
    recurring: false,
    receiptReference: '',
    notes: ''
  });

  const isOwner = Boolean(state.currentUser.isPlatformOwner || 
                          state.currentUser.platformRole === 'PLATFORM_OWNER');

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [ov, rev, expRes, custs, usg, alrts] = await Promise.all([
        api.getOwnerOverview().catch(e => { console.error('Overview error:', e); return null; }),
        api.getOwnerRevenue(timeframe).catch(e => { console.error('Revenue error:', e); return null; }),
        api.getOwnerExpenses().catch(e => { console.error('Expenses error:', e); return { expenses: [], summary: null }; }),
        api.getOwnerCustomers().catch(e => { console.error('Customers error:', e); return []; }),
        api.getOwnerUsage().catch(e => { console.error('Usage error:', e); return null; }),
        api.getOwnerAlerts().catch(e => { console.error('Alerts error:', e); return []; })
      ]);

      if (ov) setOverview(ov);
      if (rev) setRevenueData(rev);
      if (expRes) {
        setExpenses(expRes.expenses || []);
        setExpenseSummary(expRes.summary || null);
      }
      if (custs) setCustomers(custs);
      if (usg) setUsageTelemetry(usg);
      if (alrts) setAlerts(alrts);

    } catch (err: any) {
      console.error('Failed to load CEO dashboard:', err);
      setError(err.message || 'Unable to connect to Platform Owner governance services');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOwner) {
      loadDashboardData();
    }
  }, [isOwner, timeframe]);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpense.amount || Number(newExpense.amount) <= 0) {
      alert('Please enter a valid positive expense amount.');
      return;
    }
    if (!newExpense.description || !newExpense.vendor) {
      alert('Please provide description and vendor details.');
      return;
    }

    try {
      setSubmittingExpense(true);
      await api.createOwnerExpense({
        amount: Number(newExpense.amount),
        currency: newExpense.currency,
        category: newExpense.category,
        description: newExpense.description,
        date: newExpense.date,
        vendor: newExpense.vendor,
        recurring: newExpense.recurring,
        receiptReference: newExpense.receiptReference || undefined,
        notes: newExpense.notes || undefined
      });

      setShowAddExpenseModal(false);
      setNewExpense({
        amount: '',
        currency: 'UGX',
        category: 'Cloud Infrastructure',
        description: '',
        date: new Date().toISOString().slice(0, 10),
        vendor: '',
        recurring: false,
        receiptReference: '',
        notes: ''
      });
      await loadDashboardData();
    } catch (err: any) {
      alert(`Error saving expense: ${err.message}`);
    } finally {
      setSubmittingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string, vendor: string) => {
    if (!window.confirm(`Are you sure you want to delete this expense record for "${vendor}"? This action is audited.`)) {
      return;
    }
    try {
      await api.deleteOwnerExpense(id);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Failed to delete expense: ${err.message}`);
    }
  };

  const handleUpdateOrgStatus = async (orgId: string, orgName: string, newStatus: string) => {
    if (!window.confirm(`Change active status of "${orgName}" to ${newStatus}?`)) return;
    try {
      await api.updateCustomerStatus(orgId, newStatus);
      await loadDashboardData();
    } catch (err: any) {
      alert(`Failed to update organization status: ${err.message}`);
    }
  };

  const handleExportFinancials = () => {
    window.open('/api/owner/export-financials', '_blank');
  };

  if (!isOwner) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-800">
          <XCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-stone-100 mb-2">Access Denied — 403 Forbidden</h2>
        <p className="text-stone-400 max-w-lg mx-auto text-sm leading-relaxed mb-6">
          The CEO & Platform Owner Governance center is strictly restricted to SaaS platform operators (<code className="text-amber-300">PLATFORM_OWNER</code>). Organization administrators, staff, and viewers do not possess platform governance privileges.
        </p>
      </div>
    );
  }

  const filteredExpenses = expenseCategoryFilter === 'ALL' 
    ? expenses 
    : expenses.filter(e => e.category === expenseCategoryFilter);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header Banner */}
      <div className="bg-stone-900 border border-amber-500/30 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500 text-stone-950 shadow-md">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
                    SaaS Platform CEO & Financial Governance
                  </h1>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                    PLATFORM_OWNER
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-stone-400">
                  Authoritative multi-tenant revenue metrics, business operating ledger, customer tenancy, and risk controls.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddExpenseModal(true)}
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Record Expense</span>
            </button>

            <button
              onClick={handleExportFinancials}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium px-3 py-2 rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors"
              title="Download full audited CSV ledger"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export Financials CSV</span>
            </button>

            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-2 rounded-lg border border-stone-700 transition-colors"
              title="Refresh telemetry and revenue metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-lg p-4 text-xs text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top Level Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR & ARR */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Monthly Recurring Revenue (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-stone-100">
            UGX {(overview?.mrrUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
            <span>ARR: <strong className="text-stone-300">UGX {((overview?.mrrUgx || 0) * 12).toLocaleString()}</strong></span>
            <span className="text-emerald-400 font-semibold">{overview?.activeSubscriptionsCount || 0} active subs</span>
          </div>
        </div>

        {/* Cash Collected (Strict Separation from Outstanding/Failed) */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Cash Received (Gross Collections)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            UGX {(overview?.cashReceivedUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
            <span>MoMo & Wire settled</span>
            <span className="text-stone-300">{overview?.payingOrganizations || 0} paying tenants</span>
          </div>
        </div>

        {/* Operating Expenses */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Monthly Operating Expenses</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-100">
            UGX {(overview?.monthlyExpensesUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
            <span>Total Logged: UGX {(overview?.totalExpensesUgx || 0).toLocaleString()}</span>
            <span className="text-amber-400 font-semibold">{expenses.length} entries</span>
          </div>
        </div>

        {/* Net Operating Profit */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Net Monthly Operating Margin</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-black ${(overview?.monthlyOperatingProfitUgx || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            UGX {(overview?.monthlyOperatingProfitUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800/80">
            <span>Profit Margin</span>
            <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
              (overview?.monthlyOperatingProfitUgx || 0) >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
            }`}>
              {overview?.mrrUgx && overview.mrrUgx > 0 
                ? `${Math.round(((overview.monthlyOperatingProfitUgx) / overview.mrrUgx) * 100)}%` 
                : 'N/A'}
            </span>
          </div>
        </div>

      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex border-b border-stone-800 space-x-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveSubTab('financials')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'financials'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Financial Streams & Cash Flow</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'expenses'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Business Expenses Ledger ({expenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('customers')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'customers'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Customer Tenants & Subscriptions ({customers.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('usage')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 ${
            activeSubTab === 'usage'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Ecosystem Telemetry</span>
        </button>

        <button
          onClick={() => setActiveSubTab('alerts')}
          className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 relative ${
            activeSubTab === 'alerts'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Risk & Billing Alerts</span>
          {alerts.filter(a => a.severity === 'critical').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>
      </div>

      {/* 1. FINANCIAL STREAMS VIEW */}
      {activeSubTab === 'financials' && (
        <div className="space-y-6">
          
          {/* Revenue Breakdown by Plan & Timeframe */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Subscription Plans Breakdown */}
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-stone-100">Subscription Plans Breakdown</h3>
                <span className="text-[11px] text-stone-400">Recurring MRR</span>
              </div>

              <div className="space-y-3">
                {overview?.revenueByPlan.map(p => (
                  <div key={p.planId} className="space-y-1.5 bg-stone-950/60 p-3 rounded-lg border border-stone-800/60">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-200">{p.planName}</span>
                      <span className="text-emerald-400 font-mono font-bold">UGX {p.mrrUgx.toLocaleString()}/mo</span>
                    </div>
                    
                    <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${Math.max(p.percentage, 5)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-stone-400">
                      <span>{p.subscribersCount} active subscribers</span>
                      <span>{p.percentage}% of MRR</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Integrity Guarantees */}
              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-900/60 text-[11px] text-emerald-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Strict Financial Separation Policy</span>
                </div>
                <p className="text-[10px] text-emerald-300/80 leading-relaxed">
                  Revenue counted reflects strictly settled cash transactions. Pending and failed payments are logged in separate audit silos and never booked as realized revenue.
                </p>
              </div>
            </div>

            {/* Timeframe & Collections Chart */}
            <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-stone-100">Cash Flow & Daily Collections</h3>
                  <p className="text-[11px] text-stone-400">Daily breakdown of settled revenue vs operational expenses</p>
                </div>

                <div className="flex items-center gap-1 bg-stone-950 p-1 rounded-lg border border-stone-800 text-xs">
                  {(['30d', '90d', '365d'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-2.5 py-1 rounded font-medium text-[11px] transition-colors ${
                        timeframe === tf ? 'bg-emerald-800 text-white font-bold' : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      {tf === '30d' ? 'Last 30 Days' : tf === '90d' ? 'Last Quarter' : 'Annual (1Y)'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Timeseries Visual Table / Bar Graph */}
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {revenueData?.points && revenueData.points.length > 0 ? (
                  revenueData.points.slice(-15).reverse().map(pt => (
                    <div key={pt.date} className="flex items-center justify-between p-2 rounded bg-stone-950/60 border border-stone-800/40 text-xs font-mono">
                      <span className="text-stone-300">{pt.date}</span>
                      
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <span className="text-[10px] text-stone-500 block">Cash Received</span>
                          <span className={pt.cashReceivedUgx > 0 ? 'text-emerald-400 font-bold' : 'text-stone-500'}>
                            UGX {pt.cashReceivedUgx.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-500 block">Expenses</span>
                          <span className={pt.expensesUgx > 0 ? 'text-amber-400 font-bold' : 'text-stone-500'}>
                            -UGX {pt.expensesUgx.toLocaleString()}
                          </span>
                        </div>

                        <div>
                          <span className="text-[10px] text-stone-500 block">Net Profit</span>
                          <span className={pt.netProfitUgx >= 0 ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                            UGX {pt.netProfitUgx.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-stone-500 text-xs">
                    No financial transaction history available in this timeframe.
                  </div>
                )}
              </div>

              {/* Payment Gateways / Methods Breakdown */}
              <div className="pt-3 border-t border-stone-800/80">
                <h4 className="text-xs font-bold text-stone-300 mb-2">Payment Gateway Distribution</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {revenueData?.paymentMethodDistribution.map(m => (
                    <div key={m.method} className="bg-stone-950 p-2 rounded border border-stone-800 text-xs">
                      <div className="text-[10px] text-stone-400 font-mono truncate">{m.method}</div>
                      <div className="font-bold text-stone-200">UGX {m.amountUgx.toLocaleString()}</div>
                      <div className="text-[10px] text-emerald-400">{m.percentage}% of collections ({m.count} txns)</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Recent Platform Transactions Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100">Live Transaction History</h3>
                <p className="text-[11px] text-stone-400">All inbound subscription invoices, mobile money collections, and failures</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/40">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3">Payment Method</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Amount (UGX)</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {overview?.recentPayments && overview.recentPayments.length > 0 ? (
                    overview.recentPayments.map(p => (
                      <tr key={p.id} className="hover:bg-stone-800/30 font-mono">
                        <td className="py-2 px-3 text-stone-400 whitespace-nowrap">{p.createdAt.slice(0, 10)}</td>
                        <td className="py-2 px-3 font-sans font-medium text-stone-200">{p.organizationName}</td>
                        <td className="py-2 px-3 text-stone-300">{p.paymentMethod}</td>
                        <td className="py-2 px-3 text-stone-400 font-sans truncate max-w-xs">{p.description}</td>
                        <td className="py-2 px-3 font-bold text-stone-100">UGX {p.amountUgx.toLocaleString()}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'successful' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                            p.status === 'pending' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                            'bg-red-950 text-red-300 border border-red-800'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="py-6 text-center text-stone-500 font-sans">
                        No transactions recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 2. BUSINESS EXPENSES VIEW */}
      {activeSubTab === 'expenses' && (
        <div className="space-y-6">
          
          {/* Expenses Filter & Summary Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-900 p-4 rounded-xl border border-stone-800">
            <div className="flex items-center gap-2">
              <span className="text-xs text-stone-400 font-semibold">Category Filter:</span>
              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="bg-stone-950 text-stone-200 text-xs px-3 py-1.5 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
              >
                <option value="ALL">All Categories</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Telecom & Mobile Money">Telecom & Mobile Money</option>
                <option value="UCDA Field Operations">UCDA Field Operations</option>
                <option value="Legal & Compliance">Legal & Compliance</option>
                <option value="Salaries & Contractors">Salaries & Contractors</option>
                <option value="Office & Admin">Office & Admin</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-stone-500">Filtered Total:</span>{' '}
                <strong className="text-amber-400">
                  UGX {filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                </strong>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(true)}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense Entry</span>
              </button>
            </div>
          </div>

          {/* Expenses Mobile Cards (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredExpenses.length > 0 ? (
              filteredExpenses.map(exp => (
                <div key={exp.id} className="p-4 bg-stone-900 border border-stone-800 rounded-xl space-y-2 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-stone-100">{exp.vendor}</div>
                      <div className="text-[11px] text-stone-400">{exp.description}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteExpense(exp.id, exp.vendor)}
                      className="p-1 text-stone-500 hover:text-red-400 shrink-0"
                      title="Delete expense entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-stone-800/80">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-amber-300 border border-stone-700">
                      {exp.category}
                    </span>
                    <span className="font-bold text-amber-400 font-mono text-sm">
                      UGX {exp.amount.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono pt-1">
                    <span>{exp.date}</span>
                    {exp.receiptReference && <span>Ref: {exp.receiptReference}</span>}
                    {exp.recurring && <span className="text-emerald-400">Recurring</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-stone-500 bg-stone-900 rounded-xl border border-stone-800 text-xs">
                No expenses logged for this category filter.
              </div>
            )}
          </div>

          {/* Expenses Desktop Table (>= md screens) */}
          <div className="hidden md:block bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/40">
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Vendor / Payee</th>
                    <th className="py-2.5 px-3">Description & Notes</th>
                    <th className="py-2.5 px-3">Receipt / Ref</th>
                    <th className="py-2.5 px-3">Amount (UGX)</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {filteredExpenses.length > 0 ? (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id} className="hover:bg-stone-800/30">
                        <td className="py-2.5 px-3 font-mono text-stone-400 whitespace-nowrap">{exp.date}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-amber-300 border border-stone-700">
                            {exp.category}
                          </span>
                          {exp.recurring && (
                            <span className="ml-1.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Monthly Recurring
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-stone-200">{exp.vendor}</td>
                        <td className="py-2.5 px-3 text-stone-300 max-w-xs">
                          <div>{exp.description}</div>
                          {exp.notes && <div className="text-[10px] text-stone-500 italic mt-0.5">{exp.notes}</div>}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-stone-400 text-[11px]">{exp.receiptReference || '—'}</td>
                        <td className="py-2.5 px-3 font-bold text-amber-400 font-mono">
                          UGX {exp.amount.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => handleDeleteExpense(exp.id, exp.vendor)}
                            className="p-1 text-stone-500 hover:text-red-400 transition-colors"
                            title="Delete expense entry"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-stone-500">
                        No expenses logged for this category filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* 3. CUSTOMER TENANTS & SUBSCRIPTIONS VIEW */}
      {activeSubTab === 'customers' && (
        <div className="space-y-6">
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-stone-100">Customer Tenant Organizations</h3>
                <p className="text-[11px] text-stone-400">Manage multi-tenant subscriptions, smallholder limits, and access statuses</p>
              </div>
              <span className="text-xs text-stone-400 font-mono">{customers.length} total organizations</span>
            </div>

            {/* Mobile Cards (< md screens) */}
            <div className="block md:hidden space-y-3">
              {customers.map(c => (
                <div key={c.id} className="p-4 bg-stone-950/70 border border-stone-800 rounded-xl space-y-3 text-xs">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-stone-100">{c.legalName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{c.registrationNumber} • {c.district}, {c.country}</div>
                      <div className="text-[10px] text-stone-500">{c.email}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                      c.activeStatus === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                      c.activeStatus === 'Trial' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                      'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {c.activeStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-500 block">Subscription</span>
                      <span className="font-semibold text-emerald-400">{c.subscription?.planName || c.subscriptionPlan || 'Starter'}</span>
                      {c.subscription && (
                        <span className="text-[10px] text-stone-400 block font-mono">
                          UGX {c.subscription.amountUgx.toLocaleString()}/{c.subscription.billingCycle}
                        </span>
                      )}
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-500 block">Lifetime Revenue</span>
                      <span className="font-mono font-bold text-stone-100">UGX {c.totalPaymentsUgx.toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-[11px]">
                    <span className="font-mono text-stone-400">
                      {c.farmersCount} Farmers • {c.farmsCount} Farms
                    </span>

                    {c.activeStatus === 'Active' ? (
                      <button
                        onClick={() => handleUpdateOrgStatus(c.id, c.legalName, 'Suspended')}
                        className="px-2.5 py-1 bg-red-950 hover:bg-red-900 text-red-300 text-[10px] font-bold rounded border border-red-800 transition-colors"
                      >
                        Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateOrgStatus(c.id, c.legalName, 'Active')}
                        className="px-2.5 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold rounded border border-emerald-800 transition-colors"
                      >
                        Activate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table (>= md screens) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-800 text-stone-400 font-semibold bg-stone-950/40">
                    <th className="py-2.5 px-3">Organization</th>
                    <th className="py-2.5 px-3">Type & Location</th>
                    <th className="py-2.5 px-3">Subscription Plan</th>
                    <th className="py-2.5 px-3">Telemetry Footprint</th>
                    <th className="py-2.5 px-3">Lifetime Revenue</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/60">
                  {customers.map(c => (
                    <tr key={c.id} className="hover:bg-stone-800/30">
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-100">{c.legalName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{c.registrationNumber}</div>
                        <div className="text-[10px] text-stone-500">{c.email}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-stone-800 text-stone-300">
                          {c.type}
                        </span>
                        <div className="text-[10px] text-stone-400 mt-1">{c.district}, {c.country}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-semibold text-emerald-400">
                          {c.subscription?.planName || c.subscriptionPlan || 'Starter'}
                        </div>
                        {c.subscription && (
                          <div className="text-[10px] text-stone-400 font-mono">
                            UGX {c.subscription.amountUgx.toLocaleString()}/{c.subscription.billingCycle}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[11px] text-stone-300">
                        <div>{c.farmersCount} Farmers</div>
                        <div className="text-[10px] text-stone-500">{c.farmsCount} Farms | {c.shipmentsCount} Shipments</div>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-stone-100">
                        UGX {c.totalPaymentsUgx.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          c.activeStatus === 'Active' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                          c.activeStatus === 'Trial' ? 'bg-blue-950 text-blue-300 border border-blue-800' :
                          'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {c.activeStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {c.activeStatus === 'Active' ? (
                            <button
                              onClick={() => handleUpdateOrgStatus(c.id, c.legalName, 'Suspended')}
                              className="px-2 py-1 bg-red-950 hover:bg-red-900 text-red-300 text-[10px] font-bold rounded border border-red-800 transition-colors"
                              title="Suspend organization account"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateOrgStatus(c.id, c.legalName, 'Active')}
                              className="px-2 py-1 bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[10px] font-bold rounded border border-emerald-800 transition-colors"
                              title="Activate organization account"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 4. ECOSYSTEM TELEMETRY VIEW */}
      {activeSubTab === 'usage' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <div className="text-stone-400 text-xs font-semibold">Total Smallholders Mapped</div>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {(overview?.platformUsage.totalFarmers || usageTelemetry?.summary?.totalFarmers || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500">Across {(usageTelemetry?.summary?.totalOrganizations || 0)} cooperatives & exporters</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <div className="text-stone-400 text-xs font-semibold">Total Farm Plots (Polygons)</div>
              <div className="text-2xl font-black text-stone-100 font-mono">
                {(overview?.platformUsage.totalFarms || usageTelemetry?.summary?.totalFarms || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500">{usageTelemetry?.summary?.totalHectares || 0} certified hectares</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <div className="text-stone-400 text-xs font-semibold">Coffee Intake Volume</div>
              <div className="text-2xl font-black text-amber-400 font-mono">
                {(overview?.platformUsage.totalCoffeeQuantityKg || usageTelemetry?.summary?.totalIntakeKg || 0).toLocaleString()} kg
              </div>
              <div className="text-[10px] text-stone-500">Through {overview?.platformUsage.totalDeliveries || 0} purchase weighments</div>
            </div>

            <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
              <div className="text-stone-400 text-xs font-semibold">Cryptographic Audit Logs</div>
              <div className="text-2xl font-black text-stone-100 font-mono">
                {(overview?.platformUsage.totalAuditLogs || usageTelemetry?.summary?.totalAuditLogs || 0).toLocaleString()}
              </div>
              <div className="text-[10px] text-stone-500">Immutable trace events</div>
            </div>

          </div>

          {/* Regional Coffee District Distribution */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-bold text-stone-100">National Coffee District Distribution</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {usageTelemetry?.districtDistribution && Object.entries(usageTelemetry.districtDistribution).map(([dist, count]: any) => (
                <div key={dist} className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                  <div className="text-xs font-bold text-stone-200">{dist} District</div>
                  <div className="text-sm font-black text-emerald-400 font-mono mt-1">{count} Smallholders</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. RISK & ALERTS VIEW */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map(a => (
              <div 
                key={a.id} 
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 ${
                  a.severity === 'critical' 
                    ? 'bg-red-950/40 border-red-800 text-red-200' 
                    : a.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-800 text-amber-200'
                    : 'bg-stone-900 border-stone-800 text-stone-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-stone-950/60 border border-stone-800">
                    {a.severity === 'critical' ? (
                      <XCircle className="w-5 h-5 text-red-400" />
                    ) : a.severity === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-xs font-bold">{a.title}</div>
                    <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">{a.message}</p>
                    <div className="text-[10px] text-stone-500 font-mono mt-1">{a.timestamp}</div>
                  </div>
                </div>

                {a.actionLabel && (
                  <button 
                    onClick={() => setActiveSubTab('financials')}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded border border-stone-700 whitespace-nowrap"
                  >
                    {a.actionLabel}
                  </button>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-stone-900 rounded-xl border border-stone-800 text-stone-400 text-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              All platform systems, tenant subscriptions, and billing pipelines are healthy.
            </div>
          )}
        </div>
      )}

      {/* Record Business Expense Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-stone-100 text-base">Record Business Operating Expense</h3>
              </div>
              <button
                onClick={() => setShowAddExpenseModal(false)}
                className="text-stone-400 hover:text-stone-100 text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Expense Amount (UGX) *</label>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    required
                    value={newExpense.amount}
                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                    placeholder="e.g. 450000"
                    className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Date *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                    className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="Telecom & Mobile Money">Telecom & Mobile Money</option>
                    <option value="UCDA Field Operations">UCDA Field Operations</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Salaries & Contractors">Salaries & Contractors</option>
                    <option value="Office & Admin">Office & Admin</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Vendor / Payee *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Google Cloud, MTN Uganda"
                    value={newExpense.vendor}
                    onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })}
                    className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Expense Description *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly managed database compute & cloud storage runtime"
                  value={newExpense.description}
                  onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 font-semibold mb-1">Receipt / Invoice Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-0812"
                    value={newExpense.receiptReference}
                    onChange={(e) => setNewExpense({ ...newExpense, receiptReference: e.target.value })}
                    className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="flex items-center pt-2 sm:pt-6">
                  <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                    <input
                      type="checkbox"
                      checked={newExpense.recurring}
                      onChange={(e) => setNewExpense({ ...newExpense, recurring: e.target.checked })}
                      className="rounded border-stone-700 bg-stone-950 text-amber-500 focus:ring-amber-400"
                    />
                    <span className="font-semibold">Recurring Monthly Expense</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 font-semibold mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional operational or tax context..."
                  value={newExpense.notes}
                  onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}
                  className="w-full bg-stone-950 text-stone-100 px-3 py-2 rounded-lg border border-stone-700 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg flex items-center gap-1.5"
                >
                  {submittingExpense ? 'Saving...' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
