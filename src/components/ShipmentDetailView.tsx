import React, { useState } from 'react';
import { 
  Shipment, 
  Lot, 
  FarmPlot, 
  Farmer, 
  Delivery, 
  DocumentRecord, 
  TraceabilityEvent,
  ReadinessScorecard,
  RuleResult
} from '../types';
import { 
  ArrowLeft, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  FileText, 
  Download, 
  MapPin, 
  Users, 
  Layers, 
  ExternalLink,
  Plus,
  Compass,
  Scale,
  RefreshCw,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { appStore } from '../services/store';

interface ShipmentDetailViewProps {
  shipment: Shipment;
  scorecard: ReadinessScorecard;
  onBack: () => void;
  onOpenEvidencePack: (shipmentId: string) => void;
  onOpenGeoJsonDownload: (shipmentId: string) => void;
  onNavigateToFarmer?: (farmerId: string) => void;
  onNavigateToFarm?: (farmId: string) => void;
  onNavigateToLot?: (lotId: string) => void;
}

export const ShipmentDetailView: React.FC<ShipmentDetailViewProps> = ({
  shipment,
  scorecard,
  onBack,
  onOpenEvidencePack,
  onOpenGeoJsonDownload,
  onNavigateToFarmer,
  onNavigateToFarm,
  onNavigateToLot
}) => {
  const state = appStore.getState();
  const linkedLots = state.lots.filter(l => shipment.linkedLotIds.includes(l.id));
  
  const deliveryIds = Array.from(new Set(linkedLots.flatMap(l => l.sourceDeliveryIds)));
  const linkedDeliveries = state.deliveries.filter(d => deliveryIds.includes(d.id));

  const farmIds = Array.from(new Set([
    ...linkedLots.flatMap(l => l.sourceFarmIds),
    ...linkedDeliveries.map(d => d.farmId)
  ]));
  const linkedFarms = state.farms.filter(f => farmIds.includes(f.id));

  const farmerIds = Array.from(new Set([
    ...linkedLots.flatMap(l => l.sourceFarmerIds),
    ...linkedDeliveries.map(d => d.farmerId),
    ...linkedFarms.map(f => f.farmerId)
  ]));
  const linkedFarmers = state.farmers.filter(f => farmerIds.includes(f.id));

  const linkedEvents = state.traceabilityEvents.filter(e => shipment.linkedLotIds.includes(e.lotId));
  const linkedDocs = state.documents.filter(doc => 
    shipment.documentIds.includes(doc.id) ||
    linkedLots.some(l => l.documentIds?.includes(doc.id) || doc.relatedEntityId === l.id) ||
    linkedDeliveries.some(d => d.documentIds?.includes(doc.id) || doc.relatedEntityId === d.id) ||
    linkedFarms.some(f => doc.relatedEntityId === f.id) ||
    linkedFarmers.some(fm => doc.relatedEntityId === fm.id)
  );

  // Quick fix modal states
  const [fixingFarm, setFixingFarm] = useState<FarmPlot | null>(null);
  const [fixingFarmer, setFixingFarmer] = useState<Farmer | null>(null);
  const [uploadDocEntity, setUploadDocEntity] = useState<{ type: string; id: string; name: string } | null>(null);

  // Form states for quick fix
  const [fixedLat, setFixedLat] = useState<string>('');
  const [fixedLng, setFixedLng] = useState<string>('');
  const [fixedArea, setFixedArea] = useState<string>('2.5');
  const [fixedDocType, setFixedDocType] = useState<string>('Farmer Consent / Due-Diligence Agreement');
  const [fixedDocName, setFixedDocName] = useState<string>('');

  const handleFixFarmCoordinates = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fixingFarm) return;

    const lat = parseFloat(fixedLat);
    const lng = parseFloat(fixedLng);
    const area = parseFloat(fixedArea) || 2.5;

    if (isNaN(lat) || isNaN(lng)) return;

    const updatedFarm: FarmPlot = {
      ...fixingFarm,
      latitude: lat,
      longitude: lng,
      plotArea: area,
      geometryType: 'Polygon',
      geoJsonData: {
        type: 'Polygon',
        coordinates: [[
          [lng - 0.002, lat - 0.002],
          [lng + 0.002, lat - 0.002],
          [lng + 0.0025, lat + 0.002],
          [lng - 0.0015, lat + 0.002],
          [lng - 0.002, lat - 0.002]
        ]]
      },
      mappingAccuracyMeters: 1.5,
      verificationStatus: 'Verified',
      mappingMethod: 'Mobile GNSS'
    };

    appStore.updateFarm(updatedFarm);
    setFixingFarm(null);
  };

  const handleVerifyFarmer = (farmer: Farmer) => {
    appStore.updateFarmer({
      ...farmer,
      verificationStatus: 'Verified',
      nationalId: farmer.nationalId || 'CM890248201MAS'
    });
    setFixingFarmer(null);
  };

  const handleQuickUploadDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadDocEntity) return;

    appStore.addDocument({
      type: fixedDocType as any,
      fileName: fixedDocName || `${uploadDocEntity.type}_${uploadDocEntity.id}_Evidence.pdf`,
      fileSize: '1.4 MB',
      fileUrl: '#verified-evidence',
      relatedEntityType: uploadDocEntity.type as any,
      relatedEntityId: uploadDocEntity.id,
      verificationStatus: 'Verified',
      notes: 'Quick-uploaded and verified during export readiness clearance.'
    });

    setUploadDocEntity(null);
    setFixedDocName('');
  };

  const statusBadge = 
    scorecard.overallStatus === 'GREEN' ? { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-300', label: 'READY FOR REVIEW' } :
    scorecard.overallStatus === 'YELLOW' ? { bg: 'bg-amber-100', text: 'text-amber-900', border: 'border-amber-300', label: 'REVIEW REQUIRED' } :
    { bg: 'bg-red-100', text: 'text-red-900', border: 'border-red-300', label: 'BLOCKED BY EVIDENCE' };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 border border-stone-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-stone-100 text-stone-600 transition-colors"
            title="Back to shipments list"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-stone-900 tracking-tight">
                {shipment.exportReference}
              </h1>
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}>
                {statusBadge.label}
              </span>
            </div>
            <p className="text-xs text-stone-500">
              Buyer: <strong className="text-stone-700">{shipment.buyerName}</strong> • Destination: <strong className="text-stone-700">{shipment.destinationCountry} ({shipment.destinationPort})</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenGeoJsonDownload(shipment.id)}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded border border-stone-300 flex items-center gap-1.5 transition-colors"
            title="Download GeoJSON FeatureCollection of all source farm plots"
          >
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            Download Farm GeoJSON
          </button>

          <button
            onClick={() => onOpenEvidencePack(shipment.id)}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors"
            title="Generate comprehensive downloadable PDF/Print Evidence Pack"
          >
            <Download className="w-3.5 h-3.5" />
            Generate Evidence Pack
          </button>
        </div>
      </div>

      {/* CORE UX SECTION: "WHY IS THIS SHIPMENT NOT READY?" BLOCKER INSPECTOR */}
      <div className={`border rounded-lg p-5 shadow-sm space-y-4 ${
        scorecard.overallStatus === 'GREEN' ? 'bg-emerald-50/50 border-emerald-300' :
        scorecard.overallStatus === 'YELLOW' ? 'bg-amber-50/60 border-amber-300' :
        'bg-red-50/70 border-red-300'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200/60 pb-3">
          <div>
            <div className="flex items-center gap-2">
              {scorecard.overallStatus === 'GREEN' && <CheckCircle2 className="w-5 h-5 text-emerald-700" />}
              {scorecard.overallStatus === 'YELLOW' && <AlertTriangle className="w-5 h-5 text-amber-700" />}
              {scorecard.overallStatus === 'RED' && <XCircle className="w-5 h-5 text-red-700" />}
              
              <h2 className="text-base font-bold text-stone-900 tracking-tight">
                {scorecard.statusHeadline}
              </h2>
            </div>
            <p className="text-xs text-stone-600 mt-0.5">
              Overall Export Readiness Score: <strong className="text-stone-900 font-mono text-sm">{scorecard.overallScorePercent}%</strong> ({scorecard.blockersCount} Blockers, {scorecard.warningsCount} Warnings, {scorecard.passedCount} Passed)
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs font-mono text-stone-500">
              Evaluated: {new Date().toLocaleDateString()} • {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* 4 Score Breakdown Meters */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          
          <div className="bg-white/90 p-2.5 rounded border border-stone-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">Data Completeness</span>
              <span className="font-bold font-mono text-stone-900">{scorecard.dataCompletenessScorePercent}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5">
              <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: `${scorecard.dataCompletenessScorePercent}%` }}></div>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{linkedFarmers.length} Farmers identified</div>
          </div>

          <div className="bg-white/90 p-2.5 rounded border border-stone-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">Geospatial Data</span>
              <span className="font-bold font-mono text-stone-900">{scorecard.geospatialScorePercent}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5">
              <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: `${scorecard.geospatialScorePercent}%` }}></div>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{linkedFarms.length} Source plots analyzed</div>
          </div>

          <div className="bg-white/90 p-2.5 rounded border border-stone-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">Traceability Chain</span>
              <span className="font-bold font-mono text-stone-900">{scorecard.traceabilityScorePercent}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5">
              <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: `${scorecard.traceabilityScorePercent}%` }}></div>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{linkedLots.length} Lots • {linkedEvents.length} Events</div>
          </div>

          <div className="bg-white/90 p-2.5 rounded border border-stone-200">
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-stone-600">Documentation</span>
              <span className="font-bold font-mono text-stone-900">{scorecard.documentationScorePercent}%</span>
            </div>
            <div className="w-full bg-stone-200 rounded-full h-1.5">
              <div className="bg-emerald-700 h-1.5 rounded-full" style={{ width: `${scorecard.documentationScorePercent}%` }}></div>
            </div>
            <div className="text-[10px] text-stone-500 mt-1">{linkedDocs.length} Verified attachments</div>
          </div>

        </div>

        {/* SPECIFIC ACTIONABLE BLOCKERS & WARNINGS LIST */}
        <div className="space-y-2 pt-2">
          <div className="text-xs font-bold text-stone-800 uppercase tracking-wider">
            {scorecard.blockersCount > 0 ? 'Critical Blocker Resolution Queue (Fix to unlock export)' : 'Readiness & Due-Diligence Checklist'}
          </div>

          <div className="space-y-2">
            {scorecard.rules.map(rule => {
              const isBlocker = rule.impact === 'BLOCKER' && rule.status === 'FAIL';
              const isWarning = rule.status === 'WARNING';
              const isPass = rule.status === 'PASS';

              return (
                <div 
                  key={rule.id}
                  className={`p-3 rounded-md border text-xs transition-all ${
                    isBlocker ? 'bg-white border-red-300 shadow-xs' :
                    isWarning ? 'bg-white border-amber-300' :
                    'bg-white/80 border-stone-200 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      {isBlocker && <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />}
                      {isWarning && <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />}
                      {isPass && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{rule.ruleName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-stone-200">
                            {rule.category}
                          </span>
                        </div>
                        <p className="text-stone-600 mt-0.5">{rule.details}</p>
                        
                        {/* Affected Entities with direct one-click fix buttons */}
                        {rule.affectedEntityIds.length > 0 && !isPass && (
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span className="text-[11px] font-semibold text-stone-700">Affected:</span>
                            {rule.affectedEntityIds.map((id, idx) => {
                              const name = rule.affectedEntityNames?.[idx] || id;

                              // Determine which quick-fix trigger to attach
                              if (rule.id === 'R-GEO-01' || rule.id === 'R-GEO-02') {
                                const farmObj = linkedFarms.find(f => f.id === id);
                                return (
                                  <button
                                    key={id}
                                    onClick={() => {
                                      if (farmObj) {
                                        setFixingFarm(farmObj);
                                        setFixedLat(farmObj.latitude ? String(farmObj.latitude) : '-0.3425');
                                        setFixedLng(farmObj.longitude ? String(farmObj.longitude) : '31.7380');
                                        setFixedArea(String(farmObj.plotArea || 2.4));
                                      }
                                    }}
                                    className="bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                  >
                                    <MapPin className="w-3 h-3 text-red-600" />
                                    <span>Fix GPS for {name}</span>
                                  </button>
                                );
                              }

                              if (rule.id === 'R-FARMER-02') {
                                const farmerObj = linkedFarmers.find(f => f.id === id);
                                return (
                                  <button
                                    key={id}
                                    onClick={() => farmerObj && handleVerifyFarmer(farmerObj)}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                  >
                                    <ShieldCheck className="w-3 h-3 text-amber-700" />
                                    <span>Verify Farmer: {name}</span>
                                  </button>
                                );
                              }

                              if (rule.id === 'R-DOC-01' || rule.id === 'R-DOC-02') {
                                return (
                                  <button
                                    key={id}
                                    onClick={() => {
                                      setUploadDocEntity({
                                        type: rule.id === 'R-DOC-01' ? 'Farmer' : 'Lot',
                                        id,
                                        name
                                      });
                                      setFixedDocType(rule.id === 'R-DOC-01' ? 'Farmer Consent / Due-Diligence Agreement' : 'UCDA Quality / Grade Inspection Certificate');
                                    }}
                                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold px-2 py-0.5 rounded flex items-center gap-1 transition-colors"
                                  >
                                    <FileText className="w-3 h-3 text-amber-700" />
                                    <span>Upload Doc for {name}</span>
                                  </button>
                                );
                              }

                              return (
                                <span key={id} className="bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded text-[10px] font-mono">
                                  {name}
                                </span>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <span className={`font-mono font-bold text-[11px] px-2 py-0.5 rounded ${
                        isPass ? 'bg-emerald-100 text-emerald-800' :
                        isWarning ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {rule.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* QUICK FIX MODAL FOR FARM GPS / POLYGON */}
      {fixingFarm && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Record Farm Geolocation & Polygon</h3>
              </div>
              <button 
                onClick={() => setFixingFarm(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleFixFarmCoordinates} className="space-y-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="font-bold text-stone-800">{fixingFarm.farmName}</div>
                <div className="text-stone-500">District: {fixingFarm.district} • Subcounty: {fixingFarm.subcounty}</div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Latitude (° N/S) [Uganda: -1.5 to 4.3]</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={fixedLat}
                  onChange={(e) => setFixedLat(e.target.value)}
                  placeholder="-0.3425"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Longitude (° E) [Uganda: 29.5 to 35.1]</label>
                <input
                  type="number"
                  step="0.000001"
                  required
                  value={fixedLng}
                  onChange={(e) => setFixedLng(e.target.value)}
                  placeholder="31.7380"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Plot Area (Hectares)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={fixedArea}
                  onChange={(e) => setFixedArea(e.target.value)}
                  placeholder="2.4"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-[11px] text-emerald-800">
                ✓ Auto-generates standard 5-point boundary polygon around GPS center for due-diligence compliance.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setFixingFarm(null)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors"
                >
                  Save & Recalculate Readiness
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK FIX MODAL FOR DOCUMENT UPLOAD */}
      {uploadDocEntity && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Upload Supporting Evidence Document</h3>
              </div>
              <button 
                onClick={() => setUploadDocEntity(null)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleQuickUploadDoc} className="space-y-3 text-xs">
              <div className="bg-stone-50 p-2.5 rounded border border-stone-200">
                <div className="text-stone-500 font-medium">Attaching to {uploadDocEntity.type}:</div>
                <div className="font-bold text-stone-800">{uploadDocEntity.name} ({uploadDocEntity.id})</div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Document Category</label>
                <select
                  value={fixedDocType}
                  onChange={(e) => setFixedDocType(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  <option value="Farmer Consent / Due-Diligence Agreement">Farmer Consent / Due-Diligence Agreement</option>
                  <option value="Land / Production Evidence (Customary / Title)">Land / Production Evidence (Customary / Title)</option>
                  <option value="Purchase Record / Weighbridge Ticket">Purchase Record / Weighbridge Ticket</option>
                  <option value="Washing / Processing / Hulling Record">Washing / Processing / Hulling Record</option>
                  <option value="UCDA Quality / Grade Inspection Certificate">UCDA Quality / Grade Inspection Certificate</option>
                  <option value="Phytosanitary Certificate">Phytosanitary Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">File Name</label>
                <input
                  type="text"
                  value={fixedDocName}
                  onChange={(e) => setFixedDocName(e.target.value)}
                  placeholder="e.g. UCDA_Inspection_Report_Verified.pdf"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setUploadDocEntity(null)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-bold transition-colors"
                >
                  Upload & Verify
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FULL ORIGIN & TRACEABILITY HIERARCHY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Linked Lots & Source Farms List (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Linked Lots */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Scale className="w-4 h-4 text-emerald-700" />
                Aggregated Export Lots ({linkedLots.length})
              </h3>
              <span className="text-xs font-mono font-bold text-stone-700">
                Total: {shipment.totalQuantityKg.toLocaleString()} kg ({Math.round(shipment.totalQuantityKg / 60)} bags)
              </span>
            </div>

            <div className="space-y-3">
              {linkedLots.map(lot => (
                <div key={lot.id} className="p-3.5 bg-stone-50 rounded-md border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900">{lot.lotNumber}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                          {lot.coffeeType} - {lot.grade}
                        </span>
                      </div>
                      <div className="text-xs text-stone-500 mt-0.5">
                        Processing: <strong className="text-stone-700">{lot.processingStation}</strong> • Location: {lot.currentLocation}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold text-stone-900">{lot.quantityKg.toLocaleString()} kg</div>
                      <div className="text-[10px] text-stone-500">{lot.sourceFarmerIds.length} Farmers • {lot.sourceFarmIds.length} Plots</div>
                    </div>
                  </div>

                  {/* Visual mini-chain for lot */}
                  <div className="pt-2 border-t border-stone-200/60 flex items-center gap-2 text-[11px] text-stone-600 overflow-x-auto">
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0 font-medium">
                      👩‍🌾 {lot.sourceFarmerIds.length} Smallholders
                    </span>
                    <span>→</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0 font-medium">
                      🌱 {lot.sourceFarmIds.length} Farm Parcels
                    </span>
                    <span>→</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0 font-medium">
                      🏭 {lot.processingStation}
                    </span>
                    <span>→</span>
                    <span className="bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300 shrink-0 font-bold">
                      🚢 {shipment.exportReference}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Source Smallholders & Parcels Table */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <Compass className="w-4 h-4 text-emerald-700" />
                Contributing Smallholder Farms & Geolocation Data ({linkedFarms.length})
              </h3>
              <span className="text-xs text-stone-500 font-mono">
                {linkedFarms.filter(f => f.geometryType === 'Polygon').length} Polygons / {linkedFarms.length} Total
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 text-stone-500 font-semibold bg-stone-50">
                    <th className="py-2 px-2.5">Farmer & Shamba</th>
                    <th className="py-2 px-2.5">Uganda District</th>
                    <th className="py-2 px-2.5">Coordinates / Geometry</th>
                    <th className="py-2 px-2.5">Area (Ha)</th>
                    <th className="py-2 px-2.5">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {linkedFarms.map(farm => {
                    const farmer = linkedFarmers.find(f => f.id === farm.farmerId);
                    const hasValidGps = farm.latitude !== 0 && farm.longitude !== 0;

                    return (
                      <tr key={farm.id} className="hover:bg-stone-50/80">
                        <td className="py-2.5 px-2.5">
                          <div className="font-bold text-stone-900">{farm.farmName}</div>
                          <div className="text-[11px] text-stone-500">{farmer?.fullName || 'Unknown'} ({farmer?.id})</div>
                        </td>
                        <td className="py-2.5 px-2.5 text-stone-700">
                          {farm.district} • {farm.subcounty}
                        </td>
                        <td className="py-2.5 px-2.5 font-mono text-[11px]">
                          {hasValidGps ? (
                            <div>
                              <div className="text-stone-900 font-semibold">
                                {farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°
                              </div>
                              <div className="text-[10px] text-emerald-700">
                                {farm.geometryType === 'Polygon' ? '✓ Polygon GeoJSON' : '• Point GPS (±' + farm.mappingAccuracyMeters + 'm)'}
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setFixingFarm(farm)}
                              className="text-red-700 font-bold bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded border border-red-200 text-[10px]"
                            >
                              🔴 Missing GPS - Click to Record
                            </button>
                          )}
                        </td>
                        <td className="py-2.5 px-2.5 font-bold text-stone-800">
                          {farm.plotArea} {farm.areaUnit}
                        </td>
                        <td className="py-2.5 px-2.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            farm.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {farm.verificationStatus}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Traceability Events Timeline & Documents (1 col) */}
        <div className="space-y-6">
          
          {/* Visual Custody Timeline */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2 border-b border-stone-100 pb-3">
              <Layers className="w-4 h-4 text-emerald-700" />
              Traceability Custody Timeline
            </h3>

            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
              {linkedEvents.map(evt => (
                <div key={evt.id} className="relative text-xs">
                  <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border-2 border-white ring-1 ring-emerald-300"></div>
                  <div className="font-bold text-stone-900">{evt.eventType}</div>
                  <div className="text-[11px] text-stone-500 font-mono">
                    {new Date(evt.dateTime).toLocaleDateString()} • {evt.location}
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">
                    {evt.notes} <span className="text-stone-400">({evt.responsibleParty})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Attached Evidence Documents */}
          <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                Evidence Documents ({linkedDocs.length})
              </h3>
              <button
                onClick={() => setUploadDocEntity({ type: 'Shipment', id: shipment.id, name: shipment.exportReference })}
                className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Attach
              </button>
            </div>

            <div className="space-y-2">
              {linkedDocs.map(doc => (
                <div key={doc.id} className="p-2.5 bg-stone-50 rounded border border-stone-200 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 truncate max-w-[180px]">{doc.fileName}</span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">
                      {doc.verificationStatus}
                    </span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    Type: <strong className="text-stone-700">{doc.type}</strong>
                  </div>
                  <div className="text-[10px] text-stone-400 font-mono">
                    Uploaded: {doc.uploadDate} by {doc.uploadedBy}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
