import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_ROOT = path.join(process.cwd(), 'private_storage');

if (!fs.existsSync(STORAGE_ROOT)) {
  fs.mkdirSync(STORAGE_ROOT, { recursive: true });
}

export function getOrgStorageDir(organizationId: string): string {
  // Sanitize orgId to prevent directory traversal
  const sanitizedOrgId = organizationId.replace(/[^a-zA-Z0-9_-]/g, '');
  const orgDir = path.join(STORAGE_ROOT, `org_${sanitizedOrgId}`);
  if (!fs.existsSync(orgDir)) {
    fs.mkdirSync(orgDir, { recursive: true });
  }
  return orgDir;
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
  '.html', '.htm', '.php', '.phtml', '.py', '.rb', '.pl', '.vbs', '.scr'
]);

export const upload = multer({
  storage: multer.diskStorage({
    destination: (req: any, _file, cb) => {
      const orgId = req.user?.organizationId || 'default';
      const dir = getOrgStorageDir(orgId);
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      if (DANGEROUS_EXTENSIONS.has(ext)) {
        return cb(new Error('Disallowed dangerous file extension'), '');
      }
      const safeBaseName = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 50);
      const uniqueName = `${uuidv4()}_${safeBaseName}${ext}`;
      cb(null, uniqueName);
    }
  }),
  limits: {
    fileSize: 15 * 1024 * 1024, // 15MB max
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
