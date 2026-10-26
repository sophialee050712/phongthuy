// Unit test cho bộ tối ưu bố trí phòng /bo-tri-3d.
import { describe, it, expect } from 'vitest';
import { batTrach } from './engine';
import {
  optimizeLayout,
  doorZone,
  doorPosition,
  scoreRoom,
  roomFootprint,
  ZONE_GRID,
} from './boTri3d';

const KHAM = batTrach('Khảm');
// Khảm: tốt = Đông Nam, Đông, Nam, Bắc; xấu = Tây Nam, Đông Bắc, Tây Bắc, Tây.
const GOOD_KHAM = new Set(['Đông Nam', 'Đông', 'Nam', 'Bắc']);

describe('doorZone: cửa rơi đúng ô 3×3 theo tường và khoảng cách', () => {
  it('mặt trước (Nam) chia theo mặt tiền, mặt trái (Tây) chia theo chiều sâu', () => {
    expect(doorZone('truoc', 1, 9, 12)).toBe('Tây Nam');
    expect(doorZone('truoc', 6, 9, 12)).toBe('Nam');
    expect(doorZone('truoc', 11, 9, 12)).toBe('Đông Nam');
    expect(doorZone('sau', 6, 9, 12)).toBe('Bắc');
    expect(doorZone('trai', 1, 9, 12)).toBe('Tây Bắc');
    expect(doorZone('trai', 4, 9, 12)).toBe('Tây');
    expect(doorZone('phai', 8, 9, 12)).toBe('Đông Nam');
  });
  it('vượt mép thì kẹp vào ô biên cuối, không văng ra ngoài', () => {
    expect(doorZone('truoc', 99, 9, 12)).toBe('Đông Nam');
    expect(doorZone('trai', -5, 9, 12)).toBe('Tây Bắc');
  });
  it('tọa độ cửa nằm đúng trên tường đã chọn', () => {
    expect(doorPosition('truoc', 3, 9, 12)).toEqual({ x: 3, y: 9 });
    expect(doorPosition('sau', 3, 9, 12)).toEqual({ x: 3, y: 0 });
    expect(doorPosition('trai', 3, 9, 12)).toEqual({ x: 0, y: 3 });
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
      depth: 9,
      facade: 12,
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
      depth: 9,
      facade: 12,
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
      depth: 9,
      facade: 9,
    });
    expect(out.assignments[0].tot).toBe(true);
  });

  it('một phòng xấu duy nhất luôn chọn cung xấu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Kho' }],
      doorWall: 'sau',
      doorDistance: 6,
      depth: 9,
      facade: 9,
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
      depth: 9,
      facade: 12,
    });
    expect(out.assignments.map((a) => a.direction).sort()).toEqual(
      ZONE_GRID.map((z) => z.direction).sort(),
    );
  });
});

