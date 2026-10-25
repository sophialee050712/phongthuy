// Vitest cho thước Lỗ Ban 52,2 cm — chạy bằng `npm test`.
import { describe, it, expect } from 'vitest';
import {
  LOBAN_CYCLE_MM,
  LOBAN_MAJORS,
  LOBAN_MAJOR_MM,
  lookupLoBan,
  nearestAuspicious,
  parseLoBanInput,
} from './loban';

describe('Thước Lỗ Ban: cấu trúc đã đối chiếu', () => {
  it('8 cung lớn, 4 tốt 4 xấu, đúng thứ tự đã đối chiếu', () => {
    expect(LOBAN_MAJORS.map((m) => m.name)).toEqual([
      'Quý Nhân',
      'Hiểm Họa',
      'Thiên Tai',
      'Thiên Tài',
      'Nhân Lộc',
      'Cô Độc',
      'Thiên Tặc',
      'Tể Tướng',
    ]);
    expect(LOBAN_MAJORS.filter((m) => m.tot).map((m) => m.name)).toEqual([
      'Quý Nhân',
      'Thiên Tài',
      'Nhân Lộc',
      'Tể Tướng',
    ]);
    expect(LOBAN_MAJORS.filter((m) => !m.tot)).toHaveLength(4);
  });

  it('mỗi cung lớn có đúng 5 tiểu cung, chu kỳ khép đúng 522 mm', () => {
    for (const m of LOBAN_MAJORS) expect(m.minors).toHaveLength(5);
    expect(LOBAN_MAJOR_MM * 8).toBe(LOBAN_CYCLE_MM);
  });

  it('chỉ tiểu cung Thiên Tai là chưa xác minh', () => {
    for (const m of LOBAN_MAJORS) {
      if (m.name === 'Thiên Tai') {
        expect(m.minors.every((s) => !s.verified)).toBe(true);
      } else {
        expect(m.minors.every((s) => s.verified)).toBe(true);
      }
    }
  });
});

describe('Tra cung tại ranh giới', () => {
  it('đầu chu kỳ là Quý Nhân / Quyền Lộc', () => {
    const r = lookupLoBan(1);
    expect(r.major.name).toBe('Quý Nhân');
    expect(r.minor.name).toBe('Quyền Lộc');
    expect(r.major.tot).toBe(true);
  });

  it('điểm đúng ranh giới thuộc về cung bắt đầu tại đó', () => {
    // 65,25 mm = cuối Quý Nhân / đầu Hiểm Họa -> Hiểm Họa.
    expect(lookupLoBan(65.25).major.name).toBe('Hiểm Họa');
    expect(lookupLoBan(65.24).major.name).toBe('Quý Nhân');
    // 195,75 mm = đầu Thiên Tài (tốt).
    expect(lookupLoBan(195.75).major.name).toBe('Thiên Tài');
    // 456,75 mm = đầu Tể Tướng; 521,99 mm vẫn là Tể Tướng.
    expect(lookupLoBan(456.75).major.name).toBe('Tể Tướng');
    expect(lookupLoBan(521.99).major.name).toBe('Tể Tướng');
  });

  it('tiểu cung: cuối Quý Nhân là Thông Minh, đầu Hiểm Họa là Án Thành', () => {
    expect(lookupLoBan(65.24).minor.name).toBe('Thông Minh');
    expect(lookupLoBan(65.25).minor.name).toBe('Án Thành');
    // Tiểu cung Thiên Tai luôn gắn cờ chưa xác minh.
    expect(lookupLoBan(140).major.name).toBe('Thiên Tai');
    expect(lookupLoBan(140).minor.verified).toBe(false);
  });

  it('số đo không dương thì báo lỗi thay vì trả cung sai', () => {
    expect(() => lookupLoBan(0)).toThrow();
    expect(() => lookupLoBan(-10)).toThrow();
    expect(() => lookupLoBan(Number.NaN)).toThrow();
  });
});

