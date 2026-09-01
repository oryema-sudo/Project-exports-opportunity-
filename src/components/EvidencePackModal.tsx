import React from 'react';
import { Shipment, ReadinessScorecard } from '../types';
import { appStore } from '../services/store';
import { AstroKahawaLogo, AstroKahawaIcon } from './AstroKahawaLogo';
import { 
  ShieldCheck, 
  Download, 
  Printer, 
  X, 
  MapPin, 
  Building2, 
  Calendar, 
  Globe, 
  Scale, 
  Layers, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Compass
} from 'lucide-react';

interface EvidencePackModalProps {
  shipmentId: string;
  onClose: () => void;
}

export const EvidencePackModal: React.FC<EvidencePackModalProps> = ({
  shipmentId,
  onClose
}) => {
  const state = appStore.getState();
  const shipment = state.shipments.find(s => s.id === shipmentId);
  const scorecard = appStore.getShipmentScorecard(shipmentId);
  const activeOrg = state.organizations.find(o => o.id === state.activeOrgId) || state.organizations[0];

  if (!shipment || !scorecard) return null;

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

  const reportRef = `DOSSIER-UG-${shipment.exportReference}-${Date.now().toString().slice(-4)}`;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadGeoJson = () => {
    const geoData = appStore.generateShipmentGeoJson(shipment.id);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(geoData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GeoJSON_${shipment.exportReference}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Container / Printable Dossier */}
      <div className="bg-white rounded-lg max-w-4xl w-full my-6 p-6 sm:p-8 border border-stone-300 shadow-2xl space-y-6 text-stone-900 text-xs print:p-0 print:border-none print:shadow-none">
        
        {/* Modal Top Bar (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-stone-200 pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-emerald-100 text-emerald-800">
              <FileText className="w-4 h-4" />
            </span>
            <span className="font-bold text-sm text-stone-900">Export Traceability & Due-Diligence Evidence Pack</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleDownloadGeoJson}
              className="bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold px-2.5 py-1.5 rounded border border-stone-300 flex items-center gap-1.5 transition-colors text-xs"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-700" />
              <span className="hidden xs:inline">Download</span> GeoJSON
            </button>

            <button
              onClick={handlePrint}
              className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded shadow-xs flex items-center gap-1.5 transition-colors text-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / PDF
            </button>

            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-stone-700 text-lg font-bold"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ==================================================== */}
        {/* OFFICIAL DOSSIER CONTENT STARTS HERE */}
        {/* ==================================================== */}
        
        {/* Header Section with Official ASTROKAHAWA Styling */}
        <div className="border-b-2 border-stone-900 pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="mb-2">
                <AstroKahawaLogo size="md" variant="light" showTagline={true} />
              </div>
              <h1 className="text-xl font-black text-stone-900 mt-1 tracking-tight uppercase">
                Export Due-Diligence Evidence Dossier
              </h1>
              <div className="text-stone-600 text-xs mt-1">
                Organization: <strong className="text-stone-900">{activeOrg.legalName}</strong> (Registration: {activeOrg.registrationNumber})
              </div>
              <div className="text-[11px] text-stone-500">
                {activeOrg.address}, {activeOrg.district}, Uganda • Phone: {activeOrg.contactPhone}
              </div>
            </div>

            <div className="text-left sm:text-right font-mono text-[11px] space-y-0.5 bg-stone-50 p-2.5 rounded border border-stone-200">
              <div><strong>Report Reference:</strong> {reportRef}</div>
              <div><strong>Generated Date:</strong> {new Date().toISOString().split('T')[0]}</div>
              <div><strong>Generated By:</strong> {state.currentUser.name} ({state.currentUser.role})</div>
              <div><strong>System Layer:</strong> ASTROKAHAWA OS v1.0</div>
            </div>
          </div>
        </div>

        {/* Regulatory Disclaimer Notice (Mandatory per Product Positioning) */}
        <div className="p-3 bg-stone-50 border border-stone-300 rounded text-[10px] text-stone-700 leading-relaxed">
          <strong>LEGAL & REGULATORY NOTICE:</strong> This document is a system-generated supply-chain traceability and export-readiness evidence report compiled from primary producer records, GNSS field mapping, weighbridge intakes, and accredited quality certificates. This dossier organizes due-diligence data to assist exporters and international buyers with regulatory workflows; it does not itself constitute a statutory government export guarantee or legal warranty of EUDR compliance.
        </div>

        {/* 1. Shipment Overview Table */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1">
            1. Consignment & Export Destination Overview
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded border border-stone-200">
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Export Reference</span>
              <div className="font-bold text-stone-900 font-mono text-xs">{shipment.exportReference}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Coffee Variety</span>
              <div className="font-bold text-stone-900">{shipment.coffeeType}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Total Export Weight</span>
              <div className="font-bold text-stone-900 font-mono">{shipment.totalQuantityKg.toLocaleString()} kg ({Math.round(shipment.totalQuantityKg / 60)} bags)</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Scheduled Export Date</span>
              <div className="font-bold text-stone-900">{shipment.shipmentDate}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">International Buyer</span>
              <div className="font-bold text-stone-900">{shipment.buyerName}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Destination Port / Country</span>
              <div className="font-bold text-stone-900">{shipment.destinationPort}, {shipment.destinationCountry}</div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Readiness Status</span>
              <div className="font-bold text-emerald-900 font-mono">
                {scorecard.overallStatus === 'GREEN' ? 'READY FOR REVIEW' : scorecard.overallStatus === 'YELLOW' ? 'REVIEW REQUIRED' : 'BLOCKED'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 uppercase font-semibold">Overall Readiness Score</span>
              <div className="font-bold font-mono text-stone-900">{scorecard.overallScorePercent}% Score</div>
            </div>
          </div>
        </div>

        {/* 2. Readiness Evaluation Breakdown */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1">
            2. Due-Diligence Readiness Scores & Evidence Checklist
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2 border border-stone-200 rounded bg-stone-50">
              <div className="text-[10px] text-stone-500 font-semibold">Data Completeness</div>
              <div className="text-sm font-bold font-mono text-stone-900">{scorecard.dataCompletenessScorePercent}%</div>
            </div>
            <div className="p-2 border border-stone-200 rounded bg-stone-50">
              <div className="text-[10px] text-stone-500 font-semibold">Geospatial Validity</div>
              <div className="text-sm font-bold font-mono text-stone-900">{scorecard.geospatialScorePercent}%</div>
            </div>
            <div className="p-2 border border-stone-200 rounded bg-stone-50">
              <div className="text-[10px] text-stone-500 font-semibold">Traceability Chain</div>
              <div className="text-sm font-bold font-mono text-stone-900">{scorecard.traceabilityScorePercent}%</div>
            </div>
            <div className="p-2 border border-stone-200 rounded bg-stone-50">
              <div className="text-[10px] text-stone-500 font-semibold">Documentation</div>
              <div className="text-sm font-bold font-mono text-stone-900">{scorecard.documentationScorePercent}%</div>
            </div>
          </div>
        </div>

        {/* 3. Contributing Smallholder Farm Manifest & Geolocation */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1 flex justify-between">
            <span>3. Source Farm Parcels & GNSS Geolocation Manifest</span>
            <span className="font-mono text-[10px] text-stone-500">{linkedFarms.length} Farm Parcels</span>
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[11px] border border-stone-200">
              <thead>
                <tr className="bg-stone-100 border-b border-stone-300 font-bold text-stone-700">
                  <th className="p-1.5">Farmer Name</th>
                  <th className="p-1.5">National ID / Ref</th>
                  <th className="p-1.5">District / Village</th>
                  <th className="p-1.5">Latitude (°N)</th>
                  <th className="p-1.5">Longitude (°E)</th>
                  <th className="p-1.5">Area (Ha)</th>
                  <th className="p-1.5">Geometry</th>
                  <th className="p-1.5">GNSS Precision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {linkedFarms.map(f => {
                  const farmer = linkedFarmers.find(fm => fm.id === f.farmerId);
                  return (
                    <tr key={f.id}>
                      <td className="p-1.5 font-semibold text-stone-900">{farmer?.fullName || 'Unknown'}</td>
                      <td className="p-1.5 font-mono text-[10px] text-stone-600">{farmer?.nationalId || farmer?.farmerRegId || 'N/A'}</td>
                      <td className="p-1.5 text-stone-700">{f.district}, {f.village}</td>
                      <td className="p-1.5 font-mono">{f.latitude.toFixed(5)}°</td>
                      <td className="p-1.5 font-mono">{f.longitude.toFixed(5)}°</td>
                      <td className="p-1.5 font-mono font-bold">{f.plotArea}</td>
                      <td className="p-1.5">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-stone-100 text-stone-800">
                          {f.geometryType}
                        </span>
                      </td>
                      <td className="p-1.5 font-mono text-[10px]">±{f.mappingAccuracyMeters}m</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Traceability Custody Chain */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1">
            4. Supply Chain Physical Custody Timeline
          </h2>
          <div className="divide-y divide-stone-200 border border-stone-200 rounded">
            {linkedEvents.map(evt => (
              <div key={evt.id} className="p-2 flex items-start justify-between text-[11px]">
                <div>
                  <span className="font-bold text-stone-900">{evt.eventType}</span> • <span className="text-stone-600">{evt.location}</span>
                  <div className="text-stone-500 text-[10px] mt-0.5">
                    {evt.notes} | Officer: {evt.responsibleParty} {evt.referenceDocNumber ? `(Ref: ${evt.referenceDocNumber})` : ''}
                  </div>
                </div>
                <div className="font-mono text-stone-600 font-bold whitespace-nowrap">
                  {new Date(evt.dateTime).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Document Repository Index */}
        <div className="space-y-2">
          <h2 className="text-xs font-black uppercase tracking-wider text-stone-900 border-b border-stone-300 pb-1">
            5. Attached Supporting Evidence & Certificates Index
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {linkedDocs.map(d => (
              <div key={d.id} className="p-2 border border-stone-200 rounded bg-stone-50 text-[11px]">
                <div className="font-bold text-stone-900">{d.fileName}</div>
                <div className="text-stone-500 text-[10px]">{d.type} • Status: <strong className="text-emerald-800">{d.verificationStatus}</strong></div>
              </div>
            ))}
          </div>
        </div>

        {/* Signatures & Certification Block */}
        <div className="pt-6 border-t-2 border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 text-[11px]">
          <div>
            <div className="text-stone-500 mb-4 sm:mb-6">Prepared & Verified By (Exporter Quality / Compliance Officer):</div>
            <div className="border-b border-stone-400 pb-1 font-bold text-stone-900">{state.currentUser.name}</div>
            <div className="text-stone-500 text-[10px] mt-0.5">{state.currentUser.title || 'Export Compliance Officer'} • {activeOrg.legalName}</div>
          </div>

          <div>
            <div className="text-stone-500 mb-4 sm:mb-6">Operations & Quality Authorization Signature:</div>
            <div className="border-b border-stone-400 pb-1 font-bold text-stone-900">Mbabazi Grace (Authorized Signatory)</div>
            <div className="text-stone-500 text-[10px] mt-0.5">Head of Quality & Compliance • UCDA Traceability Node</div>
          </div>
        </div>

      </div>

    </div>
  );
};
