// Shared locale/timezone helpers for consistent PH formatting
export const PH_LOCALE = 'en-PH';
export const PH_TIME_ZONE = 'Asia/Manila';

// Parses API date values. If a string has no timezone, treat it as UTC to avoid client-local drift.
export const parseApiDate = (value: Date | string | number): Date => {
  if (value instanceof Date) return value;

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const hasTimeZone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
    return new Date(hasTimeZone ? trimmed : `${trimmed}Z`);
  }

  return new Date(value);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(PH_LOCALE, {
    style: 'currency',
    currency: 'PHP',
  }).format(amount);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: PH_TIME_ZONE,
  }).format(parseApiDate(date));
};

export const formatDateTime = (date: Date | string): string => {
  return new Intl.DateTimeFormat(PH_LOCALE, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: PH_TIME_ZONE,
  }).format(parseApiDate(date));
};
