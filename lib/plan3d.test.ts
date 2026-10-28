// Unit test cho mặt bằng vẽ tay tự do (3D v2).
import { describe, it, expect } from 'vitest';
import {
  sectorOf,
  validatePlan,
  partitionWalls,
  windowGaps,
  perimeterWalls,
  scoreFreePlan,
  type RoomRect,
} from './plan3d';

describe('sectorOf: tâm phòng quyết định cung, không phải lưới ép hình', () => {
  it('nhà 9×9: tâm các góc rơi đúng 8 hướng, tâm giữa là Trung tâm', () => {
    expect(sectorOf(1.5, 1.5, 9, 9)).toBe('Tây Bắc');
    expect(sectorOf(4.5, 1.5, 9, 9)).toBe('Bắc');
    expect(sectorOf(7.5, 1.5, 9, 9)).toBe('Đông Bắc');
    expect(sectorOf(1.5, 4.5, 9, 9)).toBe('Tây');
    expect(sectorOf(7.5, 4.5, 9, 9)).toBe('Đông');
    expect(sectorOf(1.5, 7.5, 9, 9)).toBe('Tây Nam');
    expect(sectorOf(4.5, 7.5, 9, 9)).toBe('Nam');
    expect(sectorOf(7.5, 7.5, 9, 9)).toBe('Đông Nam');
    expect(sectorOf(4.5, 4.5, 9, 9)).toBe('Trung tâm');
  });

  it('phòng chữ nhật tự do (không theo ô lưới) vẫn tính cung theo tâm', () => {
    // Phòng 5×2 m đặt lệch, tâm (4, 1) trong nhà 12×6 → cột 1, hàng 0 → Bắc.
    expect(sectorOf(4, 1, 12, 6)).toBe('Bắc');
  });
});

describe('validatePlan', () => {
  it('phòng ngoài biên và chồng nhau đều báo lỗi', () => {
    const rooms: RoomRect[] = [
      { id: 'a', room: 'Phòng khách', x: 0, y: 0, w: 5, d: 4 },
      { id: 'b', room: 'Phòng ngủ', x: 4, y: 0, w: 5, d: 4 },
      { id: 'c', room: 'Bếp', x: 0, y: 8, w: 5, d: 4 },
    ];
    const errs = validatePlan(rooms, 9, 9);
    expect(errs.some((e) => e.includes('Phòng ngủ') && e.includes('chồng'))).toBe(true);
    expect(errs.some((e) => e.includes('Bếp') && e.includes('ngoài biên'))).toBe(true);
  });

  it('mặt bằng hợp lệ không lỗi', () => {
    const rooms: RoomRect[] = [
      { id: 'a', room: 'Phòng khách', x: 0, y: 0, w: 5, d: 4 },
      { id: 'b', room: 'Phòng ngủ', x: 5, y: 0, w: 4, d: 4 },
    ];
    expect(validatePlan(rooms, 9, 9)).toEqual([]);
  });
});

describe('partitionWalls', () => {
  it('2 phòng kề dọc 4 m có lối đi 0,9 m ở giữa', () => {
    const rooms: RoomRect[] = [
      { id: 'a', room: 'Phòng khách', x: 0, y: 0, w: 5, d: 4 },
      { id: 'b', room: 'Phòng ngủ', x: 5, y: 0, w: 4, d: 4 },
    ];
    const walls = partitionWalls(rooms);
    expect(walls).toHaveLength(2);
    expect(walls[0]).toEqual({ orient: 'v', fixed: 5, from: 0, to: 1.55 });
    expect(walls[1]).toEqual({ orient: 'v', fixed: 5, from: 2.45, to: 4 });
  });

  it('đoạn chung ngắn (< 1,5 m) không chừa lối đi', () => {
    const rooms: RoomRect[] = [
      { id: 'a', room: 'Phòng khách', x: 0, y: 0, w: 5, d: 4 },
      { id: 'b', room: 'Phòng ngủ', x: 5, y: 3, w: 4, d: 1.4 },
    ];
    expect(partitionWalls(rooms)).toEqual([{ orient: 'v', fixed: 5, from: 3, to: 4 }]);
  });
});

describe('windowGaps + perimeterWalls', () => {
  it('phòng chạm tường Bắc dài 5 m có 1 cửa sổ 1,2 m ở giữa đoạn chạm', () => {
    const rooms: RoomRect[] = [{ id: 'a', room: 'Phòng khách', x: 1, y: 0, w: 5, d: 4 }];
    expect(windowGaps(rooms, 9, 9)).toEqual([{ wall: 'sau', from: 2.9, to: 4.1 }]);
  });

  it('tường bao trừ khe cửa chính và cửa sổ thành nhiều đoạn', () => {
    const walls = perimeterWalls({
      facade: 9,
      depth: 9,
      doorWall: 'truoc',
      doorDistance: 4.5,
      windows: [{ wall: 'sau', from: 1.9, to: 3.1 }],
    });
    // Tường sau bị cửa sổ cắt thành 2 đoạn; tường trước bị cửa chính cắt thành 2 đoạn.
    const sau = walls.filter((w) => w.orient === 'h' && w.fixed === 0);
    expect(sau).toEqual([
      { orient: 'h', fixed: 0, from: 0, to: 1.9 },
      { orient: 'h', fixed: 0, from: 3.1, to: 9 },
    ]);
    const truoc = walls.filter((w) => w.orient === 'h' && w.fixed === 9);
    expect(truoc).toEqual([
      { orient: 'h', fixed: 9, from: 0, to: 4 },
      { orient: 'h', fixed: 9, from: 5, to: 9 },
    ]);
  });
});

describe('scoreFreePlan', () => {
  it('phòng tốt ở cung tốt được +10, phòng xấu ở cung xấu được +10', () => {
    const zones = {
      'Tây Bắc': { sao: 'Sinh Khí', tot: true },
      'Bắc': { sao: 'Tuyệt Mệnh', tot: false },
    } as never;
    const { rooms, total } = scoreFreePlan({
      zones,
      rooms: [
        { id: 'a', room: 'Phòng khách', x: 0, y: 0, w: 3, d: 3 },
        { id: 'b', room: 'Nhà vệ sinh', x: 3, y: 0, w: 3, d: 3 },
      ],
      doorWall: 'truoc',
      doorDistance: 1,
      facade: 9,
      depth: 9,
    });
    expect(rooms[0].direction).toBe('Tây Bắc');
    expect(rooms[0].score).toBe(10);
    expect(rooms[1].direction).toBe('Bắc');
    expect(rooms[1].score).toBe(10);
    expect(total).toBeGreaterThanOrEqual(20);
  });
});
