// Mặt bằng vẽ tay tự do cho 3D chuyên nghiệp (v2) — thay lưới 3×3 ép hình phòng.
// QUY ƯỚC QUAN TRỌNG (trả lời phản hồi user 28/10): 9 cung bát trạch CHỈ dùng
// để tính hướng/sao theo TÂM phòng, còn HÌNH phòng là chữ nhật tự do do người
// dùng vẽ (vị trí + rộng + sâu tùy ý, không còn 3 ô ngang cố định).
// Hệ tọa độ: x = Đông (0 = mép Tây, tối đa = mặt tiền), y = Nam (0 = mép Bắc,
// tối đa = chiều sâu). Gốc Tây-Bắc, khớp với boTri3d.ts và /la-ban.
// Chỉ dùng import tương đối (vitest không hiểu alias @/).

import type { HuongInfo } from './engine';
import {
  ZONE_GRID,
  scoreRoom,
  doorZone,
  doorPosition,
  minArea,
  type DoorWall,
} from './boTri3d';

export type RoomRect = {
  id: string;
  room: string;
  /** mép Tây của phòng, mét từ mép Tây nhà. */
  x: number;
  /** mép Bắc của phòng, mét từ mép Bắc nhà. */
  y: number;
  /** rộng Đông–Tây, mét. */
  w: number;
  /** sâu Bắc–Nam, mét. */
  d: number;
};

export type WallRun = {
  /** 'h' = tường ngang (chạy Đông–Tây, cố định y), 'v' = tường dọc (chạy Bắc–Nam, cố định x). */
  orient: 'h' | 'v';
  /** tọa độ cố định (y nếu ngang, x nếu dọc). */
  fixed: number;
  /** khoảng chạy dọc theo tường, mét. */
  from: number;
  to: number;
};

export type WindowGap = {
  wall: DoorWall;
  from: number;
  to: number;
};

/** Cung bát trạch của một điểm (tâm phòng): chia nhà thành 3×3 theo vị trí. */
export function sectorOf(cx: number, cy: number, facade: number, depth: number): string {
  const col = Math.min(2, Math.max(0, Math.floor((cx / facade) * 3)));
  const row = Math.min(2, Math.max(0, Math.floor((cy / depth) * 3)));
  if (row === 1 && col === 1) return 'Trung tâm';
  const z = ZONE_GRID.find((g) => g.row === row && g.col === col);
  return z ? z.direction : 'Trung tâm';
}

export type ScoredRoom = RoomRect & {
  direction: string;
  sao: string;
  tot: boolean;
  score: number;
  area: number;
  explanation: string;
};

/** Chấm điểm mặt bằng vẽ tay: hướng/sao theo tâm phòng, cửa theo vị trí nhập. */
export function scoreFreePlan(input: {
  zones: Record<string, HuongInfo>;
  rooms: RoomRect[];
  doorWall: DoorWall;
  doorDistance: number;
  facade: number;
  depth: number;
}): { rooms: ScoredRoom[]; total: number; warnings: string[] } {
  const { zones, rooms, doorWall, doorDistance, facade, depth } = input;
  const warnings: string[] = [];
  const doorDir = doorZone(doorWall, doorDistance, depth, facade);
  const doorInfo = zones[doorDir];
  const doorScore = doorInfo ? (doorInfo.tot ? 5 : -5) : 0;
  let total = doorScore;

  const scored = rooms.map((r) => {
    const cx = r.x + r.w / 2;
    const cy = r.y + r.d / 2;
    const dir = sectorOf(cx, cy, facade, depth);
    if (dir === 'Trung tâm') {
      warnings.push(
        `${r.room} nằm ở trung tâm nhà — trung tâm không phải hướng bát trạch nên không chấm điểm hướng cho phòng này.`,
      );
      return {
        ...r,
        direction: dir,
        sao: '',
        tot: false,
        score: 0,
        area: r.w * r.d,
        explanation: `${r.room} đặt ở trung tâm nhà — không chấm điểm hướng (trung tâm không thuộc 8 hướng bát trạch).`,
      };
    }
    const info = zones[dir];
    const s = scoreRoom(r.room, info.tot);
    total += s;
    const m = minArea(r.room);
    if (m !== null && r.w * r.d < m) {
      warnings.push(
        `${r.room} chỉ ${Math.round(r.w * r.d * 10) / 10} m², dưới mức tối thiểu tham khảo ${m} m² cho công năng này.`,
      );
    }
    return {
      ...r,
      direction: dir,
      sao: info.sao,
      tot: info.tot,
      score: s,
      area: r.w * r.d,
      explanation: `${r.room} đặt tại hướng ${dir} (sao ${info.sao}, hướng ${info.tot ? 'tốt' : 'xấu'}) — tâm phòng rơi vào cung ${dir}.`,
    };
  });

  return { rooms: scored, total, warnings };
}

/** Kiểm tra mặt bằng: trong biên nhà, không chồng nhau. Trả về lỗi (rỗng = hợp lệ). */
export function validatePlan(rooms: RoomRect[], facade: number, depth: number): string[] {
  const errors: string[] = [];
  const EPS = 0.01;
  for (const r of rooms) {
    if (!(r.w > 0) || !(r.d > 0)) errors.push(`${r.room}: rộng và sâu phải là số dương.`);
    if (r.x < -EPS || r.y < -EPS || r.x + r.w > facade + EPS || r.y + r.d > depth + EPS) {
      errors.push(`${r.room}: nằm ngoài biên nhà (${facade} × ${depth} m).`);
    }
  }
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
      const overlapY = Math.min(a.y + a.d, b.y + b.d) - Math.max(a.y, b.y);
      if (overlapX > EPS && overlapY > EPS) {
        errors.push(`${a.room} chồng lên ${b.room} — kéo phòng ra chỗ khác.`);
      }
    }
  }
  return errors;
}

