import React, { useState } from 'react';
import { Organization } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  Building2, 
  Users, 
  CreditCard, 
  Check, 
  X, 
  ShieldCheck,
  Mail,
  Phone,
  MapPin
} from 'lucide-react';

interface OrganizationModalProps {
  onClose: () => void;
}

export const OrganizationModal: React.FC<OrganizationModalProps> = ({
  onClose
}) => {
  const state = appStore.getState();
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];

  const [legalName, setLegalName] = useState<string>(activeOrg.legalName);
  const [address, setAddress] = useState<string>(activeOrg.address);
  const [district, setDistrict] = useState<string>(activeOrg.district);
  const [contactEmail, setContactEmail] = useState<string>(activeOrg.email || activeOrg.contactEmail || '');
  const [contactPhone, setContactPhone] = useState<string>(activeOrg.contactPhone);
  const [selectedPlan, setSelectedPlan] = useState<Organization['subscriptionPlan']>(activeOrg.subscriptionPlan);

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
      <div className="bg-white rounded-lg max-w-xl w-full p-6 border border-stone-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="font-bold text-base text-stone-900">Organization Profile & SaaS Workspace</h2>
              <p className="text-[11px] text-stone-500">Multi-tenant settings, staff licenses, and compliance subscription</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-700 text-xl font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div className="bg-stone-50 p-3 rounded border border-stone-200 grid grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Tenant Identifier</span>
              <div className="font-bold text-stone-900 font-mono text-xs">{activeOrg.id}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Registration Number</span>
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

      </div>
    </div>
  );
};
