export type UserRole = 'admin' | 'staff' | 'viewer';
export type PlatformRole = 'PLATFORM_OWNER';

export type OrganizationType = 'Exporter' | 'Cooperative' | 'Washing Station' | 'Processor' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
  title?: string;
  isPlatformOwner?: boolean;
  platformRole?: PlatformRole | null;
}

export interface Organization {
  id: string;
  legalName: string;
  type: OrganizationType;
  registrationNumber: string;
  country: string;
  district: string;
  address: string;
  contactPhone: string;
  email: string;
  contactEmail?: string;
  website: string;
  createdDate: string;
  subscriptionPlan: 'Starter' | 'Pro' | 'Enterprise' | 'Starter (UGX 250k/mo)' | 'Professional (UGX 600k/mo)' | 'Enterprise (UGX 1.8M/mo)' | string;
  activeStatus: 'Active' | 'Inactive' | 'Trial';
}

export type VerificationStatus = 'Unverified' | 'Partially verified' | 'Verified' | 'Requires review' | 'Pending Verification';

export interface Farmer {
  id: string; // e.g. "UG-F-1049"
  organizationId: string;
  fullName: string;
  phone: string;
  phoneNumber?: string;
  altPhone?: string;
  village: string;
  parish: string;
  subcounty: string;
  district: string;
  nationalId?: string; // Optional NIN to prevent pilot onboarding barriers
  cooperative: string;
  cooperativeMembership?: string;
  farmerRegId: string;
  verificationStatus: VerificationStatus;
  notes?: string;
  createdDate: string;
  updatedDate: string;
}

export type GeometryType = 'Point' | 'Polygon';

export interface GeoPolygonCoordinates {
  type: 'Polygon';
  coordinates: number[][][]; // [ [ [lng, lat], [lng, lat], ... ] ]
}

export interface FarmPlot {
  id: string; // e.g. "UG-PL-2091"
  farmerId: string;
  organizationId: string;
  farmName: string;
  district: string;
  subcounty: string;
  parish?: string;
  village: string;
  latitude: number;
  longitude: number;
  plotArea: number; // in hectares or acres
  areaUnit: 'Hectares' | 'Acres' | 'Ha';
  geometryType: GeometryType;
  geoJsonData?: GeoPolygonCoordinates;
  mappingDate?: string;
  mappingMethod?: 'GPS Handheld' | 'Mobile GNSS' | 'Drone Survey' | 'Manual Web Pin' | string;
  mappingAccuracyMeters?: number; // e.g. 1.5
  verificationStatus: VerificationStatus;
  documentIds?: string[];
  notes?: string;
}

export type CoffeeType = 'Robusta' | 'Arabica';

export type CoffeeGrade = 
  | 'Screen 18' 
  | 'Screen 15' 
  | 'Screen 12' 
  | 'FAQ (Fair Average Quality)' 
  | 'Bugisu AA' 
  | 'Bugisu A' 
  | 'Bugisu PB' 
  | 'Drugar' 
  | 'Wugar' 
  | 'Parchment' 
  | 'Dry Cherry (Kiboko)' 
  | 'Washed Cherry';

export interface Delivery {
  id: string; // e.g. "DEL-2026-0811"
  organizationId: string;
  farmerId: string;
  farmId: string;
  dateReceived?: string;
  deliveryDate?: string;
  quantityKg: number;
  unit?: 'kg' | 'bags (60kg)';
  coffeeType: CoffeeType;
  grade: CoffeeGrade;
  moistureContentPercent?: number; // e.g. 12.5%
  buyingLocation?: string; // e.g. "Kasese Main Depot", "Masaka Central Hub"
  buyingDepot?: string;
  receivingOrg?: string;
  receiptNumber: string;
  numberOfBags?: number;
  pricePerKgUgx?: number;
  totalPaymentUgx?: number;
  purchasedBy?: string;
  notes?: string;
  documentIds?: string[];
  associatedLotId?: string;
}


export type LotStatus = 
  | 'Received'
  | 'Collected'
  | 'At Washing Station'
  | 'Processing'
  | 'Processed'
  | 'Stored'
  | 'Assigned to Shipment'
  | 'Shipped'
  | 'Closed'
  | 'Requires Review';

export interface TraceabilityEvent {
  id: string;
  lotId: string;
  eventType: 
    | 'Purchased from Farmer'
    | 'Received at Collection Hub'
    | 'Transferred to Washing/Processing Station'
    | 'Hulling / Washing Completed'
    | 'Moisture & Quality Inspection'
    | 'Moved to Central Warehouse'
    | 'Assigned to Export Shipment'
    | 'Customs / Phytosanitary Clearance'
    | 'Container Sealed & Shipped';
  location: string;
  dateTime: string;
  responsibleParty: string;
  quantityKg: number;
  referenceDocNumber?: string;
  notes?: string;
}

