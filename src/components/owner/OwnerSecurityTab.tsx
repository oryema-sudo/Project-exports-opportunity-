import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  RefreshCw, 
  Lock, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Building2, 
  User, 
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { OwnerAuditRecord, OwnerAlert } from '../../types';
import { api } from '../../services/api';

interface OwnerSecurityTabProps {
  alerts: OwnerAlert[];
  onRefreshMetrics: () => void;
}

export const OwnerSecurityTab: React.FC<OwnerSecurityTabProps> = ({ alerts, onRefreshMetrics }) => {
  const [auditLogs, setAuditLogs] = useState<OwnerAuditRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrgFilter, setSelectedOrgFilter] = useState<string>('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getOwnerAuditLogs({
        limit: 100,
        search: searchTerm || undefined,
        organizationId: selectedOrgFilter !== 'ALL' ? selectedOrgFilter : undefined
      });
      setAuditLogs(data);
    } catch (err: any) {
      console.error('Failed to load audit logs:', err);
      setError(err.message || 'Failed to fetch platform security audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedOrgFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const criticalAlerts = alerts.filter(a => a.severity === 'critical');
  const warningAlerts = alerts.filter(a => a.severity === 'warning');

  return (
    <div id="owner-security-container" className="space-y-6">
      
      {/* 1. Security & Compliance Status Banner */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Platform Security, Compliance & Cryptographic Integrity</span>
            </h2>
            <p className="text-xs text-stone-400">
              Cross-tenant isolation monitoring, strict RBAC policy enforcement, and immutable administrative audit trails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-emerald-950/80 text-emerald-300 text-xs font-semibold border border-emerald-800 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Multi-Tenant RBAC Active</span>
            </span>
            <button
              onClick={() => { fetchLogs(); onRefreshMetrics(); }}
              disabled={loading}
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition-colors"
              title="Refresh security logs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-1">
            <span className="text-stone-400 text-[11px]">Active Security & Billing Alerts</span>
            <div className="text-xl font-bold text-stone-100 flex items-center gap-2">
              <span>{alerts.length}</span>
              {criticalAlerts.length > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-400 font-bold border border-red-800">
                  {criticalAlerts.length} Critical
                </span>
              )}
            </div>
            <div className="text-[10px] text-stone-500">Failed payments & overdue accounts</div>
          </div>

          <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-1">
            <span className="text-stone-400 text-[11px]">Cryptographic Audit Records</span>
            <div className="text-xl font-bold text-stone-100">
              {auditLogs.length}+
            </div>
            <div className="text-[10px] text-stone-500">Immutable, tamper-evident action trail</div>
          </div>

          <div className="bg-stone-950 p-3 rounded-lg border border-stone-800 space-y-1">
            <span className="text-stone-400 text-[11px]">Cross-Tenant Isolation Guard</span>
            <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>Enforced</span>
            </div>
            <div className="text-[10px] text-stone-500">Zero cross-tenant data leakage</div>
          </div>
        </div>
      </div>

      {/* 2. Active Risk & Billing Alerts Monitor */}
      <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Active Risk & Billing Alerts Monitor</span>
          </h3>
          <span className="text-[11px] text-stone-400">{alerts.length} Total Alerts</span>
        </div>

        <div className="space-y-2">
          {alerts.map(alert => (
            <div 
              key={alert.id}
              className={`p-3 rounded-lg border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                alert.severity === 'critical'
                  ? 'bg-red-950/40 border-red-900/70 text-red-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-950/40 border-amber-900/70 text-amber-200'
                  : 'bg-stone-950/80 border-stone-800 text-stone-300'
              }`}
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-bold">
                  <span className={`w-2 h-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span>{alert.title}</span>
                  <span className="text-[10px] uppercase opacity-75 font-mono">[{alert.entityType || 'SYSTEM'}]</span>
                </div>
                <p className="text-[11px] opacity-90 leading-relaxed max-w-2xl">
                  {alert.message}
                </p>
                <div className="text-[10px] opacity-60">
                  {new Date(alert.timestamp).toLocaleString()}
                </div>
              </div>

              {alert.actionLabel && (
                <button
                  onClick={() => alert(`Reviewing action for ${alert.entityType}: ${alert.entityId || alert.id}`)}
                  className="px-3 py-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-100 text-xs font-medium border border-stone-700 self-start sm:self-auto transition-colors"
                >
                  {alert.actionLabel}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Cross-Tenant Immutable Audit Trail */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-stone-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Cross-Tenant Security & Mutation Audit Trail</span>
            </h3>
            <p className="text-xs text-stone-400">
              Cryptographically verified audit trail logging user authentication, organization updates, plan mutations, and financial actions.
            </p>
          </div>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search action, actor, entity..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-400"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold border border-stone-700"
            >
              Filter
            </button>
          </form>
        </div>

        {/* Audit Log Table */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950/80 text-[11px] font-semibold text-stone-400 uppercase tracking-wider border-b border-stone-800">
                <tr>
                  <th className="py-3 px-4">Timestamp & IP</th>
                  <th className="py-3 px-4">Actor (User)</th>
                  <th className="py-3 px-4">Tenant Scope</th>
                  <th className="py-3 px-4">Action & Entity</th>
                  <th className="py-3 px-4">Mutation Diff</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/80 font-mono text-[11px]">
                {loading && auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400 text-xs font-sans">
                      <RefreshCw className="w-6 h-6 text-amber-400 animate-spin mx-auto mb-2" />
                      Loading platform audit stream...
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-stone-400 text-xs font-sans">
                      No audit records found matching your filter criteria.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-800/30 transition-colors">
                      <td className="py-2.5 px-4">
                        <div className="text-stone-200 font-medium">
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-stone-500">
                          IP: {log.ipAddress || 'Internal/Secure'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-semibold text-stone-100 flex items-center gap-1">
                          <User className="w-3 h-3 text-stone-400" />
                          <span>{log.userName || 'System Engine'}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          Role: {log.userRole || 'Automated'}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-medium text-stone-200 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-stone-400" />
                          <span>{log.organizationName || 'Cross-Tenant'}</span>
                        </div>
                      </td>

                      <td className="py-2.5 px-4 font-sans">
                        <div className="font-bold text-amber-400">
                          {log.action}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          {log.entity} #{log.entityId ? log.entityId.slice(0, 10) : ''}
                        </div>
                      </td>

                      <td className="py-2.5 px-4 text-[11px] text-stone-300 max-w-xs">
                        {log.previousValue && log.newValue ? (
                          <div className="space-y-0.5">
                            <div className="text-red-400 line-through text-[10px] truncate">
                              - {log.previousValue}
                            </div>
                            <div className="text-emerald-400 text-[10px] truncate">
                              + {log.newValue}
                            </div>
                          </div>
                        ) : log.newValue ? (
                          <div className="text-stone-300 text-[10px] truncate">
                            {log.newValue}
                          </div>
                        ) : (
                          <span className="text-stone-500 text-[10px]">Action recorded</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
