// Bộ tối ưu bố trí phòng theo bát trạch — logic thuần, không phụ thuộc UI.
// Mô hình: mặt bằng hình chữ nhật được chia thành lưới 3×3 theo đúng thứ tự
// la bàn của /la-ban (Bắc ở trên, Nam ở dưới, Đông bên phải, Tây bên trái).
// 8 ô biên là 8 hướng bát trạch; ô giữa là không gian chung, không gán phòng.
//
// QUY TẮC CHẤM ĐIỂM (công khai trên trang /bo-tri-3d):
// - Phòng tốt (Phòng khách, Bếp, Phòng ngủ, Phòng thờ/Bàn thờ) ở hướng tốt: +10,
//   ở hướng xấu: -10.
// - Phòng xấu (Nhà vệ sinh, Kho) ở hướng xấu: +10 ("lấy độc trị độc" — đặt
//   thứ không tốt vào cung xấu để trấn áp), ở hướng tốt: -10.
// - Phòng trung tính (Phòng ăn, Phòng làm việc) ở hướng tốt: +3, xấu: -3.
// - Cửa chính (vị trí do người dùng nhập, KHÔNG BAO GIỜ bị dời): cửa rơi vào
//   hướng tốt: +5, hướng xấu: -5.
// Tổng điểm = cộng dồn từng phòng + điểm cửa. Thuật toán liệt kê toàn bộ
// cách gán phòng → hướng (tối đa 8! = 40320) và chọn điểm cao nhất; vì điểm
// cộng dồn theo từng cặp phòng–hướng nên liệt kê toàn bộ cho ra tối ưu thật,
// không phải tham lam. Hòa điểm: giữ phương án đầu tiên theo thứ tự lưới,
// để kết quả xác định (deterministic).

import type { HuongInfo } from './engine';

export type DoorWall = 'truoc' | 'sau' | 'trai' | 'phai';

export const ZONE_GRID: { direction: string; row: number; col: number }[] = [
  { direction: 'Tây Bắc', row: 0, col: 0 },
  { direction: 'Bắc', row: 0, col: 1 },
  { direction: 'Đông Bắc', row: 0, col: 2 },
  { direction: 'Tây', row: 1, col: 0 },
  { direction: 'Đông', row: 1, col: 2 },
  { direction: 'Tây Nam', row: 2, col: 0 },
  { direction: 'Nam', row: 2, col: 1 },
  { direction: 'Đông Nam', row: 2, col: 2 },
];

export const ZONE_BY_DIRECTION: Record<string, { row: number; col: number }> =
  Object.fromEntries(ZONE_GRID.map((z) => [z.direction, { row: z.row, col: z.col }]));

/** Ô giữa nhà — không phải hướng bát trạch, chỉ là không gian chung. */
export const CENTER_ZONE = { row: 1, col: 1 };

export const GOOD_ROOMS = ['Phòng khách', 'Bếp', 'Phòng ngủ', 'Phòng thờ', 'Bàn thờ'];
export const BAD_ROOMS = ['Nhà vệ sinh', 'Kho'];
export const NEUTRAL_ROOMS = ['Phòng ăn', 'Phòng làm việc'];
export const ALL_ROOMS = [
  'Phòng khách',
  'Bếp',
  'Phòng ngủ',
  'Phòng thờ',
  'Phòng ăn',
  'Phòng làm việc',
  'Nhà vệ sinh',
  'Kho',
];

export type RoomKind = 'tot' | 'xau' | 'trung';

export function roomKind(room: string): RoomKind {
  if (GOOD_ROOMS.includes(room)) return 'tot';
  if (BAD_ROOMS.includes(room)) return 'xau';
  return 'trung';
}

export const SCORE_GOOD_ROOM = 10;
export const SCORE_BAD_ROOM = 10;
export const SCORE_NEUTRAL_ROOM = 3;
export const SCORE_DOOR = 5;

export function scoreRoom(room: string, zoneTot: boolean): number {
  const kind = roomKind(room);
  if (kind === 'tot') return zoneTot ? SCORE_GOOD_ROOM : -SCORE_GOOD_ROOM;
  if (kind === 'xau') return zoneTot ? -SCORE_BAD_ROOM : SCORE_BAD_ROOM;
  return zoneTot ? SCORE_NEUTRAL_ROOM : -SCORE_NEUTRAL_ROOM;
}

