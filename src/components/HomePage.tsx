import React from 'react';
import { AstroKahawaLogo } from './AstroKahawaLogo';
import { 
  ArrowRight, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  MapPin, 
  Layers, 
  FileCheck, 
  Globe2, 
  ChevronRight,
  Scale,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  Building2,
  Lock,
  ArrowUpRight,
  Hash
} from 'lucide-react';
import { appStore } from '../services/store';

interface HomePageProps {
  onEnterApp: () => void;
  onOpenLogin?: () => void;
  onOpenSignUp?: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onEnterApp,
  onOpenLogin = onEnterApp,
  onOpenSignUp = onEnterApp
}) => {
  const currentUser = appStore.getState().currentUser;
  const isAuthenticated = Boolean(currentUser && currentUser.email);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 flex flex-col font-sans selection:bg-emerald-800 selection:text-white">
      
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <AstroKahawaLogo size="md" variant="light" showTagline={false} />
            <div className="hidden lg:flex items-center text-xs text-stone-500 font-medium pl-4 border-l border-stone-200">
              Traceability & Export-Readiness Operating System
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-700">
            <button 
              onClick={() => scrollToSection('capabilities')} 
              className="hover:text-emerald-900 transition-colors cursor-pointer"
            >
              Capabilities
            </button>
            <button 
              onClick={() => scrollToSection('architecture')} 
              className="hover:text-emerald-900 transition-colors cursor-pointer"
            >
              Supply Chain Workflow
            </button>
            <button 
              onClick={() => scrollToSection('compliance')} 
              className="hover:text-emerald-900 transition-colors cursor-pointer"
            >
              UCDA & EUDR Standards
            </button>
            <button 
              onClick={() => scrollToSection('operational-context')} 
              className="hover:text-emerald-900 transition-colors cursor-pointer"
            >
              Origin Focus
            </button>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated ? (
              <button
                onClick={onEnterApp}
                className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Open Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={onOpenLogin}
                  className="px-3 py-1.5 text-stone-700 hover:text-stone-950 font-semibold text-xs rounded-lg hover:bg-stone-100 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-stone-500" />
                  <span>Log In</span>
                </button>
                <button
                  onClick={onOpenSignUp}
                  className="px-3.5 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Create Account</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="bg-stone-900 text-stone-100 border-b border-stone-800 py-16 sm:py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-stone-800 border border-stone-700 text-emerald-400 text-xs font-mono font-semibold mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>ASTROKAHAWA • FROM ORIGIN TO EXPORT, WITH EVIDENCE.</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              The Traceability & Export Readiness Operating System for Coffee Exporters.
            </h1>

            <p className="mt-5 text-base sm:text-lg text-stone-300 leading-relaxed">
              From smallholder farmer polygons to export container due diligence — verifiable chain of custody for African coffee.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {isAuthenticated ? (
                <button
                  onClick={onEnterApp}
                  className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <span>Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    onClick={onOpenSignUp}
                    className="px-6 py-3 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm rounded-lg shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create Account</span>
                  </button>
                  <button
                    onClick={onOpenLogin}
                    className="px-5 py-3 bg-stone-800 hover:bg-stone-750 text-stone-100 border border-stone-700 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-4 h-4 text-emerald-400" />
                    <span>Log In to Workspace</span>
                  </button>
                </>
              )}

              <button
                onClick={() => scrollToSection('architecture')}
                className="px-5 py-3 bg-stone-850 hover:bg-stone-800 text-stone-300 border border-stone-800 font-medium text-sm rounded-lg flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>Workflow Architecture</span>
                <ChevronRight className="w-4 h-4 text-stone-400" />
              </button>
            </div>

            {/* Sub-hero operational verification badges */}
            <div className="mt-12 pt-8 border-t border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-stone-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Smallholder Cadastral & GPS Polygons</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Hulling Mass Balance & Lot Identity</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>EUDR & UCDA Evidence Generation</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. CORE PROBLEM STATEMENT */}
      <section className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-800">
              The Trade Reality
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1.5">
              The coffee supply chain faces an unprecedented regulatory shift.
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              International buyers and national authorities require verifiable proof of origin. Traditional paper receipts, disconnected spreadsheets, and estimated lot allocations no longer pass port due diligence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm mb-3">
                01
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1.5">Strict Regulatory Demands</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                EUDR due diligence and national export regulations require geo-located origin evidence for every metric ton exported.
              </p>
            </div>

            <div className="p-5 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm mb-3">
                02
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1.5">Fragmented Smallholder Records</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Millions of farming households lack structured digital cadastral plots, leaving cooperatives vulnerable to unverified supply.
              </p>
            </div>

            <div className="p-5 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm mb-3">
                03
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1.5">Disconnected Processing</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Washing stations and dry mills frequently lose farm identity during cherry bulking, pulp separation, and batch milling.
              </p>
            </div>

            <div className="p-5 bg-stone-50 border border-stone-200 rounded-lg">
              <div className="w-8 h-8 rounded bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm mb-3">
                04
              </div>
              <h3 className="text-sm font-bold text-stone-900 mb-1.5">Port Rejection & Commercial Risk</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Consignments arriving without complete evidentiary chains face costly demurrage, customs seizure, and buyer contract cancellation.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. CORE OPERATING CAPABILITIES */}
      <section id="capabilities" className="py-16 sm:py-20 bg-stone-100 border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Engineered for the Coffee Floor
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1.5">
              Core Operating Capabilities
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              AstroKahawa replaces fragmented spreadsheets with an interconnected, authoritative supply-chain record.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Capability 1 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Smallholder Registry & GPS Polygon Mapping
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Register farming families with national IDs, district locations, coffee varieties, and verifiable polygon coordinate boundaries compliant with geospatial standards.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Uganda WGS84 GeoJSON Export</span>
              </div>
            </div>

            {/* Capability 2 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Cherry Intake & Washing Station Receipts
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Capture primary scale weights at collection centers. Issue digital intake receipts linked directly to registered farmer accounts and specific harvest seasons.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Defect Inspection & Quality Grades</span>
              </div>
            </div>

            {/* Capability 3 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Dry Mill Lot Management & Mass Balance
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Form distinct processing lots from intake deliveries. Track moisture levels, parchment conversion rates, screening outturns, and mill batch records.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Continuous Custody Preserved</span>
              </div>
            </div>

            {/* Capability 4 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Consignment Due Diligence & Readiness
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Aggregate lots into export contracts. Automated readiness engine flags missing polygon coordinates, unverified smallholder NINs, or absent UCDA certificates.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Dossier Package Generator</span>
              </div>
            </div>

            {/* Capability 5 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Tamper-Evident Audit Logging
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Every record modification, farm registration, delivery scale reading, and export status transition is committed to an immutable server-authoritative audit log.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Forensic Supply Chain Proof</span>
              </div>
            </div>

            {/* Capability 6 */}
            <div className="p-6 bg-white border border-stone-200 rounded-xl shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-center">
                <Globe2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-stone-900">
                Multi-Tenant Enterprise Isolation
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Securely segregates farmer registries, buyer contracts, and mill yields per exporter, cooperative, or union while maintaining uniform export format standards.
              </p>
              <div className="pt-2 text-[11px] text-stone-500 font-mono flex items-center gap-1.5 border-t border-stone-100">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Role-Based Access Control (RBAC)</span>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. COFFEE INDUSTRY ARCHITECTURE / WORKFLOW */}
      <section id="architecture" className="py-16 sm:py-20 bg-white border-b border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-14">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
              Chain of Custody
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1.5">
              Physical-to-Digital Traceability Workflow
            </h2>
            <p className="mt-3 text-stone-600 text-sm sm:text-base leading-relaxed">
              How AstroKahawa bridges physical coffee movement in Ugandan field operations with digital export verification.
            </p>
          </div>

          <div className="space-y-6">
            
            {/* Step 1 */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-mono font-bold text-base flex items-center justify-center">
                  01
                </div>
              </div>
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stage 1 • Origin Registration</span>
                <h3 className="text-base font-bold text-stone-900">Farmer & Farm Plot Cadastral Mapping</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Field officers record smallholder identity, national registration numbers, coffee tree counts, and capture GPS polygon boundaries directly at farm level.
                </p>
              </div>
              <div className="md:col-span-4 bg-white p-3.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 space-y-1">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Required Evidence Artifact:</div>
                <div className="text-stone-500">• Smallholder NIN & Phone</div>
                <div className="text-stone-500">• Polygon Coordinates (Lat/Long)</div>
                <div className="text-stone-500">• Land Tenancy Declaration</div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-mono font-bold text-base flex items-center justify-center">
                  02
                </div>
              </div>
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stage 2 • Primary Aggregation</span>
                <h3 className="text-base font-bold text-stone-900">Intake Delivery Receipts & Scale Verification</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Red ripe cherry or FAQ deliveries are weighed at station scales, checked for moisture and flotation, and logged under the delivery agent's custody.
                </p>
              </div>
              <div className="md:col-span-4 bg-white p-3.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 space-y-1">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Required Evidence Artifact:</div>
                <div className="text-stone-500">• Delivery Scale Receipt #</div>
                <div className="text-stone-500">• Net Kilograms & Moisture %</div>
                <div className="text-stone-500">• Coffee Type (Arabica / Robusta)</div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-mono font-bold text-base flex items-center justify-center">
                  03
                </div>
              </div>
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stage 3 • Processing & Milling</span>
                <h3 className="text-base font-bold text-stone-900">Lot Formation & Hulling Mass Balance</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Deliveries are grouped into identifiable processing lots. Dry mill hulling tracks conversion ratios, ensuring outturn matches source input mass.
                </p>
              </div>
              <div className="md:col-span-4 bg-white p-3.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 space-y-1">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Required Evidence Artifact:</div>
                <div className="text-stone-500">• Lot Identifier Reference</div>
                <div className="text-stone-500">• Wet-to-Dry Conversion Yield</div>
                <div className="text-stone-500">• Cupping & Grade Evaluation</div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-mono font-bold text-base flex items-center justify-center">
                  04
                </div>
              </div>
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stage 4 • Export Consignment</span>
                <h3 className="text-base font-bold text-stone-900">Buyer Allocation & Export Container Sealing</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Lots are allocated to specific export contracts and shipping containers. System executes automated pre-export readiness scoring.
                </p>
              </div>
              <div className="md:col-span-4 bg-white p-3.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 space-y-1">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Required Evidence Artifact:</div>
                <div className="text-stone-500">• Shipping Container & Seal #</div>
                <div className="text-stone-500">• Bill of Lading & Commercial Invoice</div>
                <div className="text-stone-500">• Readiness Scorecard Check</div>
              </div>
            </div>

            {/* Step 5 */}
            <div className="p-6 bg-stone-50 border border-stone-200 rounded-xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-1 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-emerald-800 text-white font-mono font-bold text-base flex items-center justify-center">
                  05
                </div>
              </div>
              <div className="md:col-span-7 space-y-1">
                <span className="text-xs font-mono font-bold text-emerald-800 uppercase">Stage 5 • Customs & Port Clearance</span>
                <h3 className="text-base font-bold text-stone-900">Dossier Generation & Due Diligence Clearance</h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Export package generates complete digital dossier: polygon GeoJSON files, farmer lists, certificate links, and tamper-evident chain history for customs.
                </p>
              </div>
              <div className="md:col-span-4 bg-white p-3.5 rounded-lg border border-stone-200 text-xs font-mono text-stone-600 space-y-1">
                <div className="text-[11px] font-bold text-stone-800 uppercase">Required Evidence Artifact:</div>
                <div className="text-stone-500">• UCDA Quality Certificate</div>
                <div className="text-stone-500">• EUDR DDS Polygon Package</div>
                <div className="text-stone-500">• Chain-of-Custody Dossier PDF</div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 6. INSTITUTIONAL & REGULATORY CONTEXT */}
      <section id="compliance" className="py-16 sm:py-20 bg-stone-900 text-stone-100 border-b border-stone-800">
        <div id="operational-context" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              National & Global Alignment
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-1.5">
              Built for the Ugandan Coffee Context
            </h2>
            <p className="mt-3 text-stone-300 text-sm sm:text-base leading-relaxed">
              AstroKahawa is designed around the operating structures of Uganda's primary coffee producing regions — Bugisu, Rwenzori, Greater Masaka, Bushenyi, and Mount Elgon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="p-5 bg-stone-850 border border-stone-800 rounded-xl space-y-2.5">
              <div className="text-emerald-400 font-mono text-xs font-bold uppercase">Standard 01</div>
              <h3 className="text-sm font-bold text-white">UCDA Regulatory Alignment</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Structured according to Uganda Coffee Development Authority export grading, quality inspection requirements, and statutory export certificates.
              </p>
            </div>

            <div className="p-5 bg-stone-850 border border-stone-800 rounded-xl space-y-2.5">
              <div className="text-emerald-400 font-mono text-xs font-bold uppercase">Standard 02</div>
              <h3 className="text-sm font-bold text-white">EUDR Geolocation Readiness</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Produces compliant polygon datasets and plot coordinates for EU Due Diligence Statements (DDS) required under EU Deforestation Regulation.
              </p>
            </div>

            <div className="p-5 bg-stone-850 border border-stone-800 rounded-xl space-y-2.5">
              <div className="text-emerald-400 font-mono text-xs font-bold uppercase">Standard 03</div>
              <h3 className="text-sm font-bold text-white">National Register Ready</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Integrates smallholder National Identification Numbers (NIN) and farmer registry fields compatible with emerging national coffee databases.
              </p>
            </div>

            <div className="p-5 bg-stone-850 border border-stone-800 rounded-xl space-y-2.5">
              <div className="text-emerald-400 font-mono text-xs font-bold uppercase">Standard 04</div>
              <h3 className="text-sm font-bold text-white">Data Sovereignty & Privacy</h3>
              <p className="text-xs text-stone-400 leading-relaxed">
                Exporters retain authoritative control over their farmer relationships and commercial contract data without third-party broker aggregation.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 7. CLEAR FOOTER */}
      <footer className="bg-stone-950 text-stone-400 border-t border-stone-800 py-12 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-stone-800">
            <div>
              <AstroKahawaLogo size="md" variant="dark" showTagline={true} />
              <p className="text-stone-400 text-xs mt-2 max-w-md leading-relaxed">
                Enterprise operating platform for coffee exporters, cooperatives, washing stations, and dry mills in Uganda and East Africa.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={onOpenLogin}
                className="px-4 py-2 bg-stone-900 hover:bg-stone-850 text-stone-200 border border-stone-800 font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Sign In
              </button>
              <button
                onClick={onOpenSignUp}
                className="px-4 py-2 bg-emerald-800 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors cursor-pointer"
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-400 text-[11px]">
            <div>
              © {new Date().getFullYear()} AstroKahawa. All rights reserved. Coffee Traceability & Export Readiness System.
            </div>
            <div className="flex items-center gap-4">
              <span>Aligned with UCDA Export Quality Standards</span>
              <span>•</span>
              <span>EUDR Geolocation Compliant</span>
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
