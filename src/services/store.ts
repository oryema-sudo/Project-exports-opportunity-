import {
  Organization, User, Farmer, FarmPlot, Delivery, Lot, Shipment, DocumentRecord, AuditLog, TraceabilityEvent, CsvImportRow, ReadinessScorecard
} from '../types';
import {
  INITIAL_ORGANIZATIONS, INITIAL_USERS, INITIAL_FARMERS, INITIAL_FARMS,
  INITIAL_DELIVERIES, INITIAL_LOTS, INITIAL_SHIPMENTS, INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS, INITIAL_TRACEABILITY_EVENTS
} from '../data/seedData';
import { isUgandaCoordinates } from '../data/ugandaRegions';
import { calculateShipmentReadiness } from './readinessEngine';

const STORAGE_KEY = 'uganda_coffee_traceability_state_v1';

export interface AppState {
  activeOrgId: string;
  currentUser: User;
  organizations: Organization[];
  users: User[];
  farmers: Farmer[];
  farms: FarmPlot[];
  deliveries: Delivery[];
  lots: Lot[];
  shipments: Shipment[];
  documents: DocumentRecord[];
  auditLogs: AuditLog[];
  traceabilityEvents: TraceabilityEvent[];
}

export interface CsvImportPreview {
  validRows: any[];
  invalidRows: any[];
  errors: string[];
}

function loadInitialState(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.farmers && parsed.shipments) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Could not load stored state, fallback to seed data', e);
  }

  return {
    activeOrgId: 'org-glc-01',
    currentUser: INITIAL_USERS[0],
    organizations: INITIAL_ORGANIZATIONS,
    users: INITIAL_USERS,
    farmers: INITIAL_FARMERS,
    farms: INITIAL_FARMS,
    deliveries: INITIAL_DELIVERIES,
    lots: INITIAL_LOTS,
    shipments: INITIAL_SHIPMENTS,
    documents: INITIAL_DOCUMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    traceabilityEvents: INITIAL_TRACEABILITY_EVENTS
  };
}

class Store {
  private state: AppState;
  private listeners: ((state: AppState) => void)[] = [];

  constructor() {
    this.state = loadInitialState();
  }

  public getState(): AppState {
    return this.state;
  }

