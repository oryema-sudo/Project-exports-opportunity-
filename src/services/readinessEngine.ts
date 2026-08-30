import { Shipment, Lot, FarmPlot, Farmer, Delivery, DocumentRecord, TraceabilityEvent, ReadinessScorecard, RuleResult, ReadinessLevel } from '../types';
import { isUgandaCoordinates } from '../data/ugandaRegions';

export function calculateShipmentReadiness(
  shipment: Shipment,
  lots: Lot[],
  farms: FarmPlot[],
  farmers: Farmer[],
  deliveries: Delivery[],
  documents: DocumentRecord[],
  events: TraceabilityEvent[]
): ReadinessScorecard {
  const linkedLots = lots.filter(l => shipment.linkedLotIds.includes(l.id));
  
  // Aggregate all source delivery IDs, farm IDs, and farmer IDs across linked lots
  const deliveryIds = Array.from(new Set(linkedLots.flatMap(l => l.sourceDeliveryIds)));
  const linkedDeliveries = deliveries.filter(d => deliveryIds.includes(d.id));

  const farmIds = Array.from(new Set([
    ...linkedLots.flatMap(l => l.sourceFarmIds),
    ...linkedDeliveries.map(d => d.farmId)
  ]));
  const linkedFarms = farms.filter(f => farmIds.includes(f.id));

  const farmerIds = Array.from(new Set([
    ...linkedLots.flatMap(l => l.sourceFarmerIds),
    ...linkedDeliveries.map(d => d.farmerId),
    ...linkedFarms.map(f => f.farmerId)
  ]));
  const linkedFarmers = farmers.filter(f => farmerIds.includes(f.id));

  const linkedEvents = events.filter(e => shipment.linkedLotIds.includes(e.lotId));
  const linkedDocs = documents.filter(doc => 
    shipment.documentIds.includes(doc.id) ||
    linkedLots.some(l => l.documentIds?.includes(doc.id) || doc.relatedEntityId === l.id) ||
    linkedDeliveries.some(d => d.documentIds?.includes(doc.id) || doc.relatedEntityId === d.id) ||
    linkedFarms.some(f => doc.relatedEntityId === f.id) ||
    linkedFarmers.some(fm => doc.relatedEntityId === fm.id)
  );

  const rules: RuleResult[] = [];

  // ==========================================
  // 1. FARMER DATA RULES
  // ==========================================
  
  // Rule 1.1: Farmer identification
  const missingFarmerDetails = linkedFarmers.filter(f => !f.fullName || !f.district || !f.village);
  rules.push({
    id: 'R-FARMER-01',
    category: 'Farmer Data',
    ruleName: 'Farmer Identification & Administrative Location',
    description: 'All contributing smallholder farmers must have complete administrative records (Name, District, Subcounty, Village).',
    status: linkedFarmers.length === 0 ? 'FAIL' : (missingFarmerDetails.length === 0 ? 'PASS' : 'FAIL'),
    impact: 'BLOCKER',
    affectedCount: missingFarmerDetails.length,
    affectedEntityIds: missingFarmerDetails.map(f => f.id),
    affectedEntityNames: missingFarmerDetails.map(f => f.fullName || f.id),
    details: missingFarmerDetails.length === 0 
      ? `${linkedFarmers.length} contributing farmers have complete administrative location profiles.`
      : `${missingFarmerDetails.length} farmers are missing mandatory village/district records.`,
    remedyAction: 'Update farmer profiles with complete Uganda administrative hierarchy.'
  });

  // Rule 1.2: Farmer Verification Status
  const unverifiedFarmers = linkedFarmers.filter(f => f.verificationStatus === 'Requires review' || f.verificationStatus === 'Unverified');
  const partiallyVerified = linkedFarmers.filter(f => f.verificationStatus === 'Partially verified');
  rules.push({
    id: 'R-FARMER-02',
    category: 'Farmer Data',
    ruleName: 'Farmer Due-Diligence Verification',
    description: 'Contributing farmers should have verified registration in the organization database.',
    status: unverifiedFarmers.length > 0 ? 'FAIL' : (partiallyVerified.length > 0 ? 'WARNING' : 'PASS'),
    impact: unverifiedFarmers.length > 0 ? 'BLOCKER' : 'WARNING',
    affectedCount: unverifiedFarmers.length + partiallyVerified.length,
    affectedEntityIds: [...unverifiedFarmers, ...partiallyVerified].map(f => f.id),
    affectedEntityNames: [...unverifiedFarmers, ...partiallyVerified].map(f => f.fullName),
    details: unverifiedFarmers.length > 0 
      ? `${unverifiedFarmers.length} farmers require review or are unverified.` 
      : (partiallyVerified.length > 0 ? `${partiallyVerified.length} farmers are partially verified (NIN pending).` : 'All contributing farmers are verified.'),
    remedyAction: 'Review farmer registration details and mark as verified.'
  });

  // ==========================================
  // 2. FARM GEOLOCATION RULES
  // ==========================================
  
  // Rule 2.1: GPS Coordinates presence and Uganda boundary check
  const missingGpsFarms = linkedFarms.filter(f => !f.latitude || !f.longitude || f.latitude === 0 || f.longitude === 0 || !isUgandaCoordinates(f.latitude, f.longitude));
  rules.push({
    id: 'R-GEO-01',
    category: 'Farm Geolocation',
    ruleName: 'Farm GPS Coordinates Validation',
    description: 'Every source production parcel must have valid latitude & longitude within Ugandan coffee zones.',
    status: linkedFarms.length === 0 ? 'FAIL' : (missingGpsFarms.length === 0 ? 'PASS' : 'FAIL'),
    impact: 'BLOCKER',
    affectedCount: missingGpsFarms.length,
    affectedEntityIds: missingGpsFarms.map(f => f.id),
    affectedEntityNames: missingGpsFarms.map(f => `${f.farmName} (${f.district})`),
    details: missingGpsFarms.length === 0
      ? `All ${linkedFarms.length} source farm plots have verified coordinates inside Uganda.`
      : `${missingGpsFarms.length} farm plot(s) have missing or invalid GPS coordinates outside Uganda bounds.`,
    remedyAction: 'Record valid GPS coordinates on the farm profile.'
  });

  // Rule 2.2: Farm Area & Polygon Coverage for Large Parcels
  const pointOnlyFarms = linkedFarms.filter(f => f.geometryType === 'Point' || !f.geoJsonData);
  const largeFarmsPointOnly = linkedFarms.filter(f => (f.plotArea >= 4 || f.plotArea === 0) && (f.geometryType === 'Point' || !f.geoJsonData));
  rules.push({
    id: 'R-GEO-02',
    category: 'Farm Geolocation',
    ruleName: 'Farm Polygon Boundary Mapping',
    description: 'Parcels (especially plots >= 4 ha) require full polygon boundary mapping for EU due-diligence readiness.',
    status: largeFarmsPointOnly.length > 0 ? 'FAIL' : (pointOnlyFarms.length > 0 ? 'WARNING' : 'PASS'),
    impact: largeFarmsPointOnly.length > 0 ? 'BLOCKER' : 'WARNING',
    affectedCount: pointOnlyFarms.length,
    affectedEntityIds: pointOnlyFarms.map(f => f.id),
    affectedEntityNames: pointOnlyFarms.map(f => `${f.farmName} (${f.plotArea} ${f.areaUnit})`),
    details: pointOnlyFarms.length === 0
      ? `All ${linkedFarms.length} farms possess complete GeoJSON polygon boundaries.`
      : `${pointOnlyFarms.length} farm(s) currently recorded as point GPS only. ${largeFarmsPointOnly.length > 0 ? `${largeFarmsPointOnly.length} plot(s) are >=4 ha and strictly require polygon geometry.` : 'Acceptable for smallholders under 4 ha, but polygon mapping recommended.'}`,
    remedyAction: 'Upload or draw polygon boundaries for point-only farm plots.'
  });

  // Rule 2.3: GNSS Accuracy
  const lowAccuracyFarms = linkedFarms.filter(f => f.mappingAccuracyMeters > 5);
  rules.push({
    id: 'R-GEO-03',
    category: 'Farm Geolocation',
    ruleName: 'Mapping Accuracy & Quality Standard',
    description: 'Field GNSS capture should have accuracy within ±5.0 meters.',
    status: lowAccuracyFarms.length === 0 ? 'PASS' : 'WARNING',
    impact: 'WARNING',
    affectedCount: lowAccuracyFarms.length,
    affectedEntityIds: lowAccuracyFarms.map(f => f.id),
    affectedEntityNames: lowAccuracyFarms.map(f => `${f.farmName} (±${f.mappingAccuracyMeters}m)`),
    details: lowAccuracyFarms.length === 0
      ? 'All mapped points meet field precision standards (<= 5.0m).'
      : `${lowAccuracyFarms.length} plot(s) mapped with GNSS variance > 5.0m.`,
    remedyAction: 'Perform high-precision GNSS re-survey during field visit.'
  });

  // ==========================================
  // 3. SUPPLY CHAIN TRACEABILITY RULES
  // ==========================================

  // Rule 3.1: Linked Lots & Origin Deliveries
  const lotsWithoutDeliveries = linkedLots.filter(l => !l.sourceDeliveryIds || l.sourceDeliveryIds.length === 0);
  rules.push({
    id: 'R-TRACE-01',
    category: 'Supply Chain Traceability',
    ruleName: 'Lot-to-Delivery Source Linkage',
    description: 'Export lots must be linked to verified intake delivery records rather than unverified aggregates.',
    status: linkedLots.length === 0 ? 'FAIL' : (lotsWithoutDeliveries.length === 0 ? 'PASS' : 'FAIL'),
    impact: 'BLOCKER',
    affectedCount: lotsWithoutDeliveries.length,
    affectedEntityIds: lotsWithoutDeliveries.map(l => l.id),
    affectedEntityNames: lotsWithoutDeliveries.map(l => l.lotNumber),
    details: lotsWithoutDeliveries.length === 0
      ? `All ${linkedLots.length} linked lots trace back directly to ${linkedDeliveries.length} recorded farmer deliveries.`
      : `${lotsWithoutDeliveries.length} lot(s) lack source delivery links.`,
    remedyAction: 'Attach delivery intake records to the coffee lot.'
  });

  // Rule 3.2: Traceability Event Timeline Completeness
  const lotsWithIncompleteTimeline = linkedLots.filter(lot => {
    const lotEvents = linkedEvents.filter(e => e.lotId === lot.id);
    return lotEvents.length < 3; // Needs at least Purchase, Processing/Milling, Staging
  });
  rules.push({
    id: 'R-TRACE-02',
    category: 'Supply Chain Traceability',
    ruleName: 'End-to-End Custody Timeline',
    description: 'Every lot must chronicle physical custody stages (Farmer Delivery → Collection/Depot → Milling/Washing → Export Staging).',
    status: lotsWithIncompleteTimeline.length === 0 ? 'PASS' : 'WARNING',
    impact: 'WARNING',
    affectedCount: lotsWithIncompleteTimeline.length,
    affectedEntityIds: lotsWithIncompleteTimeline.map(l => l.id),
    affectedEntityNames: lotsWithIncompleteTimeline.map(l => l.lotNumber),
    details: lotsWithIncompleteTimeline.length === 0
      ? 'Comprehensive custody event timeline established across all export lots.'
      : `${lotsWithIncompleteTimeline.length} lot(s) have fewer than 3 recorded custody events in their timeline.`,
    remedyAction: 'Add missing movement, washing, or milling events to the lot timeline.'
  });

  // ==========================================
  // 4. DOCUMENTATION EVIDENCE RULES
  // ==========================================

  // Rule 4.1: Farmer Consent / Land Evidence
  const farmersWithConsent = linkedFarmers.filter(f => 
    linkedDocs.some(doc => (doc.relatedEntityId === f.id || doc.relatedEntityType === 'Farmer') && doc.type.includes('Consent'))
  );
  const missingConsentCount = linkedFarmers.length - farmersWithConsent.length;
  rules.push({
    id: 'R-DOC-01',
    category: 'Documentation',
    ruleName: 'Farmer Due-Diligence & Land Consent Records',
    description: 'Signed farmer consent agreements or customary land production letters on file.',
    status: missingConsentCount === 0 ? 'PASS' : (missingConsentCount <= 1 ? 'WARNING' : 'FAIL'),
    impact: missingConsentCount > 1 ? 'BLOCKER' : 'WARNING',
    affectedCount: Math.max(0, missingConsentCount),
    affectedEntityIds: linkedFarmers.filter(f => !farmersWithConsent.some(fc => fc.id === f.id)).map(f => f.id),
    affectedEntityNames: linkedFarmers.filter(f => !farmersWithConsent.some(fc => fc.id === f.id)).map(f => f.fullName),
    details: missingConsentCount === 0
      ? 'Farmer due-diligence & consent documentation verified for all suppliers.'
      : `${missingConsentCount} contributing farmer(s) lack signed consent/land documentation.`,
    remedyAction: 'Upload signed farmer due-diligence agreement or LC1 verification.'
  });

  // Rule 4.2: Quality / Inspection Certificates (UCDA / Mill Run)
  const lotsWithInspection = linkedLots.filter(l => 
    linkedDocs.some(doc => (doc.relatedEntityId === l.id || doc.relatedEntityType === 'Lot') && (doc.type.includes('UCDA') || doc.type.includes('Inspection') || doc.type.includes('Processing')))
  );
  const missingLotDocs = linkedLots.filter(l => !lotsWithInspection.some(li => li.id === l.id));
  rules.push({
    id: 'R-DOC-02',
    category: 'Documentation',
    ruleName: 'UCDA / Milling Quality Inspection Certificates',
    description: 'Each export lot requires milling output records and official UCDA quality grading certificates.',
    status: missingLotDocs.length === 0 ? 'PASS' : 'WARNING',
    impact: 'WARNING',
    affectedCount: missingLotDocs.length,
    affectedEntityIds: missingLotDocs.map(l => l.id),
    affectedEntityNames: missingLotDocs.map(l => l.lotNumber),
    details: missingLotDocs.length === 0
      ? 'Milling records and UCDA quality certificates verified for all lots.'
      : `${missingLotDocs.length} lot(s) missing attached milling or quality grading certificate.`,
    remedyAction: 'Upload UCDA Inspection or Wet/Dry Mill output batch certificate.'
  });

  // Rule 4.3: Export Level Documents
  const hasPhytoOrExportDoc = linkedDocs.some(d => d.relatedEntityId === shipment.id && (d.type.includes('Phytosanitary') || d.type.includes('Contract') || d.type.includes('Export')));
  rules.push({
    id: 'R-DOC-03',
    category: 'Documentation',
    ruleName: 'Phytosanitary / Export Bill Clearance',
    description: 'Consignment-level export documents (Phytosanitary Certificate from MAAIF, Contract or Bill of Lading).',
    status: hasPhytoOrExportDoc ? 'PASS' : 'WARNING',
    impact: 'INFO',
    affectedCount: hasPhytoOrExportDoc ? 0 : 1,
    affectedEntityIds: hasPhytoOrExportDoc ? [] : [shipment.id],
    affectedEntityNames: [shipment.exportReference],
    details: hasPhytoOrExportDoc
      ? 'Consignment export documentation attached.'
      : 'Phytosanitary or sales contract document not yet attached (recommended before final container sealing).',
    remedyAction: 'Attach export sales contract or MAAIF phytosanitary document.'
  });

  // ==========================================
  // 5. SHIPMENT INTEGRITY
  // ==========================================
  const quantityMismatch = linkedLots.length === 0 || shipment.totalQuantityKg <= 0;
  rules.push({
    id: 'R-SHIP-01',
    category: 'Shipment Integrity',
    ruleName: 'Shipment Lot Assignment & Quantity Balance',
    description: 'Shipment must contain at least 1 verified lot with non-zero export volume.',
    status: quantityMismatch ? 'FAIL' : 'PASS',
    impact: 'BLOCKER',
    affectedCount: quantityMismatch ? 1 : 0,
    affectedEntityIds: quantityMismatch ? [shipment.id] : [],
    affectedEntityNames: [shipment.exportReference],
    details: !quantityMismatch
      ? `Shipment aggregated ${linkedLots.length} lot(s) totaling ${shipment.totalQuantityKg.toLocaleString()} kg.`
      : 'Shipment has no linked lots or has zero quantity.',
    remedyAction: 'Assign active coffee lots to this shipment.'
  });

  // ==========================================
  // SCORE CALCULATIONS
  // ==========================================
  const blockerRules = rules.filter(r => r.impact === 'BLOCKER' && r.status === 'FAIL');
  const warningRules = rules.filter(r => r.status === 'WARNING' || (r.impact !== 'BLOCKER' && r.status === 'FAIL'));
  const passedRules = rules.filter(r => r.status === 'PASS');

  // Sub-scores
  const farmerRules = rules.filter(r => r.category === 'Farmer Data');
  const geoRules = rules.filter(r => r.category === 'Farm Geolocation');
  const traceRules = rules.filter(r => r.category === 'Supply Chain Traceability');
  const docRules = rules.filter(r => r.category === 'Documentation');

  const calcCategoryScore = (catRules: RuleResult[]) => {
    if (catRules.length === 0) return 100;
    const points = catRules.reduce((sum, r) => {
      if (r.status === 'PASS') return sum + 1;
      if (r.status === 'WARNING') return sum + 0.6;
      return sum + 0;
    }, 0);
    return Math.round((points / catRules.length) * 100);
  };

  const dataCompletenessScorePercent = calcCategoryScore(farmerRules);
  const geospatialScorePercent = calcCategoryScore(geoRules);
  const traceabilityScorePercent = calcCategoryScore(traceRules);
  const documentationScorePercent = calcCategoryScore(docRules);

  const overallScorePercent = Math.round(
    dataCompletenessScorePercent * 0.25 +
    geospatialScorePercent * 0.35 +
    traceabilityScorePercent * 0.20 +
    documentationScorePercent * 0.20
  );

  let overallStatus: ReadinessLevel = 'GREEN';
  let statusHeadline = 'Ready for Review / Export Due-Diligence';

  if (blockerRules.length > 0) {
    overallStatus = 'RED';
    statusHeadline = `Blocked — ${blockerRules.length} Critical Issue(s) Prevent Export Readiness`;
  } else if (warningRules.length > 0 || overallScorePercent < 90) {
    overallStatus = 'YELLOW';
    statusHeadline = `Review Required — ${warningRules.length} Non-Blocking Flag(s) Need Attention`;
  }

  // Blocker breakdown structure for interactive deep-link fixes
  const blockerBreakdown = {
    missingGeoFarms: missingGpsFarms.map(f => {
      const farmer = farmers.find(fm => fm.id === f.farmerId);
      return {
        id: f.id,
        name: f.farmName,
        farmerName: farmer?.fullName || 'Unknown Farmer',
        district: f.district
      };
    }),
    unverifiedFarmers: unverifiedFarmers.map(f => ({
      id: f.id,
      name: f.fullName,
      district: f.district
    })),
    missingDeliveriesLots: lotsWithoutDeliveries.map(l => ({
      id: l.id,
      lotNumber: l.lotNumber
    })),
    missingDocuments: [
      ...linkedFarmers.filter(f => !farmersWithConsent.some(fc => fc.id === f.id)).map(f => ({
        type: 'Farmer Consent Agreement',
        entity: 'Farmer',
        entityId: f.id
      })),
      ...missingLotDocs.map(l => ({
        type: 'UCDA / Milling Certificate',
        entity: 'Lot',
        entityId: l.id
      }))
    ],
    incompleteTimelineLots: lotsWithIncompleteTimeline.map(l => ({
      id: l.id,
      lotNumber: l.lotNumber
    }))
  };

  return {
    shipmentId: shipment.id,
    overallStatus,
    overallScorePercent,
    dataCompletenessScorePercent,
    traceabilityScorePercent,
    geospatialScorePercent,
    documentationScorePercent,
    statusHeadline,
    blockersCount: blockerRules.length,
    warningsCount: warningRules.length,
    passedCount: passedRules.length,
    rules,
    blockerBreakdown
  };
}
