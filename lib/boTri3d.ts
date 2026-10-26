// Bộ tối ưu bố trí phòng theo bát trạch — logic thuần, không phụ thuộc UI.
// Mô hình: mặt bằng hình chữ nhật được chia thành lưới 3×3 theo đúng thứ tự
// la bàn của /la-ban (Bắc ở trên, Nam ở dưới, Đông bên phải, Tây bên trái).
// 8 ô biên là 8 hướng bát trạch; ô giữa là không gian chung, không gán phòng.
//
// QUY ƯỚC DẠNG NHÀ (sửa 26/10 theo phản hồi user): chiều rộng = mặt tiền
// (Đông–Tây, cạnh có cửa chính theo mặc định), chiều dài = chiều sâu
// (Bắc–Nam, từ trước ra sau). Mặt trước mặc định là cạnh RỘNG phía Nam —
// tường có cửa chính nằm ở chiều rộng, không phải chiều dài. Trong code:
// depth = chiều dài (chiều sâu), facade = chiều rộng (mặt tiền).
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
// không phải tham lam. Hòa điểm chính: ưu tiên phòng tốt vào sao tốt hơn
// (Sinh Khí > Thiên Y > Diên Niên > Phục Vị), phòng xấu vào sao xấu hơn
// (Tuyệt Mệnh > Ngũ Quỷ > Lục Sát > Họa Hại); còn hòa nữa thì giữ phương án
// đầu tiên theo thứ tự lưới, để kết quả xác định (deterministic).
// Diện tích hiển thị và khối vẽ: phòng nhập diện tích giữ nguyên số đã nhập
// khi còn vừa mặt bằng; phòng để trống chỉ chia phần còn lại. Khối 3D/2D co
// theo đúng diện tích hiển thị (giữ tỷ lệ khung ô), nên phòng lớn nhìn lớn
// hơn phòng nhỏ — không còn cảnh mọi phòng bằng nhau bất kể số đo.

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

/** Thứ hạng sao chỉ dùng để phá hòa điểm chính (không đổi quy tắc ±10/±3). */
export const STAR_RANK: Record<string, number> = {
  'Sinh Khí': 4,
  'Thiên Y': 3,
  'Diên Niên': 2,
  'Phục Vị': 1,
  'Họa Hại': -1,
  'Lục Sát': -2,
  'Ngũ Quỷ': -3,
  'Tuyệt Mệnh': -4,
};

/** Điểm phụ chỉ dùng khi hòa điểm chính: phòng tốt muốn sao tốt hơn,
 * phòng xấu muốn sao xấu hơn ("lấy độc trị độc" mạnh hơn). Nhân thêm
 * trọng số theo thứ tự phòng (phòng chọn trước ưu tiên sao tốt hơn) để
 * phương án hòa điểm nào cũng có một đáp án duy nhất, hợp lý nhất. */
function tieBreakRoom(room: string, sao: string, weight: number): number {
  const kind = roomKind(room);
  if (kind === 'tot') return (STAR_RANK[sao] ?? 0) * weight;
  if (kind === 'xau') return -(STAR_RANK[sao] ?? 0) * weight;
  return 0;
}

/** Kích thước khối hiển thị của một phòng trong ô của nó: giữ đúng tỷ lệ
 * khung ô và co theo diện tích hiển thị; không vượt ô, không bé tới mức
 * biến mất (tối thiểu 25% cạnh ô). */
