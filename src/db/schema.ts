import { pgTable, text, timestamp, numeric, integer, jsonb, uuid, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// --- Organizations (Tenants) ---
export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  legalName: text('legal_name').notNull(),
  type: text('type').notNull().default('Exporter'), // 'Exporter' | 'Cooperative' | 'Washing Station' | 'Processor' | 'Other'
  registrationNumber: text('registration_number').notNull(),
  country: text('country').notNull().default('Uganda'),
  district: text('district').notNull().default('Kampala'),
  address: text('address').notNull(),
  contactPhone: text('contact_phone').notNull(),
  email: text('email').notNull(),
  contactEmail: text('contact_email'),
  website: text('website').default(''),
  subscriptionPlan: text('subscription_plan').notNull().default('Starter'),
  activeStatus: text('active_status').notNull().default('Active'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Users (Linked to Firebase Auth UID & Organization) ---
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('staff'), // 'admin' | 'staff' | 'viewer'
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').default('Compliance & Operations Officer'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Farmers (Smallholder registry) ---
export const farmers = pgTable('farmers', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  farmerRegId: text('farmer_reg_id').notNull(), // e.g. "UG-F-1049"
  fullName: text('full_name').notNull(),
  phone: text('phone').notNull(),
  phoneNumber: text('phone_number'),
  altPhone: text('alt_phone'),
  village: text('village').notNull(),
  parish: text('parish').notNull(),
  subcounty: text('subcounty').notNull(),
  district: text('district').notNull(),
  nationalId: text('national_id'), // Optional NIN
  cooperative: text('cooperative').notNull(),
  cooperativeMembership: text('cooperative_membership'),
  verificationStatus: text('verification_status').notNull().default('Partially verified'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Farm Plots (Centroids & Polygon boundaries) ---
export const farms = pgTable('farms', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  farmerId: uuid('farmer_id').references(() => farmers.id, { onDelete: 'cascade' }).notNull(),
  plotBusinessId: text('plot_business_id').notNull(), // e.g. "UG-PL-2091"
  farmName: text('farm_name').notNull(),
  district: text('district').notNull(),
  subcounty: text('subcounty').notNull(),
  parish: text('parish'),
  village: text('village').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  plotArea: numeric('plot_area', { precision: 10, scale: 4 }).notNull(),
  areaUnit: text('area_unit').notNull().default('Hectares'),
  geometryType: text('geometry_type').notNull().default('Point'), // 'Point' | 'Polygon'
  geoJsonData: jsonb('geo_json_data'),
  mappingDate: text('mapping_date'),
  mappingMethod: text('mapping_method').default('Mobile GNSS'),
  mappingAccuracyMeters: numeric('mapping_accuracy_meters', { precision: 5, scale: 2 }).default('1.50'),
  verificationStatus: text('verification_status').notNull().default('Partially verified'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Deliveries (Intake receipts) ---
export const deliveries = pgTable('deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  deliveryRef: text('delivery_ref').notNull(), // e.g. "DEL-2026-0811"
  farmerId: uuid('farmer_id').references(() => farmers.id, { onDelete: 'cascade' }).notNull(),
  farmId: uuid('farm_id').references(() => farms.id, { onDelete: 'cascade' }).notNull(),
  dateReceived: text('date_received').notNull(),
  deliveryDate: text('delivery_date'),
  quantityKg: numeric('quantity_kg', { precision: 12, scale: 2 }).notNull(),
  unit: text('unit').notNull().default('kg'),
  coffeeType: text('coffee_type').notNull().default('Robusta'),
  grade: text('grade').notNull().default('FAQ (Fair Average Quality)'),
  moistureContentPercent: numeric('moisture_content_percent', { precision: 5, scale: 2 }),
  buyingLocation: text('buying_location').default('Kasese Main Depot'),
  buyingDepot: text('buying_depot'),
  receivingOrg: text('receiving_org'),
  receiptNumber: text('receipt_number').notNull(),
  numberOfBags: integer('number_of_bags'),
  pricePerKgUgx: numeric('price_per_kg_ugx', { precision: 12, scale: 2 }),
  totalPaymentUgx: numeric('total_payment_ugx', { precision: 14, scale: 2 }),
  purchasedBy: text('purchased_by'),
  notes: text('notes'),
  associatedLotId: uuid('associated_lot_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Lots (Aggregated batches) ---
export const lots = pgTable('lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  lotNumber: text('lot_number').notNull(), // e.g. "LOT-UG-RB-2026-0041"
  coffeeType: text('coffee_type').notNull().default('Robusta'),
  grade: text('grade').notNull().default('FAQ (Fair Average Quality)'),
  quantityKg: numeric('quantity_kg', { precision: 12, scale: 2 }).notNull(),
  creationDate: text('creation_date').notNull(),
  dateReceived: text('date_received').notNull(),
  currentLocation: text('current_location').notNull(),
  currentStatus: text('current_status').notNull().default('Received'),
  processingStation: text('processing_station').notNull(),
  assignedShipmentId: uuid('assigned_shipment_id'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Lot to Delivery Junction ---
export const lotDeliveries = pgTable('lot_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }).notNull(),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'cascade' }).notNull()
});

// --- Traceability Custody Events ---
export const traceabilityEvents = pgTable('traceability_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }).notNull(),
  eventType: text('event_type').notNull(),
  location: text('location').notNull(),
  dateTime: text('date_time').notNull(),
  responsibleParty: text('responsible_party').notNull(),
  quantityKg: numeric('quantity_kg', { precision: 12, scale: 2 }).notNull(),
  referenceDocNumber: text('reference_doc_number'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Shipments ---
export const shipments = pgTable('shipments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  exportReference: text('export_reference').notNull(), // e.g. "SH-UG-2026-008"
  shipmentDate: text('shipment_date').notNull(),
  buyerName: text('buyer_name').notNull(),
  destinationCountry: text('destination_country').notNull(),
  destinationPort: text('destination_port').notNull(),
  coffeeType: text('coffee_type').notNull().default('Robusta'),
  totalQuantityKg: numeric('total_quantity_kg', { precision: 12, scale: 2 }).notNull(),
  exportStatus: text('export_status').notNull().default('Draft'),
  readinessStatus: text('readiness_status').notNull().default('YELLOW'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Shipment to Lot Junction ---
export const shipmentLots = pgTable('shipment_lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }).notNull()
});

// --- Documents (Private metadata & physical storage pointer) ---
export const documents = pgTable('documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  type: text('type').notNull(),
  fileName: text('file_name').notNull(),
  fileSize: text('file_size').notNull(),
  filePath: text('file_path').notNull(), // Internal private storage relative path
  mimeType: text('mime_type').notNull(),
  uploadDate: text('upload_date').notNull(),
  uploadedBy: text('uploaded_by').notNull(),
  relatedEntityType: text('related_entity_type').notNull(), // 'Farmer' | 'Farm' | 'Delivery' | 'Lot' | 'Shipment' | 'Organization'
  relatedEntityId: text('related_entity_id').notNull(),
  expiryDate: text('expiry_date'),
  verificationStatus: text('verification_status').notNull().default('Pending Review'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Audit Logs ---
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: text('user_id'),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  previousValue: text('previous_value'),
  newValue: text('new_value'),
  ipAddress: text('ip_address')
});

// --- Readiness Evaluation Cache & Versioning ---
export const readinessEvaluations = pgTable('readiness_evaluations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  ruleVersion: text('rule_version').notNull().default('v1.2.0-uganda-2026'),
  overallStatus: text('overall_status').notNull(),
  overallScorePercent: integer('overall_score_percent').notNull(),
  dataCompletenessScorePercent: integer('data_completeness_score_percent').notNull(),
  traceabilityScorePercent: integer('traceability_score_percent').notNull(),
  geospatialScorePercent: integer('geospatial_score_percent').notNull(),
  documentationScorePercent: integer('documentation_score_percent').notNull(),
  blockersCount: integer('blockers_count').notNull(),
  warningsCount: integer('warnings_count').notNull(),
  passedCount: integer('passed_count').notNull(),
  evaluationData: jsonb('evaluation_data').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// --- Relations ---
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  farmers: many(farmers),
  farms: many(farms),
  deliveries: many(deliveries),
  lots: many(lots),
  shipments: many(shipments),
  documents: many(documents),
  auditLogs: many(auditLogs)
}));

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id]
  })
}));

export const farmersRelations = relations(farmers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [farmers.organizationId],
    references: [organizations.id]
  }),
  farms: many(farms),
  deliveries: many(deliveries)
}));

export const farmsRelations = relations(farms, ({ one, many }) => ({
  farmer: one(farmers, {
    fields: [farms.farmerId],
    references: [farmers.id]
  }),
  deliveries: many(deliveries)
}));

export const lotsRelations = relations(lots, ({ many }) => ({
  lotDeliveries: many(lotDeliveries),
  traceabilityEvents: many(traceabilityEvents),
  shipmentLots: many(shipmentLots)
}));
