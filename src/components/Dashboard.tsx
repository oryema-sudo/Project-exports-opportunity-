import React from 'react';
import { 
  Users, 
  MapPin, 
  Layers, 
  Truck, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  FileText, 
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  Scale,
  Compass,
  FileSpreadsheet
} from 'lucide-react';
import { AppState } from '../services/store';
import { ActiveTab } from './Navigation';
import { isUgandaCoordinates } from '../data/ugandaRegions';

interface DashboardProps {
  state: AppState;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectShipment: (shipmentId: string) => void;
  onOpenBulkImport: () => void;
  onOpenNewShipment: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  setActiveTab,
  onSelectShipment,
  onOpenBulkImport,
  onOpenNewShipment
}) => {
  const { farmers, farms, lots, shipments, documents, auditLogs, activeOrgId } = state;
  const activeOrg = state.organizations.find(o => o.id === activeOrgId) || state.organizations[0];

  // Core metrics
  const totalFarmers = farmers.length;
  const verifiedFarmers = farmers.filter(f => f.verificationStatus === 'Verified').length;
  const totalFarms = farms.length;
  const polygonFarms = farms.filter(f => f.geometryType === 'Polygon' && f.geoJsonData).length;
  const missingGpsFarms = farms.filter(f => !f.latitude || !f.longitude || f.latitude === 0 || !isUgandaCoordinates(f.latitude, f.longitude));

  const totalLots = lots.length;
  const activeLots = lots.filter(l => l.currentStatus !== 'Shipped' && l.currentStatus !== 'Closed');
  const reviewLots = lots.filter(l => l.currentStatus === 'Requires Review');
  const readyLots = lots.filter(l => l.currentStatus === 'Assigned to Shipment' || l.currentStatus === 'Processed');

  const readyShipments = shipments.filter(s => s.readinessStatus === 'GREEN');
  const reviewShipments = shipments.filter(s => s.readinessStatus === 'YELLOW');
  const blockedShipments = shipments.filter(s => s.readinessStatus === 'RED');

  const totalCoffeeKg = lots.reduce((sum, l) => sum + l.quantityKg, 0);
  const robustaKg = lots.filter(l => l.coffeeType === 'Robusta').reduce((sum, l) => sum + l.quantityKg, 0);
  const arabicaKg = lots.filter(l => l.coffeeType === 'Arabica').reduce((sum, l) => sum + l.quantityKg, 0);

  const missingDocsCount = farmers.filter(f => f.verificationStatus !== 'Verified').length + lots.filter(l => l.documentIds.length === 0).length;

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner: Operational Context */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              {activeOrg.type.toUpperCase()} OPERATING WORKSPACE
            </span>
            <span className="text-xs text-stone-500 font-mono">Reg: {activeOrg.registrationNumber}</span>
          </div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">
            {activeOrg.legalName}
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            District: <strong className="text-stone-800">{activeOrg.district}</strong> • Subscription: <span className="text-emerald-700 font-semibold">{activeOrg.subscriptionPlan}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenBulkImport}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded border border-stone-300 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Bulk CSV Onboarding
          </button>
          <button
            onClick={() => setActiveTab('shipments')}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Truck className="w-3.5 h-3.5" />
            Evaluate Consignments
          </button>
        </div>
      </div>

      {/* 4 Primary High-Level Stat Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Farmers */}
        <div 
          onClick={() => setActiveTab('farmers')}
          className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Registered Farmers</span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{totalFarmers.toLocaleString()}</span>
            <span className="text-xs font-semibold text-emerald-700">({verifiedFarmers} verified)</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-2">
            <span>Smallholders mapped</span>
            <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Farms & Polygons */}
        <div 
          onClick={() => setActiveTab('map')}
          className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Farm Parcels</span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Compass className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{totalFarms.toLocaleString()}</span>
            <span className="text-xs font-semibold text-stone-600">({polygonFarms} polygons)</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-2">
            <span className="text-emerald-700 font-medium">{missingGpsFarms.length === 0 ? '✓ 100% Georeferenced' : `⚠ ${missingGpsFarms.length} need GPS coordinates`}</span>
            <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Active Lots */}
        <div 
          onClick={() => setActiveTab('lots')}
          className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Traceable Lots</span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Scale className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{totalLots}</span>
            <span className="text-xs font-semibold text-stone-600">({Math.round(totalCoffeeKg / 60)} bags / {Math.round(totalCoffeeKg / 1000)}t)</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-2">
            <span>{reviewLots.length > 0 ? `⚠ ${reviewLots.length} review required` : '✓ All lots active'}</span>
            <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* Export Shipments */}
        <div 
          onClick={() => setActiveTab('shipments')}
          className="bg-white border border-stone-200 rounded-lg p-4 shadow-sm hover:border-emerald-500 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">Export Shipments</span>
            <div className="w-8 h-8 rounded bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-white transition-colors">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-stone-900">{shipments.length}</span>
            <span className="text-xs font-semibold text-emerald-700">({readyShipments.length} ready)</span>
          </div>
          <div className="mt-2 text-[11px] text-stone-500 flex items-center justify-between border-t border-stone-100 pt-2">
            <span className={blockedShipments.length > 0 ? 'text-red-700 font-bold' : 'text-stone-500'}>
              {blockedShipments.length > 0 ? `🔴 ${blockedShipments.length} blocked by evidence` : 'All consignments staged'}
            </span>
            <ArrowRight className="w-3 h-3 text-stone-400 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* CORE OPERATIONAL SECTION: EXPORT READINESS & DATA QUALITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Export Readiness Funnel (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Export Consignment Readiness Status
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Automated due-diligence rules evaluation across farmers, GPS polygons, delivery balance, and UCDA certs.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('shipments')}
              className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
            >
              Inspect All <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Status Breakdown Pills */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50/80 border border-emerald-200 rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                Ready for Review
              </div>
              <div className="text-2xl font-black text-emerald-900 mt-1">{readyShipments.length}</div>
              <div className="text-[11px] text-emerald-800 mt-0.5">Evidence complete (GREEN)</div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200 rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                Review Required
              </div>
              <div className="text-2xl font-black text-amber-900 mt-1">{reviewShipments.length}</div>
              <div className="text-[11px] text-amber-800 mt-0.5">Non-blocking warnings (YELLOW)</div>
            </div>

            <div className="bg-red-50/80 border border-red-200 rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-900">
                <XCircle className="w-4 h-4 text-red-700" />
                Blocked (Missing Data)
              </div>
              <div className="text-2xl font-black text-red-900 mt-1">{blockedShipments.length}</div>
              <div className="text-[11px] text-red-800 mt-0.5">Critical blockers present (RED)</div>
            </div>
          </div>

          {/* Active Shipments Queue Table */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">Active Consignments Queue</div>
            <div className="divide-y divide-stone-100 border border-stone-200 rounded-md overflow-hidden">
              {shipments.map(shipment => {
                const statusColor = 
                  shipment.readinessStatus === 'GREEN' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                  shipment.readinessStatus === 'YELLOW' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                  'bg-red-100 text-red-900 border-red-300';
                
                return (
                  <div
                    key={shipment.id}
                    onClick={() => {
                      onSelectShipment(shipment.id);
                      setActiveTab('shipments');
                    }}
                    className="p-3 bg-white hover:bg-stone-50 transition-colors flex items-center justify-between cursor-pointer group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 group-hover:text-emerald-800 transition-colors">
                          {shipment.exportReference}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                          {shipment.readinessStatus === 'GREEN' ? 'READY FOR REVIEW' : shipment.readinessStatus === 'YELLOW' ? 'REVIEW REQUIRED' : 'BLOCKED'}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500">
                        Buyer: <strong className="text-stone-700">{shipment.buyerName}</strong> ({shipment.destinationCountry} - {shipment.destinationPort})
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-900">
                        {shipment.totalQuantityKg.toLocaleString()} kg
                      </div>
                      <div className="text-[11px] text-stone-500">
                        {shipment.linkedLotIds.length} lot(s) • {shipment.coffeeType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Data Quality & Integrity Column (1 col) */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Data Quality & Due-Diligence Gaps
            </h2>
            <p className="text-xs text-stone-500 mt-2">
              Proactive integrity checks to resolve upstream data gaps before export packing.
            </p>

            <div className="space-y-3 mt-4">
              
              {/* Missing GPS */}
              <div 
                onClick={() => setActiveTab('map')}
                className="flex items-center justify-between p-2.5 rounded bg-stone-50 border border-stone-200 hover:border-amber-400 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${missingGpsFarms.length > 0 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {missingGpsFarms.length}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">Missing Farm GPS / Coordinates</div>
                    <div className="text-[11px] text-stone-500">Parcels without verified Uganda lat/long</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </div>

              {/* Point-only vs Polygon */}
              <div 
                onClick={() => setActiveTab('map')}
                className="flex items-center justify-between p-2.5 rounded bg-stone-50 border border-stone-200 hover:border-amber-400 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-amber-100 text-amber-800 flex items-center justify-center text-xs font-bold">
                    {totalFarms - polygonFarms}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">Point-Only Farm Geometries</div>
                    <div className="text-[11px] text-stone-500">Parcels requiring full polygon boundary survey</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </div>

              {/* Incomplete Farmer Profiles */}
              <div 
                onClick={() => setActiveTab('farmers')}
                className="flex items-center justify-between p-2.5 rounded bg-stone-50 border border-stone-200 hover:border-amber-400 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded bg-stone-200 text-stone-800 flex items-center justify-center text-xs font-bold">
                    {totalFarmers - verifiedFarmers}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-stone-900">Unverified Smallholders</div>
                    <div className="text-[11px] text-stone-500">Pending consent agreement or NIN record</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
              </div>

              {/* Coffee Volume Breakdown */}
              <div className="p-3 bg-stone-50 rounded border border-stone-200 space-y-2 mt-4">
                <div className="text-xs font-bold text-stone-700 uppercase tracking-wider">Coffee Volume Traceability</div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-600 font-medium">Robusta (Greater Masaka / Central):</span>
                  <span className="font-bold text-stone-900">{robustaKg.toLocaleString()} kg ({Math.round((robustaKg / totalCoffeeKg) * 100 || 0)}%)</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden flex">
                  <div className="bg-emerald-700 h-2" style={{ width: `${(robustaKg / totalCoffeeKg) * 100 || 0}%` }}></div>
                  <div className="bg-amber-600 h-2" style={{ width: `${(arabicaKg / totalCoffeeKg) * 100 || 0}%` }}></div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-stone-600 font-medium">Arabica (Elgon / Rwenzori):</span>
                  <span className="font-bold text-stone-900">{arabicaKg.toLocaleString()} kg ({Math.round((arabicaKg / totalCoffeeKg) * 100 || 0)}%)</span>
                </div>
              </div>

            </div>
          </div>

          <div className="pt-3 border-t border-stone-100 text-[11px] text-stone-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Audit trail auto-synchronized to system events.</span>
          </div>
        </div>

      </div>

      {/* RECENT AUDIT TRAIL / ACTIVITY FEED */}
      <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-700" />
            Recent Supply-Chain & Evidence Audit Log
          </div>
          <button 
            onClick={() => setActiveTab('audit')}
            className="text-xs text-emerald-800 font-bold hover:underline"
          >
            View Full Audit Trail ({auditLogs.length})
          </button>
        </div>

        <div className="divide-y divide-stone-100">
          {auditLogs.slice(0, 5).map(log => (
            <div key={log.id} className="py-2.5 flex items-start justify-between text-xs gap-4">
              <div>
                <span className="font-bold text-stone-800">{log.userName}</span>
                <span className="text-stone-500 font-mono text-[11px] ml-2">({log.userRole})</span>
                <div className="text-stone-700 font-medium mt-0.5">
                  <span className="text-emerald-800 font-semibold">{log.action}</span> on {log.entity} <code className="bg-stone-100 px-1 py-0.5 rounded text-[11px]">{log.entityId}</code>
                </div>
                {log.newValue && (
                  <div className="text-stone-500 text-[11px] truncate max-w-lg mt-0.5">
                    Value: {log.newValue}
                  </div>
                )}
              </div>
              <div className="text-[11px] text-stone-400 font-mono whitespace-nowrap">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