describe('optimizeLayout: diện tích tự chia chỉ lấy phần còn lại', () => {
  it('phòng nhập 100 m² co xuống 81 m² để đủ chỗ cho 3 phòng trống ở mức tối thiểu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [
        { name: 'Phòng khách', area: 100 },
        { name: 'Bếp' },
        { name: 'Phòng ngủ' },
        { name: 'Phòng thờ' },
      ],
      doorWall: 'truoc',
      doorDistance: 6,
      depth: 9,
      facade: 12, // 108 m², trống cần tối thiểu 10+12+5=27 → dành cho khách 81
    });
    const byRoom = Object.fromEntries(out.assignments.map((a) => [a.room, a.area]));
    expect(byRoom['Phòng khách']).toBe(81);
    expect(byRoom['Bếp']).toBe(10);
    expect(byRoom['Phòng ngủ']).toBe(12);
    expect(byRoom['Phòng thờ']).toBe(5);
    expect(out.warnings.length).toBeGreaterThan(0);
  });

  it('phòng nhập 80 m², 3 phòng trống mỗi phòng lấy tối thiểu trước rồi chia đều phần còn lại', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [
        { name: 'Phòng khách', area: 80 },
        { name: 'Bếp' },
        { name: 'Phòng ngủ' },
        { name: 'Phòng thờ' },
      ],
      doorWall: 'truoc',
      doorDistance: 6,
      depth: 9,
      facade: 12, // 108 m², còn lại 28 m², tối thiểu trống 27 → dư 1 chia đều
    });
    const byRoom = Object.fromEntries(out.assignments.map((a) => [a.room, a.area]));
    expect(byRoom['Phòng khách']).toBe(80);
    expect(byRoom['Bếp']).toBeCloseTo(10 + 1 / 3, 1);
    expect(byRoom['Phòng ngủ']).toBeCloseTo(12 + 1 / 3, 1);
    expect(byRoom['Phòng thờ']).toBeCloseTo(5 + 1 / 3, 1);
    expect(out.warnings).toEqual([]);
  });

  it('phòng nhập 30 m², phòng trống chia đều phần còn lại khi mức chia đều đã đủ tối thiểu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [
        { name: 'Phòng khách', area: 30 },
        { name: 'Bếp' },
        { name: 'Phòng ngủ' },
        { name: 'Phòng thờ' },
      ],
      doorWall: 'truoc',
      doorDistance: 6,
      depth: 9,
      facade: 12, // 108 m², còn lại 78 m², chia đều 26 mỗi phòng
    });
    const byRoom = Object.fromEntries(out.assignments.map((a) => [a.room, a.area]));
    expect(byRoom['Phòng khách']).toBe(30);
    expect(byRoom['Bếp']).toBe(26);
    expect(byRoom['Phòng ngủ']).toBe(26);
    expect(byRoom['Phòng thờ']).toBe(26);
    expect(out.warnings).toEqual([]);
  });

  it('phòng nhập vượt mặt bằng nhưng còn co được: co phòng nhập để đủ chỗ cho phòng trống ở mức tối thiểu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [
        { name: 'Phòng khách', area: 120 },
        { name: 'Bếp' },
      ],
      doorWall: 'truoc',
      doorDistance: 6,
      depth: 10,
      facade: 10, // 100 m², trống cần tối thiểu 10 → dành cho khách 90
    });
    const byRoom = Object.fromEntries(out.assignments.map((a) => [a.room, a.area]));
    expect(byRoom['Phòng khách']).toBe(90);
    expect(byRoom['Bếp']).toBe(10);
    expect(out.warnings.length).toBeGreaterThan(0);
  });
});

describe('optimizeLayout: hòa điểm ưu tiên sao tốt hơn cho phòng chọn trước', () => {
  it('cung Khảm, 2 phòng tốt: Phòng khách vào Sinh Khí (Đông Nam), Bếp vào Thiên Y (Đông)', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng khách' }, { name: 'Bếp' }],
      doorWall: 'truoc',
      doorDistance: 6,
      depth: 9,
      facade: 12,
    });
    const byRoom = Object.fromEntries(out.assignments.map((a) => [a.room, a.direction]));
    expect(byRoom['Phòng khách']).toBe('Đông Nam');
    expect(byRoom['Bếp']).toBe('Đông');
    expect(out.breakdown.phongTot).toBe(20);
  });
});

describe('roomFootprint: khối co đúng theo diện tích', () => {
  it('bằng diện tích ô thì full ô; bằng 1/4 thì nửa cạnh; quá ô thì chặn ở full ô; 0 thì vẫn thấy tối thiểu', () => {
    expect(roomFootprint(36, 6, 6)).toEqual({ w: 6, h: 6, scale: 1 });
    expect(roomFootprint(9, 6, 6).scale).toBeCloseTo(0.5, 5);
    expect(roomFootprint(100, 6, 6).scale).toBe(1);
    expect(roomFootprint(0, 6, 6).scale).toBe(0.25);
    const fp = roomFootprint(12, 4, 3); // ô 12 m², phòng 12 m²
    expect(fp.w).toBeCloseTo(4, 5);
    expect(fp.h).toBeCloseTo(3, 5);
  });
});

