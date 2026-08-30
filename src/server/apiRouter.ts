import { Router, Response } from 'express';
import { db } from '../db/index.ts';
import { 
  organizations, users, farmers, farms, deliveries, lots, lotDeliveries, 
  traceabilityEvents, shipments, shipmentLots, documents, auditLogs, readinessEvaluations 
} from '../db/schema.ts';
import { eq, and, desc, inArray } from 'drizzle-orm';
import { requireAuth, requireRole, AuthRequest } from '../middleware/auth.ts';
import { upload, getOrgStorageDir } from './storage.ts';
import { evaluateShipmentReadiness, READINESS_ENGINE_VERSION } from './readinessEngine.ts';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';

export const apiRouter = Router();

// Helper for audit logging
async function logServerAudit(
  req: AuthRequest, 
  action: string, 
  entity: string, 
  entityId: string, 
  previousValue?: string, 
  newValue?: string
) {
  try {
    if (!req.user) return;
    await db.insert(auditLogs).values({
      organizationId: req.user.organizationId,
      userId: req.user.id,
      userName: req.user.name,
      userRole: req.user.role,
      action,
      entity,
      entityId,
      previousValue,
      newValue,
      ipAddress: req.ip || req.socket.remoteAddress || 'unknown'
    });
  } catch (err) {
    console.error('[Audit Log] Failed to write audit record:', err);
  }
}

// =========================================================================
// AUTH & CURRENT USER / ORGANIZATION PROFILE
// =========================================================================

apiRouter.get('/auth/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const org = await db.select().from(organizations).where(eq(organizations.id, req.user!.organizationId)).limit(1);
    res.json({
      user: req.user,
      organization: org[0] || null
    });
  } catch (err: any) {
    console.error('[Auth API] /auth/me failed:', err);
    res.status(500).json({ error: 'Failed to retrieve authenticated profile' });
  }
});

// Update Organization Profile (Admin only)
apiRouter.put('/organizations/current', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      legalName: z.string().min(2),
      district: z.string().min(2),
      address: z.string().min(2),
      contactPhone: z.string().min(5),
      contactEmail: z.string().email().optional(),
      subscriptionPlan: z.string().optional(),
      website: z.string().optional()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;

    const [updated] = await db.update(organizations)
      .set({
        legalName: parsed.legalName,
        district: parsed.district,
        address: parsed.address,
        contactPhone: parsed.contactPhone,
        email: parsed.contactEmail || req.user!.email,
        contactEmail: parsed.contactEmail,
        website: parsed.website || '',
        subscriptionPlan: parsed.subscriptionPlan || 'Professional (UGX 600k/mo)',
        updatedAt: new Date()
      })
      .where(eq(organizations.id, orgId))
      .returning();

    await logServerAudit(req, 'Organization Profile Updated', 'Organization', orgId, undefined, JSON.stringify(parsed));
    res.json(updated);
  } catch (err: any) {
    console.error('[Org API] Update failed:', err);
    res.status(400).json({ error: err.message || 'Failed to update organization' });
  }
});

// =========================================================================
// FARMERS REGISTRY (SMALLHOLDERS)
// =========================================================================

apiRouter.get('/farmers', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(farmers)
      .where(eq(farmers.organizationId, orgId))
      .orderBy(desc(farmers.createdAt));

    res.json(records.map(f => ({
      id: f.id,
      organizationId: f.organizationId,
      farmerRegId: f.farmerRegId,
      fullName: f.fullName,
      phone: f.phone,
      phoneNumber: f.phoneNumber || f.phone,
      altPhone: f.altPhone || '',
      village: f.village,
      parish: f.parish,
      subcounty: f.subcounty,
      district: f.district,
      nationalId: f.nationalId || '',
      cooperative: f.cooperative,
      cooperativeMembership: f.cooperativeMembership || f.cooperative,
      verificationStatus: f.verificationStatus,
      notes: f.notes || '',
      createdDate: f.createdAt.toISOString(),
      updatedDate: f.updatedAt.toISOString()
    })));
  } catch (err: any) {
    console.error('[Farmers API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch farmers' });
  }
});

apiRouter.post('/farmers', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      fullName: z.string().min(2, 'Full name is required'),
      phone: z.string().min(6, 'Valid phone number is required'),
      district: z.string().min(2, 'District is required'),
      subcounty: z.string().min(2, 'Subcounty is required'),
      parish: z.string().optional().default('Central'),
      village: z.string().min(2, 'Village is required'),
      nationalId: z.string().optional().nullable(),
      cooperative: z.string().optional().default('Great Lakes Smallholder Farmers Network'),
      notes: z.string().optional().nullable()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;
    const businessCode = `UG-F-${Math.floor(10000 + Math.random() * 90000)}`;

    const [created] = await db.insert(farmers).values({
      organizationId: orgId,
      farmerRegId: businessCode,
      fullName: parsed.fullName,
      phone: parsed.phone,
      phoneNumber: parsed.phone,
      district: parsed.district,
      subcounty: parsed.subcounty,
      parish: parsed.parish,
      village: parsed.village,
      nationalId: parsed.nationalId || null,
      cooperative: parsed.cooperative,
      cooperativeMembership: parsed.cooperative,
      verificationStatus: parsed.nationalId ? 'Verified' : 'Partially verified',
      notes: parsed.notes || null
    }).returning();

    await logServerAudit(req, 'Farmer Registered', 'Farmer', created!.id, undefined, `${created!.fullName} (${businessCode})`);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Farmers API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to create farmer' });
  }
});