describe('Quấn chu kỳ (modulo 522 mm)', () => {
  it('522 mm đúng một chu kỳ -> lại về Quý Nhân', () => {
    expect(lookupLoBan(522).major.name).toBe('Quý Nhân');
    expect(lookupLoBan(522).remainderMm).toBe(0);
  });

  it('số đo lớn hơn 522 mm chỉ lấy phần dư', () => {
    // 810 mm = 522 + 288 -> phần dư 288 mm, trong Nhân Lộc (261–326,25).
    const r = lookupLoBan(810);
    expect(r.remainderMm).toBeCloseTo(288, 9);
    expect(r.major.name).toBe('Nhân Lộc');
    // 2100 mm = 4×522 + 12 -> Quý Nhân, cùng cung với 12 mm.
    expect(lookupLoBan(2100).major.name).toBe(lookupLoBan(12).major.name);
    expect(lookupLoBan(2100).minor.name).toBe(lookupLoBan(12).minor.name);
  });
});

describe('Cung tốt gần nhất (thêm/bớt)', () => {
  it('số đo xấu: bớt về cuối cung tốt dưới, thêm tới đầu cung tốt trên', () => {
    // 100 mm trong Hiểm Họa (65,25–130,5): bớt 34,75 mm về cuối Quý Nhân,
    // thêm 95,75 mm tới đầu Thiên Tài (195,75).
    const n = nearestAuspicious(100);
    expect(n.below.majorName).toBe('Quý Nhân');
    expect(n.below.deltaMm).toBeCloseTo(34.75, 9);
    expect(n.below.targetMm).toBeCloseTo(65.25, 9);
    expect(n.above.majorName).toBe('Thiên Tài');
    expect(n.above.deltaMm).toBeCloseTo(95.75, 9);
    expect(n.above.targetMm).toBeCloseTo(195.75, 9);
  });

  it('số đo xấu gần cuối chu kỳ: thêm tới Tể Tướng', () => {
    // 400 mm trong Thiên Tặc (391,5–456,75): bớt 73,75 mm về cuối
    // Nhân Lộc (326,25), thêm 56,75 mm tới đầu Tể Tướng (456,75).
    const n = nearestAuspicious(400);
    expect(n.below.majorName).toBe('Nhân Lộc');
    expect(n.below.deltaMm).toBeCloseTo(73.75, 9);
    expect(n.above.majorName).toBe('Tể Tướng');
    expect(n.above.deltaMm).toBeCloseTo(56.75, 9);
  });

  it('số đo trong Tể Tướng: thêm tới Quý Nhân của chu kỳ sau', () => {
    const n = nearestAuspicious(500);
    expect(n.below.alreadyGood).toBe(true);
    expect(n.below.deltaMm).toBe(0);
    expect(n.above.majorName).toBe('Quý Nhân');
    expect(n.above.deltaMm).toBeCloseTo(22, 9);
    expect(n.above.targetMm).toBeCloseTo(522, 9);
  });

  it('số đo đã tốt: phía dưới không cần bớt, phía trên là cung tốt kế tiếp', () => {
    const n = nearestAuspicious(200); // Thiên Tài
    expect(n.below.alreadyGood).toBe(true);
    expect(n.above.majorName).toBe('Nhân Lộc');
    expect(n.above.deltaMm).toBeCloseTo(61, 9);
  });

  it('số đo lớn vẫn tính thêm/bớt trên số đo tuyệt đối', () => {
    // 622 mm = 522 + 100 (Hiểm Họa): đích tuyệt đối là 587,25 và 717,75.
    const n = nearestAuspicious(622);
    expect(n.below.targetMm).toBeCloseTo(587.25, 9);
    expect(n.above.targetMm).toBeCloseTo(717.75, 9);
  });
});

describe('Kiểm tra dữ liệu nhập', () => {
  it('chấp nhận cm và mm, dấu phẩy thập phân kiểu Việt Nam', () => {
    expect(parseLoBanInput('81,5', 'cm')).toEqual({ mm: 815 });
    expect(parseLoBanInput('815', 'mm')).toEqual({ mm: 815 });
  });

  it('báo lỗi rõ ràng cho nhập sai', () => {
    expect(parseLoBanInput('', 'cm')).toHaveProperty('error');
    expect(parseLoBanInput('abc', 'cm')).toHaveProperty('error');
    expect(parseLoBanInput('0', 'cm')).toHaveProperty('error');
    expect(parseLoBanInput('-5', 'cm')).toHaveProperty('error');
    expect(parseLoBanInput('10001', 'cm')).toHaveProperty('error');
  });
});
