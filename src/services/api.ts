import { auth } from '../lib/firebase';
import { 
  Farmer, FarmPlot, Delivery, Lot, Shipment, DocumentRecord, 
  AuditLog, TraceabilityEvent, ReadinessScorecard, Organization, User 
} from '../types';

async function getAuthHeader(): Promise<HeadersInit> {
  const user = auth.currentUser;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (user) {
    try {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    } catch (e) {
      console.warn('Could not retrieve Firebase token', e);
    }
  }
  return headers;
}

export const api = {
  // Auth & Profile
  async getProfile(): Promise<{ user: User; organization: Organization } | null> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/auth/me', { headers });
    if (!res.ok) return null;
    return res.json();
  },

  async updateOrganization(data: Partial<Organization>): Promise<Organization> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/organizations/current', {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update organization');
    }
    return res.json();
  },

  async seedBaseline(): Promise<any> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/seed', {
      method: 'POST',
      headers
    });
    return res.json();
  },

  // Farmers
  async getFarmers(): Promise<Farmer[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/farmers', { headers });
    if (!res.ok) throw new Error('Failed to fetch farmers');
    return res.json();
  },

  async createFarmer(data: Partial<Farmer>): Promise<Farmer> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/farmers', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to register farmer');
    }
    return res.json();
  },

  async updateFarmer(id: string, data: Partial<Farmer>): Promise<Farmer> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/farmers/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update farmer');
    }
    return res.json();
  },

  async deleteFarmer(id: string): Promise<void> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/farmers/${id}`, {
      method: 'DELETE',
      headers
    });
    if (!res.ok) throw new Error('Failed to delete farmer');
  },

  // Farms
  async getFarms(): Promise<FarmPlot[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/farms', { headers });
    if (!res.ok) throw new Error('Failed to fetch farm plots');
    return res.json();
  },

  async createFarm(data: Partial<FarmPlot>): Promise<FarmPlot> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/farms', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create farm plot');
    }
    return res.json();
  },

  async updateFarm(id: string, data: Partial<FarmPlot>): Promise<FarmPlot> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/farms/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update farm plot');
    }
    return res.json();
  },

  // Deliveries
  async getDeliveries(): Promise<Delivery[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/deliveries', { headers });
    if (!res.ok) throw new Error('Failed to fetch deliveries');
    return res.json();
  },

  async createDelivery(data: Partial<Delivery>): Promise<Delivery> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/deliveries', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to record intake delivery');
    }
    return res.json();
  },

  // Lots & Events
  async getLots(): Promise<{ lots: Lot[]; events: TraceabilityEvent[] }> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/lots', { headers });
    if (!res.ok) throw new Error('Failed to fetch lots');
    return res.json();
  },

  async createLot(data: {
    lotNumber: string;
    coffeeType: string;
    grade: string;
    quantityKg: number;
    currentLocation: string;
    processingStation: string;
    deliveryIds: string[];
    notes?: string;
  }): Promise<Lot> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/lots', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create lot');
    }
    return res.json();
  },

  async addLotEvent(lotId: string, eventData: Partial<TraceabilityEvent>): Promise<TraceabilityEvent> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/lots/${lotId}/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify(eventData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to add custody movement event');
    }
    return res.json();
  },

  // Shipments & Authoritative Readiness
  async getShipments(): Promise<Shipment[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/shipments', { headers });
    if (!res.ok) throw new Error('Failed to fetch shipments');
    return res.json();
  },

  async createShipment(data: {
    exportReference: string;
    shipmentDate: string;
    buyerName: string;
    destinationCountry: string;
    destinationPort: string;
    coffeeType: string;
    totalQuantityKg: number;
    lotIds: string[];
    notes?: string;
  }): Promise<Shipment> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/shipments', {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create export shipment');
    }
    return res.json();
  },

  async evaluateReadiness(shipmentId: string): Promise<{ scorecard: ReadinessScorecard; ruleVersion: string }> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/shipments/${shipmentId}/evaluate`, { headers });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to run readiness evaluation');
    }
    return res.json();
  },

  // Documents
  async getDocuments(): Promise<DocumentRecord[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/documents', { headers });
    if (!res.ok) throw new Error('Failed to fetch documents');
    return res.json();
  },

  async uploadDocument(formData: FormData): Promise<DocumentRecord> {
    const user = auth.currentUser;
    const headers: Record<string, string> = {};
    if (user) {
      const token = await user.getIdToken();
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch('/api/documents/upload', {
      method: 'POST',
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }
    return res.json();
  },

  async updateDocument(id: string, data: Partial<DocumentRecord>): Promise<DocumentRecord> {
    const headers = await getAuthHeader();
    const res = await fetch(`/api/documents/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to update document');
    return res.json();
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/audit-logs', { headers });
    if (!res.ok) throw new Error('Failed to fetch audit trail');
    return res.json();
  },

  // Bulk CSV Import
  async importCsv(csvContent: string): Promise<{
    success: boolean;
    importedCount: number;
    rejectedCount: number;
    totalRows: number;
    errors: string[];
  }> {
    const headers = await getAuthHeader();
    const res = await fetch('/api/import/csv', {
      method: 'POST',
      headers,
      body: JSON.stringify({ csvContent })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to import CSV');
    }
    return res.json();
  }
};