export interface Lot {
  id: string; // e.g. "LOT-UG-RB-2026-0041"
  organizationId: string;
  lotNumber: string;
  coffeeType: CoffeeType;
  grade: CoffeeGrade;
  quantityKg: number;
  creationDate: string;
  dateReceived: string;
  currentLocation: string;
  currentStatus: LotStatus;
  sourceFarmerIds: string[];
  sourceFarmIds: string[];
  sourceDeliveryIds: string[];
  processingStation: string;
  notes?: string;
  documentIds: string[];
  assignedShipmentId?: string;
}

export type ShipmentStatus = 
  | 'Draft'
  | 'Being Prepared'
  | 'Requires Evidence'
  | 'Ready for Review'
  | 'Ready for Export'
  | 'Shipped'
  | 'Closed';

export type ReadinessLevel = 'GREEN' | 'YELLOW' | 'RED';

export interface Shipment {
  id: string; // e.g. "SH-UG-2026-008"
  organizationId: string;
  exportReference: string;
  shipmentDate: string;
  buyerName: string;
  destinationCountry: string;
  destinationPort: string;
  coffeeType: CoffeeType;
  totalQuantityKg: number;
  linkedLotIds: string[];
  exportStatus: ShipmentStatus;
  readinessStatus: ReadinessLevel;
  notes?: string;
  createdDate: string;
  documentIds: string[];
}

export type DocumentType = 
  | 'Farmer Identification / NIN'
  | 'Farmer Consent / Due-Diligence Agreement'
  | 'Land / Production Evidence (Customary / Title)'
  | 'Purchase Record / Weighbridge Ticket'
  | 'Delivery Note / Waybill'
  | 'Washing / Processing / Hulling Record'
  | 'UCDA Quality / Grade Inspection Certificate'
  | 'Phytosanitary Certificate'
  | 'Sales Contract'
  | 'Bill of Lading / Export Document'
  | 'Other';

export interface DocumentRecord {
  id: string;
  organizationId: string;
  type: DocumentType;
  fileName: string;
  fileSize: string;
  fileUrl: string;
  uploadDate: string;
  uploadedBy: string;
  relatedEntityType: 'Farmer' | 'Farm' | 'Delivery' | 'Lot' | 'Shipment' | 'Organization';
  relatedEntityId: string;
  expiryDate?: string;
  verificationStatus: 'Verified' | 'Pending Review' | 'Flagged';
  notes?: string;
}

export interface AuditLog {
  id: string;
  organizationId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  timestamp: string;
  previousValue?: string;
  newValue?: string;
}

export interface RuleResult {
  id: string;
  category: 'Farmer Data' | 'Farm Geolocation' | 'Supply Chain Traceability' | 'Documentation' | 'Shipment Integrity';
  ruleName: string;
  description: string;
  status: 'PASS' | 'WARNING' | 'FAIL' | 'NOT_APPLICABLE';
  impact: 'BLOCKER' | 'WARNING' | 'INFO';
  affectedCount: number;
  affectedEntityIds: string[];
  affectedEntityNames?: string[];
  details: string;
  remedyAction: string;
}

export interface ReadinessScorecard {
  shipmentId: string;
  overallStatus: ReadinessLevel;
  overallScorePercent: number;
  dataCompletenessScorePercent: number;
  traceabilityScorePercent: number;
  geospatialScorePercent: number;
  documentationScorePercent: number;
  statusHeadline: string;
  blockersCount: number;
  warningsCount: number;
  passedCount: number;
  rules: RuleResult[];
  blockerBreakdown: {
    missingGeoFarms: { id: string; name: string; farmerName: string; district: string }[];
    unverifiedFarmers: { id: string; name: string; district: string }[];
    missingDeliveriesLots: { id: string; lotNumber: string }[];
    missingDocuments: { type: string; entity: string; entityId: string }[];
    incompleteTimelineLots: { id: string; lotNumber: string }[];
  };
}

export interface CsvImportRow {
  rowNumber: number;
  farmerId: string;
  fullName: string;
  phone: string;
  village: string;
  parish: string;
  subcounty: string;
  district: string;
  cooperative: string;
  latitude: number | null;
  longitude: number | null;
  plotArea: number | null;
  errors: string[];
  warnings: string[];
  isValid: boolean;
}

