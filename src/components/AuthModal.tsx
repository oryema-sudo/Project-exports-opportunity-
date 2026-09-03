import React, { useState } from 'react';
import { appStore } from '../services/store';
import { User, UserRole, OrganizationType } from '../types';
import { AstroKahawaLogo, AstroKahawaIcon } from './AstroKahawaLogo';
import { 
  LogIn, 
  UserPlus, 
  X, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Mail, 
  Building2, 
  User as UserIcon, 
  MapPin, 
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'signup' | 'about';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'about'>(initialMode);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginRole, setLoginRole] = useState<UserRole>('admin');
  
  // Signup form state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupOrgName, setSignupOrgName] = useState('');
  const [signupOrgType, setSignupOrgType] = useState<OrganizationType>('Exporter');
  const [signupDistrict, setSignupDistrict] = useState('Kampala');
  const [signupRole, setSignupRole] = useState<UserRole>('admin');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync mode when initialMode changes or modal opens
  React.useEffect(() => {
    setMode(initialMode);
    setError(null);
    setSuccessMsg(null);
  }, [initialMode, isOpen]);

  if (!isOpen) return null;

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setError('Please provide a valid email address.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = appStore.loginWithEmail(loginEmail.trim(), loginRole);
      setLoading(false);
      setSuccessMsg(`Welcome back, ${res.user.name}!`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 400);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Login failed. Please try again.');
    }
  };

  const handleQuickDemoLogin = (user: User) => {
    setLoading(true);
    setError(null);
    try {
      appStore.loginUser(user);
      setLoading(false);
      setSuccessMsg(`Logged in as ${user.name} (${user.role.toUpperCase()})`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 350);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Failed to switch demo user.');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    const res = await appStore.loginWithGoogle();
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Google authentication successful!');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 400);
    } else if (res.error && res.error !== 'Popup closed') {
      setError(res.error);
    }
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName.trim() || !signupEmail.trim() || !signupOrgName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!agreeTerms) {
      setError('Please accept the ASTROKAHAWA terms of service.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = appStore.registerAccount({
        name: signupName.trim(),
        email: signupEmail.trim(),
        organizationName: signupOrgName.trim(),
        orgType: signupOrgType,
        district: signupDistrict.trim(),
        role: signupRole
      });

      setLoading(false);
      setSuccessMsg(`Account created! Welcome to ASTROKAHAWA, ${res.user.name}.`);
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 400);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Registration failed.');
    }
  };

  const state = appStore.getState();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-stone-900 border border-stone-700 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden my-8 text-stone-100 flex flex-col">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-b from-stone-850 to-stone-900 border-b border-stone-800 flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <AstroKahawaLogo size="md" variant="dark" showTagline={true} />
            <div className="text-xs text-emerald-400 font-mono mt-1 font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Digital Traceability & Export-Readiness Platform</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg hover:bg-stone-800 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-stone-800 bg-stone-950/60 p-1.5 gap-1 text-xs font-semibold">
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            onClick={() => { setMode('signup'); setError(null); }}
            className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Create Account</span>
          </button>
          <button
            onClick={() => { setMode('about'); setError(null); }}
            className={`py-2 px-4 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'about'
                ? 'bg-stone-800 text-emerald-300 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-850'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>About Us</span>
          </button>
        </div>

        {/* Alert / Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-950/80 border border-red-800 rounded-lg text-xs text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-emerald-950/80 border border-emerald-800 rounded-lg text-xs text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          
          {/* TAB 1: LOGIN */}
          {mode === 'login' && (
            <div className="space-y-4">
              <form onSubmit={handleLoginSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="e.g. g.mbabazi@greatlakescoffee.ug"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-9 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Workspace Access Role
                  </label>
                  <select
                    value={loginRole}
                    onChange={(e) => setLoginRole(e.target.value as UserRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-3 py-2 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="admin">Administrator / Quality & Compliance Lead</option>
                    <option value="staff">Field Staff / Traceability Officer</option>
                    <option value="viewer">Auditor / Read-Only Inspection</option>
                  </select>
                </div>

                <div className="flex items-center justify-between text-xs text-stone-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="rounded border-stone-700 text-emerald-600 focus:ring-emerald-500 bg-stone-950" />
                    <span>Remember workspace session</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => {
                      setLoginEmail('g.mbabazi@greatlakescoffee.ug');
                      setLoginPassword('demo123');
                    }}
                    className="text-emerald-400 hover:text-emerald-300 underline"
                  >
                    Fill sample login
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                </button>
              </form>

              {/* Google Auth Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-stone-800 w-full"></div>
                <span className="bg-stone-900 px-3 text-[11px] font-mono uppercase text-stone-500">or</span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2 px-3 bg-stone-800 hover:bg-stone-750 border border-stone-700 text-stone-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Quick Persona Selector */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 font-mono flex items-center justify-between">
                  <span>1-Click Demo Personas</span>
                  <span className="text-emerald-400 text-[10px]">Instant Access</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {state.users.slice(0, 3).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleQuickDemoLogin(u)}
                      className="p-2 bg-stone-950 hover:bg-emerald-950/60 border border-stone-800 hover:border-emerald-700 rounded-lg text-left transition-colors text-[11px] group cursor-pointer"
                    >
                      <div className="font-bold text-stone-200 group-hover:text-emerald-300 truncate">
                        {u.name}
                      </div>
                      <div className="text-[10px] text-stone-400 capitalize truncate">
                        {u.role} • {u.title?.split('-')[0] || 'Exporter'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Switch to Signup */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>New to AstroKahawa?</span>
                <button
                  type="button"
                  onClick={() => { setMode('signup'); setError(null); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
                >
                  Create Account →
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SIGN UP */}
          {mode === 'signup' && (
            <form onSubmit={handleSignupSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Your Full Name *
                  </label>
                  <div className="relative">
                    <UserIcon className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="e.g. Mbabazi Grace"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Work Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="e.g. grace@elgoncoffee.ug"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Organization / Exporter Legal Name *
                </label>
                <div className="relative">
                  <Building2 className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={signupOrgName}
                    onChange={(e) => setSignupOrgName(e.target.value)}
                    placeholder="e.g. Mt. Elgon Coffee Growers Union Ltd"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Entity Type
                  </label>
                  <select
                    value={signupOrgType}
                    onChange={(e) => setSignupOrgType(e.target.value as OrganizationType)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-2 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Exporter">Exporter</option>
                    <option value="Cooperative">Cooperative</option>
                    <option value="Washing Station">Washing Station</option>
                    <option value="Processor">Processor</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    District
                  </label>
                  <div className="relative">
                    <MapPin className="w-3 h-3 text-stone-500 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      value={signupDistrict}
                      onChange={(e) => setSignupDistrict(e.target.value)}
                      placeholder="Kampala"
                      className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-7 pr-2.5 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">
                    Your Role
                  </label>
                  <select
                    value={signupRole}
                    onChange={(e) => setSignupRole(e.target.value as UserRole)}
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2.5 py-2 text-xs text-stone-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="admin">Admin / Director</option>
                    <option value="staff">Field Staff</option>
                    <option value="viewer">Auditor</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    placeholder="Create a secure password"
                    className="w-full bg-stone-950 border border-stone-700 rounded-lg pl-8 pr-3 py-2 text-xs text-stone-100 placeholder-stone-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-stone-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="mt-0.5 rounded border-stone-700 text-emerald-600 focus:ring-emerald-500 bg-stone-950"
                  />
                  <span>
                    I agree to the ASTROKAHAWA software terms of service and acknowledge the platform acts as a digital due-diligence data layer.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Creating Tenant Workspace...' : 'Create Account & Enter Platform'}</span>
              </button>

              {/* Switch to Login */}
              <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
                <span>Already registered?</span>
                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(null); }}
                  className="text-emerald-400 hover:text-emerald-300 font-semibold hover:underline cursor-pointer"
                >
                  Sign In to Workspace →
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: ABOUT US */}
          {mode === 'about' && (
            <div className="space-y-4 text-xs text-stone-300 leading-relaxed">
              <div className="p-3.5 bg-stone-950 rounded-xl border border-stone-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <AstroKahawaIcon size={22} showBackground={false} />
                  <span>ASTROKAHAWA Traceability Platform</span>
                </div>
                <p className="font-medium text-stone-200">
                  ASTROKAHAWA is a digital traceability and export-readiness platform for coffee exporters, connecting farm-level origin data, coffee lots, shipments, documentation and evidence in one system.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-bold text-stone-100 uppercase tracking-wider text-[11px] font-mono">
                  Core Architectural Capabilities
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-lg">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Origin & GPS Mapping</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Collect verified farm GPS points and multi-point perimeter polygons across Uganda coffee districts.
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-lg">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Lot Processing Traceability</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Trace intake deliveries to parchment and green coffee export lots with moisture and grade checks.
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-lg">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Export Readiness Engine</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Calculates comprehensive export readiness scores and flags geolocation discrepancies in real time.
                    </div>
                  </div>

                  <div className="p-2.5 bg-stone-950/80 border border-stone-800 rounded-lg">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5 mb-1">
                      <Info className="w-3.5 h-3.5" />
                      <span>Tamper-Evident Evidence</span>
                    </div>
                    <div className="text-[11px] text-stone-400">
                      Generates export due-diligence dossiers, farmer registry manifests, and GeoJSON polygon exports.
                    </div>
                  </div>
                </div>
              </div>

              {/* Regulatory Notice */}
              <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded-lg text-amber-200/90 text-[11px] space-y-1">
                <div className="font-bold uppercase tracking-wider text-[10px] text-amber-300 font-mono">
                  Regulatory & Statutory Notice
                </div>
                <div>
                  ASTROKAHAWA is an enterprise software operating layer for supply-chain due-diligence organization. It does NOT issue statutory government certifications or replace mandatory regulatory filings with TRACES NT or the Uganda Coffee Development Authority (UCDA).
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Get Started with ASTROKAHAWA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer info */}
        <div className="p-3 bg-stone-950 border-t border-stone-800 text-center text-[11px] text-stone-500">
          ASTROKAHAWA • From origin to export, with evidence.
        </div>

      </div>
    </div>
  );
};
