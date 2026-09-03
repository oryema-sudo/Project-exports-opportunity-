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
  LogIn,
  UserPlus,
  Menu,
  X,
  SlidersHorizontal,
  Home,
  Info
} from 'lucide-react';
import { AppState, appStore } from '../services/store';
import { UserRole } from '../types';
import { AstroKahawaLogo, AstroKahawaIcon } from './AstroKahawaLogo';

export type ActiveTab = 
  | 'home'
  | 'login'
  | 'signup'
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
  onOpenAuth?: (mode?: 'login' | 'signup' | 'about') => void;
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
  onResetData,
  onOpenAuth
}) => {
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];
  const [showAccountMenu, setShowAccountMenu] = useState<boolean>(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [showDevControls, setShowDevControls] = useState<boolean>(false);
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

  // Close mobile menu on tab change
  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Count active warnings and blockers
  const blockedShipments = state.shipments.filter(s => s.readinessStatus === 'RED').length;
  const reviewShipments = state.shipments.filter(s => s.readinessStatus === 'YELLOW').length;

  return (
    <header className="bg-stone-900 text-stone-100 border-b border-stone-800 sticky top-0 z-30 shadow-md">
      {/* Top Banner: Regulatory Positioning & Disclaimer */}
      <div className="bg-emerald-950 text-emerald-300 text-[11px] sm:text-xs px-3 sm:px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-emerald-900/60 font-mono gap-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
          <span className="font-semibold text-emerald-200">ASTROKAHAWA TRACEABILITY OS</span>
          <span className="hidden sm:inline text-emerald-400/60">|</span>
          <span className="hidden sm:inline text-emerald-300/80">From origin to export, with evidence.</span>
        </div>
        <div className="text-[10px] sm:text-[11px] text-emerald-400/90 flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate max-w-[220px] sm:max-w-none">UCDA & Due-Diligence Evidence Layer</span>
        </div>
      </div>

      {/* Main Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          
          {/* Logo & Org Switcher */}
          <div className="flex items-center gap-2.5 sm:gap-4 shrink-0">
            <button 
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg p-0.5"
              aria-label="ASTROKAHAWA Dashboard"
            >
              {/* Desktop / Tablet Logo */}
              <div className="hidden sm:block">
                <AstroKahawaLogo size="md" variant="dark" showTagline={true} />
              </div>
              {/* Compact Mobile Logo (<= 640px) */}
              <div className="block sm:hidden">
                <AstroKahawaLogo size="sm" variant="dark" showTagline={false} />
              </div>
            </button>

            {/* Tenant Selector (Desktop) */}
            <div className="hidden md:block relative pl-3 border-l border-stone-700">
              <div className="flex items-center gap-1.5 text-xs text-stone-400 mb-0.5">
                <Building2 className="w-3 h-3 text-emerald-400" />
                <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400">Workspace</span>
              </div>
              <select
                value={state.activeOrgId}
                onChange={(e) => onSelectOrg(e.target.value)}
                className="bg-stone-800 border border-stone-700 text-stone-100 text-xs font-semibold rounded px-2 py-1 focus:ring-1 focus:ring-emerald-500 focus:outline-none cursor-pointer max-w-[170px] lg:max-w-[220px] truncate"
              >
                {state.organizations.map(org => (
                  <option key={org.id} value={org.id}>
                    {org.legalName} ({org.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Search (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-xs lg:max-w-sm relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer, lot, farm, shipment..."
              className="w-full bg-stone-800/90 text-stone-200 text-xs pl-9 pr-3 py-1.5 rounded-md border border-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-stone-500"
            />
          </div>

          {/* Actions & Controls (Desktop & Mobile trigger) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Quick Action Button Group (Desktop) */}
            {state.currentUser.role !== 'viewer' && (
              <div className="hidden sm:flex items-center gap-1.5">
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
                  className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold px-2.5 sm:px-3 py-1.5 rounded shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">New Consignment</span>
                </button>
              </div>
            )}

            {/* Cloud Database Status */}
            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-stone-800/90 border border-stone-700 text-xs">
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
                    className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded border border-stone-700 text-xs font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer min-h-[36px]"
                    title="View Account Details & Security"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                      {state.currentUser.name ? state.currentUser.name.charAt(0) : 'U'}
                    </div>
                    <div className="hidden lg:block text-left leading-tight">
                      <div className="text-xs font-semibold text-stone-200 truncate max-w-[120px]">{state.currentUser.name}</div>
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
                          onClick={() => {
                            setShowAccountMenu(false);
                            onOpenAuth?.('login');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Switch Account / Sign In</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onOpenAuth?.('signup');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Create New Workspace</span>
                        </button>

                        <button
                          onClick={() => {
                            setShowAccountMenu(false);
                            onOpenAuth?.('about');
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-stone-300 hover:text-white hover:bg-stone-800 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <Info className="w-3.5 h-3.5 text-emerald-400" />
                          <span>About ASTROKAHAWA</span>
                        </button>

                        <div className="border-t border-stone-800 my-1"></div>

                        <button
                          onClick={async () => {
                            setShowAccountMenu(false);
                            await appStore.logout();
                            setActiveTab('home');
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
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => onOpenAuth ? onOpenAuth('login') : appStore.loginWithGoogle()}
                    className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 hover:text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors border border-stone-700 cursor-pointer min-h-[36px]"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => onOpenAuth ? onOpenAuth('signup') : appStore.loginWithGoogle()}
                    className="hidden sm:flex px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold items-center gap-1.5 transition-colors shadow-sm cursor-pointer min-h-[36px]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Role Switcher Pill (Desktop) */}
            <div className="hidden lg:flex bg-stone-800 border border-stone-700 rounded px-2 py-1 items-center gap-1.5 text-xs">
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

            {/* Org Settings / Reset (Desktop) */}
            <button
              onClick={onOpenOrgSettings}
              className="hidden sm:inline-flex p-1.5 text-stone-400 hover:text-stone-200 hover:bg-stone-800 rounded transition-colors min-h-[36px] min-w-[36px] items-center justify-center"
              title="Organization Profile & Settings"
            >
              <Building2 className="w-4 h-4" />
            </button>

            <button
              onClick={onResetData}
              className="hidden lg:inline-flex p-1.5 text-stone-400 hover:text-amber-300 hover:bg-stone-800 rounded transition-colors min-h-[36px] min-w-[36px] items-center justify-center"
              title="Reset to Verified Uganda Seed Dataset"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            {/* Mobile Hamburger Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer / Dropdown Panel */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-stone-900 border-b border-stone-800 px-4 py-4 space-y-4 shadow-2xl animate-in slide-in-from-top-2 duration-150">
          
          {/* Mobile Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search farmer, lot, farm, shipment..."
              className="w-full bg-stone-800 text-stone-100 text-xs pl-9 pr-3 py-2 rounded-md border border-stone-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder-stone-500"
            />
          </div>

          {/* Mobile Workspace Selector & Org Settings */}
          <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-stone-400 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                Active Workspace
              </span>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenOrgSettings();
                }}
                className="text-xs text-emerald-400 font-semibold hover:underline flex items-center gap-1"
              >
                Settings & Team
              </button>
            </div>
            <select
              value={state.activeOrgId}
              onChange={(e) => onSelectOrg(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 text-stone-100 text-xs font-semibold rounded px-2.5 py-2 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            >
              {state.organizations.map(org => (
                <option key={org.id} value={org.id}>
                  {org.legalName} ({org.type})
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Auth / Account Access */}
          <div className="bg-stone-800/80 p-3 rounded-lg border border-stone-700/80 space-y-2">
            {state.currentUser && state.currentUser.email && state.currentUser.email.includes('@') ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{state.currentUser.name}</div>
                  <div className="text-[11px] text-stone-400 font-mono truncate max-w-[180px]">{state.currentUser.email}</div>
                </div>
                <button
                  onClick={async () => {
                    setMobileMenuOpen(false);
                    await appStore.logout();
                    setActiveTab('home');
                  }}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-300 bg-red-950/60 border border-red-800/60 rounded flex items-center gap-1.5 hover:bg-red-900/60"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <div>
                <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-2">
                  Account Access
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth?.('login');
                    }}
                    className="py-2 px-3 bg-stone-900 hover:bg-stone-750 border border-stone-700 text-stone-200 rounded text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Sign In</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onOpenAuth?.('signup');
                    }}
                    className="py-2 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Create Account</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions on Mobile */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenNewShipment();
              }}
              className="bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold py-2.5 px-3 rounded flex items-center justify-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Consignment</span>
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenBulkImport();
              }}
              className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold py-2.5 px-3 rounded border border-stone-700 flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Bulk CSV Import</span>
            </button>
          </div>

          {/* Developer & Role Switcher Collapsible */}
          <div className="border-t border-stone-800 pt-3">
            <button
              onClick={() => setShowDevControls(!showDevControls)}
              className="w-full flex items-center justify-between text-xs text-stone-400 hover:text-stone-200 py-1"
            >
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider">
                <SlidersHorizontal className="w-3.5 h-3.5 text-stone-400" />
                Testing & Role Permissions
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDevControls ? 'rotate-180' : ''}`} />
            </button>

            {showDevControls && (
              <div className="mt-2 p-3 bg-stone-950 rounded border border-stone-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-semibold">Simulate User Role:</span>
                  <select
                    value={state.currentUser.role}
                    onChange={(e) => onRoleChange(e.target.value as UserRole)}
                    className="bg-stone-800 text-emerald-300 font-bold text-xs border border-stone-700 rounded px-2 py-1 focus:outline-none"
                  >
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-stone-800 text-xs">
                  <span className="text-stone-400 font-medium">Database Seed State:</span>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onResetData();
                    }}
                    className="text-amber-400 hover:text-amber-300 font-semibold text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> Reset Data
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-stone-950 border-t border-stone-800 px-2 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-1.5 py-1.5">
          
          <button
            onClick={() => handleSelectTab('home')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'home'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Home className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleSelectTab('dashboard')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'dashboard'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => handleSelectTab('shipments')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors relative min-h-[38px] ${
              activeTab === 'shipments'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Shipments & Readiness</span>
            {(blockedShipments > 0 || reviewShipments > 0) && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-stone-950">
                {blockedShipments + reviewShipments}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectTab('lots')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'lots'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Lots & Traceability</span>
          </button>

          <button
            onClick={() => handleSelectTab('deliveries')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'deliveries'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Purchases & Intake</span>
          </button>

          <button
            onClick={() => handleSelectTab('farmers')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'farmers'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Farmers Directory</span>
          </button>

          <button
            onClick={() => handleSelectTab('map')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'map'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Farm GPS & Map</span>
          </button>

          <button
            onClick={() => handleSelectTab('documents')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'documents'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Document Evidence</span>
          </button>

          <button
            onClick={() => handleSelectTab('audit')}
            className={`px-3 py-2 rounded-md text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-colors min-h-[38px] ${
              activeTab === 'audit'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-300 hover:bg-stone-800 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Audit Trail</span>
          </button>

          {/* CEO & Platform Owner Governance Tab (Exclusive to PLATFORM_OWNER) */}
          {(state.currentUser.isPlatformOwner || state.currentUser.platformRole === 'PLATFORM_OWNER') && (
            <button
              onClick={() => handleSelectTab('owner')}
              className={`px-3 py-2 rounded-md text-xs font-bold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap transition-all border min-h-[38px] ${
                activeTab === 'owner'
                  ? 'bg-amber-500 text-stone-950 border-amber-400 shadow-md ring-2 ring-amber-400/40'
                  : 'bg-stone-800/80 text-amber-300 border-amber-500/30 hover:bg-stone-800 hover:border-amber-400/60'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${activeTab === 'owner' ? 'text-stone-950' : 'text-amber-400'} shrink-0`} />
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

