import React, { useState, useEffect } from 'react';
import { Organization } from '../types';
import { appStore } from '../services/store';
import { api } from '../services/api';
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
  FileText
} from 'lucide-react';

interface OrganizationModalProps {
  onClose: () => void;
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  onClose
}) => {
  const state = appStore.getState();
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];

  const [activeTab, setActiveTab] = useState<'profile' | 'team' | 'regulatory'>('profile');

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

  useEffect(() => {
    if (activeTab === 'team') {
      loadTeamAndInvites();
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
      <div className="bg-white rounded-lg max-w-2xl w-full p-6 border border-stone-200 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="font-bold text-base text-stone-900">Organization Settings & Multi-Tenant Workspace</h2>
              <p className="text-[11px] text-stone-500">Tenant identifier: <span className="font-mono font-bold text-stone-800">{activeOrg.id}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-stone-200 pb-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'profile' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Organization Profile
          </button>
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'team' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Staff & Invitations
          </button>
          <button
            onClick={() => setActiveTab('regulatory')}
            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-colors ${
              activeTab === 'regulatory' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Regulatory Positioning
          </button>
        </div>

        {/* Tab 1: Profile & Subscription */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="bg-stone-50 p-3 rounded border border-stone-200 grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

            <div className="grid grid-cols-2 gap-3">
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

            {/* SaaS Subscription Plans */}
            <div className="space-y-2 pt-2 border-t border-stone-100">
              <label className="block text-stone-700 font-bold uppercase tracking-wider text-[11px]">
                SaaS Subscription Tier
              </label>

              <div className="grid grid-cols-3 gap-2">
                <div
                  onClick={() => setSelectedPlan('Starter')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedPlan === 'Starter' ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900">Starter</div>
                  <div className="text-[10px] text-stone-500 font-mono">UGX 450,000 / mo</div>
                  <div className="text-[10px] text-stone-600 mt-1">Up to 500 smallholders</div>
                </div>

                <div
                  onClick={() => setSelectedPlan('Pro')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedPlan === 'Pro' ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900">Pro (Exporters)</div>
                  <div className="text-[10px] text-stone-500 font-mono">UGX 1,800,000 / mo</div>
                  <div className="text-[10px] text-stone-600 mt-1">Unlimited plots & polygons</div>
                </div>

                <div
                  onClick={() => setSelectedPlan('Enterprise')}
                  className={`p-3 rounded border cursor-pointer transition-all ${
                    selectedPlan === 'Enterprise' ? 'bg-emerald-50 border-emerald-600 ring-1 ring-emerald-600' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="font-bold text-stone-900">Enterprise</div>
                  <div className="text-[10px] text-stone-500 font-mono">Custom Contract</div>
                  <div className="text-[10px] text-stone-600 mt-1">Multi-mill ERP integration</div>
                </div>
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

              <form onSubmit={handleCreateInvite} className="flex gap-2 pt-1">
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
              <div className="border border-stone-200 rounded overflow-hidden">
                <table className="w-full text-left">
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
                <div className="border border-stone-200 rounded overflow-hidden">
                  <table className="w-full text-left">
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

        {/* Tab 3: Regulatory Positioning & Disclaimer */}
        {activeTab === 'regulatory' && (
          <div className="space-y-3 p-4 bg-stone-50 border border-stone-200 rounded leading-relaxed text-stone-700">
            <div className="flex items-center gap-2 text-stone-900 font-bold text-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              Statutory EUDR & Commercial Positioning Statement
            </div>
            
            <p className="text-xs">
              <strong>Commercial Positioning:</strong> This software is marketed and operated strictly as 
              <em> Coffee Traceability, Smallholder Due-Diligence Evidence Management, and Export-Readiness Software</em>.
            </p>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-900 text-xs space-y-1.5">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                Legal & Statutory Notice:
              </div>
              <p>
                Project Export Opportunity is a <strong>software operating layer</strong> that collects, validates, and organizes
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
