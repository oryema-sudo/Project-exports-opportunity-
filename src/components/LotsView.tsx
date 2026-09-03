import React, { useState } from 'react';
import { Lot, CoffeeType, CoffeeGrade, LotStatus, TraceabilityEvent } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  Scale, 
  Plus, 
  Layers, 
  MapPin, 
  Truck, 
  Search, 
  Filter, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  FileText,
  Building,
  ArrowRight
} from 'lucide-react';
import { EmptyState } from './EmptyState';

interface LotsViewProps {
  state: AppState;
  searchQuery: string;
  onSelectShipment?: (shipmentId: string) => void;
}

export const LotsView: React.FC<LotsViewProps> = ({
  state,
  searchQuery,
  onSelectShipment
}) => {
  const { lots, deliveries, farmers, farms, traceabilityEvents, currentUser, shipments } = state;
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [selectedLot, setSelectedLot] = useState<Lot | null>(null);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [showAddEventModal, setShowAddEventModal] = useState<boolean>(false);

  // New Lot Form State
  const [lotNumber, setLotNumber] = useState<string>(`LOT-UG-RB-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [coffeeType, setCoffeeType] = useState<CoffeeType>('Robusta');
  const [grade, setGrade] = useState<CoffeeGrade>('Screen 18');
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState<string[]>([]);
  const [processingStation, setProcessingStation] = useState<string>('Great Lakes Bugolobi Dry Mill, Kampala');
  const [currentLocation, setCurrentLocation] = useState<string>('Bugolobi Central Warehouse');
  const [notes, setNotes] = useState<string>('Standard sorted export grade batch.');

  // New Event Form State
  const [eventType, setEventType] = useState<TraceabilityEvent['eventType']>('Moisture & Quality Inspection');
  const [eventLocation, setEventLocation] = useState<string>('Quality Assurance Lab, Bugolobi');
  const [eventOfficer, setEventOfficer] = useState<string>(currentUser.name);
  const [eventRef, setEventRef] = useState<string>('QA-INSP-2026-09');
  const [eventNotes, setEventNotes] = useState<string>('Moisture 12.0%, Defect count compliant.');

  // Filter lots
  const filteredLots = lots.filter(l => {
    if (filterStatus !== 'ALL' && l.currentStatus !== filterStatus) return false;
    if (filterType !== 'ALL' && l.coffeeType !== filterType) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        l.lotNumber.toLowerCase().includes(q) ||
        l.processingStation.toLowerCase().includes(q) ||
        l.currentLocation.toLowerCase().includes(q) ||
        l.grade.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableDeliveries = deliveries.filter(d => !d.associatedLotId || d.associatedLotId === selectedLot?.id);

  const handleCreateLot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDeliveryIds.length === 0) {
      alert('Please select at least one source purchase/delivery record.');
      return;
    }

    const selectedDelvs = deliveries.filter(d => selectedDeliveryIds.includes(d.id));
    const totalQty = selectedDelvs.reduce((sum, d) => sum + d.quantityKg, 0);
    const sourceFarmerIds: string[] = Array.from(new Set(selectedDelvs.map(d => d.farmerId)));
    const sourceFarmIds: string[] = Array.from(new Set(selectedDelvs.map(d => d.farmId)));

    const newLot = await appStore.addLot({
      lotNumber,
      coffeeType,
      grade,
      quantityKg: totalQty,
      dateReceived: new Date().toISOString().split('T')[0],
      currentLocation,
      currentStatus: 'Processing',
      sourceFarmerIds,
      sourceFarmIds,
      sourceDeliveryIds: selectedDeliveryIds,
      processingStation,
      notes,
      documentIds: []
    });

    // Link deliveries
    selectedDelvs.forEach(d => {
      appStore.updateDelivery({ ...d, associatedLotId: newLot.id });
    });

    setShowCreateModal(false);
    setSelectedLot(newLot);
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;

    appStore.addTraceabilityEvent({
      lotId: selectedLot.id,
      eventType,
      location: eventLocation,
      dateTime: new Date().toISOString(),
      responsibleParty: eventOfficer,
      quantityKg: selectedLot.quantityKg,
      referenceDocNumber: eventRef,
      notes: eventNotes
    });

    setShowAddEventModal(false);
  };

  const toggleDeliverySelection = (delId: string) => {
    setSelectedDeliveryIds(prev =>
      prev.includes(delId) ? prev.filter(id => id !== delId) : [...prev, delId]
    );
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-700" />
            Coffee Lot Management & Physical Traceability
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Trace coffee from intake deliveries through wet/dry milling, grading, warehouse staging, and export assignment.
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            onClick={() => {
              setLotNumber(`LOT-UG-${coffeeType === 'Robusta' ? 'RB' : 'AR'}-2026-${Math.floor(100 + Math.random() * 900)}`);
              setShowCreateModal(true);
            }}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Create Lot from Deliveries
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
            >
              <option value="ALL">All Lot Statuses ({lots.length})</option>
              <option value="Received">Received</option>
              <option value="Processing">Processing</option>
              <option value="Processed">Processed</option>
              <option value="Assigned to Shipment">Assigned to Shipment</option>
              <option value="Requires Review">Requires Review</option>
              <option value="Shipped">Shipped</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600 text-xs"
            >
              <option value="ALL">All Varieties</option>
              <option value="Robusta">Robusta</option>
              <option value="Arabica">Arabica</option>
            </select>
          </div>
        </div>

        <div className="text-stone-500 font-mono text-xs">
          {filteredLots.length} lot(s) listed
        </div>
      </div>

      {lots.length === 0 ? (
        <EmptyState
          icon={Layers}
          title="No processing lots formed yet"
          description="Form distinct processing lots from intake deliveries to track hulling mass balance, moisture levels, and warehouse movement."
          primaryAction={
            currentUser.role !== 'viewer'
              ? {
                  label: "Create First Processing Lot",
                  onClick: () => setShowCreateModal(true),
                  icon: Plus
                }
              : undefined
          }
          guidance="Lots aggregate one or more intake delivery receipts to preserve origin custody through dry mill processing."
          badge="DRY MILL & LOT FORMATION"
        />
      ) : (
        /* Main Grid: Lots Table & Active Lot Inspector */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Lots List (2 cols) */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Mobile Lots Cards View (< md screens) */}
          <div className="block md:hidden space-y-3">
            {filteredLots.map(lot => {
              const isSelected = selectedLot?.id === lot.id;
              return (
                <div
                  key={lot.id}
                  onClick={() => setSelectedLot(lot)}
                  className={`p-4 bg-white rounded-lg border shadow-sm space-y-2 cursor-pointer transition-colors ${
                    isSelected ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500' : 'border-stone-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-sm text-stone-900">{lot.lotNumber}</div>
                      <div className="text-[10px] text-stone-500 font-mono">Created: {lot.creationDate}</div>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded shrink-0 ${
                      lot.currentStatus === 'Assigned to Shipment' ? 'bg-emerald-100 text-emerald-800' :
                      lot.currentStatus === 'Requires Review' ? 'bg-red-100 text-red-800' :
                      lot.currentStatus === 'Processed' ? 'bg-blue-100 text-blue-800' :
                      'bg-stone-100 text-stone-800'
                    }`}>
                      {lot.currentStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-stone-100">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Grade / Variety</span>
                      <span className="font-bold text-stone-800">{lot.grade}</span>
                      <span className="text-stone-500 text-[11px] block">{lot.coffeeType}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-stone-400 block">Volume</span>
                      <span className="font-mono font-bold text-emerald-900 text-sm">{lot.quantityKg.toLocaleString()} kg</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-stone-100 text-xs">
                    <div className="text-[11px] text-stone-500 truncate max-w-[200px]">
                      {lot.processingStation}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedLot(lot);
                      }}
                      className="text-emerald-800 font-bold text-xs hover:underline flex items-center gap-0.5"
                    >
                      Timeline <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop Lots Table (>= md screens) */}
          <div className="hidden md:block bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                    <th className="py-2.5 px-3">Lot ID & Number</th>
                    <th className="py-2.5 px-3">Grade & Variety</th>
                    <th className="py-2.5 px-3">Quantity</th>
                    <th className="py-2.5 px-3">Processing Station</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLots.map(lot => {
                    const isSelected = selectedLot?.id === lot.id;

                    return (
                      <tr 
                        key={lot.id} 
                        onClick={() => setSelectedLot(lot)}
                        className={`hover:bg-emerald-50/50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-emerald-50/80 font-semibold' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="font-bold text-stone-900">{lot.lotNumber}</div>
                          <div className="text-[10px] text-stone-400 font-mono">Created: {lot.creationDate}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-stone-800">{lot.grade}</span>
                          <div className="text-[10px] text-stone-500">{lot.coffeeType}</div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-stone-900">
                          {lot.quantityKg.toLocaleString()} kg
                        </td>
                        <td className="py-3 px-3 text-stone-600">
                          <div className="truncate max-w-[140px]">{lot.processingStation}</div>
                          <div className="text-[10px] text-stone-400 truncate max-w-[140px]">{lot.currentLocation}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            lot.currentStatus === 'Assigned to Shipment' ? 'bg-emerald-100 text-emerald-800' :
                            lot.currentStatus === 'Requires Review' ? 'bg-red-100 text-red-800' :
                            lot.currentStatus === 'Processed' ? 'bg-blue-100 text-blue-800' :
                            'bg-stone-100 text-stone-800'
                          }`}>
                            {lot.currentStatus}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLot(lot);
                            }}
                            className="text-emerald-800 font-bold hover:underline text-[11px]"
                          >
                            View Timeline
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Selected Lot Timeline & Details Inspector (1 col) */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          {selectedLot ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">Lot Dossier</span>
                  <h3 className="font-bold text-base text-stone-900">{selectedLot.lotNumber}</h3>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                  {selectedLot.quantityKg.toLocaleString()} kg
                </span>
              </div>

              {/* Lot Specs */}
              <div className="grid grid-cols-2 gap-2 text-xs bg-stone-50 p-2.5 rounded border border-stone-200">
                <div>
                  <span className="text-[10px] text-stone-500 font-semibold">Variety / Grade</span>
                  <div className="font-bold text-stone-900">{selectedLot.coffeeType} - {selectedLot.grade}</div>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-semibold">Current Status</span>
                  <div className="font-bold text-stone-900">{selectedLot.currentStatus}</div>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-semibold">Source Smallholders</span>
                  <div className="font-bold text-stone-900">{selectedLot.sourceFarmerIds.length} Farmers</div>
                </div>
                <div>
                  <span className="text-[10px] text-stone-500 font-semibold">Source Farm Plots</span>
                  <div className="font-bold text-stone-900">{selectedLot.sourceFarmIds.length} Plots</div>
                </div>
              </div>

              {/* Assigned Shipment */}
              {selectedLot.assignedShipmentId && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-semibold uppercase">Assigned Consignment</span>
                    <div className="font-bold text-emerald-950">{selectedLot.assignedShipmentId}</div>
                  </div>
                  {onSelectShipment && (
                    <button
                      onClick={() => onSelectShipment(selectedLot.assignedShipmentId!)}
                      className="text-xs font-bold text-emerald-800 hover:underline flex items-center gap-1"
                    >
                      Inspect <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Traceability Timeline */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-emerald-700" />
                    Physical Custody Timeline
                  </span>

                  {currentUser.role !== 'viewer' && (
                    <button
                      onClick={() => setShowAddEventModal(true)}
                      className="text-xs text-emerald-800 font-bold hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> Add Event
                    </button>
                  )}
                </div>

                <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
                  {traceabilityEvents
                    .filter(e => e.lotId === selectedLot.id)
                    .map(evt => (
                      <div key={evt.id} className="relative text-xs">
                        <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-700 border-2 border-white ring-1 ring-emerald-300"></div>
                        <div className="font-bold text-stone-900">{evt.eventType}</div>
                        <div className="text-[10px] text-stone-500 font-mono">
                          {new Date(evt.dateTime).toLocaleDateString()} • {evt.location}
                        </div>
                        <div className="text-[11px] text-stone-600 mt-0.5">
                          {evt.notes}
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Source Farmers Preview */}
              <div className="pt-3 border-t border-stone-100 space-y-1 text-xs">
                <span className="text-[10px] font-bold text-stone-500 uppercase">Contributing Farmers</span>
                <div className="flex flex-wrap gap-1">
                  {selectedLot.sourceFarmerIds.map(fId => {
                    const farmer = farmers.find(f => f.id === fId);
                    return (
                      <span key={fId} className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded text-[11px] font-medium">
                        {farmer?.fullName || fId} ({farmer?.district || 'Uganda'})
                      </span>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-stone-400 space-y-2">
              <Scale className="w-8 h-8 mx-auto text-stone-300" />
              <div className="text-xs font-semibold text-stone-600">Select a coffee lot from the table</div>
              <p className="text-[11px] text-stone-400">View source smallholders, milling stations, and custody event chains.</p>
            </div>
          )}
        </div>

      </div>
      )}

      {/* CREATE LOT MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-stone-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">Form Coffee Lot from Farmer Purchases</h3>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateLot} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Lot Reference Number</label>
                <input
                  type="text"
                  required
                  value={lotNumber}
                  onChange={(e) => setLotNumber(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Coffee Variety</label>
                  <select
                    value={coffeeType}
                    onChange={(e) => setCoffeeType(e.target.value as CoffeeType)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Robusta">Robusta</option>
                    <option value="Arabica">Arabica</option>
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Output Grade</label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as CoffeeGrade)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Screen 18">Screen 18</option>
                    <option value="Screen 15">Screen 15</option>
                    <option value="Screen 12">Screen 12</option>
                    <option value="FAQ (Fair Average Quality)">FAQ (Fair Average Quality)</option>
                    <option value="Bugisu AA">Bugisu AA (Arabica)</option>
                    <option value="Bugisu A">Bugisu A</option>
                    <option value="Drugar">Drugar (Natural Arabica)</option>
                    <option value="Wugar">Wugar (Washed Arabica)</option>
                  </select>
                </div>
              </div>

              {/* Select Intake Deliveries */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-700 font-semibold">Select Intake Purchases / Weighbridge Tickets</label>
                  <span className="text-[11px] text-stone-500 font-mono">
                    Selected: {selectedDeliveryIds.length} delivery ({selectedDeliveryIds.reduce((sum, id) => sum + (deliveries.find(d => d.id === id)?.quantityKg || 0), 0).toLocaleString()} kg)
                  </span>
                </div>

                <div className="max-h-40 overflow-y-auto border border-stone-200 rounded divide-y divide-stone-100 bg-stone-50 p-1">
                  {availableDeliveries.map(del => {
                    const farmer = farmers.find(f => f.id === del.farmerId);
                    return (
                      <label key={del.id} className="flex items-center gap-2 p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDeliveryIds.includes(del.id)}
                          onChange={() => toggleDeliverySelection(del.id)}
                          className="rounded border-stone-300 text-emerald-700 focus:ring-emerald-500"
                        />
                        <div className="flex-1 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-bold text-stone-900">{farmer?.fullName || del.farmerId}</span>
                            <span className="text-stone-500 ml-1 text-[11px]">({del.receiptNumber})</span>
                          </div>
                          <span className="font-mono font-bold text-stone-800">{del.quantityKg.toLocaleString()} kg</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Washing / Processing Station</label>
                <input
                  type="text"
                  required
                  value={processingStation}
                  onChange={(e) => setProcessingStation(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Current Warehouse / Hub Location</label>
                <input
                  type="text"
                  required
                  value={currentLocation}
                  onChange={(e) => setCurrentLocation(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
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
                  Form Lot & Initialize Custody Chain
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD TRACEABILITY EVENT MODAL */}
      {showAddEventModal && selectedLot && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-5 border border-stone-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-sm text-stone-900">Record Custody / Processing Event</h3>
              </div>
              <button onClick={() => setShowAddEventModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-3 text-xs">
              <div className="bg-stone-50 p-2 rounded border border-stone-200">
                <div className="font-bold text-stone-900">{selectedLot.lotNumber}</div>
                <div className="text-stone-500">{selectedLot.quantityKg.toLocaleString()} kg • {selectedLot.grade}</div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Event Type</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value as any)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                >
                  <option value="Received at Collection Hub">Received at Collection Hub</option>
                  <option value="Transferred to Washing/Processing Station">Transferred to Washing/Processing Station</option>
                  <option value="Hulling / Washing Completed">Hulling / Washing Completed</option>
                  <option value="Moisture & Quality Inspection">Moisture & Quality Inspection</option>
                  <option value="Moved to Central Warehouse">Moved to Central Warehouse</option>
                  <option value="Assigned to Export Shipment">Assigned to Export Shipment</option>
                  <option value="Container Sealed & Shipped">Container Sealed & Shipped</option>
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Location / Facility</label>
                <input
                  type="text"
                  required
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Responsible Officer / Organization</label>
                <input
                  type="text"
                  required
                  value={eventOfficer}
                  onChange={(e) => setEventOfficer(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Document Reference / Batch #</label>
                <input
                  type="text"
                  value={eventRef}
                  onChange={(e) => setEventRef(e.target.value)}
                  placeholder="e.g. WAYBILL-2026-081"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Observations / Quality Notes</label>
                <textarea
                  rows={2}
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddEventModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  Append Event to Timeline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
