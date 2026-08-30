import { pgTable, text, timestamp, numeric, integer, jsonb, uuid, boolean, uniqueIndex, index, unique } from 'drizzle-orm/pg-core';
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
  subscriptionPlan: text('subscription_plan').notNull().default('Professional (UGX 600k/mo)'),
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
}, (table) => {
  return {
    orgEmailUnique: uniqueIndex('users_org_email_unique').on(table.organizationId, table.email),
    orgIdIdx: index('users_org_id_idx').on(table.organizationId),
  };
});

// --- Organization Invitations (Secure Multi-tenant onboarding with hashed tokens) ---
export const organizationInvitations = pgTable('organization_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  email: text('email').notNull(),
  role: text('role').notNull().default('staff'), // 'admin' | 'staff' | 'viewer'
  tokenHash: text('token_hash').notNull().unique(), // SHA-256 hash of the one-time raw token
  invitedByName: text('invited_by_name').notNull(),
  invitedByUserId: text('invited_by_user_id'),
  status: text('status').notNull().default('pending'), // 'pending' | 'accepted' | 'revoked' | 'expired'
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    orgIdx: index('invitations_org_idx').on(table.organizationId),
    tokenHashIdx: uniqueIndex('invitations_token_hash_idx').on(table.tokenHash),
    emailIdx: index('invitations_email_idx').on(table.email)
  };
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
}, (table) => {
  return {
    orgFarmerRegUnique: uniqueIndex('farmers_org_reg_unique').on(table.organizationId, table.farmerRegId),
    orgIdIdx: index('farmers_org_id_idx').on(table.organizationId),
    districtIdx: index('farmers_district_idx').on(table.district)
  };
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
}, (table) => {
  return {
    orgPlotUnique: uniqueIndex('farms_org_plot_unique').on(table.organizationId, table.plotBusinessId),
    orgIdIdx: index('farms_org_id_idx').on(table.organizationId),
    farmerIdIdx: index('farms_farmer_id_idx').on(table.farmerId)
  };
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
}, (table) => {
  return {
    orgDeliveryRefUnique: uniqueIndex('deliveries_org_ref_unique').on(table.organizationId, table.deliveryRef),
    orgIdIdx: index('deliveries_org_id_idx').on(table.organizationId),
    farmerIdIdx: index('deliveries_farmer_id_idx').on(table.farmerId),
    farmIdIdx: index('deliveries_farm_id_idx').on(table.farmId)
  };
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
}, (table) => {
  return {
    orgLotNumberUnique: uniqueIndex('lots_org_lot_unique').on(table.organizationId, table.lotNumber),
    orgIdIdx: index('lots_org_id_idx').on(table.organizationId)
  };
});

// --- Lot to Delivery Junction ---
export const lotDeliveries = pgTable('lot_deliveries', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }).notNull(),
  deliveryId: uuid('delivery_id').references(() => deliveries.id, { onDelete: 'cascade' }).notNull()
}, (table) => {
  return {
    lotDeliveryUnique: uniqueIndex('lot_deliv_unique').on(table.lotId, table.deliveryId),
    orgIdIdx: index('lot_deliveries_org_id_idx').on(table.organizationId)
  };
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
}, (table) => {
  return {
    lotIdIdx: index('events_lot_id_idx').on(table.lotId),
    orgIdIdx: index('events_org_id_idx').on(table.organizationId)
  };
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
}, (table) => {
  return {
    orgExportRefUnique: uniqueIndex('shipments_org_ref_unique').on(table.organizationId, table.exportReference),
    orgIdIdx: index('shipments_org_id_idx').on(table.organizationId)
  };
});

// --- Shipment to Lot Junction ---
export const shipmentLots = pgTable('shipment_lots', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  shipmentId: uuid('shipment_id').references(() => shipments.id, { onDelete: 'cascade' }).notNull(),
  lotId: uuid('lot_id').references(() => lots.id, { onDelete: 'cascade' }).notNull()
}, (table) => {
  return {
    shipmentLotUnique: uniqueIndex('shipment_lot_unique').on(table.shipmentId, table.lotId),
    orgIdIdx: index('shipment_lots_org_id_idx').on(table.organizationId)
  };
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
}, (table) => {
  return {
    orgIdIdx: index('documents_org_id_idx').on(table.organizationId),
    relatedEntityIdx: index('documents_related_idx').on(table.relatedEntityType, table.relatedEntityId)
  };
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
}, (table) => {
  return {
    orgIdIdx: index('audit_org_id_idx').on(table.organizationId),
    timestampIdx: index('audit_timestamp_idx').on(table.timestamp)
  };
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
}, (table) => {
  return {
    orgShipmentIdx: index('eval_org_shipment_idx').on(table.organizationId, table.shipmentId),
    createdAtIdx: index('eval_created_idx').on(table.createdAt)
  };
});

// --- Subscriptions (Commercial tier management) ---
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  planId: text('plan_id').notNull(), // 'starter' | 'professional' | 'enterprise'
  planName: text('plan_name').notNull().default('Professional Exporter'),
  status: text('status').notNull().default('active'), // 'active' | 'past_due' | 'cancelled' | 'expired' | 'suspended'
  billingCycle: text('billing_cycle').notNull().default('monthly'), // 'monthly' | 'annual'
  amountUgx: numeric('amount_ugx', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('UGX'),
  maxFarmers: integer('max_farmers').notNull().default(5000),
  maxFarms: integer('max_farms').notNull().default(10000),
  maxShipmentsMonthly: integer('max_shipments_monthly').notNull().default(50),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).defaultNow().notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  featuresJson: jsonb('features_json'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    orgIdx: index('subscriptions_org_idx').on(table.organizationId),
    statusIdx: index('subscriptions_status_idx').on(table.status)
  };
});

// --- Payments & Mobile Money / Gateway Transactions ---
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
  amountUgx: numeric('amount_ugx', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').notNull().default('UGX'),
  paymentMethod: text('payment_method').notNull().default('MTN_MOMO'), // 'MTN_MOMO' | 'AIRTEL_MONEY' | 'CARD' | 'BANK_TRANSFER'
  provider: text('provider').notNull().default('direct_momo'), // 'direct_momo' | 'flutterwave' | 'paypack' | 'dlocal'
  providerTransactionId: text('provider_transaction_id'),
  idempotencyKey: text('idempotency_key').notNull().unique(),
  status: text('status').notNull().default('pending'), // 'pending' | 'successful' | 'failed' | 'refunded'
  phoneNumber: text('phone_number'),
  payerEmail: text('payer_email'),
  description: text('description').notNull(),
  rawMetadata: jsonb('raw_metadata'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
}, (table) => {
  return {
    orgIdx: index('payments_org_idx').on(table.organizationId),
    idempotencyIdx: uniqueIndex('payments_idempotency_idx').on(table.idempotencyKey),
    providerTxIdx: index('payments_provider_tx_idx').on(table.providerTransactionId),
    statusIdx: index('payments_status_idx').on(table.status)
  };
});

// --- Relations ---
export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  invitations: many(organizationInvitations),
  farmers: many(farmers),
  farms: many(farms),
  deliveries: many(deliveries),
  lots: many(lots),
  shipments: many(shipments),
  documents: many(documents),
  auditLogs: many(auditLogs),
  subscriptions: many(subscriptions),
  payments: many(payments)
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id]
  }),
  payments: many(payments)
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id]
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id]
  })
}));

export const organizationInvitationsRelations = relations(organizationInvitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvitations.organizationId],
    references: [organizations.id]
  })
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
