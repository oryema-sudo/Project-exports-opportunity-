import { db } from '../db/index.ts';
import { 
  organizations, farmers, farms, deliveries, lots, lotDeliveries, 
  traceabilityEvents, shipments, shipmentLots, documents, auditLogs 
} from '../db/schema.ts';
import { eq } from 'drizzle-orm';

export async function seedOrganizationData(orgId: string, userName: string = 'System Admin') {
  // Check if organization already has farmers
  const existingFarmers = await db.select().from(farmers).where(eq(farmers.organizationId, orgId)).limit(1);
  if (existingFarmers.length > 0) {
    return { status: 'already_seeded' };
  }

  // 1. Seed Smallholder Farmers across Uganda Coffee Belts
  const farmerData = [
    {
      farmerRegId: 'UG-F-1049',
      fullName: 'Yasin Mugerwa',
      phone: '+256 772 458 912',
      village: 'Kabonera Village',
      parish: 'Kabonera Parish',
      subcounty: 'Kabonera Subcounty',
      district: 'Masaka',
      nationalId: 'CM8402910398KJ',
      cooperative: 'Masaka Coffee Farmers Cooperative Union (MCFCU)',
      verificationStatus: 'Verified',
      plot: {
        plotBusinessId: 'UG-PL-2091',
        farmName: 'Mugerwa Sun-Drying Shamba',
        district: 'Masaka',
        subcounty: 'Kabonera Subcounty',
        parish: 'Kabonera Parish',
        village: 'Kabonera Village',
        latitude: '-0.3341000',
        longitude: '31.7389000',
        plotArea: '1.8500',
        areaUnit: 'Hectares',
        geometryType: 'Point'
      }
    },
    {
      farmerRegId: 'UG-F-2184',
      fullName: 'Grace Nabukenya',
      phone: '+256 701 992 481',
      village: 'Kiryasaka Cell',
      parish: 'Bukakata Parish',
      subcounty: 'Bukakata Subcounty',
      district: 'Masaka',
      nationalId: 'CF9104820194LM',
      cooperative: 'Masaka Coffee Farmers Cooperative Union (MCFCU)',
      verificationStatus: 'Verified',
      plot: {
        plotBusinessId: 'UG-PL-2092',
        farmName: 'Bukakata Lakeview Shamba',
        district: 'Masaka',
        subcounty: 'Bukakata Subcounty',
        parish: 'Bukakata Parish',
        village: 'Kiryasaka Cell',
        latitude: '-0.3015000',
        longitude: '31.7820000',
        plotArea: '2.4000',
        areaUnit: 'Hectares',
        geometryType: 'Point'
      }
    },
    {
      farmerRegId: 'UG-F-3021',
      fullName: 'Joram Masereka',
      phone: '+256 788 123 784',
      village: 'Kyondo A',
      parish: 'Kyondo Parish',
      subcounty: 'Kyondo Subcounty',
      district: 'Kasese',
      nationalId: 'CM7901192834RT',
      cooperative: 'Rwenzori High Altitude Coffee Growers',
      verificationStatus: 'Verified',
      plot: {
        plotBusinessId: 'UG-PL-3104',
        farmName: 'Kyondo Rwenzori High Farm',
        district: 'Kasese',
        subcounty: 'Kyondo Subcounty',
        parish: 'Kyondo Parish',
        village: 'Kyondo A',
        latitude: '0.1412000',
        longitude: '30.0715000',
        plotArea: '4.8000',
        areaUnit: 'Hectares',
        geometryType: 'Polygon',
        geoJsonData: {
          type: 'Polygon',
          coordinates: [[
            [30.0695, 0.1395],
            [30.0735, 0.1395],
            [30.0735, 0.1430],
            [30.0695, 0.1430],
            [30.0695, 0.1395]
          ]]
        }
      }
    },
    {
      farmerRegId: 'UG-F-4412',
      fullName: 'Agnes Chelangat',
      phone: '+256 754 819 023',
      village: 'Budadiri Central',
      parish: 'Budadiri Parish',
      subcounty: 'Budadiri Subcounty',
      district: 'Sironko',
      nationalId: 'CF8803192049BN',
      cooperative: 'Mount Elgon Bugisu Organic Alliance',
      verificationStatus: 'Verified',
      plot: {
        plotBusinessId: 'UG-PL-4050',
        farmName: 'Elgon Mountain Crest Plot',
        district: 'Sironko',
        subcounty: 'Budadiri Subcounty',
        parish: 'Budadiri Parish',
        village: 'Budadiri Central',
        latitude: '1.1648000',
        longitude: '34.3312000',
        plotArea: '2.1000',
        areaUnit: 'Hectares',
        geometryType: 'Point'
      }
    },
    {
      farmerRegId: 'UG-F-5099',
      fullName: 'Moses Byaruhanga',
      phone: '+256 779 663 219',
      village: 'Nyabubare Trading Center',
      parish: 'Nyabubare Parish',
      subcounty: 'Nyabubare Subcounty',
      district: 'Bushenyi',
      nationalId: 'CM9304192847LK',
      cooperative: 'Ankole Coffee Producers Cooperative Union (ACPCU)',
      verificationStatus: 'Verified',
      plot: {
        plotBusinessId: 'UG-PL-5120',
        farmName: 'Nyabubare Shamba Prime',
        district: 'Bushenyi',
        subcounty: 'Nyabubare Subcounty',
        parish: 'Nyabubare Parish',
        village: 'Nyabubare Trading Center',
        latitude: '-0.5420000',
        longitude: '30.1840000',
        plotArea: '3.1500',
        areaUnit: 'Hectares',
        geometryType: 'Point'
      }
    }
  ];

  const createdFarmers = [];
  const createdFarms = [];

  for (const f of farmerData) {
    const [farmerRec] = await db.insert(farmers).values({
      organizationId: orgId,
      farmerRegId: f.farmerRegId,
      fullName: f.fullName,
      phone: f.phone,
      phoneNumber: f.phone,
      village: f.village,
      parish: f.parish,
      subcounty: f.subcounty,
      district: f.district,
      nationalId: f.nationalId,
      cooperative: f.cooperative,
      cooperativeMembership: f.cooperative,
      verificationStatus: f.verificationStatus
    }).returning();
    createdFarmers.push(farmerRec!);

    const [farmRec] = await db.insert(farms).values({
      organizationId: orgId,
      farmerId: farmerRec!.id,
      plotBusinessId: f.plot.plotBusinessId,
      farmName: f.plot.farmName,
      district: f.plot.district,
      subcounty: f.plot.subcounty,
      parish: f.plot.parish,
      village: f.plot.village,
      latitude: f.plot.latitude,
      longitude: f.plot.longitude,
      plotArea: f.plot.plotArea,
      areaUnit: f.plot.areaUnit,
      geometryType: f.plot.geometryType,
      geoJsonData: f.plot.geoJsonData || null,
      mappingDate: '2026-08-15',
      mappingMethod: 'Mobile GNSS',
      mappingAccuracyMeters: '1.50',
      verificationStatus: 'Verified'
    }).returning();
    createdFarms.push(farmRec!);
  }

  // 2. Seed Intake Deliveries
  const createdDeliveries = [];
  const delData = [
    {
      farmerIndex: 0,
      deliveryRef: 'DEL-2026-0801',
      dateReceived: '2026-08-18',
      quantityKg: '1450.00',
      coffeeType: 'Robusta' as const,
      grade: 'Screen 18',
      moisture: '12.40',
      location: 'Masaka Central Buying Station',
      receiptNumber: 'RCP-MSK-2026-0192'
    },
    {
      farmerIndex: 1,
      deliveryRef: 'DEL-2026-0802',
      dateReceived: '2026-08-19',
      quantityKg: '1820.00',
      coffeeType: 'Robusta' as const,
      grade: 'Screen 18',
      moisture: '12.10',
      location: 'Masaka Central Buying Station',
      receiptNumber: 'RCP-MSK-2026-0193'
    },
    {
      farmerIndex: 2,
      deliveryRef: 'DEL-2026-0803',
      dateReceived: '2026-08-20',
      quantityKg: '2900.00',
      coffeeType: 'Arabica' as const,
      grade: 'Drugar',
      moisture: '12.20',
      location: 'Kasese Collection Hub',
      receiptNumber: 'RCP-KSS-2026-0411'
    },
    {
      farmerIndex: 3,
      deliveryRef: 'DEL-2026-0804',
      dateReceived: '2026-08-21',
      quantityKg: '2100.00',
      coffeeType: 'Arabica' as const,
      grade: 'Bugisu AA',
      moisture: '11.80',
      location: 'Mbale Depot',
      receiptNumber: 'RCP-MBL-2026-0872'
    }
  ];

  for (const d of delData) {
    const [delRec] = await db.insert(deliveries).values({
      organizationId: orgId,
      deliveryRef: d.deliveryRef,
      farmerId: createdFarmers[d.farmerIndex]!.id,
      farmId: createdFarms[d.farmerIndex]!.id,
      dateReceived: d.dateReceived,
      deliveryDate: d.dateReceived,
      quantityKg: d.quantityKg,
      unit: 'kg',
      coffeeType: d.coffeeType,
      grade: d.grade,
      moistureContentPercent: d.moisture,
      buyingLocation: d.location,
      buyingDepot: d.location,
      receiptNumber: d.receiptNumber,
      numberOfBags: Math.ceil(Number(d.quantityKg) / 60),
      pricePerKgUgx: '8500.00',
      totalPaymentUgx: (Number(d.quantityKg) * 8500).toFixed(2),
      purchasedBy: 'Kigozi Emmanuel'
    }).returning();
    createdDeliveries.push(delRec!);
  }

  // 3. Seed Lots and Traceability Custody Events
  const [lot1] = await db.insert(lots).values({
    organizationId: orgId,
    lotNumber: 'LOT-UG-RB-2026-0041',
    coffeeType: 'Robusta',
    grade: 'Screen 18',
    quantityKg: '3270.00',
    creationDate: '2026-08-20',
    dateReceived: '2026-08-19',
    currentLocation: 'Kampala Namanve Central Export Dry Mill',
    currentStatus: 'Processed',
    processingStation: 'Masaka Washing & Hulling Station'
  }).returning();

  // Link deliveries 0 & 1 to lot1
  await db.insert(lotDeliveries).values([
    { organizationId: orgId, lotId: lot1!.id, deliveryId: createdDeliveries[0]!.id },
    { organizationId: orgId, lotId: lot1!.id, deliveryId: createdDeliveries[1]!.id }
  ]);
  await db.update(deliveries).set({ associatedLotId: lot1!.id }).where(eq(deliveries.id, createdDeliveries[0]!.id));
  await db.update(deliveries).set({ associatedLotId: lot1!.id }).where(eq(deliveries.id, createdDeliveries[1]!.id));

  // Traceability events for lot1
  await db.insert(traceabilityEvents).values([
    {
      organizationId: orgId,
      lotId: lot1!.id,
      eventType: 'Received at Collection Hub',
      location: 'Masaka Central Buying Station',
      dateTime: '2026-08-19T14:30:00Z',
      responsibleParty: 'Kigozi Emmanuel',
      quantityKg: '3270.00',
      referenceDocNumber: 'DEL-2026-0801/0802',
      notes: 'Initial intake scale verification from 2 smallholder producers'
    },
    {
      organizationId: orgId,
      lotId: lot1!.id,
      eventType: 'Transferred to Washing/Processing Station',
      location: 'Masaka Hulling Station',
      dateTime: '2026-08-20T09:00:00Z',
      responsibleParty: 'Ssempijja Robert',
      quantityKg: '3270.00',
      referenceDocNumber: 'WAYBILL-MSK-092'
    },
    {
      organizationId: orgId,
      lotId: lot1!.id,
      eventType: 'Hulling / Washing Completed',
      location: 'Masaka Hulling Station',
      dateTime: '2026-08-22T16:00:00Z',
      responsibleParty: 'Ssempijja Robert',
      quantityKg: '3270.00',
      referenceDocNumber: 'MILL-CERT-2026-019'
    },
    {
      organizationId: orgId,
      lotId: lot1!.id,
      eventType: 'Moved to Central Warehouse',
      location: 'Kampala Namanve Central Export Dry Mill',
      dateTime: '2026-08-24T11:00:00Z',
      responsibleParty: 'Logistics Lead - Nakato Brenda',
      quantityKg: '3270.00',
      referenceDocNumber: 'TRANS-KLA-4410'
    }
  ]);

  // 4. Seed Export Shipment
  const [shipment1] = await db.insert(shipments).values({
    organizationId: orgId,
    exportReference: 'SH-UG-2026-008',
    shipmentDate: '2026-09-05',
    buyerName: 'Hamburg Specialty Roasters GmbH',
    destinationCountry: 'Germany',
    destinationPort: 'Port of Hamburg',
    coffeeType: 'Robusta',
    totalQuantityKg: '3270.00',
    exportStatus: 'Ready for Review',
    readinessStatus: 'GREEN',
    notes: '20ft FCL Container Consignment. Screen 18 High-Grade Ugandan Robusta.'
  }).returning();

  await db.insert(shipmentLots).values({
    organizationId: orgId,
    shipmentId: shipment1!.id,
    lotId: lot1!.id
  });

  await db.update(lots).set({
    assignedShipmentId: shipment1!.id,
    currentStatus: 'Assigned to Shipment'
  }).where(eq(lots.id, lot1!.id));

  // 5. Seed Compliance Documents
  await db.insert(documents).values([
    {
      organizationId: orgId,
      type: 'Land / Production Evidence (Customary / Title)',
      fileName: 'Mugerwa_Yasin_Customary_Land_Agreement.pdf',
      fileSize: '1.4 MB',
      filePath: 'storage/sample_land_agreement.pdf',
      mimeType: 'application/pdf',
      uploadDate: '2026-08-16',
      uploadedBy: userName,
      relatedEntityType: 'Farm',
      relatedEntityId: createdFarms[0]!.id,
      verificationStatus: 'Verified',
      notes: 'LC1 stamped smallholder customary land rights certificate'
    },
    {
      organizationId: orgId,
      type: 'UCDA Quality / Grade Inspection Certificate',
      fileName: 'UCDA_Quality_Inspection_SH-UG-2026-008.pdf',
      fileSize: '2.1 MB',
      filePath: 'storage/sample_ucda_cert.pdf',
      mimeType: 'application/pdf',
      uploadDate: '2026-08-25',
      uploadedBy: userName,
      relatedEntityType: 'Shipment',
      relatedEntityId: shipment1!.id,
      verificationStatus: 'Verified',
      notes: 'UCDA Screen 18 export grade certification and moisture report (12.2%)'
    }
  ]);

  // 6. Audit Log
  await db.insert(auditLogs).values({
    organizationId: orgId,
    userName,
    userRole: 'admin',
    action: 'Initial Production Tenant Setup & Pilot Baseline Seeded',
    entity: 'Organization',
    entityId: orgId,
    newValue: 'Seeded 5 smallholders, farm geometries, deliveries, and consignment SH-UG-2026-008'
  });

  return { status: 'seeded_successfully', farmersCount: 5, lotsCount: 1, shipmentsCount: 1 };
}
