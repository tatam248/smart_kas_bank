/**
 * Format number into Indonesian Rupiah (IDR)
 * e.g. 1500000 -> "Rp 1.500.000"
 */
export function formatIDR(amount: number, showDecimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(absAmount);

  // Intl in node/browser might output "IDR 1.500.000" or "Rp 1.500.000"
  const normalized = formatted.replace('IDR', 'Rp').trim();
  return isNegative ? `-${normalized}` : normalized;
}

/**
 * Format date string into Indonesian standard format
 */
export function formatDate(dateStr: string, includeTime: boolean = false): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const options: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
      options.hour12 = false;
    }

    return new Intl.DateTimeFormat('id-ID', options).format(date);
  } catch {
    return dateStr;
  }
}

/**
 * Format relative time (e.g. "5 menit yang lalu")
 */
export function formatRelativeTime(dateStr: string): string {
  if (!dateStr) return '-';
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffSec < 60) return 'Baru saja';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} menit yang lalu`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Kemarin';
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    return formatDate(dateStr, false);
  } catch {
    return dateStr;
  }
}

/**
 * Mask account number for security (e.g. "0123456789" -> "**** 6789")
 */
export function maskAccountNumber(acc: string): string {
  if (!acc) return '****';
  const clean = acc.replace(/[^0-9A-Za-z]/g, '');
  if (clean.length <= 4) return `**** ${clean}`;
  return `**** ${clean.slice(-4)}`;
}

/**
 * Parse Indonesian number strings e.g. "1.500.000,00" or "Rp 25.000" or "350,000.00"
 */
export function parseIndonesianCurrency(text: string): number {
  if (!text) return 0;
  // Remove currency prefix and whitespace
  let clean = text.replace(/^(Rp|IDR)\s*/i, '').trim();

  // If format is 1.500.000,00 (Indonesian: period for thousands, comma for decimals)
  if (clean.includes('.') && clean.includes(',')) {
    clean = clean.replace(/\./g, '').replace(',', '.');
  } else if (clean.includes('.') && !clean.includes(',')) {
    // Check if period is thousands separator (e.g. 1.500.000) or decimal (1500.50)
    const parts = clean.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      clean = clean.replace(/\./g, '');
    }
  } else if (clean.includes(',') && !clean.includes('.')) {
    // e.g. 1,500,000 or 1500,50
    const parts = clean.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      clean = clean.replace(/,/g, '');
    } else {
      clean = clean.replace(',', '.');
    }
  }

  // Remove any remaining non-digit except dot and minus
  clean = clean.replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Unique ID generator
 */
export function generateId(prefix: string = 'id'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
}