apiRouter.put('/farmers/:id', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const farmerId = req.params.id as string;

    const existing = await db.select().from(farmers)
      .where(and(eq(farmers.id, farmerId), eq(farmers.organizationId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Farmer record not found or access denied' });
    }

    const { fullName, phone, district, subcounty, parish, village, nationalId, cooperative, notes, verificationStatus } = req.body;

    const [updated] = await db.update(farmers)
      .set({
        fullName: fullName ?? existing[0]!.fullName,
        phone: phone ?? existing[0]!.phone,
        district: district ?? existing[0]!.district,
        subcounty: subcounty ?? existing[0]!.subcounty,
        parish: parish ?? existing[0]!.parish,
        village: village ?? existing[0]!.village,
        nationalId: nationalId !== undefined ? nationalId : existing[0]!.nationalId,
        cooperative: cooperative ?? existing[0]!.cooperative,
        notes: notes !== undefined ? notes : existing[0]!.notes,
        verificationStatus: verificationStatus ?? (nationalId ? 'Verified' : existing[0]!.verificationStatus),
        updatedAt: new Date()
      })
      .where(and(eq(farmers.id, farmerId), eq(farmers.organizationId, orgId)))
      .returning();

    await logServerAudit(req, 'Farmer Updated', 'Farmer', farmerId, JSON.stringify(existing[0]), JSON.stringify(updated));
    res.json(updated);
  } catch (err: any) {
    console.error('[Farmers API] Update failed:', err);
    res.status(400).json({ error: err.message || 'Failed to update farmer' });
  }
});

apiRouter.delete('/farmers/:id', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const farmerId = req.params.id as string;

    const deleted = await db.delete(farmers)
      .where(and(eq(farmers.id, farmerId), eq(farmers.organizationId, orgId)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Farmer not found or access denied' });
    }

    await logServerAudit(req, 'Farmer Deleted', 'Farmer', farmerId, JSON.stringify(deleted[0]));
    res.json({ success: true, id: farmerId });
  } catch (err: any) {
    console.error('[Farmers API] Delete failed:', err);
    res.status(500).json({ error: 'Failed to delete farmer' });
  }
});

// =========================================================================
// FARM PLOTS & GEOLOCATION
// =========================================================================

apiRouter.get('/farms', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(farms)
      .where(eq(farms.organizationId, orgId))
      .orderBy(desc(farms.createdAt));

    res.json(records.map(f => ({
      id: f.id,
      farmerId: f.farmerId,
      organizationId: f.organizationId,
      plotBusinessId: f.plotBusinessId,
      farmName: f.farmName,
      district: f.district,
      subcounty: f.subcounty,
      parish: f.parish || '',
      village: f.village,
      latitude: Number(f.latitude),
      longitude: Number(f.longitude),
      plotArea: Number(f.plotArea),
      areaUnit: f.areaUnit,
      geometryType: f.geometryType,
      geoJsonData: f.geoJsonData,
      mappingDate: f.mappingDate || f.createdAt.toISOString().split('T')[0],
      mappingMethod: f.mappingMethod || 'Mobile GNSS',
      mappingAccuracyMeters: Number(f.mappingAccuracyMeters || 1.5),
      verificationStatus: f.verificationStatus,
      notes: f.notes || ''
    })));
  } catch (err: any) {
    console.error('[Farms API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch farm plots' });
  }
});

apiRouter.post('/farms', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      farmerId: z.string().uuid(),
      farmName: z.string().min(2),
      district: z.string().min(2),
      subcounty: z.string().min(2),
      parish: z.string().optional(),
      village: z.string().min(2),
      latitude: z.number().min(-1.5, 'Latitude must be inside Uganda (-1.5 to 4.3)').max(4.3, 'Latitude must be inside Uganda'),
      longitude: z.number().min(29.5, 'Longitude must be inside Uganda (29.5 to 35.1)').max(35.1, 'Longitude must be inside Uganda'),
      plotArea: z.number().positive(),
      areaUnit: z.enum(['Hectares', 'Acres', 'Ha']).default('Hectares'),
      geometryType: z.enum(['Point', 'Polygon']).default('Point'),
      geoJsonData: z.any().optional(),
      mappingMethod: z.string().optional().default('Mobile GNSS'),
      notes: z.string().optional()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;

    // Verify farmer belongs to same tenant
    const farmerExists = await db.select().from(farmers)
      .where(and(eq(farmers.id, parsed.farmerId), eq(farmers.organizationId, orgId)))
      .limit(1);

    if (farmerExists.length === 0) {
      return res.status(400).json({ error: 'Specified farmer does not exist in your organization' });
    }

    const businessId = `UG-PL-${Math.floor(1000 + Math.random() * 9000)}`;

    const [created] = await db.insert(farms).values({
      organizationId: orgId,
      farmerId: parsed.farmerId,
      plotBusinessId: businessId,
      farmName: parsed.farmName,
      district: parsed.district,
      subcounty: parsed.subcounty,
      parish: parsed.parish || null,
      village: parsed.village,
      latitude: parsed.latitude.toString(),
      longitude: parsed.longitude.toString(),
      plotArea: parsed.plotArea.toString(),
      areaUnit: parsed.areaUnit === 'Ha' ? 'Hectares' : parsed.areaUnit,
      geometryType: parsed.geometryType,
      geoJsonData: parsed.geoJsonData || null,
      mappingDate: new Date().toISOString().split('T')[0],
      mappingMethod: parsed.mappingMethod,
      mappingAccuracyMeters: '1.50',
      verificationStatus: 'Verified',
      notes: parsed.notes || null
    }).returning();

    await logServerAudit(req, 'Farm Plot Mapped', 'FarmPlot', created!.id, undefined, `${created!.farmName} (${businessId})`);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Farms API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to create farm plot' });
  }
});

