import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  TrendingUp, 
  Building2, 
  Users, 
  Layers, 
  Activity, 
  ShieldCheck, 
  Receipt, 
  AlertTriangle, 
  XCircle,
  X,
  Plus
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

import { OwnerHeader } from './owner/OwnerHeader';
import { OwnerOverviewTab } from './owner/OwnerOverviewTab';
import { OwnerOrganizationsTab } from './owner/OwnerOrganizationsTab';
import { OwnerUsersTab } from './owner/OwnerUsersTab';
import { OwnerSubscriptionsTab } from './owner/OwnerSubscriptionsTab';
import { OwnerTelemetryTab } from './owner/OwnerTelemetryTab';
import { OwnerSecurityTab } from './owner/OwnerSecurityTab';
import { OwnerFinancialsTab } from './owner/OwnerFinancialsTab';

interface OwnerDashboardViewProps {
  state: AppState;
}

export type OwnerControlTab = 
  | 'overview' 
  | 'organizations' 
  | 'administrators' 
  | 'subscriptions' 
  | 'telemetry' 
  | 'security' 
  | 'financials';

export const OwnerDashboardView: React.FC<OwnerDashboardViewProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<OwnerControlTab>('overview');

  const [overview, setOverview] = useState<OwnerOverviewMetrics | null>(null);
  const [revenueData, setRevenueData] = useState<OwnerRevenueData | null>(null);
  const [expenses, setExpenses] = useState<BusinessExpense[]>([]);
  const [expenseSummary, setExpenseSummary] = useState<any>(null);
  const [customers, setCustomers] = useState<OwnerCustomerRecord[]>([]);
  const [usageTelemetry, setUsageTelemetry] = useState<any>(null);
  const [alerts, setAlerts] = useState<OwnerAlert[]>([]);

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

  const isOwner = Boolean(
    state.currentUser.isPlatformOwner || 
    state.currentUser.platformRole === 'PLATFORM_OWNER'
  );

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
      console.error('Failed to load Platform Owner dashboard:', err);
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
    if (!window.confirm(`Delete expense record for "${vendor}"? This action will be logged in the audit ledger.`)) {
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
          The AstroKahawa Platform Owner SaaS Control Center is strictly restricted to platform operators (<code className="text-amber-300">PLATFORM_OWNER</code>). Organization-level exporters, administrators, and staff do not possess multi-tenant governance privileges.
        </p>
      </div>
    );
  }

  const criticalAlertCount = alerts.filter(a => a.severity === 'critical').length;

  return (
    <div id="owner-dashboard-root" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* 1. Header with Platform Identity & Quick Actions */}
      <OwnerHeader
        loading={loading}
        onRefresh={loadDashboardData}
        onOpenAddExpense={() => setShowAddExpenseModal(true)}
        onExportFinancials={handleExportFinancials}
        totalOrgsCount={overview?.totalOrganizations || customers.length}
        activeSubCount={overview?.activeSubscriptionsCount || 0}
      />

      {error && (
        <div className="bg-red-950/60 border border-red-800 rounded-lg p-4 text-xs text-red-300 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Primary SaaS Navigation Tabs */}
      <div id="owner-sub-tabs" className="flex border-b border-stone-800 space-x-1 sm:space-x-2 overflow-x-auto pb-1">
        <button
          id="tab-overview"
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Command Center</span>
        </button>

        <button
          id="tab-organizations"
          onClick={() => setActiveTab('organizations')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'organizations'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Registered Tenants ({customers.length})</span>
        </button>

        <button
          id="tab-administrators"
          onClick={() => setActiveTab('administrators')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'administrators'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Admins & Users</span>
        </button>

        <button
          id="tab-subscriptions"
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'subscriptions'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Plans & Quotas</span>
        </button>

        <button
          id="tab-telemetry"
          onClick={() => setActiveTab('telemetry')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'telemetry'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Platform Telemetry</span>
        </button>

        <button
          id="tab-security"
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap relative ${
            activeTab === 'security'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
          <span>Security & Audits</span>
          {criticalAlertCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
        </button>

        <button
          id="tab-financials"
          onClick={() => setActiveTab('financials')}
          className={`px-3.5 py-2 text-xs font-bold rounded-t-lg transition-colors flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'financials'
              ? 'bg-stone-800 text-amber-300 border-t-2 border-amber-400'
              : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
          }`}
        >
          <Receipt className="w-3.5 h-3.5" />
          <span>Financial Ledger</span>
        </button>
      </div>

      {/* 3. Active Tab Content Rendering */}
      {activeTab === 'overview' && (
        <OwnerOverviewTab
          overview={overview}
          onNavigateTab={(tab) => setActiveTab(tab as OwnerControlTab)}
          alerts={alerts}
        />
      )}

      {activeTab === 'organizations' && (
        <OwnerOrganizationsTab
          customers={customers}
          onRefresh={loadDashboardData}
          onUpdateStatus={handleUpdateOrgStatus}
        />
      )}

      {activeTab === 'administrators' && (
        <OwnerUsersTab
          onRefreshTelemetry={loadDashboardData}
        />
      )}

      {activeTab === 'subscriptions' && (
        <OwnerSubscriptionsTab
          onRefreshMetrics={loadDashboardData}
        />
      )}

      {activeTab === 'telemetry' && (
        <OwnerTelemetryTab
          usageTelemetry={usageTelemetry}
        />
      )}

      {activeTab === 'security' && (
        <OwnerSecurityTab
          alerts={alerts}
          onRefreshMetrics={loadDashboardData}
        />
      )}

      {activeTab === 'financials' && (
        <OwnerFinancialsTab
          overview={overview}
          revenueData={revenueData}
          expenses={expenses}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          expenseCategoryFilter={expenseCategoryFilter}
          setExpenseCategoryFilter={setExpenseCategoryFilter}
          onOpenAddExpense={() => setShowAddExpenseModal(true)}
          onDeleteExpense={handleDeleteExpense}
          onExportFinancials={handleExportFinancials}
          onRefresh={loadDashboardData}
        />
      )}

      {/* 4. Add Expense Entry Modal */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setShowAddExpenseModal(false)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                <span>Record Platform Operating Expense</span>
              </h3>
              <p className="text-xs text-stone-400 mt-1">
                Enter an authoritative operating expense. This entry will be cryptographically audited and deducted from net operating profits.
              </p>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Amount (UGX) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    placeholder="e.g. 750000"
                    value={newExpense.amount}
                    onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Category *</label>
                  <select
                    value={newExpense.category}
                    onChange={e => setNewExpense({ ...newExpense, category: e.target.value as ExpenseCategory })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                  >
                    <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                    <option value="UCDA Field Operations">UCDA Field Operations</option>
                    <option value="Telecom & Mobile Money">Telecom & Mobile Money</option>
                    <option value="Legal & Compliance">Legal & Compliance</option>
                    <option value="Salaries & Contractors">Salaries & Contractors</option>
                    <option value="Office & Admin">Office & Admin</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Vendor / Payee *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Google Cloud, Sentinel-2 GIS, MTN MoMo"
                  value={newExpense.vendor}
                  onChange={e => setNewExpense({ ...newExpense, vendor: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Description / Line Item Purpose *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Monthly server ingress & PostgreSQL Cloud instance"
                  value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-stone-400 block mb-1">Date Incurred *</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="text-stone-400 block mb-1">Invoice / Receipt Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-089"
                    value={newExpense.receiptReference}
                    onChange={e => setNewExpense({ ...newExpense, receiptReference: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="expense-recurring"
                  checked={newExpense.recurring}
                  onChange={e => setNewExpense({ ...newExpense, recurring: e.target.checked })}
                  className="rounded border-stone-800 text-amber-500 focus:ring-amber-500 bg-stone-950"
                />
                <label htmlFor="expense-recurring" className="text-stone-300 select-none cursor-pointer">
                  Mark as monthly recurring operational commitment
                </label>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-3 py-2 rounded-lg text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExpense}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors disabled:opacity-50"
                >
                  {submittingExpense ? 'Recording...' : 'Record Expense Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
