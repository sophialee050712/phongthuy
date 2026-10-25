import { describe, expect, it } from 'vitest';
import { isValidVnMobile, normalizeVnPhone } from './LeadForm';

describe('isValidVnMobile', () => {
  it('chấp nhận SĐT di động 10 số đúng đầu số', () => {
    expect(isValidVnMobile('0901234567')).toBe(true);
    expect(isValidVnMobile('0351234567')).toBe(true);
    expect(isValidVnMobile('0781234567')).toBe(true);
  });
  it('chấp nhận dạng +84 và khoảng trắng', () => {
    expect(isValidVnMobile('+84901234567')).toBe(true);
    expect(isValidVnMobile('090 123 4567')).toBe(true);
  });
  it('từ chối số ngắn, sai đầu số, số bàn', () => {
    expect(isValidVnMobile('12345')).toBe(false);
    expect(isValidVnMobile('0123456789')).toBe(false);
    expect(isValidVnMobile('0241234567')).toBe(false);
    expect(isValidVnMobile('090123456')).toBe(false);
    expect(isValidVnMobile('')).toBe(false);
  });
  it('normalizeVnPhone đổi +84 thành 0', () => {
    expect(normalizeVnPhone('+84901234567')).toBe('0901234567');
  });
});
