import React, { useState } from 'react';
import { appStore } from '../services/store';
import { AstroKahawaLogo, AstroKahawaIcon } from './AstroKahawaLogo';
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
  Layers,
  FileCheck,
  Globe2,
  X
} from 'lucide-react';

interface LoginPageProps {
  onSuccess: () => void;
  onNavigateToSignUp: () => void;
  onClose?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateToSignUp,
  onClose
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await appStore.loginWithEmailAndPassword(email, password);
    setLoading(false);

    if (res.success) {
      setSuccessMsg('Authentication successful. Redirecting to workspace...');
      setTimeout(() => {
        onSuccess();
      }, 350);
    } else {
      setError(res.error || 'Authentication failed. Please verify your email and password.');
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    const res = await appStore.loginWithGoogle();
    setLoading(false);
    if (res.success) {
      setSuccessMsg('Signed in with Google. Redirecting to workspace...');
      setTimeout(() => {
        onSuccess();
      }, 350);
    } else if (res.error && res.error !== 'Popup closed') {
      setError(res.error);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotStatus({ type: 'error', message: 'Please enter your account email address.' });
      return;
    }

    setForgotLoading(true);
    setForgotStatus(null);
    const res = await appStore.sendPasswordReset(forgotEmail.trim());
    setForgotLoading(false);

    if (res.success) {
      setForgotStatus({
        type: 'success',
        message: 'Password reset email sent. Please check your inbox for the link.'
      });
    } else {
      setForgotStatus({
        type: 'error',
        message: res.error || 'Failed to send password reset email.'
      });
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-xl shadow-lg border border-stone-200 overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
        
        {/* LEFT PANEL: Restrained Enterprise B2B Brand & Coffee Industry Overview */}
        <div className="md:col-span-5 bg-stone-900 text-stone-100 p-6 sm:p-8 lg:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-stone-800">
          <div>
            {/* Logo & Category */}
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
                  Coffee Supply Chain Operating System
                </span>
                <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight mt-1.5">
                  From origin to export, with evidence.
                </h1>
                <p className="text-xs sm:text-sm text-stone-400 mt-2 leading-relaxed">
                  A professional operating platform engineered for Ugandan coffee exporters, cooperatives, washing stations, and dry mills.
                </p>
              </div>

              {/* Operational Realities Checklist */}
              <div className="space-y-3.5 pt-4 border-t border-stone-800 text-xs text-stone-300">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <Globe2 className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Origin Mapping & GPS Polygons</strong>
                    <span className="text-stone-400 text-[11px]">Smallholder plot boundaries and cadastral land rights documentation.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <Layers className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Intake Deliveries & Lot Formation</strong>
                    <span className="text-stone-400 text-[11px]">Direct scale intake receipts, hulling batches, and moisture verification.</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded bg-emerald-950/80 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">
                    <FileCheck className="w-3 h-3" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Consignment Due Diligence</strong>
                    <span className="text-stone-400 text-[11px]">Instant UCDA and EUDR evidence packaging before container sealing.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Compliance Notice */}
          <div className="mt-8 pt-4 border-t border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Uganda Coffee Development Authority (UCDA) standard aligned</span>
          </div>
        </div>

        {/* RIGHT PANEL: Clean Enterprise Login Form */}
        <div className="md:col-span-7 p-6 sm:p-8 lg:p-12 flex flex-col justify-between bg-white">
          <div>
            {/* Top Bar with optional close or back link */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
                  Log in to your account
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Enter your credentials to access your coffee enterprise workspace.
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

            {/* Error & Success Messages */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800 flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{successMsg}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider mb-1.5">
                  Work Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@coffee-exporter.ug"
                    autoComplete="email"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-stone-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-700 uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setShowForgotModal(true);
                      setForgotStatus(null);
                    }}
                    className="text-xs text-emerald-800 hover:text-emerald-900 font-semibold hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    className="w-full pl-10 pr-10 py-2.5 bg-stone-50 border border-stone-300 rounded-lg text-stone-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:bg-white transition-all placeholder:text-stone-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-stone-300 text-emerald-800 focus:ring-emerald-700"
                  />
                  <span className="text-xs text-stone-600">Keep me signed in on this device</span>
                </label>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 px-4 bg-emerald-800 hover:bg-emerald-900 disabled:bg-stone-300 text-white font-semibold text-sm rounded-lg shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Optional Google SSO */}
            <div className="mt-5 pt-4 border-t border-stone-200">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full py-2 px-3 bg-white hover:bg-stone-50 border border-stone-300 rounded-lg text-stone-700 text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Continue with Google Workspace</span>
              </button>
            </div>
          </div>

          {/* Footer Link to Sign Up */}
          <div className="mt-8 pt-4 border-t border-stone-100 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-500 gap-2">
            <span>Don't have an enterprise account?</span>
            <button
              onClick={onNavigateToSignUp}
              className="text-emerald-800 hover:text-emerald-900 font-bold hover:underline"
            >
              Create an organization account →
            </button>
          </div>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-xl shadow-xl border border-stone-200 w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-stone-900">Reset Account Password</h3>
              <button
                onClick={() => setShowForgotModal(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Enter your work email address. We will send you an official password recovery link.
            </p>

            {forgotStatus && (
              <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${forgotStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {forgotStatus.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                <span>{forgotStatus.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="name@coffee-exporter.ug"
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold rounded-lg disabled:opacity-50"
                >
                  {forgotLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
