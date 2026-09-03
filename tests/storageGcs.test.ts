import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  GoogleCloudStorageProvider, 
  LocalStorageProvider, 
  S3ObjectStorageProvider, 
  createStorageProvider,
  getOrgStorageDir,
  resolveSecureFilePath,
  DANGEROUS_EXTENSIONS,
  ALLOWED_MIME_TYPES
} from '../src/server/storage.ts';
import fs from 'fs';
import path from 'path';

describe('Production Google Cloud Storage (GCS) & Storage Provider Security Suite', () => {

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('1. Storage Provider Factory & Selection', () => {
    it('Instantiates GoogleCloudStorageProvider when STORAGE_PROVIDER=gcs', () => {
      const provider = createStorageProvider('gcs');
      expect(provider).toBeInstanceOf(GoogleCloudStorageProvider);
      expect(provider.name).toBe('google_cloud_storage');
    });

    it('Instantiates LocalStorageProvider when STORAGE_PROVIDER=local or default', () => {
      const providerLocal = createStorageProvider('local');
      expect(providerLocal).toBeInstanceOf(LocalStorageProvider);
      expect(providerLocal.name).toBe('local_filesystem_sandbox');

      const providerDefault = createStorageProvider('');
      expect(providerDefault).toBeInstanceOf(LocalStorageProvider);
    });

    it('Instantiates S3ObjectStorageProvider when STORAGE_PROVIDER=s3', () => {
      const provider = createStorageProvider('s3');
      expect(provider).toBeInstanceOf(S3ObjectStorageProvider);
      expect(provider.name).toBe('s3_compatible_object_storage');
    });
  });

  describe('2. GCS Tenant Boundary Enforcement & Path Sanitization', () => {
    // Construct provider with mock Storage and Bucket
    const mockFile = {
      createReadStream: vi.fn().mockReturnValue('mock-stream'),
      delete: vi.fn().mockResolvedValue([{}]),
      exists: vi.fn().mockResolvedValue([true])
    };
    const mockBucket = {
      file: vi.fn().mockReturnValue(mockFile),
      upload: vi.fn().mockResolvedValue([{}]),
      exists: vi.fn().mockResolvedValue([true])
    };
    const mockStorage = {
      bucket: vi.fn().mockReturnValue(mockBucket)
    } as any;

    const gcs = new GoogleCloudStorageProvider({
      bucketName: 'test-evidence-bucket',
      storage: mockStorage
    });

    it('Constructs isolated GCS object keys prefixed by organization', () => {
      const key = gcs.resolveAndValidateKey('sample_phytosanitary.pdf', 'org-uganda-coffee-1');
      expect(key).toBe('organizations/org_org-uganda-coffee-1/documents/sample_phytosanitary.pdf');
    });

    it('Accepts existing valid organization-prefixed keys for the same tenant', () => {
      const inputKey = 'organizations/org_tenant_abc/documents/batch_analysis.pdf';
      const key = gcs.resolveAndValidateKey(inputKey, 'tenant_abc');
      expect(key).toBe(inputKey);
    });

    it('Normalizes legacy private_storage paths for the authorized tenant', () => {
      const inputKey = 'private_storage/org_tenant_abc/sample.pdf';
      const key = gcs.resolveAndValidateKey(inputKey, 'tenant_abc');
      expect(key).toBe('organizations/org_tenant_abc/sample.pdf');
    });

    it('STRICTLY BLOCKS cross-tenant access attempts', () => {
      const maliciousKey = 'organizations/org_victim_enterprise/documents/confidential_contract.pdf';
      const attackerOrg = 'attacker_coop';

      expect(() => {
        gcs.resolveAndValidateKey(maliciousKey, attackerOrg);
      }).toThrow(/Access denied: File does not belong to authorized organization container/i);
    });

    it('STRICTLY BLOCKS cross-tenant access via legacy private_storage paths', () => {
      const maliciousPath = 'private_storage/org_victim_enterprise/secret.pdf';
      const attackerOrg = 'attacker_coop';

      expect(() => {
        gcs.resolveAndValidateKey(maliciousPath, attackerOrg);
      }).toThrow(/Access denied: File does not belong to authorized organization container/i);
    });

    it('Rejects directory traversal sequences (..)', () => {
      expect(() => {
        gcs.resolveAndValidateKey('../../etc/passwd', 'legit_org');
      }).toThrow(/Access denied: Invalid storage path boundary/i);

      expect(() => {
        gcs.resolveAndValidateKey('org_legit_org/../../../shadow', 'legit_org');
      }).toThrow(/Access denied: Invalid storage path boundary/i);
    });

    it('Rejects null bytes in object paths', () => {
      expect(() => {
        gcs.resolveAndValidateKey('org_legit_org/file\0.pdf', 'legit_org');
      }).toThrow(/Access denied: Invalid storage path boundary/i);
    });
  });

  describe('3. GCS Object Upload, Streaming & Deletion Operations', () => {
    it('Uploads file to GCS with correct metadata and unlinks staging file', async () => {
      const tempPath = path.join(process.cwd(), 'private_storage', '.test_upload_staging.tmp');
      fs.writeFileSync(tempPath, 'dummy file content');

      const mockUpload = vi.fn().mockResolvedValue([{}]);
      const mockBucket = {
        upload: mockUpload,
        file: vi.fn(),
        exists: vi.fn().mockResolvedValue([true])
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-prod',
        storage: mockStorage
      });

      const fakeFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'Export_Inspection_MAAIF.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 1024 * 100, // 100 KB
        destination: path.dirname(tempPath),
        filename: path.basename(tempPath),
        path: tempPath,
        buffer: Buffer.from('')
      } as any;

      const result = await gcs.save(fakeFile, 'kampala_coop');

      expect(mockUpload).toHaveBeenCalledWith(
        tempPath,
        expect.objectContaining({
          destination: 'organizations/org_kampala_coop/documents/.test_upload_staging.tmp',
          resumable: false,
          validation: 'crc32c',
          metadata: expect.objectContaining({
            contentType: 'application/pdf',
            metadata: expect.objectContaining({
              organizationId: 'kampala_coop',
              originalName: 'Export_Inspection_MAAIF.pdf'
            })
          })
        })
      );

      expect(result.storageKey).toContain('organizations/org_kampala_coop/documents/');
      expect(result.fileSizeFormatted).toBe('100.0 KB');
      // Verify temp staging file was securely unlinked
      expect(fs.existsSync(tempPath)).toBe(false);
    });

    it('Cleans up staging file and throws descriptive error if GCS upload fails', async () => {
      const tempPath = path.join(process.cwd(), 'private_storage', '.test_upload_fail.tmp');
      fs.writeFileSync(tempPath, 'dummy file content');

      const mockUpload = vi.fn().mockRejectedValue(new Error('GCS network socket closed'));
      const mockBucket = {
        upload: mockUpload,
        file: vi.fn(),
        exists: vi.fn().mockResolvedValue([true])
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-prod',
        storage: mockStorage
      });

      const fakeFile: Express.Multer.File = {
        fieldname: 'file',
        originalname: 'fail.pdf',
        encoding: '7bit',
        mimetype: 'application/pdf',
        size: 512,
        destination: path.dirname(tempPath),
        filename: path.basename(tempPath),
        path: tempPath,
        buffer: Buffer.from('')
      } as any;

      await expect(gcs.save(fakeFile, 'org_test')).rejects.toThrow(/Failed to upload document to Google Cloud Storage/i);
      // Temp file must be removed even on failure
      expect(fs.existsSync(tempPath)).toBe(false);
    });

    it('getStream requests read stream from GCS file', () => {
      const mockCreateReadStream = vi.fn().mockReturnValue('readable-stream-stub');
      const mockFile = {
        createReadStream: mockCreateReadStream
      };
      const mockBucket = {
        file: vi.fn().mockReturnValue(mockFile)
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-prod',
        storage: mockStorage
      });

      const stream = gcs.getStream('organizations/org_rwenzori/documents/cert.pdf', 'rwenzori');
      expect(mockBucket.file).toHaveBeenCalledWith('organizations/org_rwenzori/documents/cert.pdf');
      expect(mockCreateReadStream).toHaveBeenCalled();
      expect(stream).toBe('readable-stream-stub');
    });

    it('delete removes object from GCS bucket', async () => {
      const mockDelete = vi.fn().mockResolvedValue([{}]);
      const mockFile = {
        delete: mockDelete
      };
      const mockBucket = {
        file: vi.fn().mockReturnValue(mockFile)
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-prod',
        storage: mockStorage
      });

      await gcs.delete('organizations/org_rwenzori/documents/old_doc.pdf', 'rwenzori');
      expect(mockBucket.file).toHaveBeenCalledWith('organizations/org_rwenzori/documents/old_doc.pdf');
      expect(mockDelete).toHaveBeenCalledWith({ ignoreNotFound: true });
    });
  });

  describe('4. Real GCS Readiness Health Probe (/api/ready)', () => {
    it('Returns ready=true when GCS bucket exists and is accessible', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([true])
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-evidence-prod',
        storage: mockStorage
      });

      const health = await gcs.checkHealth();
      expect(health.ready).toBe(true);
      expect(health.provider).toBe('google_cloud_storage');
      expect(health.message).toContain('astrokahawa-evidence-prod');
    });

    it('Returns ready=false when GCS bucket does not exist', async () => {
      const mockBucket = {
        exists: vi.fn().mockResolvedValue([false])
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'nonexistent-bucket',
        storage: mockStorage
      });

      const health = await gcs.checkHealth();
      expect(health.ready).toBe(false);
      expect(health.provider).toBe('google_cloud_storage');
      expect(health.message).toContain('does not exist or access is forbidden');
    });

    it('Returns ready=false when GCS check throws authentication or network error', async () => {
      const mockBucket = {
        exists: vi.fn().mockRejectedValue(new Error('Could not load the default credentials'))
      };
      const mockStorage = {
        bucket: vi.fn().mockReturnValue(mockBucket)
      } as any;

      const gcs = new GoogleCloudStorageProvider({
        bucketName: 'astrokahawa-prod',
        storage: mockStorage
      });

      const health = await gcs.checkHealth();
      expect(health.ready).toBe(false);
      expect(health.provider).toBe('google_cloud_storage');
      expect(health.message).toContain('Could not load the default credentials');
    });
  });
});