function overlap(a1: number, a2: number, b1: number, b2: number): [number, number] | null {
  const from = Math.max(a1, b1);
  const to = Math.min(a2, b2);
  return to - from > 0.01 ? [from, to] : null;
}

/**
 * Vách ngăn giữa 2 phòng kề nhau: đoạn chung của cạnh tiếp giáp.
 * Nếu đoạn chung ≥ 1,5 m thì chừa 0,9 m ở giữa làm lối đi (không bịt kín nhà).
 */
export function partitionWalls(rooms: RoomRect[]): WallRun[] {
  const walls: WallRun[] = [];
  for (let i = 0; i < rooms.length; i++) {
    for (let j = i + 1; j < rooms.length; j++) {
      const a = rooms[i];
      const b = rooms[j];
      // Kề dọc: a Đông = b Tây hoặc ngược lại, chung khoảng y.
      if (Math.abs(a.x + a.w - b.x) < 0.01 || Math.abs(b.x + b.w - a.x) < 0.01) {
        const ov = overlap(a.y, a.y + a.d, b.y, b.y + b.d);
        const fixed = Math.abs(a.x + a.w - b.x) < 0.01 ? a.x + a.w : a.x;
        if (ov) walls.push(...splitWithDoorway('v', fixed, ov));
      }
      // Kề ngang: a Nam = b Bắc hoặc ngược lại, chung khoảng x.
      if (Math.abs(a.y + a.d - b.y) < 0.01 || Math.abs(b.y + b.d - a.y) < 0.01) {
        const ov = overlap(a.x, a.x + a.w, b.x, b.x + b.w);
        const fixed = Math.abs(a.y + a.d - b.y) < 0.01 ? a.y + a.d : a.y;
        if (ov) walls.push(...splitWithDoorway('h', fixed, ov));
      }
    }
  }
  return walls;
}

function splitWithDoorway(orient: 'h' | 'v', fixed: number, ov: [number, number]): WallRun[] {
  const [from, to] = ov;
  const len = to - from;
  if (len >= 1.5) {
    const mid = (from + to) / 2;
    const gap = 0.9;
    return [
      { orient, fixed, from, to: mid - gap / 2 },
      { orient, fixed, from: mid + gap / 2, to },
    ];
  }
  return [{ orient, fixed, from, to }];
}

/**
 * Cửa sổ trên tường bao: mỗi phòng chạm tường ngoài với đoạn chạm ≥ 2 m được
 * 1 cửa sổ 1,2 m ở giữa đoạn chạm đó. Trả về khe hở để trừ khỏi tường bao.
 */
export function windowGaps(rooms: RoomRect[], facade: number, depth: number): WindowGap[] {
  const gaps: WindowGap[] = [];
  for (const r of rooms) {
    const add = (wall: DoorWall, from: number, to: number) => {
      if (to - from >= 2) {
        const mid = (from + to) / 2;
        gaps.push({ wall, from: mid - 0.6, to: mid + 0.6 });
      }
    };
    if (Math.abs(r.y) < 0.01) add('sau', r.x, r.x + r.w);
    if (Math.abs(r.y + r.d - depth) < 0.01) add('truoc', r.x, r.x + r.w);
    if (Math.abs(r.x) < 0.01) add('trai', r.y, r.y + r.d);
    if (Math.abs(r.x + r.w - facade) < 0.01) add('phai', r.y, r.y + r.d);
  }
  return gaps;
}

/**
 * Tường bao chia đoạn theo khe cửa chính + khe cửa sổ: mỗi bức tường là danh
 * sách đoạn tường thật (không còn là 1 thanh liền). Dùng trực tiếp cho render 3D.
 */
export function perimeterWalls(input: {
  facade: number;
  depth: number;
  doorWall: DoorWall;
  doorDistance: number;
  windows: WindowGap[];
}): WallRun[] {
  const { facade, depth, doorWall, doorDistance, windows } = input;
  const door = doorPosition(doorWall, doorDistance, depth, facade);
  const doorGap: WindowGap = {
    wall: doorWall,
    from: (doorWall === 'truoc' || doorWall === 'sau' ? door.x : door.y) - 0.5,
    to: (doorWall === 'truoc' || doorWall === 'sau' ? door.x : door.y) + 0.5,
  };
  const allGaps = [...windows, doorGap];
  const walls: WallRun[] = [];
  const defs: { wall: DoorWall; orient: 'h' | 'v'; fixed: number; len: number }[] = [
    { wall: 'sau', orient: 'h', fixed: 0, len: facade },
    { wall: 'truoc', orient: 'h', fixed: depth, len: facade },
    { wall: 'trai', orient: 'v', fixed: 0, len: depth },
    { wall: 'phai', orient: 'v', fixed: facade, len: depth },
  ];
  for (const def of defs) {
    const cuts = allGaps
      .filter((g) => g.wall === def.wall)
      .map((g) => [Math.max(0, g.from), Math.min(def.len, g.to)] as [number, number])
      .filter(([a, b]) => b - a > 0.01)
      .sort((a, b) => a[0] - b[0]);
    let cursor = 0;
    for (const [a, b] of cuts) {
      if (a - cursor > 0.01) walls.push({ orient: def.orient, fixed: def.fixed, from: cursor, to: a });
      cursor = Math.max(cursor, b);
    }
    if (def.len - cursor > 0.01) walls.push({ orient: def.orient, fixed: def.fixed, from: cursor, to: def.len });
  }
  return walls;
}
