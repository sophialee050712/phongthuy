// Unit test cho bộ tối ưu bố trí phòng /bo-tri-3d.
import { describe, it, expect } from 'vitest';
import { batTrach } from './engine';
import {
  optimizeLayout,
  doorZone,
  doorPosition,
  scoreRoom,
  ZONE_GRID,
} from './boTri3d';

const KHAM = batTrach('Khảm');
// Khảm: tốt = Đông Nam, Đông, Nam, Bắc; xấu = Tây Nam, Đông Bắc, Tây Bắc, Tây.
const GOOD_KHAM = new Set(['Đông Nam', 'Đông', 'Nam', 'Bắc']);

describe('doorZone: cửa rơi đúng ô 3×3 theo tường và khoảng cách', () => {
  it('mặt trước (Nam) chia theo chiều dài, mặt trái (Tây) chia theo chiều rộng', () => {
    expect(doorZone('truoc', 1, 12, 9)).toBe('Tây Nam');
    expect(doorZone('truoc', 6, 12, 9)).toBe('Nam');
    expect(doorZone('truoc', 11, 12, 9)).toBe('Đông Nam');
    expect(doorZone('sau', 6, 12, 9)).toBe('Bắc');
    expect(doorZone('trai', 1, 12, 9)).toBe('Tây Bắc');
    expect(doorZone('trai', 4, 12, 9)).toBe('Tây');
    expect(doorZone('phai', 8, 12, 9)).toBe('Đông Nam');
  });
  it('vượt mép thì kẹp vào ô biên cuối, không văng ra ngoài', () => {
    expect(doorZone('truoc', 99, 12, 9)).toBe('Đông Nam');
    expect(doorZone('trai', -5, 12, 9)).toBe('Tây Bắc');
  });
  it('tọa độ cửa nằm đúng trên tường đã chọn', () => {
    expect(doorPosition('truoc', 3, 12, 9)).toEqual({ x: 3, y: 9 });
    expect(doorPosition('sau', 3, 12, 9)).toEqual({ x: 3, y: 0 });
    expect(doorPosition('trai', 3, 12, 9)).toEqual({ x: 0, y: 3 });
  });
});

describe('scoreRoom: quy tắc chấm điểm', () => {
  it('phòng tốt ở cung tốt +10, ở cung xấu -10; phòng xấu ngược lại', () => {
    expect(scoreRoom('Phòng khách', true)).toBe(10);
    expect(scoreRoom('Bếp', false)).toBe(-10);
    expect(scoreRoom('Nhà vệ sinh', false)).toBe(10);
    expect(scoreRoom('Kho', true)).toBe(-10);
  });
  it('phòng trung tính chỉ ±3', () => {
    expect(scoreRoom('Phòng ăn', true)).toBe(3);
    expect(scoreRoom('Phòng làm việc', false)).toBe(-3);
  });
});

