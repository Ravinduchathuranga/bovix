import { formatDateToISO, formatDateFriendly } from '../../utils/dateUtils';

describe('AppDatePicker Helper Functions', () => {
  describe('formatDateToISO', () => {
    it('should format Date object into YYYY-MM-DD string with zero padding', () => {
      const sampleDate = new Date(2026, 7, 1); // Aug 1, 2026
      expect(formatDateToISO(sampleDate)).toBe('2026-08-01');
    });

    it('should format single digit months and days properly', () => {
      const sampleDate = new Date(2026, 0, 5); // Jan 5, 2026
      expect(formatDateToISO(sampleDate)).toBe('2026-01-05');
    });
  });

  describe('formatDateFriendly', () => {
    it('should return empty string if input is falsy', () => {
      expect(formatDateFriendly('')).toBe('');
    });

    it('should format today date as Today (Month Day)', () => {
      const todayISO = formatDateToISO(new Date());
      const formatted = formatDateFriendly(todayISO);
      expect(formatted).toContain('Today');
    });

    it('should format yesterday date as Yesterday (Month Day)', () => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      const yesterdayISO = formatDateToISO(d);
      const formatted = formatDateFriendly(yesterdayISO);
      expect(formatted).toContain('Yesterday');
    });

    it('should format past dates into human-readable string', () => {
      const pastISO = '2025-12-25';
      const formatted = formatDateFriendly(pastISO);
      expect(formatted).toContain('Dec 25, 2025');
    });
  });
});
