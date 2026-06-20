// Utility functions

/**
 * Format a number with locale-specific separators
 */
export function formatNumber(num: number, decimals = 0): string {
  if (num === undefined || num === null) return '0';
  return num.toLocaleString('uk-UA', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format large numbers with suffixes (K, M, B, T)
 */
export function formatNumberCompact(num: number): string {
  if (num === undefined || num === null) return '0';
  
  const absNum = Math.abs(num);
  
  if (absNum >= 1_000_000_000_000) {
    return (num / 1_000_000_000_000).toFixed(1).replace(/\.0$/, '') + 'T';
  }
  if (absNum >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absNum >= 1_000_000) {
    return (num / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absNum >= 1_000) {
    return (num / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  
  return num.toString();
}

/**
 * Get today's date string in YYYY-MM-DD format (UTC)
 */
export function getTodayDateStr(): string {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/**
 * Get yesterday's date string
 */
export function getYesterdayDateStr(): string {
  const now = new Date();
  now.setUTCDate(now.getUTCDate() - 1);
  return now.toISOString().split('T')[0];
}

/**
 * Check if two dates are the same day (UTC)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Get days between two dates (UTC)
 */
export function getDaysBetween(date1: Date, date2: Date): number {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Format time duration in human-readable format
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.floor(seconds)}с`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}хв`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}год`;
  return `${Math.floor(seconds / 86400)}д`;
}

/**
 * Format time remaining until a timestamp
 */
export function formatTimeRemaining(endTimestamp: number): string {
  const now = Date.now();
  const diff = endTimestamp - now;
  
  if (diff <= 0) return '0:00';
  
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${(seconds % 60).toString().padStart(2, '0')}`;
}

/**
 * Clamp a number between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linear interpolation
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * clamp(t, 0, 1);
}

/**
 * Calculate percentage
 */
export function percentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: Parameters<T>) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: Parameters<T>) => void>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Generate a random ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Check if we're in Telegram WebApp environment
 */
export function isTelegramWebApp(): boolean {
  return typeof window !== 'undefined' && !!window.Telegram?.WebApp;
}

/**
 * Get platform info
 */
export function getPlatform(): 'ios' | 'android' | 'web' | 'desktop' {
  if (!isTelegramWebApp()) return 'web';
  
  const tg = window.Telegram.WebApp;
  switch (tg.platform) {
    case 'ios':
      return 'ios';
    case 'android':
      return 'android';
    case 'tdesktop':
      return 'desktop';
    default:
      return 'web';
  }
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
  return safeJsonParse(JSON.stringify(obj), obj);
}