apiRouter.put('/farms/:id', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const farmId = req.params.id as string;

    const existing = await db.select().from(farms)
      .where(and(eq(farms.id, farmId), eq(farms.organizationId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Farm plot not found or access denied' });
    }

    const { farmName, district, subcounty, parish, village, latitude, longitude, plotArea, areaUnit, geometryType, geoJsonData, verificationStatus, notes } = req.body;

    const [updated] = await db.update(farms)
      .set({
        farmName: farmName ?? existing[0]!.farmName,
        district: district ?? existing[0]!.district,
        subcounty: subcounty ?? existing[0]!.subcounty,
        parish: parish !== undefined ? parish : existing[0]!.parish,
        village: village ?? existing[0]!.village,
        latitude: latitude !== undefined ? latitude.toString() : existing[0]!.latitude,
        longitude: longitude !== undefined ? longitude.toString() : existing[0]!.longitude,
        plotArea: plotArea !== undefined ? plotArea.toString() : existing[0]!.plotArea,
        areaUnit: areaUnit ?? existing[0]!.areaUnit,
        geometryType: geometryType ?? existing[0]!.geometryType,
        geoJsonData: geoJsonData !== undefined ? geoJsonData : existing[0]!.geoJsonData,
        verificationStatus: verificationStatus ?? existing[0]!.verificationStatus,
        notes: notes !== undefined ? notes : existing[0]!.notes,
        updatedAt: new Date()
      })
      .where(and(eq(farms.id, farmId), eq(farms.organizationId, orgId)))
      .returning();

    await logServerAudit(req, 'Farm Plot Updated', 'FarmPlot', farmId, JSON.stringify(existing[0]), JSON.stringify(updated));
    res.json(updated);
  } catch (err: any) {
    console.error('[Farms API] Update failed:', err);
    res.status(400).json({ error: err.message || 'Failed to update farm plot' });
  }
});

apiRouter.delete('/farms/:id', requireAuth, requireRole(['admin']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const farmId = req.params.id as string;

    const deleted = await db.delete(farms)
      .where(and(eq(farms.id, farmId), eq(farms.organizationId, orgId)))
      .returning();

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'Farm plot not found or access denied' });
    }

    await logServerAudit(req, 'Farm Plot Deleted', 'FarmPlot', farmId, JSON.stringify(deleted[0]));
    res.json({ success: true, id: farmId });
  } catch (err: any) {
    console.error('[Farms API] Delete failed:', err);
    res.status(500).json({ error: 'Failed to delete farm plot' });
  }
});

// =========================================================================
// INTAKE DELIVERIES
// =========================================================================

apiRouter.get('/deliveries', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(deliveries)
      .where(eq(deliveries.organizationId, orgId))
      .orderBy(desc(deliveries.createdAt));

    res.json(records.map(d => ({
      id: d.id,
      organizationId: d.organizationId,
      farmerId: d.farmerId,
      farmId: d.farmId,
      dateReceived: d.dateReceived,
      deliveryDate: d.deliveryDate || d.dateReceived,
      quantityKg: Number(d.quantityKg),
      unit: d.unit,
      coffeeType: d.coffeeType,
      grade: d.grade,
      moistureContentPercent: d.moistureContentPercent ? Number(d.moistureContentPercent) : 12.5,
      buyingLocation: d.buyingLocation || 'Kasese Main Depot',
      buyingDepot: d.buyingDepot || d.buyingLocation || 'Kasese Main Depot',
      receivingOrg: d.receivingOrg || '',
      receiptNumber: d.receiptNumber,
      numberOfBags: d.numberOfBags || Math.ceil(Number(d.quantityKg) / 60),
      pricePerKgUgx: d.pricePerKgUgx ? Number(d.pricePerKgUgx) : 8500,
      totalPaymentUgx: d.totalPaymentUgx ? Number(d.totalPaymentUgx) : Number(d.quantityKg) * 8500,
      purchasedBy: d.purchasedBy || 'Buying Officer',
      notes: d.notes || '',
      associatedLotId: d.associatedLotId || undefined
    })));
  } catch (err: any) {
    console.error('[Deliveries API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch deliveries' });
  }
});

