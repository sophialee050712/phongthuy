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

// Diện tích tối thiểu theo công năng (m²) — mức "ở được thoải mái" từ thực
// hành thiết kế nhà ở Việt Nam (nghiên cứu 26/10/2026). KHÔNG phải chuẩn
// TCVN/QCVN bắt buộc: không có văn bản nào quy định mức này cho nhà riêng
// lẻ; chuẩn pháp lý duy nhất xác minh được là QCVN 04:2019 cho chung cư
// (phòng ngủ ≥ 9 m²). Phòng ăn 8 m² là phần tách từ mức bếp+ăn 12–20 m²
// (bếp 10 + ăn 8 = 18). Phòng làm việc: chưa có chuẩn đáng tin cho nhà riêng
// nên không đặt mức cứng — trả null, trang hiển thị "chưa có chuẩn".
export const MIN_AREA: Record<string, number> = {
  'Phòng khách': 15,
  'Phòng ngủ': 12,
  'Bếp': 10,
  'Phòng ăn': 8,
  'Phòng thờ': 5,
  'Nhà vệ sinh': 3,
  // Tên gọi khác của cùng một phòng (trang dùng "Nhà vệ sinh").
  'Phòng vệ sinh': 3,
  'Kho': 4,
};

export function minArea(room: string): number | null {
  return MIN_AREA[room] ?? null;
}

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
  // Diện tích hiển thị — nguyên tắc công năng (sửa 26/10 sau phản hồi
  // "phòng nhỏ xí sao ở"): KHÔNG BAO GIỜ co phòng nào xuống dưới mức tối
  // thiểu theo công năng. Phòng nhập diện tích giữ nguyên số đã nhập khi
  // còn vừa mặt bằng (tính cả mức tối thiểu của phòng để trống); phòng để
  // trống chia phần còn lại — mỗi phòng lấy mức tối thiểu trước rồi chia
  // đều phần dư, hoặc chia đều khi mức chia đều đã đủ tối thiểu. Mặt bằng
  // không đủ cho tất cả ở mức tối thiểu thì BÁO THIẾU thay vì vẽ phòng nhỏ
  // không ở được.
  const specified = rooms.map((r, i) => ({ ...r, i })).filter((r) => r.area !== undefined);
  const autos = rooms.map((r, i) => ({ ...r, i })).filter((r) => r.area === undefined);
  const specifiedSum = specified.reduce((s, r) => s + (r.area as number), 0);
  const autoCount = autos.length;
  const autoMinSum = autos.reduce((s, r) => s + (minArea(r.name) ?? 0), 0);
  // Người dùng nhập dưới mức tối thiểu: cảnh báo nhưng giữ nguyên số đã
  // nhập (ví dụ bàn thờ treo/tích hợp có thể nhỏ hơn phòng thờ riêng).
  for (const r of rooms) {
    const m = minArea(r.name);
    if (r.area !== undefined && m !== null && r.area < m) {
      warnings.push(
        `${r.name} chỉ ${r.area} m², dưới mức tối thiểu tham khảo ${m} m² cho công năng này — nếu chỉ là góc/tủ tích hợp thì không sao, còn phòng riêng sẽ chật.`,
      );
    }
  }
  const have = Math.round(plotArea * 10) / 10;
  const r1 = (x: number) => Math.round(x * 10) / 10;
  let display: number[];
  if (autoCount > 0) {
    const available = plotArea - autoMinSum;
    if (available < 0) {
      throw new Error(
        `Không đủ diện tích: riêng các phòng để trống đã cần tối thiểu ${r1(autoMinSum)} m² mà mặt bằng chỉ có ${have} m² — thiếu ${r1(autoMinSum - plotArea)} m². Bớt phòng, gộp công năng (khách–bếp liên thông, thờ tích hợp khách) hoặc tăng kích thước nhà / thêm tầng.`,
      );
    }
    // Phần dành cho phòng đã nhập: giữ nguyên nếu vừa, ngược lại co theo tỷ
    // lệ để đủ chỗ cho phòng trống ở mức tối thiểu (không co dưới mức tối
    // thiểu của chính phòng đã nhập — nếu không được thì báo thiếu).
    const specDisplay = new Map<number, number>();
    if (specifiedSum > available) {
      const f = available / specifiedSum;
      for (const r of specified) {
        const v = r1((r.area as number) * f);
        const m = minArea(r.name);
        if (m !== null && v < m) {
          throw new Error(
            `Không đủ diện tích: co phòng đã nhập theo tỷ lệ sẽ làm ${r.name} xuống dưới mức tối thiểu tham khảo ${m} m². Giảm diện tích các phòng đã nhập, bớt phòng hoặc tăng kích thước nhà.`,
          );
        }
        specDisplay.set(r.i, v);
      }
      warnings.push(
        `Tổng diện tích đã nhập (${r1(specifiedSum)} m²) vượt phần dành cho phòng đã nhập (${r1(available)} m²) nên đã co theo tỷ lệ để đủ chỗ cho các phòng để trống ở mức tối thiểu; không phòng nào xuống dưới mức tối thiểu theo công năng.`,
      );
    } else {
      for (const r of specified) specDisplay.set(r.i, r.area as number);
    }
    const specSum = [...specDisplay.values()].reduce((s, v) => s + v, 0);
    const remainder = plotArea - specSum;
    const maxAutoMin = Math.max(0, ...autos.map((r) => minArea(r.name) ?? 0));
    const leftover = remainder - autoMinSum;
    display = rooms.map((r, i) => {
      if (specDisplay.has(i)) return specDisplay.get(i) as number;
      const m = minArea(r.name) ?? 0;
      if (remainder / autoCount >= maxAutoMin) {
        return Math.max(m, r1(remainder / autoCount));
      }
      return Math.max(m, r1(m + leftover / autoCount));
    });
  } else if (specifiedSum > plotArea) {
    const f = plotArea / specifiedSum;
    const scaled = rooms.map((r) => (r.area !== undefined ? r1(r.area * f) : 0));
    const violator = rooms.find((r, i) => {
      const m = minArea(r.name);
      return m !== null && r.area !== undefined && scaled[i] < m;
    });
    if (violator) {
      throw new Error(
        `Không đủ diện tích: co theo tỷ lệ sẽ làm ${violator.name} xuống dưới mức tối thiểu tham khảo ${minArea(violator.name)} m². Giảm diện tích các phòng khác, bớt phòng hoặc tăng kích thước nhà.`,
      );
    }
    display = scaled;
    warnings.push(
      `Tổng diện tích đã nhập (${r1(specifiedSum)} m²) vượt diện tích mặt bằng (${have} m²) nên đã co theo tỷ lệ để vừa sơ đồ; không phòng nào xuống dưới mức tối thiểu theo công năng.`,
    );
  } else {
    display = rooms.map((r) => r.area as number);
  }
  // Phòng trống chia được dưới 3 m² (dưới cả mức nhỏ nhất của vệ sinh):
  // không phải chuẩn, chỉ nhắc xem lại — phòng nhỏ vậy khó dùng riêng.
  display.forEach((d, i) => {
    if (rooms[i].area === undefined && d < 3) {
      warnings.push(
        `${rooms[i].name} chỉ còn ${r1(d)} m² — quá nhỏ để dùng riêng, cân nhắc bỏ phòng này hoặc tăng diện tích nhà.`,
      );
    }
  });

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
