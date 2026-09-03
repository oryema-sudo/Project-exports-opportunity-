import React, { useState } from 'react';
import { appStore } from '../services/store';
import { OrganizationType } from '../types';
import { AstroKahawaLogo } from './AstroKahawaLogo';
import { 
  Lock, 
  Mail, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2,
  Building2,
  User as UserIcon,
  MapPin,
  Globe2,
  Layers,
  FileCheck,
  X
} from 'lucide-react';

interface SignUpPageProps {
  onSuccess: () => void;
  onNavigateToLogin: () => void;
  onClose?: () => void;
}

export const SignUpPage: React.FC<SignUpPageProps> = ({
  onSuccess,
  onNavigateToLogin,
  onClose
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [organizationName, setOrganizationName] = useState('');
  const [orgType, setOrgType] = useState<OrganizationType>('Exporter');
  const [district, setDistrict] = useState('Kampala');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !organizationName.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('Please acknowledge the terms of use to create an account.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await appStore.registerWithEmailAndPassword({
      name: name.trim(),
      email: email.trim(),
      password,
      organizationName: organizationName.trim(),
      orgType,
      district
    });

    setLoading(false);

    if (res.success) {
      setSuccessMsg(`Workspace created for ${organizationName.trim()}. Redirecting to dashboard...`);
      setTimeout(() => {
        onSuccess();
      }, 450);
    } else {
      setError(res.error || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[680px]">
        
        {/* LEFT PANEL: Restrained Enterprise B2B Brand Overview */}
        <div className="md:col-span-5 bg-stone-900 text-stone-100 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800">
          <div>
            <div className="flex items-center justify-between mb-8">
              <AstroKahawaLogo size="md" variant="dark" showTagline={false} />
              {onClose && (
                <button
                  onClick={onClose}
                  className="md:hidden text-stone-400 hover:text-white p-1 rounded-md"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400">
                  Enterprise Workspace Registration
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5">
                  Establish your digital chain of custody.
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
                  Join Uganda's leading coffee exporters and cooperatives in maintaining compliant, evidence-backed origin data.
                </p>
              </div>

              {/* What happens next explanation */}
              <div className="space-y-3.5 pt-4 border-t border-stone-800 text-xs text-stone-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <Globe2 className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">1. Register smallholder farmers</strong>
                    <span className="text-stone-400 text-[11px]">Upload CSVs or record farm coordinates and National Identification Numbers (NIN).</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <Layers className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">2. Log physical cherry deliveries</strong>
                    <span className="text-stone-400 text-[11px]">Maintain immutable receipts linking each harvest directly to origin plots.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <FileCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">3. Generate export dossiers</strong>
                    <span className="text-stone-400 text-[11px]">Produce verified EUDR and UCDA compliance packages for international buyers.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Multi-tenant enterprise data segregation with audit trails</span>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Enterprise Registration Form */}
        <div className="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-white overflow-y-auto max-h-[90vh] md:max-h-none">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Create your AstroKahawa workspace
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Set up your organization and begin managing your coffee records in one place.
                </p>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="hidden md:flex text-stone-400 hover:text-stone-700 p-1.5 rounded-lg hover:bg-stone-100 transition-colors"
                  aria-label="Close"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Your Full Name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Grace Namubiru"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Work Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="grace@ugandacoffee.ug"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-9 pr-8 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Organization Profile */}
              <div className="pt-2 border-t border-stone-200">
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                  Organization / Company Legal Name
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="e.g. Rwenzori Highlands Coffee Exporters Ltd"
                    className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Primary Operational Role
                  </label>
                  <select
                    value={orgType}
                    onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                    className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700"
                  >
                    <option value="Exporter">Licensed Coffee Exporter</option>
                    <option value="Cooperative">Farmer Cooperative Society</option>
                    <option value="Processor">Dry Mill / Processing Facility</option>
                    <option value="Washing Station">Wet Mill / Washing Station</option>
                    <option value="Estate Producer">Commercial Coffee Estate</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Operating District / Hub
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Kampala, Kasese, Mbale, Masaka"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-2 cursor-pointer select-none text-xs text-stone-600">
                  <input
                    type="checkbox"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700 mt-0.5 shrink-0"
                  />
                  <span>
                    I confirm that I am authorized to represent this organization and agree to maintain verified, audit-ready traceability records.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-300 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-6 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
            <span>Already have an enterprise account?</span>
            <button
              onClick={onNavigateToLogin}
              className="text-emerald-800 hover:text-emerald-900 font-bold hover:underline"
            >
              Log in →
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
