import React, { useState } from 'react';
import { AstroKahawaLogo, AstroKahawaIcon } from './AstroKahawaLogo';
import { AuthModal } from './AuthModal';
import { 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  Info, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  FileText, 
  Sparkles, 
  CheckCircle2, 
  Globe, 
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { appStore } from '../services/store';

interface HomePageProps {
  onEnterApp: () => void;
  onOpenAbout?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onEnterApp }) => {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'about'>('signup');
  const [showAboutSection, setShowAboutSection] = useState(false);

  const handleOpenAuth = (mode: 'login' | 'signup' | 'about') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleAuthSuccess = () => {
    onEnterApp();
  };

  const handleQuickDemoLaunch = () => {
    const state = appStore.getState();
    if (!state.currentUser || !state.currentUser.email) {
      // Pick first admin user
      const defaultAdmin = state.users[0];
      if (defaultAdmin) {
        appStore.loginUser(defaultAdmin);
      }
    }
    onEnterApp();
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col justify-between selection:bg-emerald-600 selection:text-white font-sans antialiased relative overflow-x-hidden">
      
      {/* Background Decorative Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-emerald-900/20 via-emerald-950/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Minimal Top Header */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between z-10 border-b border-stone-900/80">
        <div className="flex items-center gap-3">
          <AstroKahawaLogo size="md" variant="dark" showTagline={false} />
        </div>

        <nav className="flex items-center gap-2 sm:gap-4 text-xs font-semibold">
          <button
            onClick={() => {
              setShowAboutSection(true);
              const el = document.getElementById('about-us-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
              else handleOpenAuth('about');
            }}
            className="px-3 py-1.5 text-stone-300 hover:text-emerald-300 rounded-lg hover:bg-stone-900 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Info className="w-3.5 h-3.5 text-emerald-400" />
            <span>About Us</span>
          </button>

          <button
            onClick={() => handleOpenAuth('login')}
            className="px-3 py-1.5 text-stone-200 hover:text-white bg-stone-900 hover:bg-stone-850 border border-stone-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => handleOpenAuth('signup')}
            className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Get Started</span>
            <span className="sm:hidden">Sign Up</span>
          </button>
        </nav>
      </header>

      {/* Main Home / Landing Canvas */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center text-center py-12 sm:py-20 z-10">
        
        {/* Central Logo & Visual Badge */}
        <div className="mb-6 animate-in fade-in zoom-in-95 duration-500 flex flex-col items-center">
          <div className="p-4 sm:p-5 rounded-2xl bg-stone-900/90 border border-stone-800 shadow-2xl shadow-emerald-950/40 relative group">
            <AstroKahawaIcon size={64} showBackground={false} />
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-amber-500/20 blur opacity-40 group-hover:opacity-70 transition duration-500 -z-10" />
          </div>
        </div>

        {/* Platform Name */}
        <h1 className="text-4xl sm:text-6xl font-black text-stone-100 tracking-tight uppercase leading-none font-mono">
          ASTROKAHAWA
        </h1>

        {/* Tagline */}
        <p className="mt-3 sm:mt-4 text-base sm:text-xl font-medium text-emerald-400 tracking-wide">
          From origin to export, with evidence.
        </p>

        {/* Concise Description */}
        <p className="mt-4 max-w-2xl text-xs sm:text-sm text-stone-400 leading-relaxed">
          The digital traceability and export-readiness operating system for coffee exporters — seamlessly linking smallholder farm GPS coordinates, washing station intake lots, shipment consignments, and tamper-evident due-diligence dossiers.
        </p>

        {/* Primary Call-to-Action Group: Get Started Icon Button */}
        <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full max-w-md justify-center">
          
          {/* Main Get Started Button */}
          <button
            onClick={() => handleOpenAuth('signup')}
            className="w-full sm:w-auto px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm sm:text-base shadow-lg shadow-emerald-950/60 flex items-center justify-center gap-3 group transition-all transform hover:-translate-y-0.5 cursor-pointer"
            id="btn-get-started"
          >
            <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
            <span>Get Started</span>
            <ArrowRight className="w-4 h-4 text-emerald-200 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Quick Demo Launch Button */}
          <button
            onClick={handleQuickDemoLaunch}
            className="w-full sm:w-auto px-6 py-3.5 bg-stone-900 hover:bg-stone-850 border border-stone-700 text-stone-200 hover:text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            id="btn-launch-demo"
            title="Launch interactive workspace with sample export consignments"
          >
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Launch Workspace</span>
          </button>
        </div>

        {/* 4 Feature Highlights */}
        <div className="mt-12 sm:mt-16 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 w-full text-left">
          
          <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/90 hover:border-emerald-800/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2.5">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-200">Origin GPS & Plots</div>
            <div className="text-[11px] text-stone-400 mt-1">
              Verify farmer coordinates & polygon boundaries.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/90 hover:border-emerald-800/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2.5">
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-200">Lot Processing</div>
            <div className="text-[11px] text-stone-400 mt-1">
              Full custody chain from cherry intake to parchment lot.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/90 hover:border-emerald-800/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-200">Export Readiness</div>
            <div className="text-[11px] text-stone-400 mt-1">
              Deterministic scoring and consignment risk breakdown.
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/90 hover:border-emerald-800/80 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-800/60 text-emerald-400 flex items-center justify-center mb-2.5">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-stone-200">Evidence Dossiers</div>
            <div className="text-[11px] text-stone-400 mt-1">
              Export due-diligence audit packs & GeoJSON files.
            </div>
          </div>

        </div>

        {/* Dedicated "About Us" Section */}
        <section id="about-us-section" className="mt-16 sm:mt-24 w-full text-left pt-12 border-t border-stone-850">
          <div className="bg-stone-900/90 border border-stone-800 rounded-2xl p-6 sm:p-8 space-y-6">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-5">
              <div className="flex items-center gap-3">
                <AstroKahawaIcon size={32} showBackground={false} />
                <div>
                  <div className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
                    About the Platform
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-stone-100 uppercase tracking-tight font-mono">
                    About ASTROKAHAWA
                  </h2>
                </div>
              </div>

              <button
                onClick={() => handleOpenAuth('signup')}
                className="self-start sm:self-auto px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Join ASTROKAHAWA</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs sm:text-sm text-stone-300 leading-relaxed">
              <p>
                <strong className="text-emerald-300">ASTROKAHAWA</strong> is an enterprise digital traceability and export-readiness platform built for coffee exporters, cooperatives, washing stations, and quality auditors across Uganda and East Africa.
              </p>
              
              <p>
                Our mission is to empower coffee supply chains with verifiable evidence from origin to destination port: guaranteeing that every shipping container is backed by verified farm GPS coordinates, authentic intake deliveries, certified parchment batches, and thorough export due-diligence dossiers.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="font-bold text-emerald-400 text-xs mb-1">Smallholder Inclusion</div>
                  <div className="text-xs text-stone-400">
                    Designed to work with smallholder farmers, offline field mapping, and cooperative bulk deliveries without administrative bottlenecks.
                  </div>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="font-bold text-emerald-400 text-xs mb-1">Export Risk Mitigation</div>
                  <div className="text-xs text-stone-400">
                    Proactively identifies missing certificates, coordinates outside Uganda borders, and quality defects before containers leave port.
                  </div>
                </div>

                <div className="p-3 bg-stone-950 rounded-xl border border-stone-800">
                  <div className="font-bold text-emerald-400 text-xs mb-1">Audit-Grade Traceability</div>
                  <div className="text-xs text-stone-400">
                    Generates tamper-evident PDF dossiers, GeoJSON polygon maps, and immutable audit trails for international buyers.
                  </div>
                </div>
              </div>

              {/* Regulatory Notice Box */}
              <div className="p-4 bg-amber-950/30 border border-amber-800/60 rounded-xl text-amber-200/90 text-xs space-y-1.5 mt-4">
                <div className="font-bold uppercase tracking-wider text-[11px] text-amber-300 font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Statutory Notice & Operational Boundary</span>
                </div>
                <p className="text-[11px] text-stone-300 leading-relaxed">
                  ASTROKAHAWA is an independent enterprise software operating layer that collects, structures, and validates supply-chain due-diligence data. It <strong>does NOT</strong> issue statutory government certifications or replace mandatory regulatory filings with the European Commission (TRACES NT) or the Uganda Coffee Development Authority (UCDA).
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-400 border-t border-stone-800">
              <div>
                <strong>Headquarters:</strong> Plot 14B Bandali Rise, Bugolobi Industrial Area, Kampala, Uganda
              </div>
              <button
                onClick={() => handleOpenAuth('about')}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Full Platform Specs</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

          </div>
        </section>

      </main>

      {/* Minimal Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 border-t border-stone-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500 z-10">
        <div className="flex items-center gap-2">
          <AstroKahawaIcon size={18} showBackground={false} />
          <span className="font-mono text-stone-400">ASTROKAHAWA OS v1.0</span>
          <span>•</span>
          <span>From origin to export, with evidence.</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => handleOpenAuth('about')} 
            className="hover:text-stone-300 transition-colors cursor-pointer"
          >
            About Us
          </button>
          <button 
            onClick={() => handleOpenAuth('login')} 
            className="hover:text-stone-300 transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button 
            onClick={() => handleOpenAuth('signup')} 
            className="text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            Create Account
          </button>
        </div>
      </footer>

      {/* Interactive Auth Modal (Login / Sign Up / About) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={handleAuthSuccess}
      />

    </div>
  );
};
