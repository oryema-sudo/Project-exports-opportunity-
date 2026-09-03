import React from 'react';
import { 
  Activity, 
  MapPin, 
  Layers, 
  FileText, 
  Coffee, 
  Globe, 
  ShieldCheck, 
  Users, 
  Building2, 
  CheckCircle2, 
  Compass,
  FileCheck
} from 'lucide-react';

interface OwnerTelemetryTabProps {
  usageTelemetry: any;
}

export const OwnerTelemetryTab: React.FC<OwnerTelemetryTabProps> = ({ usageTelemetry }) => {
  const summary = usageTelemetry?.summary || {};
  const districtDistribution: Record<string, number> = usageTelemetry?.districtDistribution || {};
  const documentTypeDistribution: Record<string, number> = usageTelemetry?.documentTypeDistribution || {};
  const organizationTypes: Record<string, number> = usageTelemetry?.organizationTypes || {};

  const totalDistrictsFarmers = Object.values(districtDistribution).reduce((a, b) => a + b, 0);

  return (
    <div id="owner-telemetry-container" className="space-y-6">
      
      {/* 1. Core Ecosystem Telemetry Cards */}
      <div className="space-y-2">
        <h2 className="text-sm font-bold text-stone-100 flex items-center gap-2">
          <Activity className="w-4 h-4 text-amber-400" />
          <span>Platform Scale, Data Assets & Compliance Volume</span>
        </h2>
        <p className="text-xs text-stone-400">
          Live aggregated data footprint spanning farm-level GPS mapping, coffee traceability intake, and regulatory export packs.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="text-stone-400 text-xs flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Registered Smallholders</span>
          </div>
          <div className="text-2xl font-black text-stone-100">
            {(summary.totalFarmers || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400">
            Across {Object.keys(districtDistribution).length} production districts
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="text-stone-400 text-xs flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Mapped Farm Polygons</span>
          </div>
          <div className="text-2xl font-black text-stone-100">
            {(summary.totalFarms || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-stone-400">
            {(summary.totalHectares || 0).toLocaleString()} ha verified acreage
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="text-stone-400 text-xs flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-amber-400" />
            <span>Intake Volume</span>
          </div>
          <div className="text-2xl font-black text-amber-400">
            {(summary.totalIntakeKg || 0).toLocaleString()} <span className="text-xs font-normal text-stone-400">kg</span>
          </div>
          <div className="text-[11px] text-stone-400">
            From {summary.totalLots || 0} batches
          </div>
        </div>

        <div className="bg-stone-900 border border-stone-800 rounded-xl p-4 space-y-1">
          <div className="text-stone-400 text-xs flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-purple-400" />
            <span>Consignment Exports</span>
          </div>
          <div className="text-2xl font-black text-purple-400">
            {(summary.totalExportKg || 0).toLocaleString()} <span className="text-xs font-normal text-stone-400">kg</span>
          </div>
          <div className="text-[11px] text-stone-400">
            Across {summary.totalShipments || 0} international shipments
          </div>
        </div>
      </div>

      {/* 2. District Regional Breakdown & Document Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* District Distribution */}
        <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
              <Compass className="w-4 h-4 text-amber-400" />
              <span>Smallholder Geographic Distribution by District</span>
            </h3>
            <span className="text-[11px] text-stone-400">
              {Object.keys(districtDistribution).length} Districts
            </span>
          </div>

          <div className="space-y-3">
            {Object.entries(districtDistribution).map(([district, count]) => {
              const pct = totalDistrictsFarmers > 0 ? Math.round((count / totalDistrictsFarmers) * 100) : 0;
              return (
                <div key={district} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-200">{district} District</span>
                    <span className="text-stone-400 font-mono">{count} smallholders ({pct}%)</span>
                  </div>
                  <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(pct, 4)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Regulatory Document Packs & Organization Breakdown */}
        <div className="space-y-6">
          
          {/* Document Verification Breakdown */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Compliance Document Repository</span>
              </h3>
              <span className="text-[11px] text-stone-400">
                {summary.totalDocuments || 0} Total Files
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(documentTypeDistribution).map(([docType, count]) => (
                <div key={docType} className="bg-stone-950 p-3 rounded-lg border border-stone-800/80 space-y-1">
                  <span className="text-stone-400 text-[11px] font-medium block truncate">
                    {docType.replace(/_/g, ' ')}
                  </span>
                  <div className="text-base font-bold text-stone-100">
                    {count} <span className="text-[10px] text-stone-400 font-normal">verified</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Organization Types */}
          <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-stone-100 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span>Customer Organization Types</span>
            </h3>

            <div className="flex flex-wrap gap-2">
              {Object.entries(organizationTypes).map(([type, count]) => (
                <div key={type} className="px-3 py-2 rounded-lg bg-stone-950 border border-stone-800 text-xs flex items-center gap-2">
                  <span className="text-stone-300 font-semibold">{type}</span>
                  <span className="px-1.5 py-0.2 rounded bg-stone-800 text-stone-400 text-[10px] font-bold">
                    {count}
                  </span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
