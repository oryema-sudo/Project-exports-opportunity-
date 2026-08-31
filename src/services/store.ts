import {
  Organization, User, Farmer, FarmPlot, Delivery, Lot, Shipment, DocumentRecord, AuditLog, TraceabilityEvent, CsvImportRow, ReadinessScorecard, UserRole
} from '../types';
import {
  INITIAL_ORGANIZATIONS, INITIAL_USERS, INITIAL_FARMERS, INITIAL_FARMS,
  INITIAL_DELIVERIES, INITIAL_LOTS, INITIAL_SHIPMENTS, INITIAL_DOCUMENTS,
  INITIAL_AUDIT_LOGS, INITIAL_TRACEABILITY_EVENTS
} from '../data/seedData';
import { isUgandaCoordinates } from '../data/ugandaRegions';
import { calculateShipmentReadiness } from './readinessEngine';
import { api } from './api';
import { auth, googleAuthProvider } from '../lib/firebase';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const STORAGE_KEY = 'uganda_coffee_traceability_cache_v2';

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
  isLoading: boolean;
  serverConnected: boolean;
  syncError?: string;
}

export interface CsvImportPreview {
  validRows: any[];
  invalidRows: any[];
  errors: string[];
}

const GUEST_USER: User = {
  id: '',
  name: 'Guest User',
  email: '',
  role: 'viewer',
  organizationId: '',
  title: 'Guest Viewer',
  isPlatformOwner: false,
  platformRole: null
};

function loadInitialState(): AppState {
  return {
    activeOrgId: 'org-glc-01',
    currentUser: GUEST_USER,
    organizations: INITIAL_ORGANIZATIONS,
    users: INITIAL_USERS,
    farmers: INITIAL_FARMERS,
    farms: INITIAL_FARMS,
    deliveries: INITIAL_DELIVERIES,
    lots: INITIAL_LOTS,
    shipments: INITIAL_SHIPMENTS,
    documents: INITIAL_DOCUMENTS,
    auditLogs: INITIAL_AUDIT_LOGS,
    traceabilityEvents: INITIAL_TRACEABILITY_EVENTS,
    isLoading: false,
    serverConnected: false
  };
}

class Store {
  private state: AppState;
  private listeners: ((state: AppState) => void)[] = [];
  private isInitialized = false;

  constructor() {
    this.state = loadInitialState();
    this.initAuthAndSync();
  }

