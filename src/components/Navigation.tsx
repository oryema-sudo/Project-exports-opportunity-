import React, { useState, useRef, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Layers, 
  Truck, 
  FileText, 
  History, 
  ShieldCheck, 
  UploadCloud, 
  Plus, 
  Search, 
  RefreshCw,
  Scale,
  Compass,
  AlertTriangle,
  FileSpreadsheet,
  Crown,
  LogOut,
  User as UserIcon,
  ChevronDown,
  LogIn
} from 'lucide-react';
import { AppState, appStore } from '../services/store';
import { UserRole } from '../types';

export type ActiveTab = 
  | 'dashboard' 
  | 'shipments' 
  | 'lots' 
  | 'deliveries' 
  | 'farmers' 
  | 'map' 
  | 'documents' 
  | 'audit'
  | 'owner';

interface NavigationProps {
  state: AppState;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onOpenBulkImport: () => void;
  onOpenNewFarmer: () => void;
  onOpenNewLot: () => void;
  onOpenNewShipment: () => void;
  onOpenOrgSettings: () => void;
  onSelectOrg: (orgId: string) => void;
  onRoleChange: (role: UserRole) => void;
  onResetData: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  state,
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  onOpenBulkImport,
  onOpenNewFarmer,
  onOpenNewLot,
  onOpenNewShipment,
  onOpenOrgSettings,
  onSelectOrg,
  onRoleChange,
  onResetData
}) => {
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // Close account menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setShowAccountMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Count active warnings and blockers
  const blockedShipments = state.shipments.filter(s => s.readinessStatus === 'RED').length;
  const reviewShipments = state.shipments.filter(s => s.readinessStatus === 'YELLOW').length;

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner: Regulatory Positioning & Disclaimer */}
      <div className="bg-emerald-950 text-emerald-300 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-emerald-900/60 font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="font-semibold text-emerald-200">UGANDA COFFEE TRACEABILITY OS</span>
          <span className="text-emerald-400/60">|</span>
          <span className="text-emerald-300/80">Export Readiness & Supply-Chain Due-Diligence System</span>
        </div>
        <div className="text-[11px] text-emerald-400/90 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Evidence Organizer & Readiness Engine (UCDA / Supply Chain Layer)</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Org Switcher */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-700 flex items-center justify-center text-white font-black text-lg shadow-inner group-hover:bg-emerald-600 transition-colors">
                ☕
              </div>
              <div className="hidden sm:block">
                <div className="font-bold text-stone-100 tracking-tight text-base leading-tight">
                  KaziTrace <span className="text-emerald-400 font-semibold text-xs px-1.5 py-0.5 bg-emerald-900/80 rounded border border-emerald-700/50">Uganda</span>
                </div>
                <div className="text-[11px] text-stone-400 font-medium">Export Due-Diligence OS</div>
              </div>
            </button>

            {/* Tenant Selector */}
            <div className="relative pl-3 border-l border-stone-700">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-0.5">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Workspace</span>
              </div>
              <select
                value={state.activeOrgId}
                onChange={(e) => onSelectOrg(e.target.value)}
                className="bg-stone-800 border border-stone-700 text-stone-100 text-xs font-semibold rounded px-2.5 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer max-w-[200px] truncate"
              >
                {state.organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.legalName} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search */}
          <div className="hidden md:flex flex-1 max-w-xs relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer, lot, farm, shipment..."
              className="w-full bg-stone-800/90 text-stone-200 text-xs pl-9 pr-3 py-1.5 rounded-md border border-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-stone-500"
            />
          </div>

          {/* Actions & Role Switcher */}
          <div className="flex items-center gap-2.5">
            {/* Quick Action Button Group */}
            {state.currentUser.role !== 'viewer' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenBulkImport}
                  className="bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white text-xs font-medium px-2.5 py-1.5 rounded border border-stone-700 flex items-center gap-1.5 transition-colors"
                  title="Bulk CSV Import for Farmers & Plots"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden lg:inline">Bulk Import</span>
                </button>

                <button
                  onClick={onOpenNewShipment}
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">New Consignment</span>
                </button>
              </div>
            )}

            {/* Cloud Database & Auth Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800/90 border border-stone-700 text-xs">
              <div className={`w-2 h-2 rounded-full ${state.serverConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-[11px] text-stone-300 font-mono">
                {state.serverConnected ? 'PostgreSQL Active' : 'Connecting DB...'}
              </span>
            </div>

            {/* Google Sign In / User Profile Dropdown */}
            <div className="relative" ref={accountMenuRef}>
              {state.currentUser && state.currentUser.email && state.currentUser.email.includes('@') ? (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowAccountMenu(!showAccountMenu)}
                    className="flex items-center gap-2 px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded border border-stone-700 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                    title="View Account Details & Security"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {state.currentUser.name ? state.currentUser.name.charAt(0) : 'U'}
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <div className="text-xs font-semibold text-stone-200">{state.currentUser.name}</div>
                    </div>
                    <ChevronDown className="w-3 h-3 text-stone-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {showAccountMenu && (
                    <div className="absolute right-0 top-full mt-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="px-3 py-2 border-b border-stone-800">
                        <div className="text-xs font-bold text-stone-100">{state.currentUser.name}</div>
                        <div className="text-[11px] text-stone-400 font-mono truncate">{state.currentUser.email}</div>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-emerald-950 text-emerald-300 border border-emerald-800">
                            Org {state.currentUser.role}
                          </span>
                          {(state.currentUser.isPlatformOwner || state.currentUser.platformRole === 'PLATFORM_OWNER') && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Platform CEO
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={async () => {
                            setShowAccountMenu(false);
                            await appStore.loginWithGoogle();
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Switch Google Account</span>
                        </button>

                        <button
                          onClick={async () => {
                            setShowAccountMenu(false);
                            await appStore.logout();
                            if (activeTab === 'owner') {
                              setActiveTab('dashboard');
                            }
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-red-300 hover:text-red-200 hover:bg-red-950/40 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5 text-red-400" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => appStore.loginWithGoogle()}
                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>

            {/* Role Switcher Pill (for testing Admin vs Staff vs Viewer permissions) */}
            <div className="bg-stone-800 border border-stone-700 rounded px-2 py-1 flex items-center gap-1.5 text-xs">
              <span className="text-[10px] text-stone-400 font-bold uppercase">Role:</span>
              <select
                value={state.currentUser.role}
                onChange={(e) => onRoleChange(e.target.value as UserRole)}
                className="bg-transparent text-emerald-300 font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="admin" className="bg-stone-800 text-white">Admin</option>
                <option value="staff" className="bg-stone-800 text-white">Staff</option>
                <option value="viewer" className="bg-stone-800 text-white">Viewer</option>
              </select>
            </div>

            {/* Org Settings / Reset */}
            <button
              onClick={onOpenOrgSettings}
              className="p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors"
              title="Organization Profile & Settings"
            >
              <Building2 className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              className="p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors"
              title="Reset to Verified Uganda Seed Dataset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-stone-950 border-t border-stone-800 px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex space-x-1 py-1">
          
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'dashboard'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            Dashboard
          </button>

          <button
            onClick={() => setActiveTab('shipments')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors relative ${
              activeTab === 'shipments'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Shipments & Export Readiness</span>
            {(blockedShipments > 0 || reviewShipments > 0) && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                {blockedShipments + reviewShipments}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('lots')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'lots'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400" />
            <span>Lots & Traceability</span>
          </button>

          <button
            onClick={() => setActiveTab('deliveries')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'deliveries'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Purchases & Intake</span>
          </button>

          <button
            onClick={() => setActiveTab('farmers')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'farmers'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Farmers Directory</span>
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'map'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Farm GPS & Map</span>
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'documents'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>Document Evidence</span>
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'audit'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit Trail</span>
          </button>

          {/* CEO & Platform Owner Governance Tab (Exclusive to PLATFORM_OWNER) */}
          {(state.currentUser.isPlatformOwner || state.currentUser.platformRole === 'PLATFORM_OWNER') && (
            <button
              onClick={() => setActiveTab('owner')}
              className={`px-3 py-1.5 rounded text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                activeTab === 'owner'
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-stone-800/80 text-amber-300 border-amber-500/30 hover:bg-stone-800 hover:border-amber-400/60'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${activeTab === 'owner' ? 'text-stone-950' : 'text-amber-400'}`} />
              <span>CEO Platform Governance</span>
              <span className={`px-1.5 py-0.2 text-[9px] font-black uppercase rounded ${
                activeTab === 'owner' ? 'bg-stone-950 text-amber-400' : 'bg-amber-500/20 text-amber-300'
              }`}>
                Owner
              </span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