  public subscribe(listener: (state: AppState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.listeners.forEach(l => l(this.state));
  }

  public logAudit(action: string, entity: string, entityId: string, previousValue?: string, newValue?: string) {
    const log: AuditLog = {
      id: `AUD-${Date.now().toString().slice(-6)}`,
      organizationId: this.state.activeOrgId,
      userName: this.state.currentUser.name,
      userRole: this.state.currentUser.role,
      action,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      previousValue,
      newValue
    };
    this.state.auditLogs = [log, ...this.state.auditLogs];
  }

  // --- Auth & Org ---
  public setActiveOrganization(orgId: string) {
    this.state.activeOrgId = orgId;
    this.notify();
  }

  public switchOrganization(orgId: string) {
    this.setActiveOrganization(orgId);
  }

  public setCurrentUserRole(role: User['role']) {
    this.state.currentUser = {
      ...this.state.currentUser,
      role
    };
    this.notify();
  }

  public switchUserRole(role: User['role']) {
    this.setCurrentUserRole(role);
  }

  public updateOrganization(org: Organization) {
    this.state.organizations = this.state.organizations.map(o => o.id === org.id ? org : o);
    this.logAudit('Organization Profile Updated', 'Organization', org.id, undefined, org.legalName);
    this.notify();
  }


  // --- Farmers ---
  public addFarmer(farmer: Omit<Farmer, 'id' | 'organizationId' | 'createdDate' | 'updatedDate'>): Farmer {
    const newFarmer: Farmer = {
      ...farmer,
      id: `UG-F-${Math.floor(1000 + Math.random() * 9000)}`,
      organizationId: this.state.activeOrgId,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    this.state.farmers = [newFarmer, ...this.state.farmers];
    this.logAudit('Farmer Created', 'Farmer', newFarmer.id, undefined, `${newFarmer.fullName} (${newFarmer.district})`);
    this.notify();
    return newFarmer;
  }

  public updateFarmer(farmer: Farmer) {
    const old = this.state.farmers.find(f => f.id === farmer.id);
    this.state.farmers = this.state.farmers.map(f => f.id === farmer.id ? { ...farmer, updatedDate: new Date().toISOString().split('T')[0] } : f);
    this.logAudit('Farmer Updated', 'Farmer', farmer.id, old?.fullName, farmer.fullName);
    this.recalculateAllShipments();
    this.notify();
  }

  public deleteFarmer(id: string) {
    const old = this.state.farmers.find(f => f.id === id);
    this.state.farmers = this.state.farmers.filter(f => f.id !== id);
    this.logAudit('Farmer Deleted', 'Farmer', id, old?.fullName, 'Deleted');
    this.recalculateAllShipments();
    this.notify();
  }

  // --- Farms / Plots ---
  public addFarm(farm: Omit<FarmPlot, 'id' | 'organizationId'>): FarmPlot {
    const newFarm: FarmPlot = {
      ...farm,
      id: `UG-PL-${Math.floor(2000 + Math.random() * 8000)}`,
      organizationId: this.state.activeOrgId
    };
    this.state.farms = [newFarm, ...this.state.farms];
    this.logAudit('Farm Plot Created', 'FarmPlot', newFarm.id, undefined, `${newFarm.farmName} (${newFarm.district})`);
    this.recalculateAllShipments();
    this.notify();
    return newFarm;
  }

  public updateFarm(farm: FarmPlot) {
    const old = this.state.farms.find(f => f.id === farm.id);
    this.state.farms = this.state.farms.map(f => f.id === farm.id ? farm : f);
    this.logAudit(
      'Farm Plot Updated',
      'FarmPlot',
      farm.id,
      old ? `Lat: ${old.latitude}, Lng: ${old.longitude}` : undefined,
      `Lat: ${farm.latitude}, Lng: ${farm.longitude} (${farm.geometryType})`
    );
    this.recalculateAllShipments();
    this.notify();
  }

  public deleteFarm(id: string) {
    const old = this.state.farms.find(f => f.id === id);
    this.state.farms = this.state.farms.filter(f => f.id !== id);
    this.logAudit('Farm Deleted', 'FarmPlot', id, old?.farmName, 'Deleted');
    this.recalculateAllShipments();
    this.notify();
  }

  // --- Deliveries ---
  public addDelivery(delivery: Omit<Delivery, 'id' | 'organizationId'>): Delivery {
    const newDelivery: Delivery = {
      ...delivery,
      id: `DEL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      organizationId: this.state.activeOrgId
    };
    this.state.deliveries = [newDelivery, ...this.state.deliveries];
    this.logAudit('Delivery Recorded', 'Delivery', newDelivery.id, undefined, `${newDelivery.quantityKg} kg ${newDelivery.coffeeType} (${newDelivery.receiptNumber})`);
    this.recalculateAllShipments();
    this.notify();
    return newDelivery;
  }

  public updateDelivery(delivery: Delivery) {
    this.state.deliveries = this.state.deliveries.map(d => d.id === delivery.id ? delivery : d);
    this.logAudit('Delivery Updated', 'Delivery', delivery.id, undefined, `${delivery.quantityKg} kg`);
    this.recalculateAllShipments();
    this.notify();
  }

  // --- Lots & Traceability ---
  public addLot(lot: Omit<Lot, 'id' | 'organizationId' | 'creationDate'>): Lot {
    const newLot: Lot = {
      ...lot,
      id: `LOT-UG-${lot.coffeeType === 'Robusta' ? 'RB' : 'AR'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      organizationId: this.state.activeOrgId,
      creationDate: new Date().toISOString().split('T')[0]
    };
    this.state.lots = [newLot, ...this.state.lots];
    
    // Add default initial intake event
    const initialEvent: TraceabilityEvent = {
      id: `EVT-${Date.now().toString().slice(-5)}`,
      lotId: newLot.id,
      eventType: 'Received at Collection Hub',
      location: newLot.currentLocation,
      dateTime: new Date().toISOString(),
      responsibleParty: this.state.currentUser.name,
      quantityKg: newLot.quantityKg,
      referenceDocNumber: newLot.lotNumber,
      notes: 'Initial lot formation and weight verification.'
    };
    this.state.traceabilityEvents = [initialEvent, ...this.state.traceabilityEvents];

    this.logAudit('Lot Created', 'Lot', newLot.id, undefined, `${newLot.lotNumber} (${newLot.quantityKg} kg)`);
    this.recalculateAllShipments();
    this.notify();
    return newLot;
  }

  public updateLot(lot: Lot) {
    const old = this.state.lots.find(l => l.id === lot.id);
    this.state.lots = this.state.lots.map(l => l.id === lot.id ? lot : l);
    this.logAudit('Lot Updated', 'Lot', lot.id, old?.currentStatus, lot.currentStatus);
    this.recalculateAllShipments();
    this.notify();
  }

  public addTraceabilityEvent(event: Omit<TraceabilityEvent, 'id'>): TraceabilityEvent {
    const newEvent: TraceabilityEvent = {
      ...event,
      id: `EVT-${Date.now().toString().slice(-6)}`
    };
    this.state.traceabilityEvents = [newEvent, ...this.state.traceabilityEvents];
    this.logAudit('Traceability Movement Added', 'TraceabilityEvent', newEvent.lotId, undefined, `${newEvent.eventType} at ${newEvent.location}`);
    this.recalculateAllShipments();
    this.notify();
    return newEvent;
  }

  // --- Shipments ---
  public addShipment(shipment: Omit<Shipment, 'id' | 'organizationId' | 'createdDate' | 'readinessStatus'>): Shipment {
    const id = `SH-UG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newShipment: Shipment = {
      ...shipment,
      id,
      organizationId: this.state.activeOrgId,
      createdDate: new Date().toISOString().split('T')[0],
      readinessStatus: 'YELLOW'
    };

    // Calculate initial readiness
    const scorecard = calculateShipmentReadiness(
      newShipment,
      this.state.lots,
      this.state.farms,
      this.state.farmers,
      this.state.deliveries,
      this.state.documents,
      this.state.traceabilityEvents
    );
    newShipment.readinessStatus = scorecard.overallStatus;

    this.state.shipments = [newShipment, ...this.state.shipments];
    this.logAudit('Shipment Created', 'Shipment', newShipment.id, undefined, `${newShipment.exportReference} -> ${newShipment.buyerName}`);
    this.notify();
    return newShipment;
  }

  public updateShipment(shipment: Shipment) {
    const scorecard = calculateShipmentReadiness(
      shipment,
      this.state.lots,
      this.state.farms,
      this.state.farmers,
      this.state.deliveries,
      this.state.documents,
      this.state.traceabilityEvents
    );
    const updated = { ...shipment, readinessStatus: scorecard.overallStatus };
    this.state.shipments = this.state.shipments.map(s => s.id === shipment.id ? updated : s);
    this.logAudit('Shipment Updated', 'Shipment', shipment.id, undefined, `Status: ${updated.exportStatus}, Readiness: ${updated.readinessStatus}`);
    this.notify();
  }

  public recalculateAllShipments() {
    this.state.shipments = this.state.shipments.map(shipment => {
      const scorecard = calculateShipmentReadiness(
        shipment,
        this.state.lots,
        this.state.farms,
        this.state.farmers,
        this.state.deliveries,
        this.state.documents,
        this.state.traceabilityEvents
      );
      return { ...shipment, readinessStatus: scorecard.overallStatus };
    });
  }

  public getShipmentScorecard(shipmentId: string): ReadinessScorecard | null {
    const shipment = this.state.shipments.find(s => s.id === shipmentId);
    if (!shipment) return null;
    return calculateShipmentReadiness(
      shipment,
      this.state.lots,
      this.state.farms,
      this.state.farmers,
      this.state.deliveries,
      this.state.documents,
      this.state.traceabilityEvents
    );
  }

  // --- Documents ---
  public addDocument(doc: Omit<DocumentRecord, 'id' | 'organizationId' | 'uploadDate' | 'uploadedBy'>): DocumentRecord {
    const newDoc: DocumentRecord = {
      ...doc,
      id: `DOC-${Math.floor(100 + Math.random() * 900)}`,
      organizationId: this.state.activeOrgId,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: this.state.currentUser.name
    };
    this.state.documents = [newDoc, ...this.state.documents];
    this.logAudit('Document Uploaded', 'DocumentRecord', newDoc.id, undefined, `${newDoc.fileName} (${newDoc.type})`);
    this.recalculateAllShipments();
    this.notify();
    return newDoc;
  }

  public verifyDocument(id: string) {
    this.state.documents = this.state.documents.map(d => d.id === id ? { ...d, verificationStatus: 'Verified' } : d);
    this.logAudit('Document Verified', 'DocumentRecord', id, 'Pending Review', 'Verified');
    this.recalculateAllShipments();
    this.notify();
  }

  public updateDocument(doc: DocumentRecord) {
    this.state.documents = this.state.documents.map(d => d.id === doc.id ? doc : d);
    this.logAudit('Document Updated', 'DocumentRecord', doc.id, undefined, `${doc.fileName} (${doc.verificationStatus})`);
    this.recalculateAllShipments();
    this.notify();
  }

  public deleteDocument(id: string) {
    const old = this.state.documents.find(d => d.id === id);
    this.state.documents = this.state.documents.filter(d => d.id !== id);
    this.logAudit('Document Deleted', 'DocumentRecord', id, old?.fileName, 'Deleted');
    this.recalculateAllShipments();
    this.notify();
  }

  // --- Bulk CSV Import Processor ---
  public importBulkFarmersAndFarms(validRows: any[]) {
    return this.commitImportedRows(validRows);
  }

  public resetToSeedData() {
    this.resetToSeed();
  }


  // --- Bulk CSV Import Processor ---
  public parseAndValidateCsv(csvText: string): CsvImportPreview & { rows: CsvImportRow[]; validCount: number; warningCount: number; errorCount: number } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      return { rows: [], validRows: [], invalidRows: [], errors: [], validCount: 0, warningCount: 0, errorCount: 0 };
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
    
    // Check key column indices
    const nameIdx = headers.findIndex(h => h.includes('name'));
    const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('contact') || h.includes('tel'));
    const villageIdx = headers.findIndex(h => h.includes('village'));
    const parishIdx = headers.findIndex(h => h.includes('parish'));
    const subcountyIdx = headers.findIndex(h => h.includes('subcounty'));
    const districtIdx = headers.findIndex(h => h.includes('district'));
    const coopIdx = headers.findIndex(h => h.includes('coop') || h.includes('association'));
    const latIdx = headers.findIndex(h => h.includes('lat'));
    const lngIdx = headers.findIndex(h => h.includes('lon') || h.includes('lng'));
    const areaIdx = headers.findIndex(h => h.includes('area') || h.includes('hecta') || h.includes('acre'));

    const rows: CsvImportRow[] = [];
    let validCount = 0;
    let warningCount = 0;
    let errorCount = 0;

    const existingIds = new Set(this.state.farmers.map(f => f.id));

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim());
      if (parts.length < 2) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      const fullName = nameIdx >= 0 ? parts[nameIdx] : parts[0] || '';
      const phone = phoneIdx >= 0 ? parts[phoneIdx] : '';
      const village = villageIdx >= 0 ? parts[villageIdx] : '';
      const parish = parishIdx >= 0 ? parts[parishIdx] : '';
      const subcounty = subcountyIdx >= 0 ? parts[subcountyIdx] : '';
      const district = districtIdx >= 0 ? parts[districtIdx] : '';
      const cooperative = coopIdx >= 0 ? parts[coopIdx] : 'Great Lakes Smallholder Farmers Network';
      
      const rawLat = latIdx >= 0 ? parseFloat(parts[latIdx]) : NaN;
      const rawLng = lngIdx >= 0 ? parseFloat(parts[lngIdx]) : NaN;
      const rawArea = areaIdx >= 0 ? parseFloat(parts[areaIdx]) : NaN;

      const latitude = isNaN(rawLat) ? null : rawLat;
      const longitude = isNaN(rawLng) ? null : rawLng;
      const plotArea = isNaN(rawArea) ? 1.5 : rawArea;

      if (!fullName) errors.push('Farmer full name is required');
      if (!district) errors.push('District is required');

      if (!phone) {
        warnings.push('Missing phone number');
      } else if (!phone.startsWith('+256') && !phone.startsWith('07') && !phone.startsWith('256')) {
        warnings.push('Phone may not be standard Ugandan format (+256...)');
      }

      if (latitude !== null && longitude !== null) {
        if (!isUgandaCoordinates(latitude, longitude)) {
          errors.push(`Coordinates (${latitude}, ${longitude}) fall outside Uganda bounding box (-1.5° to 4.3° N, 29.5° to 35.1° E)`);
        }
      } else {
        warnings.push('Missing GPS latitude/longitude (Point will need mapping later)');
      }

      const generatedId = `UG-F-${Math.floor(2000 + Math.random() * 7000)}`;

      const isValid = errors.length === 0;
      if (isValid) {
        validCount++;
        if (warnings.length > 0) warningCount++;
      } else {
        errorCount++;
      }

      rows.push({
        rowNumber: i,
        farmerId: generatedId,
        fullName,
        phone: phone || '+256 700 000 000',
        village: village || 'Central',
        parish: parish || 'Parish',
        subcounty: subcounty || 'Subcounty',
        district: district || 'Masaka',
        cooperative: cooperative || 'Independent Smallholder',
        latitude,
        longitude,
        plotArea,
        errors,
        warnings,
        isValid
      });
    }

    const validRows = rows.filter(r => r.isValid);
    const invalidRows = rows.filter(r => !r.isValid);
    const allErrors = invalidRows.flatMap(r => r.errors);

    return { 
      rows, 
      validRows,
      invalidRows,
      errors: allErrors,
      validCount, 
      warningCount, 
      errorCount 
    };
  }


  public commitImportedRows(validRows: CsvImportRow[]): number {
    let count = 0;
    for (const r of validRows) {
      if (!r.isValid) continue;

      const farmer: Farmer = {
        id: r.farmerId,
        organizationId: this.state.activeOrgId,
        fullName: r.fullName,
        phone: r.phone,
        village: r.village,
        parish: r.parish,
        subcounty: r.subcounty,
        district: r.district,
        cooperative: r.cooperative,
        farmerRegId: `REG-${r.district.slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        verificationStatus: r.latitude && r.longitude ? 'Verified' : 'Partially verified',
        notes: `Bulk imported via CSV on ${new Date().toISOString().split('T')[0]}.`,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0]
      };

      this.state.farmers = [farmer, ...this.state.farmers];

      // Auto-create farm plot if GPS coordinates exist
      if (r.latitude && r.longitude) {
        const farm: FarmPlot = {
          id: `UG-PL-${Math.floor(3000 + Math.random() * 6000)}`,
          farmerId: farmer.id,
          organizationId: this.state.activeOrgId,
          farmName: `${farmer.fullName} Main Shamba`,
          district: r.district,
          subcounty: r.subcounty,
          parish: r.parish,
          village: r.village,
          latitude: r.latitude,
          longitude: r.longitude,
          plotArea: r.plotArea || 1.5,
          areaUnit: 'Hectares',
          geometryType: 'Point',
          mappingDate: new Date().toISOString().split('T')[0],
          mappingMethod: 'Mobile GNSS',
          mappingAccuracyMeters: 2.1,
          verificationStatus: 'Verified',
          notes: 'Auto-registered during CSV bulk onboarding.'
        };
        this.state.farms = [farm, ...this.state.farms];
      }

      count++;
    }

    this.logAudit('Bulk CSV Farmers Imported', 'Farmer', `BATCH-${Date.now()}`, undefined, `Imported ${count} verified records`);
    this.recalculateAllShipments();
    this.notify();
    return count;
  }

  // --- GeoJSON Generator for Shipment Export ---
  public generateShipmentGeoJson(shipmentId: string): object {
    const shipment = this.state.shipments.find(s => s.id === shipmentId);
    if (!shipment) return {};

    const linkedLots = this.state.lots.filter(l => shipment.linkedLotIds.includes(l.id));
    const farmIds = Array.from(new Set(linkedLots.flatMap(l => l.sourceFarmIds)));
    const linkedFarms = this.state.farms.filter(f => farmIds.includes(f.id));

    const features = linkedFarms.map(farm => {
      const farmer = this.state.farmers.find(fm => fm.id === farm.farmerId);
      
      let geometry: any;
      if (farm.geometryType === 'Polygon' && farm.geoJsonData) {
        geometry = farm.geoJsonData;
      } else {
        geometry = {
          type: 'Point',
          coordinates: [farm.longitude, farm.latitude]
        };
      }

      return {
        type: 'Feature',
        properties: {
          farmId: farm.id,
          farmName: farm.farmName,
          farmerId: farmer?.id || farm.farmerId,
          farmerName: farmer?.fullName || 'Unknown',
          district: farm.district,
          subcounty: farm.subcounty,
          parish: farm.parish,
          village: farm.village,
          plotAreaHectares: farm.plotArea,
          mappingMethod: farm.mappingMethod,
          mappingAccuracyMeters: farm.mappingAccuracyMeters,
          verificationStatus: farm.verificationStatus,
          shipmentExportReference: shipment.exportReference,
          coffeeType: shipment.coffeeType
        },
        geometry
      };
    });

    return {
      type: 'FeatureCollection',
      name: `Uganda_Coffee_Traceability_${shipment.exportReference}`,
      metadata: {
        exportReference: shipment.exportReference,
        buyer: shipment.buyerName,
        destinationPort: shipment.destinationPort,
        consignmentKg: shipment.totalQuantityKg,
        generatedAt: new Date().toISOString(),
        producerCountry: 'Uganda',
        disclaimer: 'System-generated traceability & export-readiness evidence dataset. Does not constitute statutory government certification.'
      },
      features
    };
  }

  public resetToSeed() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      activeOrgId: 'org-glc-01',
      currentUser: INITIAL_USERS[0],
      organizations: INITIAL_ORGANIZATIONS,
      users: INITIAL_USERS,
      farmers: INITIAL_FARMERS,
      farms: INITIAL_FARMS,
      deliveries: INITIAL_DELIVERIES,
      lots: INITIAL_LOTS,
      shipments: INITIAL_SHIPMENTS,
      documents: INITIAL_DOCUMENTS,
      auditLogs: INITIAL_AUDIT_LOGS,
      traceabilityEvents: INITIAL_TRACEABILITY_EVENTS
    };
    this.notify();
  }
}

export const appStore = new Store();
