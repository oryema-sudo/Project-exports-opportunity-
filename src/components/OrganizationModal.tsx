import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { appStore } from '../services/store';
import { api } from '../services/api';
import { AstroKahawaIcon, AstroKahawaLogo } from './AstroKahawaLogo';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Check, 
  X, 
  ShieldCheck,
  Mail,
  UserPlus,
  Trash2,
  Copy,
  AlertTriangle,
  FileText,
  Smartphone,
  CheckCircle2,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';

interface OrganizationModalProps {
  onClose: () => void;
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  onClose
}) => {
  const state = appStore.getState();
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];

  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'billing' | 'regulatory'>('profile');

  // Org form state
  const [legalName, setLegalName] = useState<string>(activeOrg.legalName);
  const [address, setAddress] = useState<string>(activeOrg.address);
  const [district, setDistrict] = useState<string>(activeOrg.district);
  const [contactEmail, setContactEmail] = useState<string>(activeOrg.email || activeOrg.contactEmail || '');
  const [contactPhone, setContactPhone] = useState<string>(activeOrg.contactPhone);
  const [selectedPlan, setSelectedPlan] = useState<Organization['subscriptionPlan']>(activeOrg.subscriptionPlan);

  // Team & Invitation state
  const [teamMembers, setTeamMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'staff' | 'viewer'>('staff');
  const [generatedInviteLink, setGeneratedInviteLink] = useState<string | null>(null);
  const [loadingTeam, setLoadingTeam] = useState<boolean>(false);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Billing & Subscriptions state
  const [subData, setSubData] = useState<any>(null);
  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState<boolean>(false);
  const [billingError, setBillingError] = useState<string | null>(null);

  // Payment Checkout Form
  const [selectedCheckoutPlan, setSelectedCheckoutPlan] = useState<'starter' | 'professional' | 'enterprise'>('professional');
  const [checkoutCycle, setCheckoutCycle] = useState<'monthly' | 'annual'>('monthly');
  const [checkoutMethod, setCheckoutMethod] = useState<'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD'>('MTN_MOMO');
  const [momoPhone, setMomoPhone] = useState<string>(activeOrg.contactPhone || '0772123456');
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);
  const [activePaymentPrompt, setActivePaymentPrompt] = useState<any>(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'team') {
      loadTeamAndInvites();
    } else if (activeTab === 'billing') {
      loadBillingData();
    }
  }, [activeTab]);

  const loadTeamAndInvites = async () => {
    setLoadingTeam(true);
    setTeamError(null);
    try {
      const [members, invites] = await Promise.all([
        api.getTeamMembers().catch(() => []),
        api.getInvitations().catch(() => [])
      ]);
      setTeamMembers(members);
      setInvitations(invites);
    } catch (err: any) {
      setTeamError(err.message || 'Failed to load team members');
    } finally {
      setLoadingTeam(false);
    }
  };

  const loadBillingData = async () => {
    setLoadingBilling(true);
    setBillingError(null);
    try {
      const [subscriptionRes, paymentsRes] = await Promise.all([
        api.getSubscription().catch(() => null),
        api.getPayments().catch(() => [])
      ]);
      setSubData(subscriptionRes);
      setPaymentHistory(paymentsRes);
    } catch (err: any) {
      setBillingError(err.message || 'Failed to load billing status');
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleInitiatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    setBillingError(null);
    setPaymentSuccessMsg(null);
    try {
      const idempotencyKey = `pay-${activeOrg.id}-${Date.now()}`;
      const result = await api.initiatePayment({
        planId: selectedCheckoutPlan,
        billingCycle: checkoutCycle,
        paymentMethod: checkoutMethod,
        phoneNumber: momoPhone,
        payerEmail: contactEmail,
        idempotencyKey
      });

      setActivePaymentPrompt(result);
    } catch (err: any) {
      setBillingError(err.message || 'Payment initiation failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!activePaymentPrompt) return;
    setIsProcessingPayment(true);
    try {
      const verifyRes = await api.verifyPayment(activePaymentPrompt.paymentId);
      setPaymentSuccessMsg(verifyRes.message || 'Payment verified and plan activated successfully!');
      setActivePaymentPrompt(null);
      await loadBillingData();
    } catch (err: any) {
      setBillingError(err.message || 'Failed to verify transaction confirmation');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCreateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    setTeamError(null);
    try {
      const result = await api.createInvitation({
        email: inviteEmail,
        role: inviteRole
      });
      setGeneratedInviteLink(result.inviteLink);
      setInviteEmail('');
      loadTeamAndInvites();
    } catch (err: any) {
      setTeamError(err.message || 'Failed to generate invitation');
    }
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await api.revokeInvitation(id);
      loadTeamAndInvites();
    } catch (err: any) {
      alert(err.message || 'Failed to revoke invitation');
    }
  };

  const handleCopyLink = () => {
    if (generatedInviteLink) {
      navigator.clipboard.writeText(generatedInviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    appStore.updateOrganization({
      ...activeOrg,
      legalName,
      address,
      district,
      email: contactEmail,
      contactEmail,
      contactPhone,
      subscriptionPlan: selectedPlan
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full p-6 border border-stone-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="font-bold text-base text-stone-900">Organization Settings & Commercial Hub</h2>
              <p className="text-[11px] text-stone-500">Tenant identifier: <span className="font-mono font-bold text-stone-800">{activeOrg.id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-stone-200 pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'profile' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Organization Profile
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'team' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Staff & Invitations
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'billing' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Subscription & MoMo Billing
          </button>
          <button
            onClick={() => setActiveTab('regulatory')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'regulatory' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Regulatory Positioning
          </button>
        </div>

        {/* Tab 1: Profile */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-stone-50 p-3 rounded border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Tenant ID</span>
                <div className="font-bold text-stone-900 font-mono text-xs">{activeOrg.id}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 uppercase font-semibold">Registration / UCDA No.</span>
                <div className="font-bold text-stone-900 font-mono text-xs">{activeOrg.registrationNumber}</div>
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-semibold mb-1">Legal Company / Cooperative Name</label>
              <input
                type="text"
                required
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Headquarters District</label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Office Physical Address</label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Contact Email</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Contact Phone</label>
                <input
                  type="text"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
              >
                Save Organization Settings
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Team & Invitations */}
        {activeTab === 'team' && (
          <div className="space-y-4">
            {teamError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded border border-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{teamError}</span>
              </div>
            )}

            {/* Invite New Team Member Form */}
            <div className="bg-stone-50 p-3 rounded border border-stone-200 space-y-2">
              <div className="font-bold text-stone-900 flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-700" />
                Invite Colleague or Field Officer
              </div>
              <p className="text-[11px] text-stone-500">
                Generate a secure, single-use onboarding token for staff or auditors to join this organization.
              </p>

              <form onSubmit={handleCreateInvite} className="flex flex-col sm:flex-row gap-2 pt-1">
                <input
                  type="email"
                  required
                  placeholder="colleague@ugandacoffee.org"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="bg-white border border-stone-300 rounded px-2 py-1.5 text-xs font-semibold"
                >
                  <option value="staff">Staff / Field Officer</option>
                  <option value="viewer">Auditor / Viewer</option>
                  <option value="admin">Administrator</option>
                </select>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors shrink-0"
                >
                  Create Invite
                </button>
              </form>

              {generatedInviteLink && (
                <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded space-y-1">
                  <div className="text-[11px] font-bold text-emerald-900 flex items-center justify-between">
                    <span>Invitation Token Generated:</span>
                    <button
                      onClick={handleCopyLink}
                      className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white px-2 py-0.5 rounded font-bold flex items-center gap-1"
                    >
                      {copiedLink ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedLink ? 'Copied!' : 'Copy Link'}
                    </button>
                  </div>
                  <div className="font-mono text-[10px] text-emerald-800 break-all bg-white/80 p-1.5 rounded border border-emerald-100">
                    {generatedInviteLink}
                  </div>
                </div>
              )}
            </div>

              {/* Active Team Members */}
              <div className="space-y-2">
                <h3 className="font-bold text-stone-900">Current Organization Members</h3>
                <div className="border border-stone-200 rounded overflow-x-auto">
                  <table className="w-full text-left min-w-[340px]">
                    <thead className="bg-stone-100 text-stone-600 border-b border-stone-200 text-[10px] uppercase font-bold">
                      <tr>
                        <th className="p-2">Name</th>
                        <th className="p-2">Email</th>
                        <th className="p-2">Role</th>
                        <th className="p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {teamMembers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="p-3 text-stone-400 text-center">
                            {loadingTeam ? 'Loading members...' : 'Primary Administrator'}
                          </td>
                        </tr>
                      ) : (
                        teamMembers.map((m) => (
                          <tr key={m.id} className="hover:bg-stone-50">
                            <td className="p-2 font-bold text-stone-900">{m.name}</td>
                            <td className="p-2 font-mono text-stone-600">{m.email}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                m.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                m.role === 'staff' ? 'bg-blue-100 text-blue-800' : 'bg-stone-100 text-stone-700'
                              }`}>
                                {m.role.toUpperCase()}
                              </span>
                            </td>
                            <td className="p-2">
                              <span className="text-emerald-700 font-bold">Active</span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pending Invitations */}
              {invitations.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-bold text-stone-900">Pending Invitations</h3>
                  <div className="border border-stone-200 rounded overflow-x-auto">
                    <table className="w-full text-left min-w-[340px]">
                      <thead className="bg-stone-100 text-stone-600 border-b border-stone-200 text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Invited Email</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {invitations.map((inv) => (
                          <tr key={inv.id} className="hover:bg-stone-50">
                            <td className="p-2 font-mono text-stone-800">{inv.email}</td>
                            <td className="p-2 uppercase font-semibold text-stone-600">{inv.role}</td>
                            <td className="p-2">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                inv.status === 'pending' ? 'bg-amber-100 text-amber-800' :
                                inv.status === 'accepted' ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              {inv.status === 'pending' && (
                                <button
                                  onClick={() => handleRevokeInvite(inv.id)}
                                  className="text-red-600 hover:text-red-800 font-bold text-[10px] p-1"
                                  title="Revoke Invitation"
                                >
                                  <Trash2 className="w-3.5 h-3.5 inline" /> Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        )}

        {/* Tab 3: Commercial Billing & MoMo Payments */}
        {activeTab === 'billing' && (
          <div className="space-y-4">
            {billingError && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded border border-red-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{billingError}</span>
              </div>
            )}

            {paymentSuccessMsg && (
              <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded border border-emerald-200 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-bold">{paymentSuccessMsg}</span>
              </div>
            )}

            {/* Current Tier & Quotas */}
            <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2.5">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-stone-500">Active Subscription</span>
                  <div className="text-sm font-black text-stone-900 flex items-center gap-2">
                    <span>{subData?.subscription?.planName || activeOrg.subscriptionPlan || 'Professional (Exporters)'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                      {subData?.subscription?.status || 'Active'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-500">Billing Period</span>
                  <div className="font-mono text-xs font-bold text-stone-800">
                    {subData?.subscription?.billingCycle === 'annual' ? 'Annual (15% Savings)' : 'Monthly'}
                  </div>
                </div>
              </div>

              {/* Usage Quota Progress Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-stone-600">Registered Farmers</span>
                    <span className="font-mono text-emerald-800">
                      {subData?.usage?.currentFarmers || state.farmers.length} / {subData?.usage?.maxFarmers || 5000}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((subData?.usage?.currentFarmers || state.farmers.length) / (subData?.usage?.maxFarmers || 5000)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-stone-600">Farm GPS Plots</span>
                    <span className="font-mono text-emerald-800">
                      {subData?.usage?.currentFarms || state.farms.length} / {subData?.usage?.maxFarms || 10000}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((subData?.usage?.currentFarms || state.farms.length) / (subData?.usage?.maxFarms || 10000)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="bg-white p-2.5 rounded border border-stone-200">
                  <div className="flex justify-between text-[11px] font-bold mb-1">
                    <span className="text-stone-600">Monthly Shipments</span>
                    <span className="font-mono text-emerald-800">
                      {subData?.usage?.currentShipments || state.shipments.length} / {subData?.usage?.maxShipments || 50}
                    </span>
                  </div>
                  <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((subData?.usage?.currentShipments || state.shipments.length) / (subData?.usage?.maxShipments || 50)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Money / Card Checkout Drawer */}
            <form onSubmit={handleInitiatePayment} className="border border-stone-200 rounded-lg p-4 bg-white space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="font-bold text-stone-900 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  <span>Upgrade or Renew with Mobile Money (Uganda)</span>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCheckoutCycle('monthly')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      checkoutCycle === 'monthly' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    type="button"
                    onClick={() => setCheckoutCycle('annual')}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      checkoutCycle === 'annual' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    Annual (Save 15%)
                  </button>
                </div>
              </div>

              {/* Plan Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div
                  onClick={() => setSelectedCheckoutPlan('starter')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCheckoutPlan === 'starter' ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/50' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900">Starter Plan</div>
                  <div className="text-emerald-800 font-mono font-bold text-xs mt-0.5">
                    {checkoutCycle === 'annual' ? 'UGX 2,550,000 / yr' : 'UGX 250,000 / mo'}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1">Up to 500 smallholders, 5 shipments/mo</div>
                </div>

                <div
                  onClick={() => setSelectedCheckoutPlan('professional')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCheckoutPlan === 'professional' ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/50' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900 flex items-center justify-between">
                    <span>Professional</span>
                    <span className="text-[9px] bg-emerald-700 text-white px-1.5 py-0.2 rounded font-bold">POPULAR</span>
                  </div>
                  <div className="text-emerald-800 font-mono font-bold text-xs mt-0.5">
                    {checkoutCycle === 'annual' ? 'UGX 6,120,000 / yr' : 'UGX 600,000 / mo'}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1">Up to 5,000 farmers, polygon mapping, 50 shipments</div>
                </div>

                <div
                  onClick={() => setSelectedCheckoutPlan('enterprise')}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedCheckoutPlan === 'enterprise' ? 'bg-emerald-50/80 border-emerald-600 ring-2 ring-emerald-600/50' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900">Enterprise</div>
                  <div className="text-emerald-800 font-mono font-bold text-xs mt-0.5">
                    {checkoutCycle === 'annual' ? 'UGX 18,360,000 / yr' : 'UGX 1,800,000 / mo'}
                  </div>
                  <div className="text-[10px] text-stone-600 mt-1">Unlimited farmers, dedicated API gateway, ERP sync</div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setCheckoutMethod('MTN_MOMO')}
                  className={`p-2 rounded border font-semibold text-left flex items-center gap-2 ${
                    checkoutMethod === 'MTN_MOMO' ? 'bg-amber-50 border-amber-500 text-amber-950 ring-1 ring-amber-500' : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                  <div>
                    <div className="font-bold">MTN Mobile Money</div>
                    <div className="text-[10px] text-stone-500">UG Dial *165# prompt</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod('AIRTEL_MONEY')}
                  className={`p-2 rounded border font-semibold text-left flex items-center gap-2 ${
                    checkoutMethod === 'AIRTEL_MONEY' ? 'bg-red-50 border-red-500 text-red-950 ring-1 ring-red-500' : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <span className="w-3 h-3 rounded-full bg-red-500"></span>
                  <div>
                    <div className="font-bold">Airtel Money</div>
                    <div className="text-[10px] text-stone-500">UG Dial *185# prompt</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMethod('CARD')}
                  className={`p-2 rounded border font-semibold text-left flex items-center gap-2 ${
                    checkoutMethod === 'CARD' ? 'bg-blue-50 border-blue-500 text-blue-950 ring-1 ring-blue-500' : 'bg-stone-50 border-stone-200 text-stone-700'
                  }`}
                >
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="font-bold">Visa / Mastercard</div>
                    <div className="text-[10px] text-stone-500">International Gateway</div>
                  </div>
                </button>
              </div>

              {/* Phone / Details Row */}
              <div className="flex flex-col sm:flex-row gap-2 pt-1 items-start sm:items-center">
                <div className="w-full sm:flex-1">
                  <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                    {checkoutMethod === 'CARD' ? 'Billing Contact Phone' : 'Uganda Mobile Money MSISDN (07X...)'}
                  </label>
                  <input
                    type="tel"
                    required
                    value={momoPhone}
                    onChange={(e) => setMomoPhone(e.target.value)}
                    placeholder="0772123456"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div className="pt-1 sm:pt-4 w-full sm:w-auto shrink-0">
                  <button
                    type="submit"
                    disabled={isProcessingPayment}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-bold rounded text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    {isProcessingPayment ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    <span>Initiate Payment</span>
                  </button>
                </div>
              </div>

              {/* Active Prompt Modal / Card */}
              {activePaymentPrompt && (
                <div className="p-3.5 bg-emerald-950 text-emerald-100 rounded-lg border border-emerald-800 space-y-2 mt-3 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-emerald-300 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4 text-amber-400 animate-pulse" />
                      Mobile Money Authorization Prompt Dispatched
                    </span>
                    <span className="font-mono text-xs font-bold text-amber-300">
                      UGX {activePaymentPrompt.amountUgx?.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-200 leading-normal">
                    {activePaymentPrompt.instructions}
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <div className="text-[10px] font-mono text-emerald-400">
                      Ref: {activePaymentPrompt.providerTransactionId}
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyPayment}
                      disabled={isProcessingPayment}
                      className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded text-xs transition-colors flex items-center gap-1"
                    >
                      {isProcessingPayment ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      <span>Confirm & Activate Plan</span>
                    </button>
                  </div>
                </div>
              )}
            </form>

            {/* Payment Receipts Ledger */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-stone-900">Commercial Invoices & Payment Ledger</h3>
                <button
                  type="button"
                  onClick={loadBillingData}
                  className="text-stone-500 hover:text-stone-800 text-[10px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>
              <div className="border border-stone-200 rounded overflow-x-auto">
                <table className="w-full text-left min-w-[420px]">
                  <thead className="bg-stone-100 text-stone-600 border-b border-stone-200 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="p-2">Date</th>
                      <th className="p-2">Description</th>
                      <th className="p-2">Method</th>
                      <th className="p-2">Amount</th>
                      <th className="p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {paymentHistory.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-3 text-stone-400 text-center">
                          {loadingBilling ? 'Loading payments...' : 'No external payment records yet. Initiate an upgrade above.'}
                        </td>
                      </tr>
                    ) : (
                      paymentHistory.map((p) => (
                        <tr key={p.id} className="hover:bg-stone-50">
                          <td className="p-2 font-mono text-stone-600">
                            {new Date(p.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-2 font-bold text-stone-900">{p.description}</td>
                          <td className="p-2 font-mono text-stone-600">{p.paymentMethod}</td>
                          <td className="p-2 font-mono font-bold text-stone-900">
                            UGX {Number(p.amountUgx).toLocaleString()}
                          </td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
                              p.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {p.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Regulatory Positioning & Disclaimer */}
        {activeTab === 'regulatory' && (
          <div className="space-y-3 p-4 bg-stone-50 border border-stone-200 rounded leading-relaxed text-stone-700">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <AstroKahawaIcon size={20} showBackground={false} />
              ASTROKAHAWA Commercial Positioning & Regulatory Statement
            </div>
            
            <p className="text-xs">
              <strong>Commercial Positioning:</strong> ASTROKAHAWA is a digital traceability and export-readiness platform for coffee exporters, connecting farm-level origin data, coffee lots, shipments, documentation and evidence in one system.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                Legal & Statutory Notice:
              </div>
              <p>
                ASTROKAHAWA is a <strong>software operating layer</strong> that collects, validates, and organizes
                supply-chain due diligence data. It <strong>does NOT</strong> issue statutory EUDR certification or replace mandatory
                regulatory filings with the European Commission (TRACES NT) or Uganda Coffee Development Authority (UCDA).
              </p>
            </div>

            <div className="space-y-1 text-[11px] text-stone-600">
              <div className="font-bold text-stone-800">Supported Authoritative Standards:</div>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>UCDA National Coffee Register & Smallholder Geolocation Protocol</li>
                <li>EU Regulation 2023/1115 (EUDR) Article 9 polygon & point geometry thresholds (plots &gt; 4.0 Ha require closed polygons)</li>
                <li>Post-December 31, 2020 Deforestation-Free Baselines</li>
                <li>Cryptographically hashed due diligence evidence packs and custody logs</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