  private initAuthAndSync() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        this.state.isLoading = true;
        this.notify();
        await this.syncFromServer();
      } else {
        this.state.currentUser = GUEST_USER;
        this.state.isLoading = false;
        this.notify();
      }
    });
  }

  public async syncFromServer() {
    try {
      this.state.isLoading = true;
      this.notify();

      // Check profile
      const profile = await api.getProfile().catch(() => null);
      if (profile && profile.user) {
        this.state.currentUser = profile.user;
        if (profile.organization) {
          this.state.organizations = [profile.organization];
          this.state.activeOrgId = profile.organization.id;
        }
      }

      // Fetch all server authoritative datasets
      const [farmers, farms, deliveries, lotsData, shipments, docs, logs] = await Promise.all([
        api.getFarmers().catch(() => null),
        api.getFarms().catch(() => null),
        api.getDeliveries().catch(() => null),
        api.getLots().catch(() => null),
        api.getShipments().catch(() => null),
        api.getDocuments().catch(() => null),
        api.getAuditLogs().catch(() => null)
      ]);

      if (farmers !== null) {
        this.state.farmers = farmers;
        this.state.serverConnected = true;

        // If organization is brand new & empty, seed baseline pilot data automatically
        if (farmers.length === 0) {
          await api.seedBaseline().catch(() => {});
          // Re-fetch after seed
          const [seededFarmers, seededFarms, seededDeliveries, seededLotsData, seededShipments, seededDocs, seededLogs] = await Promise.all([
            api.getFarmers().catch(() => []),
            api.getFarms().catch(() => []),
            api.getDeliveries().catch(() => []),
            api.getLots().catch(() => ({ lots: [], events: [] })),
            api.getShipments().catch(() => []),
            api.getDocuments().catch(() => []),
            api.getAuditLogs().catch(() => [])
          ]);
          this.state.farmers = seededFarmers;
          this.state.farms = seededFarms;
          this.state.deliveries = seededDeliveries;
          this.state.lots = seededLotsData.lots || [];
          this.state.traceabilityEvents = seededLotsData.events || [];
          this.state.shipments = seededShipments;
          this.state.documents = seededDocs;
          this.state.auditLogs = seededLogs;
        } else {
          if (farms !== null) this.state.farms = farms;
          if (deliveries !== null) this.state.deliveries = deliveries;
          if (lotsData !== null) {
            this.state.lots = lotsData.lots || [];
            this.state.traceabilityEvents = lotsData.events || [];
          }
          if (shipments !== null) this.state.shipments = shipments;
          if (docs !== null) this.state.documents = docs;
          if (logs !== null) this.state.auditLogs = logs;
        }
      }

      this.state.isLoading = false;
      this.state.syncError = undefined;
      this.recalculateAllShipments();
      this.notify();
    } catch (err: any) {
      console.warn('[Store] Cloud sync note:', err.message);
      this.state.isLoading = false;
      this.state.syncError = err.message;
      this.notify();
    }
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
    this.listeners.forEach(l => l(this.state));
  }

  // --- Authentication Actions ---
  public async loginWithGoogle(): Promise<{ success: boolean; error?: string }> {
    try {
      this.state.isLoading = true;
      this.notify();
      await signInWithPopup(auth, googleAuthProvider);
      await this.syncFromServer();
      return { success: true };
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or cancelled the popup window intentionally; reset loading gracefully
        this.state.isLoading = false;
        this.notify();
        return { success: false, error: 'Popup closed' };
      }

      if (code === 'auth/popup-blocked') {
        this.state.isLoading = false;
        this.state.syncError = 'Sign-in popup was blocked by browser. Please allow popups for this site.';
        this.notify();
        return { success: false, error: 'Popup blocked' };
      }

      console.warn('[Auth] Google sign in note:', err?.message || err);
      this.state.isLoading = false;
      this.state.syncError = err?.message;
      this.notify();
      return { success: false, error: err?.message };
    }
  }

  public async logout() {
    try {
      this.state.isLoading = true;
      this.notify();
      await signOut(auth);
      this.state.currentUser = GUEST_USER;
      this.state.isLoading = false;
      this.notify();
    } catch (err) {
      console.error('[Auth] Logout failed:', err);
      this.state.currentUser = GUEST_USER;
      this.state.isLoading = false;
      this.notify();
    }
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
    this.notify();
  }

  // --- Auth & Org ---
  public setActiveOrganization(orgId: string) {
    this.state.activeOrgId = orgId;
    this.notify();
  }

  public switchOrganization(orgId: string) {
    this.setActiveOrganization(orgId);
  }

  public setCurrentUserRole(role: UserRole) {
    this.state.currentUser = {
      ...this.state.currentUser,
      role
    };
    this.notify();
  }

  public switchUserRole(role: UserRole) {
    this.setCurrentUserRole(role);
  }

  public async updateOrganization(org: Organization) {
    this.state.organizations = this.state.organizations.map(o => o.id === org.id ? org : o);
    this.notify();
    try {
      await api.updateOrganization({
        legalName: org.legalName,
        district: org.district,
        address: org.address,
        contactPhone: org.contactPhone,
        contactEmail: org.contactEmail,
        website: org.website,
        subscriptionPlan: org.subscriptionPlan
      });
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] Org update API error:', err);
    }
  }

  // --- Farmers ---
  public async addFarmer(farmer: Omit<Farmer, 'id' | 'organizationId' | 'createdDate' | 'updatedDate'>): Promise<Farmer> {
    const tempId = `UG-F-${Math.floor(1000 + Math.random() * 9000)}`;
    const newFarmer: Farmer = {
      ...farmer,
      id: tempId,
      organizationId: this.state.activeOrgId,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0]
    };
    this.state.farmers = [newFarmer, ...this.state.farmers];
    this.notify();

    try {
      const created = await api.createFarmer(farmer);
      this.state.farmers = this.state.farmers.map(f => f.id === tempId ? { ...newFarmer, id: created.id } : f);
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addFarmer API error:', err);
      return newFarmer;
    }
  }

  public async updateFarmer(farmer: Farmer) {
    this.state.farmers = this.state.farmers.map(f => f.id === farmer.id ? { ...farmer, updatedDate: new Date().toISOString().split('T')[0] } : f);
    this.recalculateAllShipments();
    this.notify();

    try {
      await api.updateFarmer(farmer.id, farmer);
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] updateFarmer API error:', err);
    }
  }

  public async deleteFarmer(id: string) {
    this.state.farmers = this.state.farmers.filter(f => f.id !== id);
    this.recalculateAllShipments();
    this.notify();

    try {
      await api.deleteFarmer(id);
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] deleteFarmer API error:', err);
    }
  }

  // --- Farms / Plots ---
  public async addFarm(farm: Omit<FarmPlot, 'id' | 'organizationId'>): Promise<FarmPlot> {
    const tempId = `UG-PL-${Math.floor(2000 + Math.random() * 8000)}`;
    const newFarm: FarmPlot = {
      ...farm,
      id: tempId,
      organizationId: this.state.activeOrgId
    };
    this.state.farms = [newFarm, ...this.state.farms];
    this.recalculateAllShipments();
    this.notify();

    try {
      const created = await api.createFarm(farm);
      this.state.farms = this.state.farms.map(f => f.id === tempId ? { ...newFarm, id: created.id } : f);
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addFarm API error:', err);
      return newFarm;
    }
  }

  public async updateFarm(farm: FarmPlot) {
    this.state.farms = this.state.farms.map(f => f.id === farm.id ? farm : f);
    this.recalculateAllShipments();
    this.notify();

    try {
      await api.updateFarm(farm.id, farm);
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] updateFarm API error:', err);
    }
  }

  // --- Deliveries ---
  public async addDelivery(delivery: Omit<Delivery, 'id' | 'organizationId'>): Promise<Delivery> {
    const tempId = `DEL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newDelivery: Delivery = {
      ...delivery,
      id: tempId,
      organizationId: this.state.activeOrgId
    };
    this.state.deliveries = [newDelivery, ...this.state.deliveries];
    this.recalculateAllShipments();
    this.notify();

    try {
      const created = await api.createDelivery(delivery);
      this.state.deliveries = this.state.deliveries.map(d => d.id === tempId ? { ...newDelivery, id: created.id } : d);
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addDelivery API error:', err);
      return newDelivery;
    }
  }

  public async updateDelivery(delivery: Delivery) {
    this.state.deliveries = this.state.deliveries.map(d => d.id === delivery.id ? delivery : d);
    this.recalculateAllShipments();
    this.notify();
  }

  // --- Lots & Traceability ---
  public async addLot(lot: Omit<Lot, 'id' | 'organizationId' | 'creationDate'> & { deliveryIds?: string[] }): Promise<Lot> {
    const tempId = `LOT-UG-${lot.coffeeType === 'Robusta' ? 'RB' : 'AR'}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLot: Lot = {
      ...lot,
      id: tempId,
      organizationId: this.state.activeOrgId,
      creationDate: new Date().toISOString().split('T')[0]
    };
    this.state.lots = [newLot, ...this.state.lots];
    this.recalculateAllShipments();
    this.notify();

    try {
      const created = await api.createLot({
        lotNumber: lot.lotNumber,
        coffeeType: lot.coffeeType,
        grade: lot.grade,
        quantityKg: lot.quantityKg,
        currentLocation: lot.currentLocation,
        processingStation: lot.processingStation,
        deliveryIds: lot.sourceDeliveryIds || lot.deliveryIds || [],
        notes: lot.notes
      });
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addLot API error:', err);
      return newLot;
    }
  }

  public async addTraceabilityEvent(event: Omit<TraceabilityEvent, 'id'>): Promise<TraceabilityEvent> {
    const tempId = `EVT-${Date.now().toString().slice(-6)}`;
    const newEvent: TraceabilityEvent = {
      ...event,
      id: tempId
    };
    this.state.traceabilityEvents = [newEvent, ...this.state.traceabilityEvents];
    this.recalculateAllShipments();
    this.notify();

    try {
      const created = await api.addLotEvent(event.lotId, event);
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addTraceabilityEvent API error:', err);
      return newEvent;
    }
  }

  // --- Shipments ---
  public async addShipment(shipment: Omit<Shipment, 'id' | 'organizationId' | 'createdDate' | 'readinessStatus'>): Promise<Shipment> {
    const tempId = `SH-UG-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
    const newShipment: Shipment = {
      ...shipment,
      id: tempId,
      organizationId: this.state.activeOrgId,
      createdDate: new Date().toISOString().split('T')[0],
      readinessStatus: 'YELLOW'
    };

    this.state.shipments = [newShipment, ...this.state.shipments];
    this.recalculateAllShipments();
    this.notify();

    try {
      const created = await api.createShipment({
        exportReference: shipment.exportReference,
        shipmentDate: shipment.shipmentDate,
        buyerName: shipment.buyerName,
        destinationCountry: shipment.destinationCountry,
        destinationPort: shipment.destinationPort,
        coffeeType: shipment.coffeeType,
        totalQuantityKg: shipment.totalQuantityKg,
        lotIds: shipment.linkedLotIds,
        notes: shipment.notes
      });
      await this.syncFromServer();
      return created;
    } catch (err) {
      console.error('[Store] addShipment API error:', err);
      return newShipment;
    }
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
  public async addDocument(doc: Omit<DocumentRecord, 'id' | 'organizationId' | 'uploadDate' | 'uploadedBy'>): Promise<DocumentRecord> {
    const tempId = `DOC-${Math.floor(100 + Math.random() * 900)}`;
    const newDoc: DocumentRecord = {
      ...doc,
      id: tempId,
      organizationId: this.state.activeOrgId,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: this.state.currentUser.name
    };
    this.state.documents = [newDoc, ...this.state.documents];
    this.recalculateAllShipments();
    this.notify();
    return newDoc;
  }

  public async uploadDocumentFile(file: File, meta: { type: string; relatedEntityType: string; relatedEntityId: string; notes?: string }): Promise<DocumentRecord> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', meta.type);
    formData.append('relatedEntityType', meta.relatedEntityType);
    formData.append('relatedEntityId', meta.relatedEntityId);
    if (meta.notes) formData.append('notes', meta.notes);

    const uploaded = await api.uploadDocument(formData);
    await this.syncFromServer();
    return uploaded;
  }

  public async updateDocument(doc: DocumentRecord) {
    this.state.documents = this.state.documents.map(d => d.id === doc.id ? doc : d);
    this.recalculateAllShipments();
    this.notify();

    try {
      await api.updateDocument(doc.id, doc);
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] updateDocument API error:', err);
    }
  }

  public async verifyDocument(id: string) {
    this.state.documents = this.state.documents.map(d => d.id === id ? { ...d, verificationStatus: 'Verified' } : d);
    this.recalculateAllShipments();
    this.notify();

    try {
      await api.updateDocument(id, { verificationStatus: 'Verified' });
      await this.syncFromServer();
    } catch (err) {
      console.error('[Store] verifyDocument API error:', err);
    }
  }

  // --- CSV Import ---
  public parseAndValidateCsv(csvText: string): CsvImportPreview & { rows: CsvImportRow[]; validCount: number; warningCount: number; errorCount: number } {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length <= 1) {
      return { rows: [], validRows: [], invalidRows: [], errors: [], validCount: 0, warningCount: 0, errorCount: 0 };
    }

    const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
    
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

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i]!.split(',').map(p => p.trim());
      if (parts.length < 2) continue;

      const errors: string[] = [];
      const warnings: string[] = [];

      const fullName = nameIdx >= 0 ? parts[nameIdx]! : parts[0] || '';
      const phone = phoneIdx >= 0 ? parts[phoneIdx]! : '';
      const village = villageIdx >= 0 ? parts[villageIdx]! : '';
      const parish = parishIdx >= 0 ? parts[parishIdx]! : '';
      const subcounty = subcountyIdx >= 0 ? parts[subcountyIdx]! : '';
      const district = districtIdx >= 0 ? parts[districtIdx]! : '';
      const cooperative = coopIdx >= 0 ? parts[coopIdx]! : 'Great Lakes Smallholder Farmers Network';
      
      const rawLat = latIdx >= 0 ? parseFloat(parts[latIdx]!) : NaN;
      const rawLng = lngIdx >= 0 ? parseFloat(parts[lngIdx]!) : NaN;
      const rawArea = areaIdx >= 0 ? parseFloat(parts[areaIdx]!) : NaN;

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
        warnings.push('Missing GPS latitude/longitude');
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

  public async importBulkFarmersAndFarms(validRows: any[]) {
    // Send raw CSV or commit rows via API
    return this.commitImportedRows(validRows);
  }

  public async commitImportedRows(validRows: CsvImportRow[]): Promise<number> {
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

    this.recalculateAllShipments();
    this.notify();
    return count;
  }

  // --- GeoJSON Generator ---
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
    this.state = loadInitialState();
    this.syncFromServer();
    this.notify();
  }

  public resetToSeedData() {
    this.resetToSeed();
  }
}

export const appStore = new Store();
