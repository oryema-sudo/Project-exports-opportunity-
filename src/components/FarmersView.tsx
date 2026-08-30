import React, { useState } from 'react';
import { Farmer, FarmPlot, Delivery, VerificationStatus } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ShieldCheck, 
  Phone, 
  Compass, 
  Scale, 
  Edit3,
  X,
  FileSpreadsheet
} from 'lucide-react';
import { UGANDA_DISTRICTS } from '../data/ugandaRegions';

interface FarmersViewProps {
  state: AppState;
  searchQuery: string;
  onOpenBulkImport: () => void;
}

export const FarmersView: React.FC<FarmersViewProps> = ({
  state,
  searchQuery,
  onOpenBulkImport
}) => {
  const { farmers, farms, deliveries, documents, currentUser } = state;
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingFarmer, setEditingFarmer] = useState<Farmer | null>(null);

  // Form State for Add / Edit Farmer
  const [fullName, setFullName] = useState<string>('');
  const [nationalId, setNationalId] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('+256 7');
  const [district, setDistrict] = useState<string>('Masaka');
  const [subcounty, setSubcounty] = useState<string>('Kyanamukaka');
  const [parish, setParish] = useState<string>('Kamuzinda');
  const [village, setVillage] = useState<string>('Buyaga');
  const [cooperativeMembership, setCooperativeMembership] = useState<string>('Kyanamukaka Coffee Farmers Society');
  const [notes, setNotes] = useState<string>('');

  const openAddFarmerModal = () => {
    setEditingFarmer(null);
    setFullName('');
    setNationalId('');
    setPhoneNumber('+256 7');
    setDistrict('Masaka');
    setSubcounty('Kyanamukaka');
    setParish('Kamuzinda');
    setVillage('Buyaga');
    setCooperativeMembership('Kyanamukaka Coffee Farmers Society');
    setNotes('');
    setShowAddModal(true);
  };

  const openEditFarmerModal = (farmer: Farmer) => {
    setEditingFarmer(farmer);
    setFullName(farmer.fullName);
    setNationalId(farmer.nationalId || '');
    setPhoneNumber(farmer.phone || farmer.phoneNumber || '');
    setDistrict(farmer.district);
    setSubcounty(farmer.subcounty);
    setParish(farmer.parish || '');
    setVillage(farmer.village);
    setCooperativeMembership(farmer.cooperative || farmer.cooperativeMembership || '');
    setNotes(farmer.notes || '');
    setShowAddModal(true);
  };

  const handleSaveFarmer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName) return;

    const verificationStatus: VerificationStatus = nationalId ? 'Verified' : 'Partially verified';

    if (editingFarmer) {
      const updated: Farmer = {
        ...editingFarmer,
        fullName,
        nationalId: nationalId || undefined,
        phone: phoneNumber || '+256 700 000 000',
        phoneNumber: phoneNumber || undefined,
        district,
        subcounty,
        parish,
        village,
        cooperative: cooperativeMembership || 'Great Lakes Smallholder Farmers Network',
        cooperativeMembership: cooperativeMembership || undefined,
        notes: notes || undefined,
        verificationStatus
      };
      appStore.updateFarmer(updated);
      setSelectedFarmer(updated);
    } else {
      const newFarmer = appStore.addFarmer({
        farmerRegId: `UGA-FARM-${Math.floor(10000 + Math.random() * 90000)}`,
        fullName,
        nationalId: nationalId || undefined,
        phone: phoneNumber || '+256 700 000 000',
        phoneNumber: phoneNumber || undefined,
        district,
        subcounty,
        parish,
        village,
        cooperative: cooperativeMembership || 'Great Lakes Smallholder Farmers Network',
        cooperativeMembership: cooperativeMembership || undefined,
        verificationStatus,
        notes: notes || undefined
      });
      setSelectedFarmer(newFarmer);
    }

    setShowAddModal(false);
  };

  // Filter farmers
  const filteredFarmers = farmers.filter(f => {
    if (filterDistrict !== 'ALL' && f.district !== filterDistrict) return false;
    if (filterStatus !== 'ALL' && f.verificationStatus !== filterStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        f.fullName.toLowerCase().includes(q) ||
        (f.nationalId && f.nationalId.toLowerCase().includes(q)) ||
        (f.farmerRegId && f.farmerRegId.toLowerCase().includes(q)) ||
        (f.phoneNumber && f.phoneNumber.toLowerCase().includes(q)) ||
        f.district.toLowerCase().includes(q) ||
        f.village.toLowerCase().includes(q)
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
            <Users className="w-5 h-5 text-emerald-700" />
            Smallholder Farmer Registry & Due-Diligence Profiles
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Producer records, national ID verification, consent agreements, and linked farm plot coordinates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenBulkImport}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded border border-stone-300 flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            Bulk CSV Import
          </button>

          <button
            onClick={async () => {
              try {
                const user = (await import('../lib/firebase')).auth.currentUser;
                const token = user ? await user.getIdToken() : '';
                const res = await fetch('/api/export/farmers/csv', {
                  headers: token ? { Authorization: `Bearer ${token}` } : {}
                });
                if (!res.ok) throw new Error('Failed to export CSV');
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `uganda-farmers-${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
              } catch (err: any) {
                alert(err.message || 'Failed to export farmers CSV');
              }
            }}
            className="bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold px-3 py-2 rounded border border-stone-300 flex items-center gap-1.5 transition-colors"
            title="Download CSV export with formula-injection sanitization"
          >
            <FileText className="w-3.5 h-3.5 text-stone-600" />
            Export CSV
          </button>

          {currentUser.role !== 'viewer' && (
            <button
              onClick={openAddFarmerModal}
              className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Register Smallholder
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Districts ({farmers.length})</option>
            {UGANDA_DISTRICTS.map(d => (
              <option key={d.name} value={d.name}>{d.name} ({d.coffeeType})</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Verification Statuses</option>
            <option value="Verified">Verified</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Needs Review">Needs Review</option>
          </select>
        </div>

        <div className="text-stone-500 font-mono text-xs">
          Showing {filteredFarmers.length} of {farmers.length} smallholders
        </div>
      </div>

      {/* Farmers Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-bold">
                <th className="py-2.5 px-3">Farmer Name & Reg ID</th>
                <th className="py-2.5 px-3">National ID (NIN)</th>
                <th className="py-2.5 px-3">District & Village</th>
                <th className="py-2.5 px-3">Cooperative Society</th>
                <th className="py-2.5 px-3">Farms Mapped</th>
                <th className="py-2.5 px-3">Verification</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredFarmers.map(farmer => {
                const farmerFarms = farms.filter(f => f.farmerId === farmer.id);
                const hasPolygons = farmerFarms.some(f => f.geometryType === 'Polygon');

                return (
                  <tr 
                    key={farmer.id}
                    onClick={() => setSelectedFarmer(farmer)}
                    className="hover:bg-emerald-50/40 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-stone-900">{farmer.fullName}</div>
                      <div className="text-[10px] text-stone-400 font-mono">{farmer.farmerRegId || farmer.id}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-stone-700">
                      {farmer.nationalId ? (
                        <span className="font-semibold text-stone-900">{farmer.nationalId}</span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                          Pending NIN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-stone-800">
                      <div>{farmer.district}, {farmer.subcounty}</div>
                      <div className="text-[10px] text-stone-400">{farmer.village}</div>
                    </td>
                    <td className="py-3 px-3 text-stone-600 truncate max-w-[160px]">
                      {farmer.cooperativeMembership || 'Individual Independent'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="font-bold text-stone-900">{farmerFarms.length} plot(s)</span>
                      <div className="text-[10px] text-emerald-700">
                        {hasPolygons ? '✓ Polygons recorded' : '• Point GPS'}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        farmer.verificationStatus === 'Verified' ? 'bg-emerald-100 text-emerald-800' :
                        farmer.verificationStatus === 'Needs Review' ? 'bg-red-100 text-red-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {farmer.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFarmer(farmer);
                          }}
                          className="text-emerald-800 font-bold hover:underline text-[11px]"
                        >
                          Profile
                        </button>
                        {currentUser.role !== 'viewer' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditFarmerModal(farmer);
                            }}
                            className="p-1 text-stone-400 hover:text-stone-700"
                            title="Edit Farmer Record"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* FARMER PROFILE DRAWER / MODAL */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 border border-stone-200 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Top Bar */}
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedFarmer.verificationStatus} PRODUCER PROFILE
                </span>
                <h2 className="text-lg font-bold text-stone-900 mt-1">{selectedFarmer.fullName}</h2>
              </div>
              <button onClick={() => setSelectedFarmer(null)} className="text-stone-400 hover:text-stone-700 text-xl font-bold">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Farmer Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-50 p-3 rounded-md border border-stone-200 text-xs">
              <div>
                <span className="text-[10px] text-stone-500 font-semibold uppercase">Farmer ID</span>
                <div className="font-bold text-stone-900 font-mono">{selectedFarmer.farmerRegId || selectedFarmer.id}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-semibold uppercase">National ID (NIN)</span>
                <div className="font-bold text-stone-900 font-mono">{selectedFarmer.nationalId || 'Not Recorded'}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-semibold uppercase">District / Subcounty</span>
                <div className="font-bold text-stone-900">{selectedFarmer.district}, {selectedFarmer.subcounty}</div>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 font-semibold uppercase">Telephone</span>
                <div className="font-bold text-stone-900 font-mono">{selectedFarmer.phoneNumber || 'N/A'}</div>
              </div>
            </div>

            {/* Registered Farm Plots */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-emerald-700" />
                  Registered Farm Parcels & GNSS Polygons
                </h3>
              </div>

              <div className="space-y-2">
                {farms.filter(f => f.farmerId === selectedFarmer.id).map(farm => (
                  <div key={farm.id} className="p-3 bg-stone-50 rounded border border-stone-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-900">{farm.farmName}</span>
                      <span className="font-mono font-bold text-emerald-800 bg-emerald-100 px-2 py-0.2 rounded text-[10px]">
                        {farm.plotArea} {farm.areaUnit} ({farm.geometryType})
                      </span>
                    </div>
                    <div className="text-stone-600">
                      Location: {farm.district}, {farm.subcounty}, {farm.village}
                    </div>
                    <div className="font-mono text-[11px] text-stone-500">
                      Center: {farm.latitude.toFixed(5)}° N, {farm.longitude.toFixed(5)}° E (±{farm.mappingAccuracyMeters}m accuracy)
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Delivery & Purchase History */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-700" />
                Delivery & Purchase History
              </h3>

              <div className="divide-y divide-stone-100 border border-stone-200 rounded max-h-36 overflow-y-auto">
                {deliveries.filter(d => d.farmerId === selectedFarmer.id).map(del => (
                  <div key={del.id} className="p-2 flex items-center justify-between text-xs hover:bg-stone-50">
                    <div>
                      <span className="font-bold text-stone-900">{del.receiptNumber}</span>
                      <span className="text-stone-500 ml-2">({del.coffeeType} - {del.grade})</span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-bold text-stone-900">{del.quantityKg} kg</span>
                      <span className="text-[10px] text-stone-400 ml-2">{del.deliveryDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action */}
            <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
              {selectedFarmer.verificationStatus !== 'Verified' && (
                <button
                  onClick={() => {
                    appStore.updateFarmer({
                      ...selectedFarmer,
                      verificationStatus: 'Verified',
                      nationalId: selectedFarmer.nationalId || 'CM890248201MAS'
                    });
                    setSelectedFarmer(null);
                  }}
                  className="px-3.5 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Mark as Verified Producer
                </button>
              )}
              <button
                onClick={() => setSelectedFarmer(null)}
                className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold text-xs"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ADD / EDIT FARMER MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-stone-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">
                  {editingFarmer ? 'Edit Smallholder Farmer Profile' : 'Register New Smallholder Producer'}
                </h3>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFarmer} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Full Legal Name (as per Uganda National ID)</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ssekandi Joseph"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">National ID (NIN)</label>
                  <input
                    type="text"
                    value={nationalId}
                    onChange={(e) => setNationalId(e.target.value)}
                    placeholder="e.g. CM820491820MAS"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Telephone Number</label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+256 700 000 000"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    {UGANDA_DISTRICTS.map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Subcounty</label>
                  <input
                    type="text"
                    required
                    value={subcounty}
                    onChange={(e) => setSubcounty(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Parish</label>
                  <input
                    type="text"
                    value={parish}
                    onChange={(e) => setParish(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Village / LC1</label>
                  <input
                    type="text"
                    required
                    value={village}
                    onChange={(e) => setVillage(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Cooperative Society / Producer Group</label>
                <input
                  type="text"
                  value={cooperativeMembership}
                  onChange={(e) => setCooperativeMembership(e.target.value)}
                  placeholder="e.g. Kyanamukaka Coffee Farmers Society"
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  {editingFarmer ? 'Save Changes' : 'Register Producer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