describe('optimizeLayout: đầu vào biên và diện tích', () => {
  it('không nhập diện tích thì chia đều mặt bằng', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng khách' }, { name: 'Bếp' }],
      doorWall: 'truoc',
      doorDistance: 2,
      depth: 8,
      facade: 10,
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
      depth: 8,
      facade: 10, // 80 m²
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
      depth: 8,
      facade: 10,
    };
    expect(() => optimizeLayout({ ...base, rooms: [] })).toThrow();
    expect(() => optimizeLayout({ ...base, rooms: [{ name: 'Bếp' }], depth: 0 })).toThrow();
    expect(() => optimizeLayout({ ...base, rooms: [{ name: 'Bếp' }], facade: -1 })).toThrow();
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

describe('optimizeLayout: diện tích tối thiểu theo công năng', () => {
  it('8 phòng không nhập diện tích trên mặt bằng 24 m² thì báo thiếu thay vì phòng 1.7 m²', () => {
    expect(() =>
      optimizeLayout({
        zones: KHAM,
        rooms: [
          { name: 'Phòng khách' },
          { name: 'Phòng ngủ' },
          { name: 'Phòng thờ' },
          { name: 'Bếp' },
          { name: 'Phòng ăn' },
          { name: 'Phòng làm việc' },
          { name: 'Nhà vệ sinh' },
          { name: 'Kho' },
        ],
        doorWall: 'truoc',
        doorDistance: 2,
        depth: 4,
        facade: 6, // 24 m², trống cần tối thiểu 15+12+5+10+8+0+3+4=57
      }),
    ).toThrow(/Không đủ diện tích/);
  });

  it('8 phòng nhập tổng 84 m² trên mặt bằng 24 m² thì báo thiếu (co sẽ làm phòng dưới mức tối thiểu)', () => {
    expect(() =>
      optimizeLayout({
        zones: KHAM,
        rooms: [
          { name: 'Phòng khách', area: 20 },
          { name: 'Phòng ngủ', area: 15 },
          { name: 'Phòng thờ', area: 10 },
          { name: 'Bếp', area: 15 },
          { name: 'Phòng ăn', area: 8 },
          { name: 'Phòng làm việc', area: 6 },
          { name: 'Nhà vệ sinh', area: 5 },
          { name: 'Kho', area: 5 },
        ],
        doorWall: 'trai',
        doorDistance: 2,
        depth: 4,
        facade: 6, // 24 m²
      }),
    ).toThrow(/Không đủ diện tích/);
  });

  it('co phòng nhập để đủ chỗ cho phòng trống mà vi phạm mức tối thiểu thì báo thiếu', () => {
    expect(() =>
      optimizeLayout({
        zones: KHAM,
        rooms: [
          { name: 'Phòng khách', area: 20 },
          { name: 'Bếp' },
          { name: 'Phòng ngủ' },
        ],
        doorWall: 'truoc',
        doorDistance: 2,
        depth: 5,
        facade: 6, // 30 m², trống cần 22 → dành cho khách 8, dưới mức 15
      }),
    ).toThrow(/Phòng khách/);
  });

  it('co theo tỷ lệ làm phòng xuống dưới mức tối thiểu thì báo thiếu', () => {
    expect(() =>
      optimizeLayout({
        zones: KHAM,
        rooms: [
          { name: 'Phòng khách', area: 16 },
          { name: 'Phòng ngủ', area: 12 },
        ],
        doorWall: 'truoc',
        doorDistance: 2,
        depth: 5.2,
        facade: 5, // 26 m², co khách 16→14.9 dưới mức 15
      }),
    ).toThrow(/Phòng khách/);
  });

  it('nhập dưới mức tối thiểu thì cảnh báo nhưng giữ nguyên số đã nhập', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng thờ', area: 3 }],
      doorWall: 'truoc',
      doorDistance: 2,
      depth: 9,
      facade: 12,
    });
    expect(out.assignments[0].area).toBe(3);
    expect(out.warnings.join(' ')).toMatch(/Phòng thờ.*3 m².*5 m²/);
  });

  it('phòng trống không bao giờ chia dưới mức tối thiểu', () => {
    const out = optimizeLayout({
      zones: KHAM,
      rooms: [{ name: 'Phòng khách' }, { name: 'Phòng ngủ' }, { name: 'Bếp' }, { name: 'Nhà vệ sinh' }],
      doorWall: 'truoc',
      doorDistance: 2,
      depth: 6,
      facade: 8, // 48 m², tối thiểu 15+12+10+3=40, dư 8 chia đều 2 mỗi phòng
    });
    expect(out.assignments.map((a) => a.area)).toEqual([17, 14, 12, 5]);
  });
});
