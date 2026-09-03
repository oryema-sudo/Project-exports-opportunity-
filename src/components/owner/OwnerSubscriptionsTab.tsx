import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CreditCard, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Building2, 
  Calendar, 
  ArrowUpRight, 
  RefreshCw,
  Edit2,
  X,
  ShieldCheck
} from 'lucide-react';
import { OwnerSubscriptionRecord, OwnerPlanDefinition } from '../../types';
import { api } from '../../services/api';

interface OwnerSubscriptionsTabProps {
  onRefreshMetrics: () => void;
}

export const OwnerSubscriptionsTab: React.FC<OwnerSubscriptionsTabProps> = ({ onRefreshMetrics }) => {
  const [plans, setPlans] = useState<OwnerPlanDefinition[]>([]);
  const [subscriptions, setSubscriptions] = useState<OwnerSubscriptionRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal for modifying subscription
  const [selectedSub, setSelectedSub] = useState<OwnerSubscriptionRecord | null>(null);
  const [editStatus, setEditStatus] = useState<string>('active');
  const [editPlanId, setEditPlanId] = useState<string>('starter');
  const [editBillingCycle, setEditBillingCycle] = useState<string>('monthly');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, subsData] = await Promise.all([
        api.getOwnerPlans().catch(() => []),
        api.getOwnerSubscriptions().catch(() => [])
      ]);
      setPlans(plansData);
      setSubscriptions(subsData);
    } catch (err: any) {
      console.error('Failed to load subscriptions & plans:', err);
      setError(err.message || 'Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenEdit = (sub: OwnerSubscriptionRecord) => {
    setSelectedSub(sub);
    setEditStatus(sub.status);
    setEditPlanId(sub.planId || 'starter');
    setEditBillingCycle(sub.billingCycle || 'monthly');
    setSuccessMessage(null);
  };

  const handleSaveSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) return;

    try {
      setSubmitting(true);
      setSuccessMessage(null);

      const targetPlan = plans.find(p => p.id === editPlanId);
      const amount = targetPlan 
        ? (editBillingCycle === 'annual' ? targetPlan.annualPriceUgx : targetPlan.monthlyPriceUgx)
        : selectedSub.amountUgx;

      await fetch(`/api/owner/subscriptions/${selectedSub.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: editStatus,
          planId: editPlanId,
          planName: targetPlan ? targetPlan.name : selectedSub.planName,
          billingCycle: editBillingCycle,
          amountUgx: amount
        })
      });

      setSuccessMessage('Subscription record updated and audited.');
      await fetchData();
      onRefreshMetrics();
      setTimeout(() => setSelectedSub(null), 1500);
    } catch (err: any) {
      alert(`Failed to update subscription: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSubs = subscriptions.filter(s => {
    const matchesSearch = 
      (s.organizationName && s.organizationName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.planName && s.planName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.contactEmail && s.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.district && s.district.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="owner-subscriptions-container" className="space-y-6">
      
      {/* 1. Canonical Subscription Plans & Quotas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>SaaS Subscription Plans & Quota Limits</span>
            </h2>
            <p className="text-xs text-stone-400">
              Platform-wide tiers governing tenant smallholder boundaries, GPS farm limits, and shipment capacities.
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
            title="Refresh subscriptions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map(plan => (
            <div 
              key={plan.id}
              className={`rounded-xl p-5 border space-y-4 relative flex flex-col justify-between ${
                plan.id === 'professional'
                  ? 'bg-stone-900 border-amber-500/40 shadow-lg'
                  : 'bg-stone-900 border-stone-800'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-stone-100">{plan.name}</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-stone-800 text-stone-300 border border-stone-700">
                    {plan.subscribersCount || 0} active tenants
                  </span>
                </div>
                
                <p className="text-xs text-stone-400 leading-relaxed min-h-[40px]">
                  {plan.description}
                </p>

                <div className="pt-2 border-t border-stone-800">
                  <div className="text-2xl font-black text-stone-100 font-mono">
                    UGX {plan.monthlyPriceUgx.toLocaleString()}
                    <span className="text-xs font-normal text-stone-400">/mo</span>
                  </div>
                  <div className="text-[11px] text-stone-400">
                    Annual: UGX {plan.annualPriceUgx.toLocaleString()}/yr
                  </div>
                </div>

                {/* Quotas */}
                <div className="bg-stone-950 p-3 rounded-lg border border-stone-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Smallholder Quota:</span>
                    <strong className="text-stone-100">{plan.maxFarmers.toLocaleString()} farmers</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Farm Polygon Limit:</span>
                    <strong className="text-stone-100">{plan.maxFarms.toLocaleString()} plots</strong>
                  </div>
                  <div className="flex items-center justify-between text-stone-300">
                    <span>Monthly Shipments:</span>
                    <strong className="text-stone-100">{plan.maxShipmentsMonthly} consignments</strong>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-1.5 text-xs text-stone-300 pt-1">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[11px] leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Platform-wide Active Subscriptions Registry */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-400" />
              <span>Multi-Tenant Subscriptions Registry ({subscriptions.length})</span>
            </h2>
            <p className="text-xs text-stone-400">
              Active agreements, billing cycles, renewals, and payment statuses across all customer organizations.
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tenant or plan..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="active">Active</option>
              <option value="past_due">Past Due</option>
              <option value="trial">Trial</option>
              <option value="cancelled">Cancelled</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>

        {/* Subscriptions Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Organization Tenant</th>
                  <th className="py-3 px-4">Assigned Plan</th>
                  <th className="py-3 px-4">Cycle & Amount</th>
                  <th className="py-3 px-4">Current Period Renewal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80">
                {filteredSubs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-stone-400 text-xs">
                      No subscription records match your filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredSubs.map(sub => {
                    const statusColors: Record<string, string> = {
                      active: 'bg-emerald-950/70 text-emerald-400 border-emerald-800',
                      past_due: 'bg-red-950/70 text-red-400 border-red-800',
                      trial: 'bg-amber-950/70 text-amber-400 border-amber-800',
                      cancelled: 'bg-stone-800 text-stone-400 border-stone-700',
                      suspended: 'bg-red-950 text-red-400 border-red-900'
                    };

                    return (
                      <tr key={sub.id} className="hover:bg-stone-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-stone-100 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-stone-400" />
                            <span>{sub.organizationName || 'Unlinked Organization'}</span>
                          </div>
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            {sub.contactEmail} • {sub.district || 'Uganda'}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-stone-200">
                            {sub.planName}
                          </div>
                          <div className="text-[10px] text-stone-400 font-mono">
                            Plan ID: {sub.planId}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-mono font-bold text-emerald-400">
                            UGX {sub.amountUgx.toLocaleString()}
                          </div>
                          <div className="text-[10px] text-stone-400 capitalize">
                            {sub.billingCycle} billing
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <div className="text-stone-200 flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-stone-400" />
                            <span>{new Date(sub.currentPeriodEnd).toLocaleDateString()}</span>
                          </div>
                          <div className="text-[10px] text-stone-400">
                            Started {new Date(sub.currentPeriodStart).toLocaleDateString()}
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border capitalize ${statusColors[sub.status] || 'bg-stone-800 text-stone-300'}`}>
                            {sub.status.replace('_', ' ')}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEdit(sub)}
                            className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 text-[11px] font-medium transition-colors inline-flex items-center gap-1"
                          >
                            <Edit2 className="w-3 h-3 text-amber-400" />
                            <span>Modify</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modify Subscription Modal */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl relative">
            <button
              onClick={() => setSelectedSub(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-100"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-stone-100">
              Modify Subscription for {selectedSub.organizationName}
            </h3>

            {successMessage && (
              <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubscription} className="space-y-3 text-xs">
              <div>
                <label className="text-stone-400 block mb-1">Subscription Plan</label>
                <select
                  value={editPlanId}
                  onChange={e => setEditPlanId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="starter">Starter Exporter (UGX 250,000/mo)</option>
                  <option value="professional">Professional Exporter (UGX 600,000/mo)</option>
                  <option value="enterprise">Enterprise Union (UGX 1,800,000/mo)</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Billing Cycle</label>
                <select
                  value={editBillingCycle}
                  onChange={e => setEditBillingCycle(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="monthly">Monthly</option>
                  <option value="annual">Annual</option>
                </select>
              </div>

              <div>
                <label className="text-stone-400 block mb-1">Subscription Status</label>
                <select
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-800 rounded-lg p-2 text-stone-100 focus:outline-none focus:border-amber-400"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="past_due">Past Due (Overdue)</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedSub(null)}
                  className="px-3 py-1.5 rounded-lg text-stone-400 hover:text-stone-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Saving Changes...' : 'Save & Record Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