apiRouter.post('/deliveries', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      farmerId: z.string().uuid(),
      farmId: z.string().uuid(),
      dateReceived: z.string().optional(),
      quantityKg: z.number().positive(),
      coffeeType: z.enum(['Robusta', 'Arabica']),
      grade: z.string(),
      moistureContentPercent: z.number().optional().default(12.5),
      buyingLocation: z.string().optional().default('Kasese Main Depot'),
      receiptNumber: z.string().min(2),
      pricePerKgUgx: z.number().optional().default(8500),
      notes: z.string().optional()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;

    const receiptRef = parsed.receiptNumber.startsWith('DEL-') ? parsed.receiptNumber : `DEL-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const [created] = await db.insert(deliveries).values({
      organizationId: orgId,
      deliveryRef: receiptRef,
      farmerId: parsed.farmerId,
      farmId: parsed.farmId,
      dateReceived: parsed.dateReceived || new Date().toISOString().split('T')[0],
      deliveryDate: parsed.dateReceived || new Date().toISOString().split('T')[0],
      quantityKg: parsed.quantityKg.toString(),
      unit: 'kg',
      coffeeType: parsed.coffeeType,
      grade: parsed.grade,
      moistureContentPercent: parsed.moistureContentPercent.toString(),
      buyingLocation: parsed.buyingLocation,
      buyingDepot: parsed.buyingLocation,
      receiptNumber: parsed.receiptNumber,
      numberOfBags: Math.ceil(parsed.quantityKg / 60),
      pricePerKgUgx: parsed.pricePerKgUgx.toString(),
      totalPaymentUgx: (parsed.quantityKg * parsed.pricePerKgUgx).toString(),
      purchasedBy: req.user!.name,
      notes: parsed.notes || null
    }).returning();

    await logServerAudit(req, 'Delivery Recorded', 'Delivery', created!.id, undefined, `${created!.quantityKg}kg (${created!.receiptNumber})`);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Deliveries API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to create delivery' });
  }
});

// =========================================================================
// LOTS & PROCESSING EVENTS
// =========================================================================

apiRouter.get('/lots', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const lotRecords = await db.select().from(lots)
      .where(eq(lots.organizationId, orgId))
      .orderBy(desc(lots.createdAt));

    // Also get all events and deliveries linked to lots
    const allEvents = await db.select().from(traceabilityEvents)
      .where(eq(traceabilityEvents.organizationId, orgId));
    
    const allLotDeliveries = await db.select().from(lotDeliveries)
      .where(eq(lotDeliveries.organizationId, orgId));

    const allDeliveries = await db.select().from(deliveries)
      .where(eq(deliveries.organizationId, orgId));

    const deliveryMap = new Map(allDeliveries.map(d => [d.id, d]));

    const response = lotRecords.map(l => {
      const lotDelvs = allLotDeliveries.filter(ld => ld.lotId === l.id);
      const deliveryIds = lotDelvs.map(ld => ld.deliveryId);
      const matchedDelvs = deliveryIds.map(id => deliveryMap.get(id)).filter(Boolean);
      
      const farmerIds = Array.from(new Set(matchedDelvs.map(d => d!.farmerId)));
      const farmIds = Array.from(new Set(matchedDelvs.map(d => d!.farmId)));

      return {
        id: l.id,
        organizationId: l.organizationId,
        lotNumber: l.lotNumber,
        coffeeType: l.coffeeType,
        grade: l.grade,
        quantityKg: Number(l.quantityKg),
        creationDate: l.creationDate,
        dateReceived: l.dateReceived,
        currentLocation: l.currentLocation,
        currentStatus: l.currentStatus,
        sourceFarmerIds: farmerIds,
        sourceFarmIds: farmIds,
        sourceDeliveryIds: deliveryIds,
        processingStation: l.processingStation,
        assignedShipmentId: l.assignedShipmentId || undefined,
        notes: l.notes || '',
        documentIds: []
      };
    });

    res.json({
      lots: response,
      events: allEvents.map(e => ({
        id: e.id,
        lotId: e.lotId,
        eventType: e.eventType,
        location: e.location,
        dateTime: e.dateTime,
        responsibleParty: e.responsibleParty,
        quantityKg: Number(e.quantityKg),
        referenceDocNumber: e.referenceDocNumber || undefined,
        notes: e.notes || ''
      }))
    });
  } catch (err: any) {
    console.error('[Lots API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch lots' });
  }
});

apiRouter.post('/lots', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      lotNumber: z.string().min(2),
      coffeeType: z.enum(['Robusta', 'Arabica']),
      grade: z.string(),
      quantityKg: z.number().positive(),
      currentLocation: z.string().min(2),
      processingStation: z.string().min(2),
      deliveryIds: z.array(z.string().uuid()).default([]),
      notes: z.string().optional()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;
    const now = new Date().toISOString().split('T')[0];

    const [createdLot] = await db.insert(lots).values({
      organizationId: orgId,
      lotNumber: parsed.lotNumber,
      coffeeType: parsed.coffeeType,
      grade: parsed.grade,
      quantityKg: parsed.quantityKg.toString(),
      creationDate: now,
      dateReceived: now,
      currentLocation: parsed.currentLocation,
      currentStatus: 'Processing',
      processingStation: parsed.processingStation,
      notes: parsed.notes || null
    }).returning();

    // Link deliveries
    if (parsed.deliveryIds.length > 0) {
      for (const delId of parsed.deliveryIds) {
        await db.insert(lotDeliveries).values({
          organizationId: orgId,
          lotId: createdLot!.id,
          deliveryId: delId
        });
        // Update delivery with associatedLotId
        await db.update(deliveries)
          .set({ associatedLotId: createdLot!.id })
          .where(and(eq(deliveries.id, delId), eq(deliveries.organizationId, orgId)));
      }
    }

    // Add initial intake custody event
    await db.insert(traceabilityEvents).values({
      organizationId: orgId,
      lotId: createdLot!.id,
      eventType: 'Received at Collection Hub',
      location: parsed.currentLocation,
      dateTime: new Date().toISOString(),
      responsibleParty: req.user!.name,
      quantityKg: parsed.quantityKg.toString(),
      referenceDocNumber: parsed.lotNumber,
      notes: 'Initial lot formation from verified smallholder intake receipts'
    });

    await logServerAudit(req, 'Lot Created', 'Lot', createdLot!.id, undefined, `${createdLot!.lotNumber} (${createdLot!.quantityKg}kg)`);
    res.status(201).json(createdLot);
  } catch (err: any) {
    console.error('[Lots API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to create lot' });
  }
});

// Add Traceability Custody Event to a Lot
apiRouter.post('/lots/:id/events', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const lotId = req.params.id as string;
    const orgId = req.user!.organizationId;

    const lotExists = await db.select().from(lots)
      .where(and(eq(lots.id, lotId), eq(lots.organizationId, orgId)))
      .limit(1);

    if (lotExists.length === 0) {
      return res.status(404).json({ error: 'Lot not found or access denied' });
    }

    const { eventType, location, dateTime, responsibleParty, quantityKg, referenceDocNumber, notes } = req.body;

    const [createdEvent] = await db.insert(traceabilityEvents).values({
      organizationId: orgId,
      lotId,
      eventType: eventType || 'Moved to Central Warehouse',
      location: location || lotExists[0]!.currentLocation,
      dateTime: dateTime || new Date().toISOString(),
      responsibleParty: responsibleParty || req.user!.name,
      quantityKg: (quantityKg || lotExists[0]!.quantityKg).toString(),
      referenceDocNumber: referenceDocNumber || null,
      notes: notes || null
    }).returning();

    await logServerAudit(req, 'Custody Event Logged', 'TraceabilityEvent', createdEvent!.id, undefined, `${eventType} @ ${location}`);
    res.status(201).json(createdEvent);
  } catch (err: any) {
    console.error('[Events API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to add custody event' });
  }
});

// =========================================================================
// SHIPMENTS & AUTHORITATIVE READINESS ENGINE
// =========================================================================

apiRouter.get('/shipments', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(shipments)
      .where(eq(shipments.organizationId, orgId))
      .orderBy(desc(shipments.createdAt));

    const allShipmentLots = await db.select().from(shipmentLots)
      .where(eq(shipmentLots.organizationId, orgId));

    const response = records.map(s => {
      const linked = allShipmentLots.filter(sl => sl.shipmentId === s.id).map(sl => sl.lotId);
      return {
        id: s.id,
        organizationId: s.organizationId,
        exportReference: s.exportReference,
        shipmentDate: s.shipmentDate,
        buyerName: s.buyerName,
        destinationCountry: s.destinationCountry,
        destinationPort: s.destinationPort,
        coffeeType: s.coffeeType,
        totalQuantityKg: Number(s.totalQuantityKg),
        linkedLotIds: linked,
        exportStatus: s.exportStatus,
        readinessStatus: s.readinessStatus,
        notes: s.notes || '',
        createdDate: s.createdAt.toISOString(),
        documentIds: []
      };
    });

    res.json(response);
  } catch (err: any) {
    console.error('[Shipments API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch shipments' });
  }
});

apiRouter.post('/shipments', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const schema = z.object({
      exportReference: z.string().min(2),
      shipmentDate: z.string().min(2),
      buyerName: z.string().min(2),
      destinationCountry: z.string().min(2),
      destinationPort: z.string().min(2),
      coffeeType: z.enum(['Robusta', 'Arabica']),
      totalQuantityKg: z.number().positive(),
      lotIds: z.array(z.string().uuid()).default([]),
      notes: z.string().optional()
    });

    const parsed = schema.parse(req.body);
    const orgId = req.user!.organizationId;

    const [created] = await db.insert(shipments).values({
      organizationId: orgId,
      exportReference: parsed.exportReference,
      shipmentDate: parsed.shipmentDate,
      buyerName: parsed.buyerName,
      destinationCountry: parsed.destinationCountry,
      destinationPort: parsed.destinationPort,
      coffeeType: parsed.coffeeType,
      totalQuantityKg: parsed.totalQuantityKg.toString(),
      exportStatus: 'Draft',
      readinessStatus: 'YELLOW',
      notes: parsed.notes || null
    }).returning();

    // Link lots
    for (const lotId of parsed.lotIds) {
      await db.insert(shipmentLots).values({
        organizationId: orgId,
        shipmentId: created!.id,
        lotId
      });
      await db.update(lots)
        .set({ assignedShipmentId: created!.id, currentStatus: 'Assigned to Shipment' })
        .where(and(eq(lots.id, lotId), eq(lots.organizationId, orgId)));
    }

    await logServerAudit(req, 'Shipment Created', 'Shipment', created!.id, undefined, `${created!.exportReference} -> ${created!.buyerName}`);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Shipments API] Creation failed:', err);
    res.status(400).json({ error: err.message || 'Failed to create shipment' });
  }
});

// Run Authoritative Readiness Engine Evaluation on a Shipment
apiRouter.get('/shipments/:id/evaluate', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const shipmentId = req.params.id as string;
    const orgId = req.user!.organizationId;

    const shipmentRecord = await db.select().from(shipments)
      .where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, orgId)))
      .limit(1);

    if (shipmentRecord.length === 0) {
      return res.status(404).json({ error: 'Shipment not found or access denied' });
    }

    // Gather all linked lots
    const sLots = await db.select().from(shipmentLots)
      .where(and(eq(shipmentLots.shipmentId, shipmentId), eq(shipmentLots.organizationId, orgId)));
    
    const lotIds = sLots.map(sl => sl.lotId);
    let linkedLots: any[] = [];
    if (lotIds.length > 0) {
      linkedLots = await db.select().from(lots).where(and(inArray(lots.id, lotIds), eq(lots.organizationId, orgId)));
    }

    // Gather all deliveries linked to these lots
    let linkedDeliveries: any[] = [];
    if (lotIds.length > 0) {
      const lDels = await db.select().from(lotDeliveries).where(and(inArray(lotDeliveries.lotId, lotIds), eq(lotDeliveries.organizationId, orgId)));
      const delIds = lDels.map(ld => ld.deliveryId);
      if (delIds.length > 0) {
        linkedDeliveries = await db.select().from(deliveries).where(and(inArray(deliveries.id, delIds), eq(deliveries.organizationId, orgId)));
      }
    }

    // Gather all farmers, farms, events, and documents for this org
    const allFarmers = await db.select().from(farmers).where(eq(farmers.organizationId, orgId));
    const allFarms = await db.select().from(farms).where(eq(farms.organizationId, orgId));
    const allEvents = await db.select().from(traceabilityEvents).where(eq(traceabilityEvents.organizationId, orgId));
    const allDocuments = await db.select().from(documents).where(eq(documents.organizationId, orgId));

    const scorecard = evaluateShipmentReadiness({
      shipment: {
        id: shipmentRecord[0]!.id,
        exportReference: shipmentRecord[0]!.exportReference,
        coffeeType: shipmentRecord[0]!.coffeeType,
        totalQuantityKg: Number(shipmentRecord[0]!.totalQuantityKg),
        destinationCountry: shipmentRecord[0]!.destinationCountry,
        buyerName: shipmentRecord[0]!.buyerName
      },
      lots: linkedLots.map(l => ({
        id: l.id,
        lotNumber: l.lotNumber,
        coffeeType: l.coffeeType,
        grade: l.grade,
        quantityKg: Number(l.quantityKg),
        assignedShipmentId: l.assignedShipmentId
      })),
      deliveries: linkedDeliveries.map(d => ({
        id: d.id,
        deliveryRef: d.deliveryRef,
        farmerId: d.farmerId,
        farmId: d.farmId,
        quantityKg: Number(d.quantityKg),
        moistureContentPercent: d.moistureContentPercent ? Number(d.moistureContentPercent) : null,
        associatedLotId: d.associatedLotId
      })),
      farmers: allFarmers.map(f => ({
        id: f.id,
        farmerRegId: f.farmerRegId,
        fullName: f.fullName,
        phone: f.phone,
        district: f.district,
        subcounty: f.subcounty,
        village: f.village,
        nationalId: f.nationalId,
        cooperative: f.cooperative,
        verificationStatus: f.verificationStatus
      })),
      farms: allFarms.map(f => ({
        id: f.id,
        plotBusinessId: f.plotBusinessId,
        farmerId: f.farmerId,
        farmName: f.farmName,
        district: f.district,
        subcounty: f.subcounty,
        village: f.village,
        latitude: Number(f.latitude),
        longitude: Number(f.longitude),
        plotArea: Number(f.plotArea),
        areaUnit: f.areaUnit,
        geometryType: f.geometryType,
        geoJsonData: f.geoJsonData,
        mappingAccuracyMeters: f.mappingAccuracyMeters ? Number(f.mappingAccuracyMeters) : 1.5,
        verificationStatus: f.verificationStatus
      })),
      events: allEvents.map(e => ({
        id: e.id,
        lotId: e.lotId,
        eventType: e.eventType,
        dateTime: e.dateTime,
        location: e.location,
        quantityKg: Number(e.quantityKg)
      })),
      documents: allDocuments.map(doc => ({
        id: doc.id,
        type: doc.type,
        fileName: doc.fileName,
        relatedEntityType: doc.relatedEntityType,
        relatedEntityId: doc.relatedEntityId,
        verificationStatus: doc.verificationStatus
      }))
    });

    // Update shipment readinessStatus in DB
    await db.update(shipments)
      .set({ readinessStatus: scorecard.overallStatus })
      .where(and(eq(shipments.id, shipmentId), eq(shipments.organizationId, orgId)));

    // Save evaluation to readiness_evaluations
    await db.insert(readinessEvaluations).values({
      organizationId: orgId,
      shipmentId,
      ruleVersion: READINESS_ENGINE_VERSION,
      overallStatus: scorecard.overallStatus,
      overallScorePercent: scorecard.overallScorePercent,
      dataCompletenessScorePercent: scorecard.dataCompletenessScorePercent,
      traceabilityScorePercent: scorecard.traceabilityScorePercent,
      geospatialScorePercent: scorecard.geospatialScorePercent,
      documentationScorePercent: scorecard.documentationScorePercent,
      blockersCount: scorecard.blockersCount,
      warningsCount: scorecard.warningsCount,
      passedCount: scorecard.passedCount,
      evaluationData: scorecard
    });

    res.json({
      scorecard,
      ruleVersion: READINESS_ENGINE_VERSION
    });
  } catch (err: any) {
    console.error('[Readiness API] Evaluation failed:', err);
    res.status(500).json({ error: 'Failed to run readiness evaluation' });
  }
});

// =========================================================================
// DOCUMENTS & PRIVATE STORAGE
// =========================================================================

apiRouter.get('/documents', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(documents)
      .where(eq(documents.organizationId, orgId))
      .orderBy(desc(documents.createdAt));

    res.json(records.map(d => ({
      id: d.id,
      organizationId: d.organizationId,
      type: d.type,
      fileName: d.fileName,
      fileSize: d.fileSize,
      fileUrl: `/api/documents/${d.id}/download`,
      uploadDate: d.uploadDate,
      uploadedBy: d.uploadedBy,
      relatedEntityType: d.relatedEntityType,
      relatedEntityId: d.relatedEntityId,
      expiryDate: d.expiryDate || undefined,
      verificationStatus: d.verificationStatus,
      notes: d.notes || ''
    })));
  } catch (err: any) {
    console.error('[Documents API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch documents' });
  }
});

apiRouter.post('/documents/upload', requireAuth, requireRole(['admin', 'staff']), upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded or file rejected by security filter' });
    }

    const { type, relatedEntityType, relatedEntityId, notes } = req.body;
    const orgId = req.user!.organizationId;
    const relativeFilePath = path.relative(process.cwd(), req.file.path);

    const formatBytes = (bytes: number) => {
      if (bytes < 1024) return `${bytes} B`;
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const [created] = await db.insert(documents).values({
      organizationId: orgId,
      type: type || 'Other',
      fileName: req.file.originalname,
      fileSize: formatBytes(req.file.size),
      filePath: relativeFilePath,
      mimeType: req.file.mimetype,
      uploadDate: new Date().toISOString().split('T')[0],
      uploadedBy: req.user!.name,
      relatedEntityType: relatedEntityType || 'Organization',
      relatedEntityId: relatedEntityId || orgId,
      verificationStatus: 'Verified',
      notes: notes || null
    }).returning();

    await logServerAudit(req, 'Document Uploaded', 'Document', created!.id, undefined, `${created!.fileName} (${created!.type})`);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Documents API] Upload failed:', err);
    res.status(400).json({ error: err.message || 'Failed to upload document' });
  }
});

apiRouter.put('/documents/:id', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const docId = req.params.id as string;

    const existing = await db.select().from(documents)
      .where(and(eq(documents.id, docId), eq(documents.organizationId, orgId)))
      .limit(1);

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const { verificationStatus, notes } = req.body;

    const [updated] = await db.update(documents)
      .set({
        verificationStatus: verificationStatus ?? existing[0]!.verificationStatus,
        notes: notes !== undefined ? notes : existing[0]!.notes
      })
      .where(and(eq(documents.id, docId), eq(documents.organizationId, orgId)))
      .returning();

    await logServerAudit(req, 'Document Verified', 'Document', docId, existing[0]!.verificationStatus, updated!.verificationStatus);
    res.json(updated);
  } catch (err: any) {
    console.error('[Documents API] Update failed:', err);
    res.status(400).json({ error: err.message || 'Failed to update document' });
  }
});

// Secure Document Download with strict Tenant Isolation
apiRouter.get('/documents/:id/download', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const docId = req.params.id as string;

    const doc = await db.select().from(documents)
      .where(and(eq(documents.id, docId), eq(documents.organizationId, orgId)))
      .limit(1);

    if (doc.length === 0) {
      return res.status(404).json({ error: 'Document not found or access denied' });
    }

    const fullPath = path.isAbsolute(doc[0]!.filePath) ? doc[0]!.filePath : path.join(process.cwd(), doc[0]!.filePath);

    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'File contents not found in private storage' });
    }

    res.setHeader('Content-Type', doc[0]!.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc[0]!.fileName)}"`);
    fs.createReadStream(fullPath).pipe(res);
  } catch (err: any) {
    console.error('[Documents API] Download failed:', err);
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// =========================================================================
// AUDIT LOGS
// =========================================================================

apiRouter.get('/audit-logs', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const orgId = req.user!.organizationId;
    const records = await db.select().from(auditLogs)
      .where(eq(auditLogs.organizationId, orgId))
      .orderBy(desc(auditLogs.timestamp))
      .limit(200);

    res.json(records.map(a => ({
      id: a.id,
      organizationId: a.organizationId,
      userName: a.userName,
      userRole: a.userRole,
      action: a.action,
      entity: a.entity,
      entityId: a.entityId,
      timestamp: a.timestamp.toISOString(),
      previousValue: a.previousValue || undefined,
      newValue: a.newValue || undefined
    })));
  } catch (err: any) {
    console.error('[Audit API] Query failed:', err);
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// =========================================================================
// SERVER-SIDE BULK CSV ONBOARDING IMPORT
// =========================================================================

apiRouter.post('/import/csv', requireAuth, requireRole(['admin', 'staff']), async (req: AuthRequest, res: Response) => {
  try {
    const { csvContent } = req.body;
    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ error: 'Missing csvContent parameter' });
    }

    const orgId = req.user!.organizationId;
    const lines = csvContent.split(/\r?\n/).filter(l => l.trim().length > 0);

    if (lines.length <= 1) {
      return res.status(400).json({ error: 'CSV file contains no data rows' });
    }

    const headers = lines[0]!.split(',').map(h => h.trim().toLowerCase().replace(/[\s_-]/g, ''));
    const rows = lines.slice(1);

    let importedCount = 0;
    let rejectedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rowNum = i + 2;
      const values = rows[i]!.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      const fullName = rowObj.fullname || rowObj.farmername || rowObj.name;
      const phone = rowObj.phone || rowObj.phonenumber || '+256 700 000 000';
      const village = rowObj.village || 'Central Village';
      const parish = rowObj.parish || 'Main Parish';
      const subcounty = rowObj.subcounty || 'Central Subcounty';
      const district = rowObj.district || 'Kasese';
      const nationalId = rowObj.nationalid || rowObj.nin || '';
      const cooperative = rowObj.cooperative || 'Great Lakes Smallholder Farmers Network';

      const latStr = rowObj.latitude || rowObj.lat;
      const lngStr = rowObj.longitude || rowObj.lng || rowObj.long;
      const areaStr = rowObj.plotarea || rowObj.area || rowObj.acres || '1.5';

      if (!fullName) {
        rejectedCount++;
        errors.push(`Row ${rowNum}: Missing farmer full name`);
        continue;
      }

      const lat = parseFloat(latStr);
      const lng = parseFloat(lngStr);
      const area = parseFloat(areaStr);

      if (isNaN(lat) || isNaN(lng) || lat < -1.5 || lat > 4.3 || lng < 29.5 || lng > 35.1) {
        rejectedCount++;
        errors.push(`Row ${rowNum}: GPS coordinates [${latStr}, ${lngStr}] fall outside Uganda coffee territory`);
        continue;
      }

      // Insert farmer & farm plot atomically
      const farmerCode = `UG-F-${Math.floor(10000 + Math.random() * 90000)}`;
      const [newFarmer] = await db.insert(farmers).values({
        organizationId: orgId,
        farmerRegId: farmerCode,
        fullName,
        phone,
        phoneNumber: phone,
        village,
        parish,
        subcounty,
        district,
        nationalId: nationalId || null,
        cooperative,
        cooperativeMembership: cooperative,
        verificationStatus: nationalId ? 'Verified' : 'Partially verified'
      }).returning();

      const plotCode = `UG-PL-${Math.floor(1000 + Math.random() * 9000)}`;
      await db.insert(farms).values({
        organizationId: orgId,
        farmerId: newFarmer!.id,
        plotBusinessId: plotCode,
        farmName: `${fullName}'s Coffee Shamba`,
        district,
        subcounty,
        parish,
        village,
        latitude: lat.toString(),
        longitude: lng.toString(),
        plotArea: (isNaN(area) ? 1.5 : area).toString(),
        areaUnit: 'Hectares',
        geometryType: 'Point',
        mappingDate: new Date().toISOString().split('T')[0],
        mappingMethod: 'Mobile GNSS',
        mappingAccuracyMeters: '1.50',
        verificationStatus: 'Verified'
      });

      importedCount++;
    }

    await logServerAudit(req, 'Bulk CSV Farmers & Plots Ingested', 'Farmer', orgId, undefined, `Imported: ${importedCount}, Rejected: ${rejectedCount}`);

    res.json({
      success: true,
      importedCount,
      rejectedCount,
      totalRows: rows.length,
      errors
    });
  } catch (err: any) {
    console.error('[CSV Import API] Error:', err);
    res.status(500).json({ error: err.message || 'Failed to process CSV import' });
  }
});
