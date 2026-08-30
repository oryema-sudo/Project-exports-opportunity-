import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';

const STORAGE_ROOT = path.join(process.cwd(), 'private_storage');

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

export function getOrgStorageDir(organizationId: string): string {
  // Strict sanitize orgId to prevent directory traversal
  const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
  const orgDir = path.join(STORAGE_ROOT, `org_${sanitizedOrgId}`);
  const resolvedDir = path.resolve(orgDir);
  
  // Security guard: Ensure resolved path is strictly within STORAGE_ROOT
  if (!resolvedDir.startsWith(path.resolve(STORAGE_ROOT))) {
    throw new Error('Invalid storage path boundary');
  }

  if (!fs.existsSync(resolvedDir)) {
    fs.mkdirSync(resolvedDir, { recursive: true });
  }
  return resolvedDir;
}

export function resolveSecureFilePath(relativePath: string, organizationId: string): string {
  const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
  const orgDir = path.resolve(STORAGE_ROOT, `org_${sanitizedOrgId}`);
  const fullPath = path.resolve(process.cwd(), relativePath);

  // Strict boundary check
  if (!fullPath.startsWith(orgDir)) {
    throw new Error('Access denied: File does not belong to authorized organization container');
  }

  return fullPath;
}

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/tiff',
  'text/csv',
  'application/json',
  'text/plain',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel'
]);

const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.dll', '.sh', '.bat', '.cmd', '.js', '.jsx', '.ts', '.tsx',
  '.html', '.htm', '.php', '.phtml', '.py', '.rb', '.pl', '.vbs', '.scr',
  '.jar', '.war', '.cgi', '.asp', '.aspx', '.jsp'
]);

/**
 * Verify Magic Bytes for known file formats to prevent MIME-spoofing
 */
export function verifyFileSignature(filePath: string, claimedMime: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const buffer = Buffer.alloc(8);
    const fd = fs.openSync(filePath, 'r');
    fs.readSync(fd, buffer, 0, 8, 0);
    fs.closeSync(fd);

    if (claimedMime === 'application/pdf') {
      // PDF header %PDF- (0x25 0x50 0x44 0x46 0x2D)
      return buffer.slice(0, 4).toString() === '%PDF';
    }

    if (claimedMime === 'image/png') {
      // PNG header (89 50 4E 47 0D 0A 1A 0A)
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
    }

    if (claimedMime === 'image/jpeg') {
      // JPEG header (FF D8 FF)
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }

    // Default pass for CSV/Plaintext/JSON/Docs after basic checks
    return true;
  } catch (err) {
    console.error('[Storage] Magic byte verification error:', err);
    return false;
  }
}

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, _file, cb) => {
      const orgId = req.user?.organizationId;
      if (!orgId) {
        return cb(new Error('User organization context required for file upload'), '');
      }
      try {
        const dir = getOrgStorageDir(orgId);
        cb(null, dir);
      } catch (e: any) {
        cb(e, '');
      }
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (DANGEROUS_EXTENSIONS.has(ext)) {
        return cb(new Error('Disallowed dangerous file extension'), '');
      }
      const safeBaseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 40);
      const uniqueName = `${Date.now()}_${uuidv4().slice(0, 8)}_${safeBaseName}${ext}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB maximum per file
    files: 1
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (DANGEROUS_EXTENSIONS.has(ext)) {
      return cb(new Error('Disallowed dangerous file extension'));
    }
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) && !file.mimetype.startsWith('image/')) {
      return cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
    cb(null, true);
  }
});
