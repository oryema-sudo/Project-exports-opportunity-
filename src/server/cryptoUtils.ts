import crypto from 'crypto';

/**
 * Generate cryptographically secure random integers between min (inclusive) and max (exclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  return crypto.randomInt(min, max);
}

/**
 * Generate a cryptographically random hex token
 */
export function generateSecureToken(bytes: number = 24): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * SHA-256 hash a sensitive token before persistence
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate secure Farmer Business ID (e.g. UG-F-84920)
 */
export function generateFarmerId(district?: string): string {
  const code = secureRandomInt(10000, 99999);
  if (district) {
    const dCode = district.trim().slice(0, 3).toUpperCase();
    return `UG-F-${dCode}-${code}`;
  }
  return `UG-F-${code}`;
}

/**
 * Generate secure Plot Business ID (e.g. UG-PL-4921)
 */
export function generatePlotId(district?: string): string {
  const code = secureRandomInt(1000, 9999);
  if (district) {
    const dCode = district.trim().slice(0, 3).toUpperCase();
    return `UG-PL-${dCode}-${code}`;
  }
  return `UG-PL-${code}`;
}

/**
 * Generate secure Intake Delivery Reference (e.g. DEL-2026-8402)
 */
export function generateDeliveryRef(): string {
  const year = new Date().getFullYear();
  const code = secureRandomInt(1000, 9999);
  return `DEL-${year}-${code}`;
}

/**
 * Generate secure Lot Batch Number (e.g. LOT-UG-RB-2026-0491)
 */
export function generateLotNumber(coffeeType: 'Robusta' | 'Arabica' | string = 'Robusta'): string {
  const year = new Date().getFullYear();
  const typeCode = coffeeType.toLowerCase().includes('arabica') ? 'AR' : 'RB';
  const code = secureRandomInt(1000, 9999);
  return `LOT-UG-${typeCode}-${year}-${code}`;
}

/**
 * Generate secure Export Consignment Reference (e.g. SH-UG-2026-084)
 */
export function generateExportRef(): string {
  const year = new Date().getFullYear();
  const code = secureRandomInt(100, 999);
  return `SH-UG-${year}-${code}`;
}

/**
 * Sanitize strings for CSV export to prevent Formula Injection Attacks (CVE-2014-3524 / CSV Injection)
 * Prefixes cells starting with '=', '+', '-', '@', '\t', '\r' with a single apostrophe.
 */
export function sanitizeForCsv(val: any): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (/^[=+\-@\t\r]/.test(str)) {
    return `'${str}`;
  }
  return str;
}
