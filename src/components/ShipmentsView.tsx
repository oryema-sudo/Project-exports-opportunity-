import React, { useState } from 'react';
import { Shipment, CoffeeType } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  Truck, 
  Plus, 
  Search, 
  ShieldCheck, 
  AlertTriangle, 
  XCircle, 
  CheckCircle2, 
  ArrowRight, 
  Filter,
  Calendar,
  Globe
} from 'lucide-react';
import { INTERNATIONAL_BUYERS } from '../data/ugandaRegions';

interface ShipmentsViewProps {
  state: AppState;
  onSelectShipment: (shipmentId: string) => void;
  searchQuery: string;
}

export const ShipmentsView: React.FC<ShipmentsViewProps> = ({
  state,
  onSelectShipment,
  searchQuery
}) => {
  const { shipments, lots, currentUser } = state;
  const [filterReadiness, setFilterReadiness] = useState<string>('ALL');
  const [filterCoffeeType, setFilterCoffeeType] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Shipment Form State
  const [exportReference, setExportReference] = useState<string>(`EXP-GLC-EUR-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [shipmentDate, setShipmentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedBuyerIdx, setSelectedBuyerIdx] = useState<number>(0);
  const [coffeeType, setCoffeeType] = useState<CoffeeType>('Robusta');
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('Standard 60kg export bags with GrainPro liners for European roaster.');

  // Filtered shipments
  const filteredShipments = shipments.filter(s => {
    if (filterReadiness !== 'ALL' && s.readinessStatus !== filterReadiness) return false;
    if (filterCoffeeType !== 'ALL' && s.coffeeType !== filterCoffeeType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.exportReference.toLowerCase().includes(q) ||
        s.buyerName.toLowerCase().includes(q) ||
        s.destinationCountry.toLowerCase().includes(q) ||
        s.destinationPort.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableLots = lots.filter(l => l.currentStatus !== 'Shipped' && l.currentStatus !== 'Closed');

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedLotIds.length === 0) {
      alert('Please select at least one coffee lot to include in this export consignment.');
      return;
    }

    const buyer = INTERNATIONAL_BUYERS[selectedBuyerIdx] || INTERNATIONAL_BUYERS[0];
    const totalQty = lots
      .filter(l => selectedLotIds.includes(l.id))
      .reduce((sum, l) => sum + l.quantityKg, 0);

    const newShipment = await appStore.addShipment({
      exportReference,
      shipmentDate,
      buyerName: buyer.name,
      destinationCountry: buyer.country,
      destinationPort: buyer.port,
      coffeeType,
      totalQuantityKg: totalQty,
      linkedLotIds: selectedLotIds,
      exportStatus: 'Being Prepared',
      notes,
      documentIds: []
    });

    setShowCreateModal(false);
    onSelectShipment(newShipment.id);
  };

  const toggleLotSelection = (lotId: string) => {
    setSelectedLotIds(prev => 
      prev.includes(lotId) ? prev.filter(id => id !== lotId) : [...prev, lotId]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Metric Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Truck className="w-5 h-5 text-emerald-700" />
            Export Shipments & Due-Diligence Readiness
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Consignment-level evaluation of farm polygons, farmer consent, custody chain, and quality certificates.
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Stage New Consignment
          </button>
        )}
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterReadiness}
              onChange={(e) => setFilterReadiness(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
            >
              <option value="ALL">All Readiness Levels ({shipments.length})</option>
              <option value="GREEN">🟢 Ready for Review ({shipments.filter(s => s.readinessStatus === 'GREEN').length})</option>
              <option value="YELLOW">🟡 Review Required ({shipments.filter(s => s.readinessStatus === 'YELLOW').length})</option>
              <option value="RED">🔴 Blocked / Missing Data ({shipments.filter(s => s.readinessStatus === 'RED').length})</option>
            </select>

            <select
              value={filterCoffeeType}
              onChange={(e) => setFilterCoffeeType(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
            >
              <option value="ALL">All Coffee Types</option>
              <option value="Robusta">Robusta (Central & Masaka)</option>
              <option value="Arabica">Arabica (Elgon & Rwenzori)</option>
            </select>
          </div>
        </div>

        <div className="text-stone-500 font-mono text-xs">
          Showing {filteredShipments.length} of {shipments.length} consignments
        </div>
      </div>

      {/* Shipments Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredShipments.map(shipment => {
          const scorecard = appStore.getShipmentScorecard(shipment.id);
          const isGreen = shipment.readinessStatus === 'GREEN';
          const isYellow = shipment.readinessStatus === 'YELLOW';
          const isRed = shipment.readinessStatus === 'RED';

          return (
            <div
              key={shipment.id}
              onClick={() => onSelectShipment(shipment.id)}
              className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm hover:border-emerald-500 cursor-pointer transition-all flex flex-col justify-between space-y-4 group"
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-stone-500">
                    {shipment.id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    isGreen ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    isYellow ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-red-100 text-red-900 border-red-300'
                  }`}>
                    {isGreen ? 'READY FOR REVIEW' : isYellow ? 'REVIEW REQUIRED' : 'BLOCKED'}
                  </span>
                </div>

                <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-800 transition-colors">
                  {shipment.exportReference}
                </h3>
                
                <div className="text-xs text-stone-600 mt-1 flex items-center gap-1">
                  <Globe className="w-3 h-3 text-stone-400" />
                  <span>{shipment.buyerName}</span>
                </div>
                <div className="text-[11px] text-stone-500">
                  Port: <strong>{shipment.destinationPort}</strong>, {shipment.destinationCountry}
                </div>

                {/* Score Preview */}
                {scorecard && (
                  <div className="mt-3 pt-3 border-t border-stone-100">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-stone-600">Due-Diligence Readiness</span>
                      <span className="font-bold font-mono text-stone-900">{scorecard.overallScorePercent}%</span>
                    </div>
                    <div className="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={`h-1.5 rounded-full ${
                          isGreen ? 'bg-emerald-700' : isYellow ? 'bg-amber-600' : 'bg-red-600'
                        }`} 
                        style={{ width: `${scorecard.overallScorePercent}%` }}
                      ></div>
                    </div>

                    {/* Blocker Summary Line */}
                    <div className="mt-2 text-[11px]">
                      {scorecard.blockersCount > 0 ? (
                        <span className="text-red-700 font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> {scorecard.blockersCount} blocker(s) prevent export
                        </span>
                      ) : scorecard.warningsCount > 0 ? (
                        <span className="text-amber-700 font-semibold flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> {scorecard.warningsCount} review flag(s)
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> All data & polygons verified
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Volume & Action Footer */}
              <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-stone-900">{shipment.totalQuantityKg.toLocaleString()} kg</span>
                  <span className="text-stone-500 ml-1">({shipment.coffeeType})</span>
                </div>
                <div className="text-emerald-800 font-bold text-xs flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Inspect <ArrowRight className="w-3 h-3" />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* CREATE NEW SHIPMENT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-stone-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">Stage New Export Consignment</h3>
              </div>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="text-stone-400 hover:text-stone-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateShipment} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Export Reference / Contract #</label>
                <input
                  type="text"
                  required
                  value={exportReference}
                  onChange={(e) => setExportReference(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Scheduled Shipment Date</label>
                  <input
                    type="date"
                    required
                    value={shipmentDate}
                    onChange={(e) => setShipmentDate(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Primary Coffee Variety</label>
                  <select
                    value={coffeeType}
                    onChange={(e) => setCoffeeType(e.target.value as CoffeeType)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Robusta">Robusta (Central / Masaka)</option>
                    <option value="Arabica">Arabica (Elgon / Rwenzori)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">International Buyer & Port</label>
                <select
                  value={selectedBuyerIdx}
                  onChange={(e) => setSelectedBuyerIdx(parseInt(e.target.value))}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  {INTERNATIONAL_BUYERS.map((b, idx) => (
                    <option key={b.name} value={idx}>
                      {b.name} — {b.port}, {b.country}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Available Coffee Lots */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-700 font-semibold">Select Contributing Coffee Lots ({availableLots.length} available)</label>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Selected: {selectedLotIds.length} lot(s)
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-stone-200 rounded divide-y divide-stone-100 bg-stone-50 p-1">
                  {availableLots.map(lot => (
                    <label key={lot.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedLotIds.includes(lot.id)}
                        onChange={() => toggleLotSelection(lot.id)}
                        className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                      />
                      <div className="flex-1 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-stone-900">{lot.lotNumber}</span>
                          <span className="text-stone-500 ml-1">({lot.grade})</span>
                        </div>
                        <span className="font-mono font-bold text-stone-700">{lot.quantityKg.toLocaleString()} kg</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Logistics / Consignment Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Stage Consignment & Run Readiness Engine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
