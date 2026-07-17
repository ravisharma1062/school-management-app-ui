import { describe, expect, it } from 'vitest';
import {
  ATTENDANCE_STATUSES,
  DAYS_OF_WEEK,
  FEE_STATUSES,
  LEAVE_TYPES,
  ROLES,
  TARGET_ROLES,
  formatDate,
  formatDateTime,
  formatMoney,
  todayIso,
} from './format';

describe('formatDate', () => {
  it('returns an em dash for null/undefined/empty', () => {
    expect(formatDate(null)).toBe('—');
    expect(formatDate(undefined)).toBe('—');
    expect(formatDate('')).toBe('—');
  });

  it('formats a date-only ISO string as a local date (no timezone shift)', () => {
    // A date-only string must be interpreted as local midnight, so the rendered
    // day is the same regardless of the machine's timezone.
    expect(formatDate('2026-03-05')).toBe(
      new Date(2026, 2, 5).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    );
  });

  it('formats a full ISO date-time string', () => {
    const iso = '2026-03-05T10:30:00Z';
    expect(formatDate(iso)).toBe(
      new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    );
  });

  it('returns the raw input when unparseable', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date');
  });
});

describe('formatDateTime', () => {
  it('returns an em dash for null/undefined', () => {
    expect(formatDateTime(null)).toBe('—');
    expect(formatDateTime(undefined)).toBe('—');
  });

  it('formats a valid ISO date-time', () => {
    const iso = '2026-03-05T10:30:00Z';
    expect(formatDateTime(iso)).toBe(
      new Date(iso).toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    );
  });

  it('returns the raw input when unparseable', () => {
    expect(formatDateTime('garbage')).toBe('garbage');
  });
});

describe('formatMoney', () => {
  it('returns an em dash for null/undefined', () => {
    expect(formatMoney(null)).toBe('—');
    expect(formatMoney(undefined)).toBe('—');
  });

  it('always renders two decimal places', () => {
    expect(formatMoney(0)).toBe((0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    expect(formatMoney(1234.5)).toBe(
      (1234.5).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    );
    // sanity: ends with exactly two fraction digits
    expect(formatMoney(1234.5)).toMatch(/\.50$/);
    expect(formatMoney(99.999)).toMatch(/\.00$/); // rounded to 100.00
  });
});

describe('todayIso', () => {
  it('returns a yyyy-MM-dd string for today (UTC)', () => {
    expect(todayIso()).toBe(new Date().toISOString().slice(0, 10));
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('domain constant lists', () => {
  it('exposes the expected enumerations', () => {
    expect(ROLES).toEqual(['ADMIN', 'TEACHER', 'PARENT']);
    expect(TARGET_ROLES).toEqual(['ALL', 'ADMIN', 'TEACHER', 'PARENT']);
    expect(ATTENDANCE_STATUSES).toEqual(['PRESENT', 'ABSENT', 'LATE', 'EXCUSED']);
    expect(FEE_STATUSES).toEqual(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE']);
    expect(LEAVE_TYPES).toEqual(['SICK', 'CASUAL', 'OTHER']);
    expect(DAYS_OF_WEEK).toHaveLength(7);
    expect(DAYS_OF_WEEK[0]).toBe('MONDAY');
    expect(DAYS_OF_WEEK[6]).toBe('SUNDAY');
  });
});
