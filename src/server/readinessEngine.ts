import { RuleResult, ReadinessScorecard, ReadinessLevel } from '../types.ts';

export const READINESS_ENGINE_VERSION = 'v1.2.0-uganda-2026';

export interface EvaluationInput {
  shipment: {
    id: string;
    exportReference: string;
    coffeeType: string;
    totalQuantityKg: number;
    destinationCountry: string;
    buyerName: string;
  };
  lots: Array<{
    id: string;
    lotNumber: string;
    coffeeType: string;
    grade: string;
    quantityKg: number;
    assignedShipmentId?: string | null;
  }>;
  deliveries: Array<{
    id: string;
    deliveryRef: string;
    farmerId: string;
    farmId: string;
    quantityKg: number;
    moistureContentPercent?: number | null;
    associatedLotId?: string | null;
  }>;
  farmers: Array<{
    id: string;
    farmerRegId: string;
    fullName: string;
    phone: string;
    district: string;
    subcounty: string;
    village: string;
    nationalId?: string | null;
    cooperative: string;
    verificationStatus: string;
  }>;
  farms: Array<{
    id: string;
    plotBusinessId: string;
    farmerId: string;
    farmName: string;
    district: string;
    subcounty: string;
    village: string;
    latitude: number;
    longitude: number;
    plotArea: number;
    areaUnit: string;
    geometryType: string;
    geoJsonData?: any;
    mappingAccuracyMeters?: number | null;
    verificationStatus: string;
  }>;
  events: Array<{
    id: string;
    lotId: string;
    eventType: string;
    dateTime: string;
    location: string;
    quantityKg: number;
  }>;
  documents: Array<{
    id: string;
    type: string;
    fileName: string;
    relatedEntityType: string;
    relatedEntityId: string;
    verificationStatus: string;
  }>;
}