export function roomFootprint(area: number, cellW: number, cellH: number) {
  const cellArea = cellW * cellH;
  const scale =
    cellArea > 0
      ? Math.min(1, Math.max(0.25, Math.sqrt(Math.max(area, 0) / cellArea)))
      : 1;
  return { w: cellW * scale, h: cellH * scale, scale };
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
// rộng dưới (phía Nam), mặt sau = cạnh rộng trên (phía Bắc), trái = cạnh dài
// Tây, phải = cạnh dài Đông. Khoảng cách đo từ góc: mặt trước từ góc Tây Nam
// đi về Đông; mặt sau từ góc Tây Bắc đi về Đông; trái từ góc Tây Bắc đi về
// Nam; phải từ góc Đông Bắc đi về Nam. Vượt mép thì kẹp (clamp) vào ô biên cuối.

export function wallLength(wall: DoorWall, depth: number, facade: number): number {
  return wall === 'truoc' || wall === 'sau' ? facade : depth;
}

export function doorZone(wall: DoorWall, distance: number, depth: number, facade: number): string {
  const len = wallLength(wall, depth, facade);
  const d = Math.min(Math.max(distance, 0), len);
  const seg = Math.min(2, Math.floor(d / (len / 3)));
  if (wall === 'truoc') return ['Tây Nam', 'Nam', 'Đông Nam'][seg];
  if (wall === 'sau') return ['Tây Bắc', 'Bắc', 'Đông Bắc'][seg];
  if (wall === 'trai') return ['Tây Bắc', 'Tây', 'Tây Nam'][seg];
  return ['Đông Bắc', 'Đông', 'Đông Nam'][seg];
}

/** Tọa độ cửa theo hệ mét của mặt bằng: x = Đông (0 = mép Tây, tối đa = mặt
 * tiền), y = Nam (0 = mép Bắc, tối đa = chiều sâu). */
export function doorPosition(
  wall: DoorWall,
  distance: number,
  depth: number,
  facade: number,
): { x: number; y: number } {
  const len = wallLength(wall, depth, facade);
  const d = Math.min(Math.max(distance, 0), len);
  if (wall === 'truoc') return { x: d, y: depth };
  if (wall === 'sau') return { x: d, y: 0 };
  if (wall === 'trai') return { x: 0, y: d };
  return { x: facade, y: d };
}

/** Hình chữ nhật của một hướng trên mặt bằng (mét, gốc Tây-Bắc). */
export function zoneRect(direction: string, depth: number, facade: number) {
  const z = ZONE_BY_DIRECTION[direction];
  if (!z) throw new Error(`Hướng không hợp lệ: ${direction}`);
  return { x: (z.col * facade) / 3, y: (z.row * depth) / 3, w: facade / 3, h: depth / 3 };
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
  depth: number;
  facade: number;
}): OptimizedLayout {
  const { zones, rooms, doorWall, doorDistance, depth, facade } = input;
  if (!rooms || rooms.length === 0) throw new Error('Chọn ít nhất một phòng để bố trí.');
  if (rooms.length > 8) throw new Error('Tối đa 8 phòng (mỗi hướng bát trạch chỉ đặt một phòng).');
  if (!(depth > 0) || !(facade > 0) || !Number.isFinite(depth) || !Number.isFinite(facade)) {
    throw new Error('Chiều dài (chiều sâu) và chiều rộng (mặt tiền) phải là số dương.');
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

  const plotArea = depth * facade;
  const warnings: string[] = [];
  // Diện tích hiển thị — quy tắc "phòng tự chia chỉ lấy phần CÒN LẠI":
  // phòng nhập diện tích giữ nguyên số đã nhập khi còn vừa mặt bằng; phòng
  // để trống chia đều phần còn lại (không chia đều toàn bộ mặt bằng rồi mới
  // co — cách cũ làm phòng nhập 100 m² bị co oan chỉ vì phòng trống cũng
  // tính tạm bằng 1/n mặt bằng). Chỉ khi tổng diện tích ĐÃ NHẬP đã vượt mặt
  // bằng thì mới co các phòng đã nhập theo tỷ lệ và báo rõ.
  const specifiedSum = rooms.reduce((s, r) => s + (r.area ?? 0), 0);
  const autoCount = rooms.filter((r) => r.area === undefined).length;
  let display: number[];
  if (specifiedSum > plotArea) {
    const f = plotArea / specifiedSum;
    display = rooms.map((r) => (r.area !== undefined ? Math.round(r.area * f * 10) / 10 : 0));
    warnings.push(
      `Tổng diện tích đã nhập (${Math.round(specifiedSum * 10) / 10} m²) vượt diện tích mặt bằng (${Math.round(plotArea * 10) / 10} m²) nên đã co theo tỷ lệ để vừa sơ đồ${autoCount > 0 ? '; các phòng để trống không còn diện tích để chia' : ''}; hãy giảm diện tích từng phòng hoặc tăng kích thước nhà.`,
    );
  } else if (autoCount > 0) {
    const autoShare = Math.round(((plotArea - specifiedSum) / autoCount) * 10) / 10;
    display = rooms.map((r) => (r.area !== undefined ? r.area : autoShare));
  } else {
    display = rooms.map((r) => r.area as number);
  }

  const doorDir = doorZone(doorWall, doorDistance, depth, facade);
  const doorInfo = zones[doorDir];
  const doorScore = doorInfo.tot ? SCORE_DOOR : -SCORE_DOOR;

  // Liệt kê toàn bộ: gán lần lượt từng phòng vào một hướng còn trống.
  // (Dùng biến vô hướng thay cho object nullable để tránh TS thu hẹp kiểu
  // sai sau khi gán trong hàm đệ quy.)
  let bestAssign: string[] = [];
  let bestScore = -Infinity;
  let bestTie = -Infinity;
  const used = new Set<string>();
  const current: string[] = [];
  function dfs(i: number, score: number, tie: number) {
    if (i === rooms.length) {
      if (score > bestScore || (score === bestScore && tie > bestTie)) {
        bestScore = score;
        bestTie = tie;
        bestAssign = [...current];
      }
      return;
    }
    for (const z of ZONE_GRID) {
      if (used.has(z.direction)) continue;
      used.add(z.direction);
      current.push(z.direction);
      dfs(
        i + 1,
        score + scoreRoom(rooms[i].name, zones[z.direction].tot),
        tie + tieBreakRoom(rooms[i].name, zones[z.direction].sao, rooms.length - i),
      );
      current.pop();
      used.delete(z.direction);
    }
  }
  dfs(0, 0, 0);
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
