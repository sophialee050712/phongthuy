// Unit test cho điểm vận rút gọn dùng chung (ngày + tuần).
import { describe, it, expect } from 'vitest';
import { diemVanHan, mucVanHan } from './van-han';

describe('diemVanHan: khớp công thức gốc VanHanForm', () => {
  it('nền 55 + (ngày % 10) − 4, sinh +20, khắc −20, cùng hành +5', () => {
    expect(diemVanHan(1, 'binh', false)).toBe(52);
    expect(diemVanHan(5, 'sinh', false)).toBe(76);
    expect(diemVanHan(9, 'khac', false)).toBe(40);
    expect(diemVanHan(10, 'binh', true)).toBe(56);
    // Sinh/khắc ưu tiên trước cùng hành (vốn không xảy ra cùng lúc, nhưng giữ thứ tự gốc).
    expect(diemVanHan(3, 'sinh', true)).toBe(74);
  });

  it('kẹp trong 20–95', () => {
    for (let d = 1; d <= 31; d += 1) {
      for (const q of ['sinh', 'khac', 'binh'] as const) {
        const v = diemVanHan(d, q, false);
        expect(v).toBeGreaterThanOrEqual(20);
        expect(v).toBeLessThanOrEqual(95);
      }
    }
  });
});

describe('mucVanHan: ngưỡng 75/50', () => {
  it('>= 75 tốt, >= 50 bình ổn, còn lại trầm', () => {
    expect(mucVanHan(95)).toBe('Vận tốt');
    expect(mucVanHan(75)).toBe('Vận tốt');
    expect(mucVanHan(74)).toBe('Vận bình ổn');
    expect(mucVanHan(50)).toBe('Vận bình ổn');
    expect(mucVanHan(49)).toBe('Vận trầm — nên chậm lại');
    expect(mucVanHan(20)).toBe('Vận trầm — nên chậm lại');
  });
});