export function explainRoom(room: string, direction: string, sao: string, tot: boolean): string {
  const kind = roomKind(room);
  if (kind === 'tot') {
    return tot
      ? `${room} đặt tại hướng ${direction} (sao ${sao}, hướng tốt) — phòng sinh hoạt chính hợp với cung tốt, được cộng điểm.`
      : `${room} đặt tại hướng ${direction} (sao ${sao}, hướng xấu) — không còn cung tốt trống; đây là phương án ít thiệt hại nhất trong các cách gán còn lại, bị trừ điểm.`;
  }
  if (kind === 'xau') {
    return tot
      ? `${room} đặt tại hướng ${direction} (sao ${sao}, hướng tốt) — không còn cung xấu trống; đặt phòng phụ vào cung tốt bị trừ điểm.`
      : `${room} đặt tại hướng ${direction} (sao ${sao}, hướng xấu) — theo nguyên tắc "lấy độc trị độc", đặt thứ không tốt vào cung xấu để trấn áp, được cộng điểm.`;
  }
  return tot
    ? `${room} đặt tại hướng ${direction} (sao ${sao}, hướng tốt) — phòng trung tính, hợp cung tốt được cộng điểm nhẹ.`
    : `${room} đặt tại hướng ${direction} (sao ${sao}, hướng xấu) — phòng trung tính, đặt vào cung xấu bị trừ điểm nhẹ.`;
}

// ---- Cửa ----
// Quy ước đo (ghi rõ trên trang): sơ đồ vẽ Bắc lên trên. Mặt trước = cạnh
// dưới (phía Nam), mặt sau = cạnh trên (phía Bắc), trái = cạnh Tây, phải =
// cạnh Đông. Khoảng cách đo từ góc: mặt trước từ góc Tây Nam đi về Đông;
// mặt sau từ góc Tây Bắc đi về Đông; trái từ góc Tây Bắc đi về Nam; phải
// từ góc Đông Bắc đi về Nam. Vượt mép thì kẹp (clamp) vào ô biên cuối.

export function wallLength(wall: DoorWall, length: number, width: number): number {
  return wall === 'truoc' || wall === 'sau' ? length : width;
}

export function doorZone(wall: DoorWall, distance: number, length: number, width: number): string {
  const len = wallLength(wall, length, width);
  const d = Math.min(Math.max(distance, 0), len);
  const seg = Math.min(2, Math.floor(d / (len / 3)));
  if (wall === 'truoc') return ['Tây Nam', 'Nam', 'Đông Nam'][seg];
  if (wall === 'sau') return ['Tây Bắc', 'Bắc', 'Đông Bắc'][seg];
  if (wall === 'trai') return ['Tây Bắc', 'Tây', 'Tây Nam'][seg];
  return ['Đông Bắc', 'Đông', 'Đông Nam'][seg];
}

/** Tọa độ cửa theo hệ mét của mặt bằng: x = Đông (0 = mép Tây), y = Nam (0 = mép Bắc). */
export function doorPosition(
  wall: DoorWall,
  distance: number,
  length: number,
  width: number,
): { x: number; y: number } {
  const len = wallLength(wall, length, width);
  const d = Math.min(Math.max(distance, 0), len);
  if (wall === 'truoc') return { x: d, y: width };
  if (wall === 'sau') return { x: d, y: 0 };
  if (wall === 'trai') return { x: 0, y: d };
  return { x: length, y: d };
}

/** Hình chữ nhật của một hướng trên mặt bằng (mét, gốc Tây-Bắc). */
export function zoneRect(direction: string, length: number, width: number) {
  const z = ZONE_BY_DIRECTION[direction];
  if (!z) throw new Error(`Hướng không hợp lệ: ${direction}`);
  return { x: (z.col * length) / 3, y: (z.row * width) / 3, w: length / 3, h: width / 3 };
}

export type RoomInput = { name: string; area?: number };

export type OptimizedRoom = {
  room: string;
  direction: string;
  row: number;
  col: number;
  sao: string;
  tot: boolean;
  score: number;
  area: number; // diện tích hiển thị (m², đã cân đối vừa mặt bằng)
  requestedArea: number | null;
  explanation: string;
};

export type OptimizedLayout = {
  assignments: OptimizedRoom[];
  door: { wall: DoorWall; distance: number; direction: string; sao: string; tot: boolean; score: number };
  breakdown: { phongTot: number; phongXau: number; phongTrung: number; cua: number };
  total: number;
  warnings: string[];
};