describe('optimizeLayout: phương án tốt nhất theo quy tắc', () => {
  const rooms = [
    { name: 'Phòng khách' },
    { name: 'Bếp' },
    { name: 'Phòng ngủ' },
    { name: 'Phòng thờ' },
    { name: 'Nhà vệ sinh' },
    { name: 'Kho' },
  ];
  it('cung Khảm: phòng tốt vào cung tốt, phòng xấu vào cung xấu, không trùng hướng', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms,
      doorWall: 'truoc',
      doorDistance: 6,
      length: 12,
      width: 9,
    });
    expect(out.assignments).toHaveLength(6);
    expect(new Set(out.assignments.map((a) => a.direction)).size).toBe(6);
    for (const a of out.assignments) {
      if (['Phòng khách', 'Bếp', 'Phòng ngủ', 'Phòng thờ'].includes(a.room)) {
        expect(GOOD_KHAM.has(a.direction)).toBe(true);
      } else {
        expect(GOOD_KHAM.has(a.direction)).toBe(false);
      }
    }
    // 4 phòng tốt × 10 + 2 phòng xấu × 10 = 60 điểm phòng; cửa Nam (tốt) +5.
    expect(out.breakdown.phongTot).toBe(40);
    expect(out.breakdown.phongXau).toBe(20);
    expect(out.door).toMatchObject({ direction: 'Nam', tot: true, score: 5 });
    expect(out.total).toBe(65);
    expect(out.assignments.every((a) => a.explanation.includes(a.direction))).toBe(true);
  });

  it('cửa ở cung xấu bị trừ điểm nhưng vị trí cửa không bị dời', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng khách' }],
      doorWall: 'truoc',
      doorDistance: 1, // Tây Nam = Tuyệt Mệnh với cung Khảm
      length: 12,
      width: 9,
    });
    expect(out.door).toMatchObject({ direction: 'Tây Nam', tot: false, score: -5 });
    expect(out.total).toBe(10 - 5);
  });

  it('một phòng tốt duy nhất luôn chọn cung tốt', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Bếp' }],
      doorWall: 'sau',
      doorDistance: 6,
      length: 9,
      width: 9,
    });
    expect(out.assignments[0].tot).toBe(true);
  });

  it('một phòng xấu duy nhất luôn chọn cung xấu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Kho' }],
      doorWall: 'sau',
      doorDistance: 6,
      length: 9,
      width: 9,
    });
    expect(out.assignments[0].tot).toBe(false);
  });

  it('8 phòng phủ đủ 8 hướng, không dùng ô giữa', () => {
    const all = [
      'Phòng khách',
      'Bếp',
      'Phòng ngủ',
      'Phòng thờ',
      'Phòng ăn',
      'Phòng làm việc',
      'Nhà vệ sinh',
      'Kho',
    ].map((name) => ({ name }));
    const out = optimizeLayout({
      zones: KHAM,
      rooms: all,
      doorWall: 'phai',
      doorDistance: 4,
      length: 12,
      width: 9,
    });
    expect(out.assignments.map((a) => a.direction).sort()).toEqual(
      ZONE_GRID.map((z) => z.direction).sort(),
    );
  });
});

describe('optimizeLayout: đầu vào biên và diện tích', () => {
  it('không nhập diện tích thì chia đều mặt bằng', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng khách' }, { name: 'Bếp' }],
      doorWall: 'truoc',
      doorDistance: 2,
      length: 10,
      width: 8,
    });
    expect(out.assignments.map((a) => a.area)).toEqual([40, 40]);
    expect(out.warnings).toEqual([]);
  });

  it('tổng diện tích vượt mặt bằng thì cảnh báo và co theo tỷ lệ vừa sơ đồ', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [
        { name: 'Phòng khách', area: 60 },
        { name: 'Bếp', area: 60 },
      ],
      doorWall: 'truoc',
      doorDistance: 2,
      length: 10,
      width: 8, // 80 m²
    });
    expect(out.warnings.length).toBeGreaterThan(0);
    const sum = out.assignments.reduce((s, a) => s + a.area, 0);
    expect(Math.abs(sum - 80)).toBeLessThan(0.2);
  });

  it('đầu vào không hợp lệ thì báo lỗi thay vì trả phương án sai', () => {
    const base = {
      zones: KHAM,
      doorWall: 'truoc' as const,
      doorDistance: 2,
      length: 10,
      width: 8,
    };
    expect(() => optimizeLayout({ ...base, rooms: [] })).toThrow();
    expect(() => optimizeLayout({ ...base, rooms: [{ name: 'Bếp' }], length: 0 })).toThrow();
    expect(() => optimizeLayout({ ...base, rooms: [{ name: 'Bếp' }], width: -1 })).toThrow();
    expect(() =>
      optimizeLayout({ ...base, rooms: [{ name: 'Bếp' }, { name: 'Bếp' }] }),
    ).toThrow();
    expect(() =>
      optimizeLayout({ ...base, rooms: [{ name: 'Bếp', area: 0 }] }),
    ).toThrow();
    expect(() =>
      optimizeLayout({
        ...base,
        rooms: Array.from({ length: 9 }, (_, i) => ({ name: `Phòng ${i}` })),
      }),
    ).toThrow();
  });
});