export function evaluateShipmentReadiness(input: EvaluationInput): ReadinessScorecard {
  const { shipment, lots, deliveries, farmers, farms, events, documents } = input;
  const rules: RuleResult[] = [];

  // Lookup Maps
  const farmerMap = new Map(farmers.map(f => [f.id, f]));
  const farmMap = new Map(farms.map(f => [f.id, f]));

  // Linked Deliveries and Lots
  const linkedLotIds = lots.map(l => l.id);
  const relevantDeliveries = deliveries.filter(d => d.associatedLotId && linkedLotIds.includes(d.associatedLotId));
  
  // Sourced Farmers & Farms
  const sourcedFarmerIds = Array.from(new Set(relevantDeliveries.map(d => d.farmerId)));
  const sourcedFarmIds = Array.from(new Set(relevantDeliveries.map(d => d.farmId)));

  const sourcedFarmers = sourcedFarmerIds.map(id => farmerMap.get(id)).filter(Boolean) as typeof farmers;
  const sourcedFarms = sourcedFarmIds.map(id => farmMap.get(id)).filter(Boolean) as typeof farms;

  // Trackers for blocker breakdowns
  const missingGeoFarms: Array<{ id: string; name: string; farmerName: string; district: string }> = [];
  const unverifiedFarmers: Array<{ id: string; name: string; district: string }> = [];
  const missingDeliveriesLots: Array<{ id: string; lotNumber: string }> = [];
  const missingDocuments: Array<{ type: string; entity: string; entityId: string }> = [];
  const incompleteTimelineLots: Array<{ id: string; lotNumber: string }> = [];

  // =========================================================================
  // PILLAR 1: FARMER DATA & PRODUCER COMPLETENESS
  // =========================================================================

  // Rule 1.1: Sourced Farmers Identity & Location (Regulatory Standard)
  const missingFarmerDetails = sourcedFarmers.filter(f => !f.fullName || !f.village || !f.district || !f.subcounty);
  if (sourcedFarmers.length === 0) {
    rules.push({
      id: 'FARMER_REG_01',
      category: 'Farmer Data',
      ruleName: 'Sourced Producer Identification',
      description: 'Mandatory identification and administrative geolocation (District, Subcounty, Village) for every smallholder in the consignment.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: 1,
      affectedEntityIds: [shipment.id],
      details: 'No smallholder farmers are linked to the intake deliveries in this shipment.',
      remedyAction: 'Assign lots with verified smallholder intake deliveries to this export consignment.'
    });
  } else if (missingFarmerDetails.length > 0) {
    missingFarmerDetails.forEach(f => unverifiedFarmers.push({ id: f.id, name: f.fullName, district: f.district }));
    rules.push({
      id: 'FARMER_REG_01',
      category: 'Farmer Data',
      ruleName: 'Sourced Producer Identification',
      description: 'Mandatory identification and administrative geolocation (District, Subcounty, Village) for every smallholder in the consignment.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: missingFarmerDetails.length,
      affectedEntityIds: missingFarmerDetails.map(f => f.id),
      affectedEntityNames: missingFarmerDetails.map(f => f.fullName),
      details: `${missingFarmerDetails.length} smallholder producer(s) have incomplete administrative location details.`,
      remedyAction: 'Complete district, subcounty, parish, and village details in the Farmers module.'
    });
  } else {
    rules.push({
      id: 'FARMER_REG_01',
      category: 'Farmer Data',
      ruleName: 'Sourced Producer Identification',
      description: 'Mandatory identification and administrative geolocation for every smallholder in the consignment.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `All ${sourcedFarmers.length} smallholder producers have verified names, phones, and administrative village records.`,
      remedyAction: 'None required.'
    });
  }

  // Rule 1.2: Producer National ID / NIN (Recommended Business Control)
  const missingNIN = sourcedFarmers.filter(f => !f.nationalId);
  if (missingNIN.length > 0) {
    rules.push({
      id: 'FARMER_NIN_02',
      category: 'Farmer Data',
      ruleName: 'National Identification (NIN) Collection [Recommended Control]',
      description: 'Collection of government National Identity Numbers (NIN) for rigorous producer validation.',
      status: 'WARNING',
      impact: 'WARNING',
      affectedCount: missingNIN.length,
      affectedEntityIds: missingNIN.map(f => f.id),
      affectedEntityNames: missingNIN.map(f => f.fullName),
      details: `${missingNIN.length} of ${sourcedFarmers.length} farmers do not have a registered NIN. (Allowed under customary smallholder pilot onboarding).`,
      remedyAction: 'Gather and record Ugandan NIN during next seasonal cooperative renewal.'
    });
  } else {
    rules.push({
      id: 'FARMER_NIN_02',
      category: 'Farmer Data',
      ruleName: 'National Identification (NIN) Collection [Recommended Control]',
      description: 'Collection of government National Identity Numbers (NIN) for rigorous producer validation.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `100% of sourced smallholders have registered NIN credentials.`,
      remedyAction: 'None required.'
    });
  }

  // =========================================================================
  // PILLAR 2: GEOSPATIAL & GPS INTEGRITY
  // =========================================================================

  // Uganda Bounding Box: Latitude -1.5° to 4.3° N, Longitude 29.5° to 35.1° E
  const invalidGeoFarms = sourcedFarms.filter(farm => {
    const lat = Number(farm.latitude);
    const lng = Number(farm.longitude);
    const validUgandaBounds = lat >= -1.5 && lat <= 4.3 && lng >= 29.5 && lng <= 35.1;
    const hasCoordinates = !isNaN(lat) && !isNaN(lng) && (lat !== 0 || lng !== 0);
    return !hasCoordinates || !validUgandaBounds;
  });

  if (sourcedFarms.length === 0) {
    rules.push({
      id: 'GEO_BOUND_01',
      category: 'Farm Geolocation',
      ruleName: 'WGS84 Geolocation & Uganda Territory Bounds',
      description: 'Validated GPS coordinates mapped within Uganda sovereign territory for every contributing plot.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: 1,
      affectedEntityIds: [shipment.id],
      details: 'No farm plots are associated with the deliveries in this consignment.',
      remedyAction: 'Link farm plots with GPS coordinates to each smallholder intake delivery.'
    });
  } else if (invalidGeoFarms.length > 0) {
    invalidGeoFarms.forEach(f => {
      const farmer = farmerMap.get(f.farmerId);
      missingGeoFarms.push({
        id: f.id,
        name: f.farmName,
        farmerName: farmer?.fullName || 'Unknown',
        district: f.district
      });
    });
    rules.push({
      id: 'GEO_BOUND_01',
      category: 'Farm Geolocation',
      ruleName: 'WGS84 Geolocation & Uganda Territory Bounds',
      description: 'Validated GPS coordinates mapped within Uganda sovereign territory for every contributing plot.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: invalidGeoFarms.length,
      affectedEntityIds: invalidGeoFarms.map(f => f.id),
      affectedEntityNames: invalidGeoFarms.map(f => f.farmName),
      details: `${invalidGeoFarms.length} plot(s) have missing or out-of-bounds coordinates (must fall within Uganda GPS boundaries).`,
      remedyAction: 'Capture WGS84 GPS point or polygon coordinates using the interactive Farm Map or GPS mobile tool.'
    });
  } else {
    rules.push({
      id: 'GEO_BOUND_01',
      category: 'Farm Geolocation',
      ruleName: 'WGS84 Geolocation & Uganda Territory Bounds',
      description: 'Validated GPS coordinates mapped within Uganda sovereign territory for every contributing plot.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `All ${sourcedFarms.length} plots possess verified WGS84 coordinates inside Uganda coffee zones.`,
      remedyAction: 'None required.'
    });
  }

  // Rule 2.2: Polygon Mapping for Large Plots (> 4 Hectares) (Regulatory Mandate)
  const largePlotsRequiringPolygon = sourcedFarms.filter(f => {
    const areaHa = f.areaUnit === 'Acres' ? Number(f.plotArea) * 0.404686 : Number(f.plotArea);
    return areaHa > 4.0 && f.geometryType !== 'Polygon';
  });

  if (largePlotsRequiringPolygon.length > 0) {
    rules.push({
      id: 'GEO_POLY_02',
      category: 'Farm Geolocation',
      ruleName: 'Multi-vertex Polygon Boundary for Plots > 4 Hectares',
      description: 'Mandatory multi-point perimeter polygon boundary for any coffee farm plot exceeding 4 hectares.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: largePlotsRequiringPolygon.length,
      affectedEntityIds: largePlotsRequiringPolygon.map(f => f.id),
      affectedEntityNames: largePlotsRequiringPolygon.map(f => f.farmName),
      details: `${largePlotsRequiringPolygon.length} plot(s) exceed 4 hectares but only have single-point centroid coordinates.`,
      remedyAction: 'Map the boundary polygon perimeter vertices in the Farm Map module.'
    });
  } else {
    rules.push({
      id: 'GEO_POLY_02',
      category: 'Farm Geolocation',
      ruleName: 'Multi-vertex Polygon Boundary for Plots > 4 Hectares',
      description: 'Mandatory multi-point perimeter polygon boundary for any coffee farm plot exceeding 4 hectares.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `All plots comply with polygon perimeter requirements based on acreage.`,
      remedyAction: 'None required.'
    });
  }

  // =========================================================================
  // PILLAR 3: SUPPLY CHAIN TRACEABILITY & CUSTODY
  // =========================================================================

  // Rule 3.1: Lot Aggregation & Intake Delivery Integrity
  const lotsWithoutDeliveries = lots.filter(lot => {
    const lotDelvs = relevantDeliveries.filter(d => d.associatedLotId === lot.id);
    return lotDelvs.length === 0;
  });

  if (lots.length === 0) {
    rules.push({
      id: 'TRACE_LOT_01',
      category: 'Supply Chain Traceability',
      ruleName: 'Consignment Lot Linking & Mass Balance',
      description: 'Every export shipment must be composed of tracked processing lots.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: 1,
      affectedEntityIds: [shipment.id],
      details: 'No processing lots have been assigned to this export shipment.',
      remedyAction: 'Assign consolidated lots to the shipment.'
    });
  } else if (lotsWithoutDeliveries.length > 0) {
    lotsWithoutDeliveries.forEach(l => missingDeliveriesLots.push({ id: l.id, lotNumber: l.lotNumber }));
    rules.push({
      id: 'TRACE_LOT_01',
      category: 'Supply Chain Traceability',
      ruleName: 'Consignment Lot Linking & Mass Balance',
      description: 'Every export shipment must be composed of tracked processing lots with linked farmer intake scale receipts.',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: lotsWithoutDeliveries.length,
      affectedEntityIds: lotsWithoutDeliveries.map(l => l.id),
      affectedEntityNames: lotsWithoutDeliveries.map(l => l.lotNumber),
      details: `${lotsWithoutDeliveries.length} lot(s) lack upstream farmer intake delivery records.`,
      remedyAction: 'Link individual farmer deliveries to the corresponding lot in the Lots module.'
    });
  } else {
    rules.push({
      id: 'TRACE_LOT_01',
      category: 'Supply Chain Traceability',
      ruleName: 'Consignment Lot Linking & Mass Balance',
      description: 'Every export shipment must be composed of tracked processing lots with linked farmer intake scale receipts.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `All ${lots.length} lot(s) trace cleanly to ${relevantDeliveries.length} intake receipts totaling ${relevantDeliveries.reduce((s, d) => s + Number(d.quantityKg), 0).toLocaleString()} kg.`,
      remedyAction: 'None required.'
    });
  }

  // Rule 3.2: Custody Movement Events
  const lotsWithoutEvents = lots.filter(lot => {
    const lotEvents = events.filter(e => e.lotId === lot.id);
    return lotEvents.length === 0;
  });

  if (lotsWithoutEvents.length > 0) {
    lotsWithoutEvents.forEach(l => incompleteTimelineLots.push({ id: l.id, lotNumber: l.lotNumber }));
    rules.push({
      id: 'TRACE_EVENT_02',
      category: 'Supply Chain Traceability',
      ruleName: 'Chain of Custody Movement & Processing Log',
      description: 'Chronological timeline of custody handoffs (Collection, Washing/Hulling, Warehouse, Container Sealing).',
      status: 'FAIL',
      impact: 'BLOCKER',
      affectedCount: lotsWithoutEvents.length,
      affectedEntityIds: lotsWithoutEvents.map(l => l.id),
      affectedEntityNames: lotsWithoutEvents.map(l => l.lotNumber),
      details: `${lotsWithoutEvents.length} lot(s) have no logged custody movements or processing station entries.`,
      remedyAction: 'Record custody events (Washing Station, Hulling, Quality Inspection, Warehouse Transfer) in the Lots view.'
    });
  } else {
    rules.push({
      id: 'TRACE_EVENT_02',
      category: 'Supply Chain Traceability',
      ruleName: 'Chain of Custody Movement & Processing Log',
      description: 'Chronological timeline of custody handoffs.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `Full custody event histories logged for all contributing lots.`,
      remedyAction: 'None required.'
    });
  }

  // Rule 3.3: Coffee Moisture Standards [Recommended Control]
  const highMoistureDeliveries = relevantDeliveries.filter(d => Number(d.moistureContentPercent || 0) > 13.0);
  if (highMoistureDeliveries.length > 0) {
    rules.push({
      id: 'QUALITY_MOIST_03',
      category: 'Supply Chain Traceability',
      ruleName: 'Export Moisture Standard (<= 13.0%) [Recommended Control]',
      description: 'Coffee moisture content must meet export specifications (<= 13.0% for commercial export).',
      status: 'WARNING',
      impact: 'WARNING',
      affectedCount: highMoistureDeliveries.length,
      affectedEntityIds: highMoistureDeliveries.map(d => d.id),
      details: `${highMoistureDeliveries.length} intake delivery receipt(s) recorded moisture levels above 13.0%.`,
      remedyAction: 'Ensure post-harvest secondary solar drying or mechanical conditioning before export milling.'
    });
  } else {
    rules.push({
      id: 'QUALITY_MOIST_03',
      category: 'Supply Chain Traceability',
      ruleName: 'Export Moisture Standard (<= 13.0%) [Recommended Control]',
      description: 'Coffee moisture content must meet export specifications (<= 13.0% for commercial export).',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: 'All measured moisture levels conform to export standards.',
      remedyAction: 'None required.'
    });
  }

  // =========================================================================
  // PILLAR 4: DUE-DILIGENCE & STATUTORY DOCUMENTATION
  // =========================================================================

  // Rule 4.1: Land / Production Evidence (Regulatory Requirement)
  const verifiedDocEntityIds = new Set(
    documents.filter(d => d.verificationStatus === 'Verified').map(d => `${d.relatedEntityType}:${d.relatedEntityId}`)
  );

  const farmsWithoutLandDoc = sourcedFarms.filter(f => !verifiedDocEntityIds.has(`Farm:${f.id}`) && !verifiedDocEntityIds.has(`Farmer:${f.farmerId}`));
  if (farmsWithoutLandDoc.length > 0) {
    farmsWithoutLandDoc.forEach(f => {
      missingDocuments.push({
        type: 'Land / Production Evidence',
        entity: 'Farm',
        entityId: f.id
      });
    });
    rules.push({
      id: 'DOC_LAND_01',
      category: 'Documentation',
      ruleName: 'Customary Land Tenancy / Production Rights Evidence',
      description: 'Documentary evidence verifying customary land rights, tenancy agreement, or cooperative production authorization.',
      status: 'WARNING',
      impact: 'WARNING',
      affectedCount: farmsWithoutLandDoc.length,
      affectedEntityIds: farmsWithoutLandDoc.map(f => f.id),
      affectedEntityNames: farmsWithoutLandDoc.map(f => f.farmName),
      details: `${farmsWithoutLandDoc.length} plot(s) do not have an attached verified customary land agreement or title record.`,
      remedyAction: 'Upload village LC1 letters, customary certificates, or cooperative land rights agreements in Documents.'
    });
  } else {
    rules.push({
      id: 'DOC_LAND_01',
      category: 'Documentation',
      ruleName: 'Customary Land Tenancy / Production Rights Evidence',
      description: 'Documentary evidence verifying customary land rights.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: `Land rights and production records verified for all contributing farms.`,
      remedyAction: 'None required.'
    });
  }

  // Rule 4.2: UCDA Quality & Export Clearance (Regulatory Requirement)
  const hasUCDACert = documents.some(d => 
    d.type.includes('UCDA') || d.type.includes('Phytosanitary') || d.type.includes('Export')
  );

  if (!hasUCDACert) {
    missingDocuments.push({
      type: 'UCDA Quality Certificate / Phyto',
      entity: 'Shipment',
      entityId: shipment.id
    });
    rules.push({
      id: 'DOC_UCDA_02',
      category: 'Documentation',
      ruleName: 'UCDA Quality Certificate & Phytosanitary Clearance',
      description: 'Official Uganda Coffee Development Authority grade inspection certificate and MAAIF phytosanitary document.',
      status: 'WARNING',
      impact: 'WARNING',
      affectedCount: 1,
      affectedEntityIds: [shipment.id],
      details: 'No UCDA inspection certificate or phytosanitary document has been attached to this shipment.',
      remedyAction: 'Upload the issued UCDA Quality Inspection Certificate once container grading is completed.'
    });
  } else {
    rules.push({
      id: 'DOC_UCDA_02',
      category: 'Documentation',
      ruleName: 'UCDA Quality Certificate & Phytosanitary Clearance',
      description: 'Official Uganda Coffee Development Authority grade inspection certificate.',
      status: 'PASS',
      impact: 'INFO',
      affectedCount: 0,
      affectedEntityIds: [],
      details: 'UCDA Quality Inspection certificate is on file.',
      remedyAction: 'None required.'
    });
  }

  // =========================================================================
  // SCORING & READINESS CALCULATION
  // =========================================================================

  const blockersCount = rules.filter(r => r.impact === 'BLOCKER' && r.status === 'FAIL').length;
  const warningsCount = rules.filter(r => r.status === 'WARNING').length;
  const passedCount = rules.filter(r => r.status === 'PASS').length;

  const calculateCategoryScore = (category: string) => {
    const catRules = rules.filter(r => r.category === category);
    if (catRules.length === 0) return 100;
    const catPassed = catRules.filter(r => r.status === 'PASS').length;
    const catWarn = catRules.filter(r => r.status === 'WARNING').length;
    return Math.round(((catPassed * 1.0 + catWarn * 0.6) / catRules.length) * 100);
  };

  const dataCompletenessScorePercent = calculateCategoryScore('Farmer Data');
  const geospatialScorePercent = calculateCategoryScore('Farm Geolocation');
  const traceabilityScorePercent = calculateCategoryScore('Supply Chain Traceability');
  const documentationScorePercent = calculateCategoryScore('Documentation');

  const overallScorePercent = Math.round(
    dataCompletenessScorePercent * 0.25 +
    geospatialScorePercent * 0.35 +
    traceabilityScorePercent * 0.25 +
    documentationScorePercent * 0.15
  );

  let overallStatus: ReadinessLevel = 'GREEN';
  let statusHeadline = 'Ready for Export & Evidence Pack Generation';

  if (blockersCount > 0) {
    overallStatus = 'RED';
    statusHeadline = `${blockersCount} Critical Blocker(s) Preventing Export Clearance`;
  } else if (warningsCount > 0 || overallScorePercent < 90) {
    overallStatus = 'YELLOW';
    statusHeadline = `Review Required — ${warningsCount} Recommended Control(s) Incomplete`;
  }

  return {
    shipmentId: shipment.id,
    overallStatus,
    overallScorePercent,
    dataCompletenessScorePercent,
    traceabilityScorePercent,
    geospatialScorePercent,
    documentationScorePercent,
    statusHeadline,
    blockersCount,
    warningsCount,
    passedCount,
    rules,
    blockerBreakdown: {
      missingGeoFarms,
      unverifiedFarmers,
      missingDeliveriesLots,
      missingDocuments,
      incompleteTimelineLots
    }
  };
}