export function optimizeLayout(input: {
  zones: Record<string, HuongInfo>;
  rooms: RoomInput[];
  doorWall: DoorWall;
  doorDistance: number;
  length: number;
  width: number;
}): OptimizedLayout {
  const { zones, rooms, doorWall, doorDistance, length, width } = input;
  if (!rooms || rooms.length === 0) throw new Error('Chọn ít nhất một phòng để bố trí.');
  if (rooms.length > 8) throw new Error('Tối đa 8 phòng (mỗi hướng bát trạch chỉ đặt một phòng).');
  if (!(length > 0) || !(width > 0) || !Number.isFinite(length) || !Number.isFinite(width)) {
    throw new Error('Chiều dài và chiều rộng phải là số dương.');
  }
  const names = rooms.map((r) => r.name);
  if (new Set(names).size !== names.length) throw new Error('Mỗi phòng chỉ chọn một lần.');
  for (const z of ZONE_GRID) {
    if (!zones[z.direction]) throw new Error(`Thiếu sao bát trạch cho hướng ${z.direction}.`);
  }
  for (const r of rooms) {
    if (r.area !== undefined && (!(r.area > 0) || !Number.isFinite(r.area))) {
      throw new Error(`Diện tích của ${r.name} phải là số dương.`);
    }
  }

  const plotArea = length * width;
  const warnings: string[] = [];
  // Diện tích hiển thị: phòng không nhập thì chia đều phần còn lại; nếu tổng
  // diện tích nhập vượt mặt bằng thì co tất cả theo tỷ lệ và cảnh báo.
  const requested: number[] = rooms.map((r) => r.area ?? plotArea / rooms.length);
  const sumRequested = requested.reduce((a, b) => a + b, 0);
  let display: number[];
  if (sumRequested > plotArea) {
    const f = plotArea / sumRequested;
    display = requested.map((a) => Math.round(a * f * 10) / 10);
    warnings.push(
      `Tổng diện tích các phòng (${Math.round(sumRequested * 10) / 10} m²) vượt diện tích mặt bằng (${Math.round(plotArea * 10) / 10} m²) nên đã co theo tỷ lệ để vừa sơ đồ; hãy giảm diện tích từng phòng hoặc tăng kích thước nhà.`,
    );
  } else {
    const specified = rooms.reduce((s, r, i) => s + (r.area !== undefined ? requested[i] : 0), 0);
    const autoCount = rooms.filter((r) => r.area === undefined).length;
    const autoShare = autoCount > 0 ? (plotArea - specified) / autoCount : 0;
    display = rooms.map((r, i) => (r.area !== undefined ? requested[i] : Math.round(autoShare * 10) / 10));
  }

  const doorDir = doorZone(doorWall, doorDistance, length, width);
  const doorInfo = zones[doorDir];
  const doorScore = doorInfo.tot ? SCORE_DOOR : -SCORE_DOOR;

  // Liệt kê toàn bộ: gán lần lượt từng phòng vào một hướng còn trống.
  // (Dùng biến vô hướng thay cho object nullable để tránh TS thu hẹp kiểu
  // sai sau khi gán trong hàm đệ quy.)
  let bestAssign: string[] = [];
  let bestScore = -Infinity;
  const used = new Set<string>();
  const current: string[] = [];
  function dfs(i: number, score: number) {
    if (i === rooms.length) {
      if (score > bestScore) {
        bestScore = score;
        bestAssign = [...current];
      }
      return;
    }
    for (const z of ZONE_GRID) {
      if (used.has(z.direction)) continue;
      used.add(z.direction);
      current.push(z.direction);
      dfs(i + 1, score + scoreRoom(rooms[i].name, zones[z.direction].tot));
      current.pop();
      used.delete(z.direction);
    }
  }
  dfs(0, 0);
  if (bestAssign.length !== rooms.length) throw new Error('Không tìm được phương án bố trí.');

  const breakdown = { phongTot: 0, phongXau: 0, phongTrung: 0, cua: doorScore };
  const assignments: OptimizedRoom[] = rooms.map((r, i) => {
    const dir = bestAssign[i];
    const info = zones[dir];
    const s = scoreRoom(r.name, info.tot);
    const kind = roomKind(r.name);
    if (kind === 'tot') breakdown.phongTot += s;
    else if (kind === 'xau') breakdown.phongXau += s;
    else breakdown.phongTrung += s;
    const z = ZONE_BY_DIRECTION[dir];
    return {
      room: r.name,
      direction: dir,
      row: z.row,
      col: z.col,
      sao: info.sao,
      tot: info.tot,
      score: s,
      area: display[i],
      requestedArea: r.area ?? null,
      explanation: explainRoom(r.name, dir, info.sao, info.tot),
    };
  });

  return {
    assignments,
    door: {
      wall: doorWall,
      distance: doorDistance,
      direction: doorDir,
      sao: doorInfo.sao,
      tot: doorInfo.tot,
      score: doorScore,
    },
    breakdown,
    total: bestScore + doorScore,
    warnings,
  };
}
