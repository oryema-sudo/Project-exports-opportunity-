import { Organization, User, Farmer, FarmPlot, Delivery, Lot, Shipment, DocumentRecord, AuditLog, TraceabilityEvent } from '../types';

/**
 * AstroKahawa starts as a clean, empty platform.
 * All operational data must be authentically entered, imported via CSV,
 * or synchronized from verified server records.
 */
export const INITIAL_ORGANIZATIONS: Organization[] = [];
export const INITIAL_USERS: User[] = [];
export const INITIAL_FARMERS: Farmer[] = [];
export const INITIAL_FARMS: FarmPlot[] = [];
export const INITIAL_DELIVERIES: Delivery[] = [];
export const INITIAL_LOTS: Lot[] = [];
export const INITIAL_SHIPMENTS: Shipment[] = [];
export const INITIAL_DOCUMENTS: DocumentRecord[] = [];
export const INITIAL_AUDIT_LOGS: AuditLog[] = [];
export const INITIAL_TRACEABILITY_EVENTS: TraceabilityEvent[] = [];
