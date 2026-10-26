// Unit test cho lịch tháng (ý 3): độ dài tháng, mức ngày khớp ViecFlow, cờ xung.
import { describe, it, expect } from 'vitest';
import { ngayThang, mucNgay, chiCuaNgay } from './lich-thang';

describe('mucNgay: ngưỡng khớp ViecFlow', () => {
  it('diem >= 2 là tương đối tốt, diem <= -1 là chưa thuận, còn lại bình thường', () => {
    expect(mucNgay(5)).toBe('Ngày tương đối tốt');
    expect(mucNgay(2)).toBe('Ngày tương đối tốt');
    expect(mucNgay(1)).toBe('Ngày bình thường');
    expect(mucNgay(0)).toBe('Ngày bình thường');
    expect(mucNgay(-1)).toBe('Ngày chưa thuận');
    expect(mucNgay(-4)).toBe('Ngày chưa thuận');
  });
});

describe('chiCuaNgay', () => {
  it('lấy từ cuối của chuỗi can chi', () => {
    expect(chiCuaNgay('Giáp Dần')).toBe('Dần');
    expect(chiCuaNgay('Quý Hợi')).toBe('Hợi');
    expect(chiCuaNgay('')).toBe('');
  });
});

describe('ngayThang', () => {
  it('tháng 2 năm nhuận 2028 có 29 ngày, 2027 có 28 ngày; tháng 4 có 30, tháng 1 có 31', () => {
    expect(ngayThang(2028, 2, null)).toHaveLength(29);
    expect(ngayThang(2027, 2, null)).toHaveLength(28);
    expect(ngayThang(2026, 4, null)).toHaveLength(30);
    expect(ngayThang(2026, 1, null)).toHaveLength(31);
  });

  it('ngày dương liên tục 1..N đúng tháng, diem = tốt − xấu, mức khớp ngưỡng mọi ngày', () => {
    const days = ngayThang(2026, 11, null);
    days.forEach((d, i) => {
      expect(d.duong).toEqual({ y: 2026, m: 11, d: i + 1 });
      expect(d.diem).toBe(d.saoTot.length - d.saoXau.length);
      expect(d.muc).toBe(mucNgay(d.diem));
      expect(d.xung).toBe(false);
    });
  });

  it('cờ xung chỉ bật đúng ngày có chi trùng xungChi', () => {
    const days = ngayThang(2026, 11, 'Ngọ');
    const xungDays = days.filter((d) => d.xung);
    expect(xungDays.length).toBeGreaterThan(0);
    expect(xungDays.every((d) => d.chiNgay === 'Ngọ')).toBe(true);
    expect(days.filter((d) => d.chiNgay === 'Ngọ').every((d) => d.xung)).toBe(true);
  });
});
