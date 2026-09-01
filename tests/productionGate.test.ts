import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireRole, requirePlatformOwner } from '../src/middleware/auth.ts';
import { adminAuth } from '../src/lib/firebase-admin.ts';
import { db } from '../src/db/index.ts';
import { evaluateShipmentReadiness } from '../src/server/readinessEngine.ts';
import { 
  getOrgStorageDir, 
  resolveSecureFilePath, 
  DANGEROUS_EXTENSIONS, 
  ALLOWED_MIME_TYPES,
  formatBytes
} from '../src/server/storage.ts';

describe('ASTROKAHAWA Production Gate Security & Verification Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Authentication & Multi-Tenant Authorization Enforcement', () => {
    
    it('Blocks unauthenticated requests missing Bearer authorization headers', async () => {
      const req = { headers: {} } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      await requireAuth(req, res, next);
      expect(statusSent).toBe(401);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.error).toMatch(/Missing or malformed Authorization header/i);
    });

    it('Blocks requests with invalid or expired Firebase tokens', async () => {
      vi.spyOn(adminAuth, 'verifyIdToken').mockRejectedValue(new Error('Firebase ID token has expired'));

      const req = { headers: { authorization: 'Bearer expired_token' } } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      await requireAuth(req, res, next);
      expect(statusSent).toBe(401);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.error).toMatch(/Invalid or expired authentication token/i);
    });

    it('Blocks deactivated users with 403 ACCOUNT_DEACTIVATED', async () => {
      vi.spyOn(adminAuth, 'verifyIdToken').mockResolvedValue({
        uid: 'uid-deactivated',
        email: 'deactivated@ugandacoffee.ug',
        name: 'Deactivated User'
      } as any);

      vi.spyOn(db, 'select').mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              {
                id: 'usr-deactivated',
                uid: 'uid-deactivated',
                email: 'deactivated@ugandacoffee.ug',
                name: 'Deactivated User',
                role: 'staff',
                organizationId: 'org-active-01',
                isActive: false // DEACTIVATED
              }
            ])
          })
        })
      } as any);

      const req = { headers: { authorization: 'Bearer token_deactivated' } } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      await requireAuth(req, res, next);
      expect(statusSent).toBe(403);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.code).toBe('ACCOUNT_DEACTIVATED');
    });

    it('Enforces RBAC role guard strictly', () => {
      const adminOnlyGuard = requireRole(['admin']);
      
      // Staff trying admin route
      const reqStaff = {
        user: { id: 'u1', role: 'staff', organizationId: 'org-1' }
      } as any;
      let statusSent = 0;
      let jsonSent: any = null;
      const res = {
        status: (code: number) => {
          statusSent = code;
          return { json: (data: any) => { jsonSent = data; } };
        }
      } as any;
      const next = vi.fn();

      adminOnlyGuard(reqStaff, res, next);
      expect(statusSent).toBe(403);
      expect(next).not.toHaveBeenCalled();
      expect(jsonSent.error).toMatch(/Forbidden: Action requires one of \[admin\] role/i);

      // Admin trying admin route
      const reqAdmin = {
        user: { id: 'u2', role: 'admin', organizationId: 'org-1' }
      } as any;
      const nextAdmin = vi.fn();
      adminOnlyGuard(reqAdmin, res, nextAdmin);
      expect(nextAdmin).toHaveBeenCalled();
    });
  });

  describe('2. Multi-Tenant Directory Isolation & Storage Security', () => {
    
    it('Sanitizes organization ID in storage path and rejects directory traversal attacks', () => {
      const maliciousOrgId = '../../etc/passwd';
      const sanitizedDir = getOrgStorageDir(maliciousOrgId);
      // Slashes and dots must be stripped
      expect(sanitizedDir).not.toContain('..');
      expect(sanitizedDir).toContain('org_etcpasswd');
    });

    it('Rejects unauthorized cross-tenant file access with path traversal attempts', () => {
      const tenantOrgId = 'org-legit-123';
      const maliciousPath = 'private_storage/org_victim_456/secret_export_doc.pdf';

      expect(() => {
        resolveSecureFilePath(maliciousPath, tenantOrgId);
      }).toThrow(/Access denied: File does not belong to authorized organization container/i);
    });

    it('Disallows all dangerous and executable extensions', () => {
      const testDangerous = ['.exe', '.sh', '.php', '.js', '.ts', '.html', '.bat', '.py'];
      for (const ext of testDangerous) {
        expect(DANGEROUS_EXTENSIONS.has(ext)).toBe(true);
      }
    });

    it('Allows expected compliance and traceability document MIME types', () => {
      expect(ALLOWED_MIME_TYPES.has('application/pdf')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('text/csv')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/jpeg')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('image/png')).toBe(true);
      expect(ALLOWED_MIME_TYPES.has('application/json')).toBe(true);
    });

    it('Correctly formats file byte sizes', () => {
      expect(formatBytes(500)).toBe('500 B');
      expect(formatBytes(2048)).toBe('2.0 KB');
      expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
    });
  });

  describe('3. Readiness Engine & Regulatory Evaluation Logic', () => {

    it('Evaluates a compliant shipment with all farm GPS, deliveries, and certificates as GREEN', () => {
      const evaluation = evaluateShipmentReadiness({
        shipment: {
          id: 'ship-001',
          exportReference: 'SH-UG-2026-001',
          coffeeType: 'Robusta',
          totalQuantityKg: 19200,
          destinationCountry: 'Germany',
          buyerName: 'Hamburg Coffee Merchants GmbH'
        },
        lots: [
          {
            id: 'lot-001',
            lotNumber: 'LOT-UG-RB-2026-001',
            coffeeType: 'Robusta',
            grade: 'Screen 18',
            quantityKg: 19200
          }
        ],
        deliveries: [
          {
            id: 'del-001',
            deliveryRef: 'DEL-2026-001',
            farmerId: 'farmer-001',
            farmId: 'farm-001',
            quantityKg: 19200,
            moistureContentPercent: 12.0,
            associatedLotId: 'lot-001'
          }
        ],
        farmers: [
          {
            id: 'farmer-001',
            farmerRegId: 'UG-F-1001',
            fullName: 'Yusuf Mukasa',
            phone: '+256 772 123 456',
            district: 'Masaka',
            subcounty: 'Buwunga',
            village: 'Kyanamukaka',
            nationalId: 'CM840291048KLA',
            cooperative: 'Masaka District Coffee Farmers Cooperative Union',
            verificationStatus: 'Verified'
          }
        ],
        farms: [
          {
            id: 'farm-001',
            plotBusinessId: 'UG-PL-001',
            farmerId: 'farmer-001',
            farmName: 'Mukasa Homestead Farm',
            district: 'Masaka',
            subcounty: 'Buwunga',
            village: 'Kyanamukaka',
            latitude: -0.3412000,
            longitude: 31.7389000,
            plotArea: 2.4,
            areaUnit: 'Hectares',
            geometryType: 'Point',
            mappingAccuracyMeters: 1.2,
            verificationStatus: 'Verified'
          }
        ],
        events: [
          {
            id: 'evt-001',
            lotId: 'lot-001',
            eventType: 'Milling & Grading',
            dateTime: '2026-08-10 14:00',
            location: 'Masaka Dry Mill',
            quantityKg: 19200
          }
        ],
        documents: [
          {
            id: 'doc-001',
            type: 'UCDA Quality Certificate',
            fileName: 'ucda_cert_2026_001.pdf',
            relatedEntityType: 'Shipment',
            relatedEntityId: 'ship-001',
            verificationStatus: 'Verified'
          },
          {
            id: 'doc-002',
            type: 'Land Title / Customary Agreement',
            fileName: 'mukasa_land_agreement.pdf',
            relatedEntityType: 'Farm',
            relatedEntityId: 'farm-001',
            verificationStatus: 'Verified'
          }
        ]
      });

      expect(evaluation.overallStatus).toBe('GREEN');
      expect(evaluation.overallScorePercent).toBeGreaterThanOrEqual(90);
      expect(evaluation.blockersCount).toBe(0);
      expect(evaluation.statusHeadline).toMatch(/Ready for Export/i);
    });

    it('Flags shipment with missing farm geolocation or invalid coordinates as RED with blocker', () => {
      const evaluation = evaluateShipmentReadiness({
        shipment: {
          id: 'ship-002',
          exportReference: 'SH-UG-2026-002',
          coffeeType: 'Arabica',
          totalQuantityKg: 10000,
          destinationCountry: 'Italy',
          buyerName: 'Trieste Roasters SpA'
        },
        lots: [
          {
            id: 'lot-002',
            lotNumber: 'LOT-UG-AR-2026-002',
            coffeeType: 'Arabica',
            grade: 'Bugisu AA',
            quantityKg: 10000
          }
        ],
        deliveries: [
          {
            id: 'del-002',
            deliveryRef: 'DEL-2026-002',
            farmerId: 'farmer-002',
            farmId: 'farm-002',
            quantityKg: 10000,
            associatedLotId: 'lot-002'
          }
        ],
        farmers: [
          {
            id: 'farmer-002',
            farmerRegId: 'UG-F-2002',
            fullName: 'Grace Nabirye',
            phone: '+256 701 987 654',
            district: 'Mbale',
            subcounty: 'Wanale',
            village: 'Bufumbo',
            cooperative: 'Bugisu Cooperative Union',
            verificationStatus: 'Partially verified'
          }
        ],
        farms: [
          {
            id: 'farm-002',
            plotBusinessId: 'UG-PL-002',
            farmerId: 'farmer-002',
            farmName: 'Nabirye Elgon Plot',
            district: 'Mbale',
            subcounty: 'Wanale',
            village: 'Bufumbo',
            latitude: 0, // INVALID 0,0 coordinates
            longitude: 0,
            plotArea: 1.5,
            areaUnit: 'Hectares',
            geometryType: 'Point',
            verificationStatus: 'Unverified'
          }
        ],
        events: [],
        documents: []
      });

      expect(evaluation.overallStatus).toBe('RED');
      expect(evaluation.blockersCount).toBeGreaterThan(0);
      expect(evaluation.blockerBreakdown.missingGeoFarms.length).toBeGreaterThan(0);
    });
  });
});
