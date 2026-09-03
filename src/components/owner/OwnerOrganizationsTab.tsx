import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Users, 
  CreditCard, 
  MapPin, 
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X,
  Coffee,
  Globe,
  FileText
} from 'lucide-react';
import { OwnerCustomerRecord, OwnerOrganizationDetail } from '../../types';
import { api } from '../../services/api';

interface OwnerOrganizationsTabProps {
  customers: OwnerCustomerRecord[];
  onRefresh: () => void;
  onUpdateStatus: (id: string, name: string, status: string) => Promise<void>;
}

export const OwnerOrganizationsTab: React.FC<OwnerOrganizationsTabProps> = ({
  customers,
  onRefresh,
  onUpdateStatus
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  
  // Drill-down modal state
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [orgDetail, setOrgDetail] = useState<OwnerOrganizationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Plan adjustment state within detail modal
  const [selectedPlanId, setSelectedPlanId] = useState<string>('professional');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [updatingSub, setUpdatingSub] = useState<boolean>(false);
  const [subSuccessMsg, setSubSuccessMsg] = useState<string | null>(null);

  // Open drill-down modal
  const handleOpenDetail = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setLoadingDetail(true);
    setDetailError(null);
    setSubSuccessMsg(null);
    try {
      const detail = await api.getOwnerOrganizationDetail(orgId);
      setOrgDetail(detail);
      if (detail.subscription) {
        setSelectedPlanId(detail.subscription.planId || 'professional');
        setBillingCycle(detail.subscription.billingCycle as any || 'monthly');
      }
    } catch (err: any) {
      console.error('Failed to load org detail:', err);
      setDetailError(err.message || 'Failed to load organization profile');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCloseDetail = () => {
    setSelectedOrgId(null);
    setOrgDetail(null);
    setSubSuccessMsg(null);
  };

  const handleApplySubscriptionChange = async () => {
    if (!selectedOrgId) return;
    try {
      setUpdatingSub(true);
      setSubSuccessMsg(null);
      await api.updateOwnerOrgSubscription(selectedOrgId, {
        planId: selectedPlanId,
        billingCycle
      });
      setSubSuccessMsg('Subscription tier successfully updated and audited.');
      // Refresh both detail and outer list
      const refreshed = await api.getOwnerOrganizationDetail(selectedOrgId);
      setOrgDetail(refreshed);
      onRefresh();
    } catch (err: any) {
      alert(`Failed to update subscription: ${err.message}`);
    } finally {
      setUpdatingSub(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.legalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.district.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || c.activeStatus === statusFilter;
    const matchesType = typeFilter === 'ALL' || c.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div id="owner-organizations-container" className="space-y-6">
      
      {/* Search and Filters Bar */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="org-search-input"
            type="text"
            placeholder="Search organizations, registration, email, district..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-4 py-2 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-medium">Status:</span>
            <select
              id="org-status-filter"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Trial">Trial</option>
              <option value="Suspended">Suspended</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-stone-400 font-medium">Type:</span>
            <select
              id="org-type-filter"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="bg-stone-950 border border-stone-800 rounded-lg px-2.5 py-1.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 transition-colors"
            >
              <option value="ALL">All Types</option>
              <option value="Exporter">Exporter</option>
              <option value="Cooperative">Cooperative</option>
              <option value="Washing Station">Washing Station</option>
              <option value="Processor">Processor</option>
            </select>
          </div>

          <div className="text-xs text-stone-400 pl-2">
            Showing <strong className="text-stone-200">{filteredCustomers.length}</strong> of {customers.length}
          </div>
        </div>
      </div>

      {/* Organizations Directory Table */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-300">
            <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
              <tr>
                <th className="py-3 px-4">Organization & Registration</th>
                <th className="py-3 px-4">Type & Region</th>
                <th className="py-3 px-4">Plan & Billing</th>
                <th className="py-3 px-4">Traceability Footprint</th>
                <th className="py-3 px-4">Settled Revenue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400 text-xs">
                    No customer organizations match the specified criteria.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(customer => {
                  const statusColors: Record<string, string> = {
                    Active: 'bg-emerald-950/70 text-emerald-400 border-emerald-800',
                    Trial: 'bg-amber-950/70 text-amber-400 border-amber-800',
                    Suspended: 'bg-red-950/70 text-red-400 border-red-800',
                    Inactive: 'bg-stone-800 text-stone-400 border-stone-700'
                  };

                  return (
                    <tr 
                      key={customer.id} 
                      className="hover:bg-stone-800/30 transition-colors cursor-pointer group"
                      onClick={() => handleOpenDetail(customer.id)}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-100 group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                          <span>{customer.legalName}</span>
                        </div>
                        <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                          ID: {customer.registrationNumber || customer.id.slice(0, 8)}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Joined {new Date(customer.createdDate).toLocaleDateString()}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-semibold text-stone-200">
                          {customer.type}
                        </div>
                        <div className="text-[11px] text-stone-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-stone-400" />
                          <span>{customer.district}, {customer.country}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5 truncate max-w-[160px]">
                          {customer.email}
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <div className="font-medium text-stone-200 flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                          <span>{customer.subscription?.planName || customer.subscriptionPlan || 'Free / Community'}</span>
                        </div>
                        {customer.subscription ? (
                          <div className="text-[11px] text-stone-400 mt-0.5">
                            UGX {customer.subscription.amountUgx.toLocaleString()}/{customer.subscription.billingCycle} • Renew: {new Date(customer.subscription.currentPeriodEnd).toLocaleDateString()}
                          </div>
                        ) : (
                          <div className="text-[10px] text-stone-400 mt-0.5">
                            No billing subscription
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3 text-xs">
                          <span title="Mapped Smallholders" className="text-stone-300">
                            <strong>{customer.farmersCount}</strong> <span className="text-stone-400">farmers</span>
                          </span>
                          <span title="GPS Farm Polygons" className="text-stone-300">
                            <strong>{customer.farmsCount}</strong> <span className="text-stone-400">farms</span>
                          </span>
                          <span title="Shipments" className="text-stone-300">
                            <strong>{customer.shipmentsCount}</strong> <span className="text-stone-400">ships</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-400 mt-1 flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>{customer.usersCount} staff accounts</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        UGX {(customer.totalPaymentsUgx || 0).toLocaleString()}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusColors[customer.activeStatus] || statusColors['Inactive']}`}>
                          {customer.activeStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right space-x-2" onClick={e => e.stopPropagation()}>
                        {customer.activeStatus === 'Suspended' ? (
                          <button
                            onClick={() => onUpdateStatus(customer.id, customer.legalName, 'Active')}
                            className="px-2.5 py-1 text-[11px] rounded bg-emerald-950 text-emerald-400 hover:bg-emerald-900 border border-emerald-800 transition-colors font-medium"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => onUpdateStatus(customer.id, customer.legalName, 'Suspended')}
                            className="px-2.5 py-1 text-[11px] rounded bg-red-950 text-red-400 hover:bg-red-900 border border-red-800 transition-colors font-medium"
                          >
                            Suspend
                          </button>
                        )}

                        <button
                          onClick={() => handleOpenDetail(customer.id)}
                          className="px-2.5 py-1 text-[11px] rounded bg-stone-800 text-stone-200 hover:bg-stone-700 border border-stone-700 transition-colors font-medium inline-flex items-center gap-1"
                        >
                          <span>Manage</span>
                          <ChevronRight className="w-3 h-3" />
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

      {/* Organization Drill-Down Modal */}
      {selectedOrgId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-stone-900 border border-stone-700 rounded-xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8">
            
            <button
              onClick={handleCloseDetail}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {loadingDetail ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-amber-400 animate-spin mx-auto" />
                <p className="text-xs text-stone-400">Loading organization telemetry, administrators, and subscriptions...</p>
              </div>
            ) : detailError ? (
              <div className="py-8 text-center text-xs text-red-400 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-red-400" />
                <p>{detailError}</p>
              </div>
            ) : orgDetail ? (
              <div className="space-y-6">
                
                {/* Org Modal Header */}
                <div className="border-b border-stone-800 pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-stone-100">
                          {orgDetail.organization.legalName}
                        </h2>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-stone-800 text-stone-300 border border-stone-700">
                          {orgDetail.organization.type}
                        </span>
                      </div>
                      <p className="text-xs text-stone-400 mt-1">
                        Reg: {orgDetail.organization.registrationNumber} • District: {orgDetail.organization.district}, {orgDetail.organization.country} • Contact: {orgDetail.organization.email} ({orgDetail.organization.contactPhone})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                        orgDetail.organization.activeStatus === 'Active' 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                          : 'bg-red-950 text-red-300 border border-red-800'
                      }`}>
                        {orgDetail.organization.activeStatus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footprint Highlights */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                    <span className="text-stone-400 text-[11px]">Smallholders</span>
                    <div className="text-lg font-bold text-stone-100 mt-0.5">
                      {orgDetail.stats.farmersCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                    <span className="text-stone-400 text-[11px]">Farm Polygons</span>
                    <div className="text-lg font-bold text-stone-100 mt-0.5">
                      {orgDetail.stats.farmsCount.toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                    <span className="text-stone-400 text-[11px]">Intake Coffee</span>
                    <div className="text-lg font-bold text-stone-100 mt-0.5">
                      {orgDetail.stats.totalCoffeeQuantityKg.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                    <span className="text-stone-400 text-[11px]">Consignments</span>
                    <div className="text-lg font-bold text-stone-100 mt-0.5">
                      {orgDetail.stats.shipmentsCount}
                    </div>
                  </div>
                </div>

                {/* Organization Administrators & User Roster */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-amber-400" />
                    <span>Organization Administrators & Staff ({orgDetail.users.length})</span>
                  </h3>
                  <div className="bg-stone-950 rounded-lg border border-stone-800 overflow-hidden">
                    <table className="w-full text-left text-xs text-stone-300">
                      <thead className="bg-stone-900/60 text-[10px] text-stone-400 uppercase">
                        <tr>
                          <th className="p-2.5">Name & Email</th>
                          <th className="p-2.5">Title</th>
                          <th className="p-2.5">Role</th>
                          <th className="p-2.5">Status</th>
                          <th className="p-2.5">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-800/60">
                        {orgDetail.users.map(u => (
                          <tr key={u.id} className="hover:bg-stone-900/30">
                            <td className="p-2.5">
                              <div className="font-semibold text-stone-100">{u.name}</div>
                              <div className="text-[11px] text-stone-400">{u.email}</div>
                            </td>
                            <td className="p-2.5 text-stone-400">{u.title || 'Staff'}</td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                u.role === 'admin' 
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800' 
                                  : 'bg-stone-800 text-stone-300'
                              }`}>
                                {u.role === 'admin' ? 'Organization Admin' : u.role}
                              </span>
                            </td>
                            <td className="p-2.5">
                              <span className={`text-[10px] font-semibold ${u.isActive ? 'text-emerald-400' : 'text-red-400'}`}>
                                {u.isActive ? 'Active' : 'Disabled'}
                              </span>
                            </td>
                            <td className="p-2.5 text-[11px] text-stone-400">
                              {new Date(u.createdAt).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Subscription Management Control */}
                <div className="bg-stone-950 p-4 rounded-xl border border-stone-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Subscription Management & Tier Upgrade</span>
                    </h3>
                    {orgDetail.subscription && (
                      <span className="text-[11px] text-stone-400">
                        Current: <strong className="text-emerald-400">{orgDetail.subscription.planName}</strong> ({orgDetail.subscription.status})
                      </span>
                    )}
                  </div>

                  {subSuccessMsg && (
                    <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>{subSuccessMsg}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Target Plan</label>
                      <select
                        value={selectedPlanId}
                        onChange={e => setSelectedPlanId(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      >
                        <option value="starter">Starter Exporter (UGX 250,000/mo)</option>
                        <option value="professional">Professional Exporter (UGX 600,000/mo)</option>
                        <option value="enterprise">Enterprise Union (UGX 1,800,000/mo)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] text-stone-400 block mb-1">Billing Cycle</label>
                      <select
                        value={billingCycle}
                        onChange={e => setBillingCycle(e.target.value as any)}
                        className="w-full bg-stone-900 border border-stone-800 rounded-lg p-2 text-xs text-stone-100 focus:outline-none focus:border-amber-400"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual (with annual billing discount)</option>
                      </select>
                    </div>

                    <div className="flex items-end">
                      <button
                        onClick={handleApplySubscriptionChange}
                        disabled={updatingSub}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold py-2 px-3 rounded-lg text-xs transition-colors disabled:opacity-50"
                      >
                        {updatingSub ? 'Updating Subscription...' : 'Apply Plan Change'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Recent Organization Activity Logs */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-stone-200 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                    <span>Recent Organization Activity Logs ({orgDetail.recentAuditLogs.length})</span>
                  </h3>
                  <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 max-h-40 overflow-y-auto space-y-1.5 text-xs">
                    {orgDetail.recentAuditLogs.length === 0 ? (
                      <p className="text-stone-400 text-xs">No recent actions recorded for this tenant.</p>
                    ) : (
                      orgDetail.recentAuditLogs.map(log => (
                        <div key={log.id} className="flex items-center justify-between text-[11px] border-b border-stone-800/40 pb-1">
                          <div>
                            <strong className="text-stone-200">{log.action}</strong>
                            <span className="text-stone-400 ml-1.5">by {log.userName} ({log.userRole})</span>
                          </div>
                          <span className="text-stone-400 font-mono">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            ) : null}

          </div>
        </div>
      )}

    </div>
  );
};