export type SubscriptionStatus = 'active' | 'past_due' | 'cancelled' | 'expired' | 'suspended';
export type PaymentStatus = 'pending' | 'successful' | 'failed' | 'refunded';
export type PaymentMethod = 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'BANK_TRANSFER';

export interface Subscription {
  id: string;
  organizationId: string;
  planId: 'starter' | 'professional' | 'enterprise';
  planName: string;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'annual';
  amountUgx: number;
  currency: string;
  maxFarmers: number;
  maxFarms: number;
  maxShipmentsMonthly: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  featuresJson?: any;
}

export interface PaymentRecord {
  id: string;
  organizationId: string;
  organizationName?: string;
  subscriptionId?: string;
  amountUgx: number;
  currency: string;
  paymentMethod: PaymentMethod;
  provider: string;
  providerTransactionId?: string;
  idempotencyKey: string;
  status: PaymentStatus;
  phoneNumber?: string;
  payerEmail?: string;
  description: string;
  createdAt: string;
}

export type ExpenseCategory =
  | 'Cloud Infrastructure'
  | 'UCDA Field Operations'
  | 'Telecom & Mobile Money'
  | 'Legal & Compliance'
  | 'Salaries & Contractors'
  | 'Office & Admin'
  | 'Marketing'
  | 'Other';

export interface BusinessExpense {
  id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory | string;
  description: string;
  date: string;
  vendor: string;
  recurring: boolean;
  receiptReference?: string | null;
  createdBy: string;
  createdById?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OwnerOverviewMetrics {
  mrrUgx: number;
  arrUgx: number;
  totalRevenueUgx: number;
  cashReceivedUgx: number;
  outstandingRevenueUgx: number;
  failedRevenueUgx: number;
  monthlyExpensesUgx: number;
  totalExpensesUgx: number;
  operatingProfitUgx: number;
  monthlyOperatingProfitUgx: number;
  totalOrganizations: number;
  payingOrganizations: number;
  trialOrganizations: number;
  activeSubscriptionsCount: number;
  newCustomers30d: number;
  churnedCustomers30d: number;
  revenueByPlan: {
    planId: string;
    planName: string;
    mrrUgx: number;
    subscribersCount: number;
    percentage: number;
  }[];
  platformUsage: {
    totalFarmers: number;
    totalFarms: number;
    totalDeliveries: number;
    totalCoffeeQuantityKg: number;
    totalLots: number;
    totalShipments: number;
    totalDocuments: number;
    totalTraceabilityEvents: number;
    totalAuditLogs: number;
  };
  recentPayments: PaymentRecord[];
  failedPayments: PaymentRecord[];
  alerts: OwnerAlert[];
}

export interface OwnerRevenueTimeseriesPoint {
  date: string;
  cashReceivedUgx: number;
  outstandingUgx: number;
  failedUgx: number;
  expensesUgx: number;
  netProfitUgx: number;
  newCustomers: number;
}

export interface OwnerRevenueData {
  timeframe: '30d' | '90d' | '365d' | 'all';
  points: OwnerRevenueTimeseriesPoint[];
  summary: {
    totalCashReceived: number;
    totalOutstanding: number;
    totalExpenses: number;
    totalNetProfit: number;
    growthRatePercent: number;
  };
  revenueByPlan: {
    planId: string;
    planName: string;
    mrrUgx: number;
    subscribersCount: number;
    percentage: number;
  }[];
  paymentMethodDistribution: {
    method: PaymentMethod | string;
    count: number;
    amountUgx: number;
    percentage: number;
  }[];
}

export interface OwnerCustomerRecord {
  id: string;
  legalName: string;
  type: OrganizationType | string;
  registrationNumber: string;
  country: string;
  district: string;
  address: string;
  contactPhone: string;
  email: string;
  subscriptionPlan: string;
  activeStatus: 'Active' | 'Inactive' | 'Trial' | 'Suspended' | string;
  createdDate: string;
  subscription?: {
    id: string;
    planId: string;
    planName: string;
    status: SubscriptionStatus;
    billingCycle: 'monthly' | 'annual';
    amountUgx: number;
    currentPeriodEnd: string;
  } | null;
  usersCount: number;
  farmersCount: number;
  farmsCount: number;
  shipmentsCount: number;
  totalPaymentsUgx: number;
  lastActiveDate?: string;
}

export interface OwnerAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  entityType?: 'payment' | 'subscription' | 'organization' | 'compliance' | 'system';
  entityId?: string;
  actionLabel?: string;
  actionUrl?: string;
}

