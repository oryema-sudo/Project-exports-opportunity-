import React, { useEffect, useRef, useState } from 'react';
import { FarmPlot, Farmer } from '../types';
import { AppState, appStore } from '../services/store';
import { 
  Compass, 
  MapPin, 
  Layers, 
  Plus, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Edit3, 
  Eye,
  Users
} from 'lucide-react';
import { UGANDA_DISTRICTS, isUgandaCoordinates } from '../data/ugandaRegions';
import L from 'leaflet';

interface FarmMapViewProps {
  state: AppState;
  searchQuery: string;
}

export const FarmMapView: React.FC<FarmMapViewProps> = ({
  state,
  searchQuery
}) => {
  const { farms, farmers, currentUser } = state;
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  const [filterGeometry, setFilterGeometry] = useState<string>('ALL');
  const [filterDistrict, setFilterDistrict] = useState<string>('ALL');
  const [selectedFarm, setSelectedFarm] = useState<FarmPlot | null>(null);
  const [showAddFarmModal, setShowAddFarmModal] = useState<boolean>(false);
  const [editingFarm, setEditingFarm] = useState<FarmPlot | null>(null);

  // Add / Edit Farm Form
  const [farmerId, setFarmerId] = useState<string>(farmers[0]?.id || '');
  const [farmName, setFarmName] = useState<string>('Kyanamukaka South Plot');
  const [district, setDistrict] = useState<string>('Masaka');
  const [subcounty, setSubcounty] = useState<string>('Kyanamukaka');
  const [village, setVillage] = useState<string>('Buyaga');
  const [latitude, setLatitude] = useState<string>('-0.3425');
  const [longitude, setLongitude] = useState<string>('31.7380');
  const [plotArea, setPlotArea] = useState<string>('2.5');
  const [geometryType, setGeometryType] = useState<'Point' | 'Polygon'>('Polygon');

  // Filtered farms
  const filteredFarms = farms.filter(f => {
    if (filterGeometry !== 'ALL' && f.geometryType !== filterGeometry) return false;
    if (filterDistrict !== 'ALL' && f.district !== filterDistrict) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const farmer = farmers.find(fm => fm.id === f.farmerId);
      return (
        f.farmName.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        farmer?.fullName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix default marker icon issues with Vite bundling
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    const map = L.map(mapContainerRef.current).setView([0.3476, 32.2825], 8);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    markersLayerRef.current = layerGroup;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers & Polygons when filteredFarms change
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;

    markersLayerRef.current.clearLayers();

    const bounds: L.LatLngExpression[] = [];

    filteredFarms.forEach(farm => {
      if (!farm.latitude || !farm.longitude || farm.latitude === 0 || farm.longitude === 0) return;

      const latLng: [number, number] = [farm.latitude, farm.longitude];
      bounds.push(latLng);

      const farmer = farmers.find(f => f.id === farm.farmerId);

      // Custom HTML Marker Pin
      const isPolygon = farm.geometryType === 'Polygon';
      const customIcon = L.divIcon({
        className: 'custom-farm-pin',
        html: `
          <div style="
            background-color: ${isPolygon ? '#047857' : '#d97706'};
            color: white;
            padding: 3px 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            border: 2px solid white;
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 3px;
          ">
            <span>${isPolygon ? '🌱' : '📍'}</span>
            <span>${farm.farmName.split(' ')[0]}</span>
          </div>
        `,
        iconSize: [80, 24],
        iconAnchor: [40, 12]
      });

      const marker = L.marker(latLng, { icon: customIcon }).addTo(markersLayerRef.current!);

      const popupContent = `
        <div style="font-family: sans-serif; font-size: 12px; line-height: 1.4; min-width: 180px;">
          <div style="font-weight: bold; font-size: 13px; color: #111827; margin-bottom: 2px;">${farm.farmName}</div>
          <div style="color: #4b5563;">Farmer: <strong>${farmer?.fullName || 'Unknown'}</strong></div>
          <div style="color: #6b7280; font-size: 11px;">District: ${farm.district}, ${farm.subcounty}</div>
          <div style="margin-top: 4px; padding-top: 4px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between;">
            <span style="font-weight: bold; color: #047857;">${farm.plotArea} ${farm.areaUnit}</span>
            <span style="background: #ecfdf5; color: #065f46; padding: 1px 4px; border-radius: 3px; font-size: 10px;">${farm.geometryType}</span>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedFarm(farm);
      });

      // Render Polygon if exists
      if (farm.geometryType === 'Polygon' && farm.geoJsonData) {
        try {
          const polyLayer = L.geoJSON(farm.geoJsonData as any, {
            style: {
              color: '#059669',
              weight: 2,
              opacity: 0.85,
              fillColor: '#10b981',
              fillOpacity: 0.25
            }
          }).addTo(markersLayerRef.current!);

          polyLayer.bindPopup(popupContent);
          polyLayer.on('click', () => setSelectedFarm(farm));
        } catch (e) {
          console.warn('GeoJSON render error for farm', farm.id, e);
        }
      }
    });

    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(bounds), { padding: [40, 40], maxZoom: 12 });
    }
  }, [filteredFarms, farmers]);

  const handleSaveFarm = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const area = parseFloat(plotArea) || 2.0;

    if (isNaN(lat) || isNaN(lng)) {
      alert('Please enter valid numeric latitude and longitude coordinates.');
      return;
    }

    const geoJsonData = geometryType === 'Polygon' ? {
      type: 'Polygon' as const,
      coordinates: [[
        [lng - 0.0018, lat - 0.0018],
        [lng + 0.0018, lat - 0.0018],
        [lng + 0.0022, lat + 0.0018],
        [lng - 0.0014, lat + 0.0018],
        [lng - 0.0018, lat - 0.0018]
      ]]
    } : undefined;

    if (editingFarm) {
      const updated: FarmPlot = {
        ...editingFarm,
        farmerId,
        farmName,
        district,
        subcounty,
        village,
        latitude: lat,
        longitude: lng,
        plotArea: area,
        geometryType,
        geoJsonData,
        verificationStatus: 'Verified'
      };
      appStore.updateFarm(updated);
      setSelectedFarm(updated);
    } else {
      const newFarm = appStore.addFarm({
        farmerId,
        farmName,
        district,
        subcounty,
        village,
        latitude: lat,
        longitude: lng,
        plotArea: area,
        areaUnit: 'Hectares',
        geometryType,
        geoJsonData,
        mappingAccuracyMeters: 1.5,
        verificationStatus: 'Verified',
        mappingMethod: 'Mobile GNSS',
        documentIds: []
      });
      setSelectedFarm(newFarm);
    }

    setShowAddFarmModal(false);
  };

  const openAddModal = () => {
    setEditingFarm(null);
    setFarmName('Masaka Central Coffee Shamba');
    setDistrict('Masaka');
    setSubcounty('Kyanamukaka');
    setVillage('Buyaga');
    setLatitude('-0.3425');
    setLongitude('31.7380');
    setPlotArea('2.4');
    setGeometryType('Polygon');
    setShowAddFarmModal(true);
  };

  const openEditModal = (farm: FarmPlot) => {
    setEditingFarm(farm);
    setFarmerId(farm.farmerId);
    setFarmName(farm.farmName);
    setDistrict(farm.district);
    setSubcounty(farm.subcounty);
    setVillage(farm.village);
    setLatitude(String(farm.latitude));
    setLongitude(String(farm.longitude));
    setPlotArea(String(farm.plotArea));
    setGeometryType(farm.geometryType);
    setShowAddFarmModal(true);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 border border-stone-200 rounded-lg shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-700" />
            Farm Geolocation & Polygon Mapping
          </h1>
          <p className="text-xs text-stone-600 mt-0.5">
            Georeferenced smallholder farm plots, GNSS bounding polygons, and regional coordinate validation.
          </p>
        </div>

        {currentUser.role !== 'viewer' && (
          <button
            onClick={openAddModal}
            className="bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-bold px-3.5 py-2 rounded shadow-sm flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Survey New Farm Parcel
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 border border-stone-200 rounded-lg text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-stone-500 uppercase tracking-wider text-[10px] flex items-center gap-1">
            <Filter className="w-3 h-3 text-stone-400" /> Filter:
          </span>

          <select
            value={filterGeometry}
            onChange={(e) => setFilterGeometry(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Geometry Formats ({farms.length})</option>
            <option value="Polygon">🌱 Polygons ({farms.filter(f => f.geometryType === 'Polygon').length})</option>
            <option value="Point">📍 Point Coordinates ({farms.filter(f => f.geometryType === 'Point').length})</option>
          </select>

          <select
            value={filterDistrict}
            onChange={(e) => setFilterDistrict(e.target.value)}
            className="bg-stone-50 border border-stone-300 rounded px-2.5 py-1 text-stone-700 font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-600"
          >
            <option value="ALL">All Districts</option>
            {UGANDA_DISTRICTS.map(d => (
              <option key={d.name} value={d.name}>{d.name} ({d.coffeeType})</option>
            ))}
          </select>
        </div>

        <div className="text-stone-600 font-mono text-xs">
          Showing {filteredFarms.length} of {farms.length} parcels on map
        </div>
      </div>

      {/* Map & Farm Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Interactive Leaflet Map (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-stone-200 rounded-lg overflow-hidden shadow-sm flex flex-col h-[520px]">
          <div className="bg-stone-900 text-stone-200 px-4 py-2 text-xs font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Uganda Coffee Geolocation Layer (WGS84 EPSG:4326)</span>
            </div>
            <span className="text-[11px] text-stone-400 font-mono">GNSS Precision: Mobile RTK/GNSS</span>
          </div>

          <div ref={mapContainerRef} className="flex-1 w-full z-10"></div>
        </div>

        {/* Selected Farm Detail Inspector (1 col) */}
        <div className="bg-white border border-stone-200 rounded-lg p-5 shadow-sm space-y-4">
          {selectedFarm ? (
            <>
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {selectedFarm.geometryType} Parcel
                  </span>
                  <h3 className="font-bold text-base text-stone-900 mt-1">{selectedFarm.farmName}</h3>
                </div>
                {currentUser.role !== 'viewer' && (
                  <button
                    onClick={() => openEditModal(selectedFarm)}
                    className="p-1.5 text-stone-400 hover:text-stone-700 rounded hover:bg-stone-100"
                    title="Edit Farm Plot Coordinates"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Farm Metadata */}
              <div className="space-y-2 text-xs bg-stone-50 p-3 rounded-md border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Registered Producer:</span>
                  <span className="font-bold text-stone-900">
                    {farmers.find(f => f.id === selectedFarm.farmerId)?.fullName || selectedFarm.farmerId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">District / Subcounty:</span>
                  <span className="font-bold text-stone-900">{selectedFarm.district}, {selectedFarm.subcounty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Village:</span>
                  <span className="font-bold text-stone-900">{selectedFarm.village}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Plot Area:</span>
                  <span className="font-bold font-mono text-emerald-900">{selectedFarm.plotArea} {selectedFarm.areaUnit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500 font-semibold">Survey Accuracy:</span>
                  <span className="font-mono text-stone-700">±{selectedFarm.mappingAccuracyMeters} meters</span>
                </div>
              </div>

              {/* Coordinates Box */}
              <div className="p-3 bg-stone-900 text-stone-100 rounded-md space-y-1 font-mono text-xs">
                <div className="text-[10px] text-emerald-400 font-bold uppercase">GNSS Centroid (WGS84)</div>
                <div>Latitude: <strong className="text-white">{selectedFarm.latitude.toFixed(6)}° N</strong></div>
                <div>Longitude: <strong className="text-white">{selectedFarm.longitude.toFixed(6)}° E</strong></div>
                <div className="text-[10px] text-stone-400 mt-1">
                  Status: {isUgandaCoordinates(selectedFarm.latitude, selectedFarm.longitude) ? '✓ Validated Uganda Territory' : '⚠ Outside Uganda Bounding Box'}
                </div>
              </div>

              {/* GeoJSON Polygon Raw Inspection */}
              {selectedFarm.geometryType === 'Polygon' && selectedFarm.geoJsonData && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider">Polygon Coordinates Array</span>
                  <pre className="bg-stone-50 p-2.5 rounded border border-stone-200 text-[10px] font-mono text-stone-700 max-h-32 overflow-y-auto">
                    {JSON.stringify(selectedFarm.geoJsonData, null, 2)}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-stone-400 space-y-2">
              <Compass className="w-8 h-8 mx-auto text-stone-300" />
              <div className="text-xs font-semibold text-stone-600">Select a farm pin on the map</div>
              <p className="text-[11px] text-stone-400">Click any marker to inspect GPS precision and polygon boundaries.</p>
            </div>
          )}
        </div>

      </div>

      {/* ADD / EDIT FARM MODAL */}
      {showAddFarmModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-5 border border-stone-200 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2">
                <Compass className="w-5 h-5 text-emerald-700" />
                <h3 className="font-bold text-base text-stone-900">
                  {editingFarm ? 'Update Farm Parcel & Coordinates' : 'Survey New Smallholder Farm Plot'}
                </h3>
              </div>
              <button onClick={() => setShowAddFarmModal(false)} className="text-stone-400 hover:text-stone-600 text-lg font-bold">
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveFarm} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-700 font-semibold mb-1">Smallholder Producer</label>
                <select
                  value={farmerId}
                  onChange={(e) => setFarmerId(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                >
                  {farmers.map(f => (
                    <option key={f.id} value={f.id}>{f.fullName} — {f.district}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Plot Name / Local Identifier</label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={(e) => setFarmName(e.target.value)}
                  className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                />
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
                  <label className="block text-stone-700 font-semibold mb-1">Latitude (° N/S) [-1.5 to 4.3]</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="-0.3425"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Longitude (° E) [29.5 to 35.1]</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="31.7380"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Plot Area (Hectares)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={plotArea}
                    onChange={(e) => setPlotArea(e.target.value)}
                    placeholder="2.5"
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">Geometry Type</label>
                  <select
                    value={geometryType}
                    onChange={(e) => setGeometryType(e.target.value as any)}
                    className="w-full bg-white border border-stone-300 rounded px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-600 focus:outline-none font-semibold"
                  >
                    <option value="Polygon">Polygon (Full Bounding Geometry)</option>
                    <option value="Point">Point (Centroid GPS)</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setShowAddFarmModal(false)}
                  className="px-3 py-1.5 rounded border border-stone-300 text-stone-700 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-800 hover:bg-emerald-700 text-white font-bold transition-colors"
                >
                  {editingFarm ? 'Save Coordinates' : 'Record Farm Parcel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
