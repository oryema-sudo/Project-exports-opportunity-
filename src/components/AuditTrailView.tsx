import React, { useState } from 'react';
import { AppState } from '../services/store';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  History, 
  User, 
  Clock, 
  Lock
} from 'lucide-react';
import { EmptyState } from './EmptyState';

interface AuditTrailViewProps {
  state: AppState;
  searchQuery: string;
}

export const AuditTrailView: React.FC<AuditTrailViewProps> = ({
  state,
  searchQuery
}) => {
  const { auditLogs } = state;
  const [filterEntity, setFilterEntity] = useState<string>('ALL');

  const filteredLogs = auditLogs.filter(log => {
    if (filterEntity !== 'ALL' && log.entity !== filterEntity) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.entity.toLowerCase().includes(q) ||
        log.entityId.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        (log.details && log.details.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            Compliance & System Audit Trail
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Immutable log of all smallholder registrations, GPS plot updates, lot aggregations, and export readiness runs.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs font-semibold px-3 py-1.5 rounded border border-emerald-200">
          <Lock className="w-3.5 h-3.5" />
          <span>Append-Only Integrity Log</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter Entity:
          </span>

          <select
            value={filterEntity}
            onChange={(e) => setFilterEntity(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
          >
            <option value="ALL">All Entities ({auditLogs.length})</option>
            <option value="Shipment">Shipments</option>
            <option value="Lot">Lots</option>
            <option value="Farmer">Farmers</option>
            <option value="Farm">Farm Plots</option>
            <option value="Delivery">Deliveries</option>
            <option value="Document">Documents</option>
          </select>
        </div>

        <div className="text-stone-500 font-mono text-xs">
          Showing {filteredLogs.length} audit entries
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title={auditLogs.length === 0 ? "No audit events logged yet" : "No matching audit records found"}
          description={
            auditLogs.length === 0
              ? "The append-only audit trail logs smallholder registrations, GPS plot polygon updates, lot aggregations, and export dossier generations."
              : "No audit records match your current filter or search criteria."
          }
          primaryAction={
            auditLogs.length > 0 && filterEntity !== 'ALL'
              ? {
                  label: "Show All Entities",
                  onClick: () => setFilterEntity('ALL')
                }
              : undefined
          }
          guidance="Every state mutation and compliance check is timestamped and cryptographically traceable."
          badge="IMMUTABLE AUDIT TRAIL"
        />
      ) : (
        <>
          {/* Audit Log Mobile Cards (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredLogs.map(log => (
              <div key={log.id} className="p-4 bg-white border border-stone-200 rounded-lg shadow-sm space-y-2 text-xs">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                    {log.action}
                  </span>
                  <span className="font-mono text-[10px] text-stone-400">
                    {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100">
                  <div>
                    <span className="font-mono font-bold text-stone-800">{log.entity}:</span>
                    <span className="font-mono text-stone-600 ml-1">{log.entityId}</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    by <strong className="text-stone-700">{log.userName}</strong>
                  </div>
                </div>

                <div className="text-stone-600 pt-1 border-t border-stone-100 text-[11px]">
                  {log.details || 'State transition recorded.'}
                  {log.newValue && (
                    <div className="text-[10px] text-stone-400 font-mono mt-0.5 truncate">
                      Val: {log.newValue}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Log Desktop Table (>= md screens) */}
          <div className="hidden md:block bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">User / Officer</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Entity & ID</th>
                    <th className="py-2.5 px-3">Modifications / Log Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-stone-50 transition-colors">
                      <td className="py-3 px-3 font-mono text-stone-500 text-[11px] whitespace-nowrap">
                        <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                        <div className="text-stone-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-stone-900">{log.userName}</div>
                        <div className="text-[10px] text-stone-400 font-mono">{log.userRole}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono">
                        <div className="font-bold text-stone-900">{log.entity}</div>
                        <div className="text-[10px] text-stone-500">{log.entityId}</div>
                      </td>
                      <td className="py-3 px-3 text-stone-700">
                        <div>{log.details || 'State transition recorded.'}</div>
                        {log.newValue && (
                          <div className="text-[11px] text-stone-500 font-mono mt-0.5 truncate max-w-md">
                            Val: {log.newValue}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

    </div>
  );
};
