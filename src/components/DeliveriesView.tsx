import React, { useState } from 'react';
import { Delivery, CoffeeType, CoffeeGrade } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  History, 
  Plus, 
  Search, 
  Filter, 
  Users, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Scale, 
  DollarSign
} from 'lucide-react';

interface DeliveriesViewProps {
  state: AppState;
  searchQuery: string;
}

export const DeliveriesView: React.FC<DeliveriesViewProps> = ({
  state,
  searchQuery
}) => {
  const { deliveries, farmers, farms, lots, currentUser } = state;
  const [filterCoffeeType, setFilterCoffeeType] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // New Delivery Form State
  const [receiptNumber, setReceiptNumber] = useState<string>(`REC-UG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [selectedFarmerId, setSelectedFarmerId] = useState<string>(farmers[0]?.id || '');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [coffeeType, setCoffeeType] = useState<CoffeeType>('Robusta');
  const [grade, setGrade] = useState<CoffeeGrade>('FAQ (Fair Average Quality)');
  const [quantityKg, setQuantityKg] = useState<string>('850');
  const [numberOfBags, setNumberOfBags] = useState<string>('14');
  const [moistureContentPercent, setMoistureContentPercent] = useState<string>('13.5');
  const [pricePerKgUgx, setPricePerKgUgx] = useState<string>('7200');
  const [buyingDepot, setBuyingDepot] = useState<string>('Masaka Regional Buying Station');
  const [purchasedBy, setPurchasedBy] = useState<string>(currentUser.name);
  const [notes, setNotes] = useState<string>('Dry cherry (kiboko) good quality, low black bean ratio.');

  // Update farm options when farmer changes
  const farmerFarms = farms.filter(f => f.farmerId === selectedFarmerId);

  const filteredDeliveries = deliveries.filter(d => {
    if (filterCoffeeType !== 'ALL' && d.coffeeType !== filterCoffeeType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const farmer = farmers.find(f => f.id === d.farmerId);
      return (
        d.receiptNumber.toLowerCase().includes(q) ||
        d.buyingDepot.toLowerCase().includes(q) ||
        farmer?.fullName.toLowerCase().includes(q) ||
        d.grade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const totalDeliveredKg = deliveries.reduce((sum, d) => sum + d.quantityKg, 0);

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFarmerId || !selectedFarmId) {
      alert('Please select both a registered smallholder and their farm parcel.');
      return;
    }

    const qty = parseFloat(quantityKg);
    const bags = parseInt(numberOfBags) || Math.round(qty / 60);
    const moisture = parseFloat(moistureContentPercent) || 13.0;
    const price = parseInt(pricePerKgUgx) || 7000;

    appStore.addDelivery({
      farmerId: selectedFarmerId,
      farmId: selectedFarmId,
      deliveryDate: new Date().toISOString().split('T')[0],
      coffeeType,
      grade,
      quantityKg: qty,
      numberOfBags: bags,
      moistureContentPercent: moisture,
      pricePerKgUgx: price,
      totalPaymentUgx: qty * price,
      buyingDepot,
      receiptNumber,
      purchasedBy,
      notes,
      documentIds: []
    });

    setShowCreateModal(false);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-700" />
            Smallholder Purchases & Intake Logs
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Record primary farmer deliveries, weighbridge tickets, moisture assays, and purchase receipts with GPS linkage.
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            onClick={() => {
              setReceiptNumber(`REC-UG-2026-${Math.floor(1000 + Math.random() * 9000)}`);
              setShowCreateModal(true);
            }}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Record Farmer Purchase
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <select
            value={filterCoffeeType}
            onChange={(e) => setFilterCoffeeType(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Varieties</option>
            <option value="Robusta">Robusta</option>
            <option value="Arabica">Arabica</option>
          </select>
        </div>

        <div className="text-stone-600 font-mono text-xs">
          Total Intake: <strong>{totalDeliveredKg.toLocaleString()} kg</strong> across {deliveries.length} tickets
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                <th className="py-2.5 px-3">Receipt / Ticket #</th>
                <th className="py-2.5 px-3">Smallholder Farmer</th>
                <th className="py-2.5 px-3">Farm Parcel / Location</th>
                <th className="py-2.5 px-3">Weight (Kg)</th>
                <th className="py-2.5 px-3">Grade & Moisture</th>
                <th className="py-2.5 px-3">Total UGX</th>
                <th className="py-2.5 px-3">Lot Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredDeliveries.map(del => {
                const farmer = farmers.find(f => f.id === del.farmerId);
                const farm = farms.find(f => f.id === del.farmId);
                const linkedLot = lots.find(l => l.id === del.associatedLotId);

                return (
                  <tr key={del.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900 font-mono">{del.receiptNumber}</div>
                      <div className="text-[10px] text-stone-400">{del.deliveryDate}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">{farmer?.fullName || 'Unknown'}</div>
                      <div className="text-[10px] text-stone-500 font-mono">{farmer?.nationalId || farmer?.farmerRegId}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-stone-800 font-medium">{farm?.farmName || 'Default Plot'}</div>
                      <div className="text-[10px] text-stone-500">{farm?.district} ({farm?.latitude.toFixed(3)}°, {farm?.longitude.toFixed(3)}°)</div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-stone-900">
                      {del.quantityKg.toLocaleString()} kg
                      <span className="text-[10px] text-stone-400 font-normal ml-1">({del.numberOfBags} bags)</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-800">{del.coffeeType} - {del.grade}</span>
                      <div className="text-[10px] text-stone-500">Moisture: {del.moistureContentPercent}%</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-800">
                      UGX {del.totalPaymentUgx.toLocaleString()}
                    </td>
                    <td className="py-3 px-3">
                      {linkedLot ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Lot: {linkedLot.lotNumber}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                          Unassigned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE DELIVERY MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-stone-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">Record Smallholder Coffee Purchase</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Receipt / Weighbridge Ticket #</label>
                <input
                  type="text"
                  required
                  value={receiptNumber}
                  onChange={(e) => setReceiptNumber(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Select Smallholder Farmer</label>
                <select
                  value={selectedFarmerId}
                  onChange={(e) => {
                    setSelectedFarmerId(e.target.value);
                    const matchingFarms = farms.filter(f => f.farmerId === e.target.value);
                    if (matchingFarms.length > 0) setSelectedFarmId(matchingFarms[0].id);
                  }}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.fullName} — {f.district} (NIN: {f.nationalId || f.farmerRegId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Source Farm Plot</label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => setSelectedFarmId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                >
                  {farmerFarms.length > 0 ? (
                    farmerFarms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.farmName} — {f.district} ({f.plotArea} Ha, {f.geometryType})
                      </option>
                    ))
                  ) : (
                    <option value="">No farm plots registered for this farmer</option>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Variety</label>
                  <select
                    value={coffeeType}
                    onChange={(e) => setCoffeeType(e.target.value as CoffeeType)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="Robusta">Robusta</option>
                    <option value="Arabica">Arabica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as CoffeeGrade)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  >
                    <option value="FAQ (Fair Average Quality)">FAQ (Fair Average Quality)</option>
                    <option value="Screen 18">Screen 18</option>
                    <option value="Screen 15">Screen 15</option>
                    <option value="Bugisu AA">Bugisu AA</option>
                    <option value="Drugar">Drugar</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Net Weight (Kg)</label>
                  <input
                    type="number"
                    required
                    value={quantityKg}
                    onChange={(e) => setQuantityKg(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Bags Count</label>
                  <input
                    type="number"
                    value={numberOfBags}
                    onChange={(e) => setNumberOfBags(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Moisture (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={moistureContentPercent}
                    onChange={(e) => setMoistureContentPercent(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Unit Price (UGX / Kg)</label>
                  <input
                    type="number"
                    value={pricePerKgUgx}
                    onChange={(e) => setPricePerKgUgx(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Buying Depot</label>
                  <input
                    type="text"
                    value={buyingDepot}
                    onChange={(e) => setBuyingDepot(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
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
                  Save Intake & Issue Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
