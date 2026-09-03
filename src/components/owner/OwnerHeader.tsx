import React from 'react';
import { Crown, Plus, Download, RefreshCw, ShieldAlert, Sparkles, Building, Layers } from 'lucide-react';

interface OwnerHeaderProps {
  loading: boolean;
  onRefresh: () => void;
  onOpenAddExpense: () => void;
  onExportFinancials: () => void;
  totalOrgsCount: number;
  activeSubCount: number;
}

export const OwnerHeader: React.FC<OwnerHeaderProps> = ({
  loading,
  onRefresh,
  onOpenAddExpense,
  onExportFinancials,
  totalOrgsCount,
  activeSubCount
}) => {
  return (
    <div id="owner-header-banner" className="bg-stone-900 border border-amber-500/30 rounded-xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-lg bg-amber-500 text-stone-950 shadow-md">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
                  AstroKahawa Platform Owner Control Center
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  PLATFORM_OPERATOR
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-400 mt-0.5">
                Multi-tenant SaaS command center: Customer organizations, administrators, subscriptions, platform scale, and cross-tenant security.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
          <button
            id="owner-btn-record-expense"
            onClick={onOpenAddExpense}
            className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record Platform Expense</span>
          </button>

          <button
            id="owner-btn-export-csv"
            onClick={onExportFinancials}
            className="bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium px-3 py-2 rounded-lg border border-stone-700 flex items-center gap-1.5 transition-colors"
            title="Download full audited CSV ledger"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Export Audited Financials</span>
          </button>

          <button
            id="owner-btn-refresh-telemetry"
            onClick={onRefresh}
            disabled={loading}
            className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-2 rounded-lg border border-stone-700 transition-colors disabled:opacity-50"
            title="Refresh telemetry and metrics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Baseline operational strip */}
      <div className="mt-4 pt-3 border-t border-stone-800/80 flex flex-wrap items-center justify-between text-[11px] text-stone-400 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-stone-300">
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>{totalOrgsCount} Registered Tenants</span>
          </span>
          <span className="flex items-center gap-1.5 text-stone-300">
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span>{activeSubCount} Active Subscriptions</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-stone-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Cross-tenant RBAC Enforced • Immutable Cryptographic Audit Active</span>
        </div>
      </div>
    </div>
  );
};
