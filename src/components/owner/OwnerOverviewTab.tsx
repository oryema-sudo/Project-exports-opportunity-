import React from 'react';
import { 
  Building2, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  Users, 
  Layers, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Coffee,
  Globe,
  MapPin
} from 'lucide-react';
import { OwnerOverviewMetrics, OwnerAlert } from '../../types';

interface OwnerOverviewTabProps {
  overview: OwnerOverviewMetrics | null;
  onNavigateTab: (tab: string) => void;
  alerts: OwnerAlert[];
}

export const OwnerOverviewTab: React.FC<OwnerOverviewTabProps> = ({
  overview,
  onNavigateTab,
  alerts
}) => {
  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div id="owner-overview-container" className="space-y-6">
      
      {/* Top Level SaaS Financial & Footprint Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* MRR & ARR */}
        <div id="kpi-mrr" className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Monthly Recurring Revenue (MRR)</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-stone-100">
            UGX {(overview?.mrrUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
            <span>ARR: <strong className="text-stone-300">UGX {((overview?.mrrUgx || 0) * 12).toLocaleString()}</strong></span>
            <span className="text-emerald-400 font-semibold">{overview?.activeSubscriptionsCount || 0} active subs</span>
          </div>
        </div>

        {/* Realized Cash Received */}
        <div id="kpi-cash" className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Realized Cash Collected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            UGX {(overview?.cashReceivedUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
            <span>Settled via MoMo & Wire</span>
            <span className="text-stone-300">{overview?.payingOrganizations || 0} paying tenants</span>
          </div>
        </div>

        {/* Monthly Operating Expenses */}
        <div id="kpi-expenses" className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Monthly Operating Expenses</span>
            <Receipt className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-stone-100">
            UGX {(overview?.monthlyExpensesUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
            <span>Total Logged: UGX {(overview?.totalExpensesUgx || 0).toLocaleString()}</span>
            <button 
              onClick={() => onNavigateTab('financials')}
              className="text-amber-400 hover:underline font-semibold"
            >
              View ledger
            </button>
          </div>
        </div>

        {/* Net Monthly Margin */}
        <div id="kpi-margin" className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-stone-400 text-xs font-medium">
            <span>Net Operating Margin</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className={`text-2xl font-black ${(overview?.monthlyOperatingProfitUgx || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            UGX {(overview?.monthlyOperatingProfitUgx || 0).toLocaleString()}
          </div>
          <div className="flex items-center justify-between text-[11px] text-stone-400 pt-1 border-t border-stone-800">
            <span>Margin %</span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
              (overview?.monthlyOperatingProfitUgx || 0) >= 0 ? 'bg-emerald-950 text-emerald-300' : 'bg-red-950 text-red-300'
            }`}>
              {overview?.mrrUgx && overview.mrrUgx > 0 
                ? `${Math.round(((overview.monthlyOperatingProfitUgx) / overview.mrrUgx) * 100)}%` 
                : '0%'}
            </span>
          </div>
        </div>

      </div>

      {/* Platform Multi-Tenant Scale Grid */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Platform Aggregate Scale & Data Volume</span>
            </h2>
            <p className="text-xs text-stone-400">
              Aggregated live operational data spanning all customer exporter organizations.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('telemetry')}
            className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Full telemetry breakdown</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Organizations</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {overview?.totalOrganizations || 0}
            </div>
            <div className="text-[10px] text-stone-400">
              {overview?.payingOrganizations || 0} paying • {overview?.trialOrganizations || 0} trial
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smallholders</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {(overview?.platformUsage.totalFarmers || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-400">
              Smallholder registry
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Farm Polygons</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {(overview?.platformUsage.totalFarms || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-400">
              GPS mapped plots
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5 text-amber-500" />
              <span>Intake Coffee (kg)</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {(overview?.platformUsage.totalCoffeeQuantityKg || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-400">
              {overview?.platformUsage.totalDeliveries || 0} deliveries logged
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>Consignments</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {overview?.platformUsage.totalShipments || 0}
            </div>
            <div className="text-[10px] text-stone-400">
              {overview?.platformUsage.totalLots || 0} coffee lots
            </div>
          </div>

          <div className="bg-stone-950/80 border border-stone-800/80 p-3.5 rounded-lg space-y-1">
            <div className="text-[11px] text-stone-400 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Audit Records</span>
            </div>
            <div className="text-lg font-black text-stone-100">
              {(overview?.platformUsage.totalAuditLogs || 0).toLocaleString()}
            </div>
            <div className="text-[10px] text-stone-400">
              Immutable logs
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans Breakdown & Platform Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Subscription Plan Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>SaaS Subscription Plans & Revenue Share</span>
            </h3>
            <button
              onClick={() => onNavigateTab('subscriptions')}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
            >
              <span>Manage plans & quotas</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {overview?.revenueByPlan.map(p => (
              <div key={p.planId} className="bg-stone-950/70 p-4 rounded-lg border border-stone-800/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-stone-200">{p.planName}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-semibold border border-emerald-900">
                    {p.subscribersCount} orgs
                  </span>
                </div>
                
                <div className="text-lg font-black text-stone-100 font-mono">
                  UGX {p.mrrUgx.toLocaleString()}<span className="text-[11px] text-stone-400 font-normal">/mo</span>
                </div>

                <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{ width: `${Math.max(p.percentage, 5)}%` }}
                  />
                </div>

                <div className="text-[10px] text-stone-400 flex items-center justify-between">
                  <span>Share of MRR</span>
                  <span className="font-semibold text-stone-300">{p.percentage}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Quick shortcuts banner */}
          <div className="pt-2 border-t border-stone-800 flex flex-wrap gap-2 text-xs">
            <button
              onClick={() => onNavigateTab('organizations')}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse Customer Organizations ({overview?.totalOrganizations || 0})</span>
            </button>
            <button
              onClick={() => onNavigateTab('administrators')}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Users className="w-3.5 h-3.5 text-emerald-400" />
              <span>Manage Organization Administrators & Users</span>
            </button>
            <button
              onClick={() => onNavigateTab('security')}
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Cross-Tenant Cryptographic Audit Trail</span>
            </button>
          </div>
        </div>

        {/* Security & Risk Monitor */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Platform Risk & Alerts</span>
            </h3>
            <span className="text-[11px] text-stone-400">{alerts.length} active</span>
          </div>

          <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
            {alerts.slice(0, 4).map(alert => (
              <div 
                key={alert.id}
                className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                  alert.severity === 'critical'
                    ? 'bg-red-950/40 border-red-900/60 text-red-300'
                    : alert.severity === 'warning'
                    ? 'bg-amber-950/40 border-amber-900/60 text-amber-300'
                    : 'bg-stone-950/60 border-stone-800 text-stone-300'
                }`}
              >
                <div className="flex items-center justify-between font-semibold">
                  <span>{alert.title}</span>
                  <span className="text-[10px] uppercase opacity-75">{alert.severity}</span>
                </div>
                <p className="text-[11px] opacity-85 leading-snug line-clamp-2">
                  {alert.message}
                </p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('security')}
            className="w-full text-center text-xs text-amber-400 hover:text-amber-300 font-semibold py-1.5 border-t border-stone-800 mt-2 block"
          >
            Review all security & billing alerts
          </button>
        </div>

      </div>

    </div>
  );
};
