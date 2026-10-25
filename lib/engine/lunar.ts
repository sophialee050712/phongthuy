// Âm lịch Việt Nam (múi giờ UTC+7).
// Thuật toán: sóc (new moon) + kinh độ mặt trời theo phương pháp Meeus,
// tháng không có trung khí là tháng nhuận. Đây là phương pháp chuẩn của
// lịch âm Việt Nam (thuật toán Hồ Ngọc Đức), chỉ khác ở bước đếm tháng:
// thay vì công thức diff/29, engine đi bộ trực tiếp trên danh sách các ngày
// sóc và dùng chỉ số kinh độ mặt trời để xác định tháng nhuận — hai cách
// tương đương nhưng cách đi bộ tránh được sai số làm tròn của phép chia.
//
// Quy ước ngày: jdFromDate trả về số ngày Julius (JD) tại giữa trưa UTC
// của ngày dương lịch đó (ví dụ 1/1/2000 -> 2451545). newMoonDay là ngày
// dương lịch (theo giờ Việt Nam) mà sóc rơi vào.

export type LunarDate = {
  day: number;
  month: number;
  year: number;
  leap: boolean;
};

const TZ = 7; // Việt Nam: UTC+7

/** Số ngày Julius (tại giữa trưa UTC) của ngày dương lịch. */
export function jdFromDate(d: number, m: number, y: number): number {
  const a = Math.floor((14 - m) / 12);
  const yy = y + 4800 - a;
  const mm = m + 12 * a - 3;
  let jd =
    d +
    Math.floor((153 * mm + 2) / 5) +
    365 * yy +
    Math.floor(yy / 4) -
    Math.floor(yy / 100) +
    Math.floor(yy / 400) -
    32045;
  if (jd < 2299161) {
    jd =
      d +
      Math.floor((153 * mm + 2) / 5) +
      365 * yy +
      Math.floor(yy / 4) -
      32083;
  }
  return jd;
}

/** Thời điểm sóc thứ k (JD, theo Meeus). k = 0 ứng với sóc tháng 1/1900. */
export function newMoon(k: number): number {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 =
    2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 += 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 =
    (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * M * dr);
  C1 -= 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(2 * Mpr * dr);
  C1 -= 0.0004 * Math.sin(3 * Mpr * dr);
  C1 += 0.0104 * Math.sin(2 * F * dr) - 0.0051 * Math.sin((M + Mpr) * dr);
  C1 -= 0.0068 * Math.sin((M - Mpr) * dr) + 0.0032 * Math.sin((2 * F + M) * dr);
  C1 += 0.0018 * Math.sin((2 * F - M) * dr) - 0.0032 * Math.sin((2 * F - Mpr) * dr);
  C1 -= 0.0021 * Math.sin((M + 2 * F) * dr);
  let deltat: number;
  if (T < -11) {
    deltat =
      0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3;
  } else {
    deltat = -0.000278 + 0.000265 * T + 0.000262 * T2;
  }
  return Jd1 + C1 - deltat;
}

/**
 * Chỉ số cung hoàng đạo của mặt trời (0..11, mỗi cung 30 độ) tại 0h
 * giờ Việt Nam của ngày có số JD = dayNumber.
 * Cung 8 = 240-270 độ (chứa Đông chí 270 độ), cung 9 = 270-300 độ.
 */
export function sunLongitudeIndex(dayNumber: number, timeZone = TZ): number {
  const jdn = dayNumber - 0.5 - timeZone / 24;
  const T = (jdn - 2451545.0) / 36525.0;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL +=
    (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) +
    0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * Math.floor(L / (Math.PI * 2));
  return Math.floor((L / Math.PI) * 6);
}

/** Ngày dương lịch (số JD) mà sóc thứ k rơi vào, theo giờ Việt Nam. */
export function getNewMoonDay(k: number, timeZone = TZ): number {
  return Math.floor(newMoon(k) + 0.5 + timeZone / 24);
}

/**
 * Ngày bắt đầu tháng 11 âm của năm dương lịch yy: tháng chứa Đông chí
 * (21-22/12) của năm yy. Lấy sóc gần 31/12 nhất; nếu sóc đó đã qua Đông chí
 * (kinh độ >= cung 9) thì lùi về sóc trước.
 */
export function getLunarMonth11(yy: number, timeZone = TZ): number {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = Math.floor(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = sunLongitudeIndex(nm, timeZone);
  if (sunLong >= 9) {
    nm = getNewMoonDay(k - 1, timeZone);
  }
  return nm;
}

/** Danh sách các ngày sóc (số JD) phủ từ đầu năm (year-2) đến khoảng năm (year+5). */
function buildMonthStarts(year: number, timeZone = TZ): number[] {
  const day0 = jdFromDate(1, 1, year - 2);
  const k0 = Math.floor((day0 - 2415021.076998695) / 29.530588853) - 2;
  const starts: number[] = [];
  for (let i = 0; i < 260; i++) {
    starts.push(getNewMoonDay(k0 + i, timeZone));
  }
  return starts;
}

/**
 * Tháng nhuận = tháng không có trung khí: kinh độ mặt trời tại 0h ngày
 * đầu tháng sau vẫn cùng cung 30 độ với ngày đầu tháng này (mặt trời chưa
 * vượt qua mốc trung khí nào trong tháng).
 */
function isLeapMonth(starts: number[], j: number, timeZone = TZ): boolean {
  if (j + 1 >= starts.length) return false;
  return (
    sunLongitudeIndex(starts[j], timeZone) ===
    sunLongitudeIndex(starts[j + 1], timeZone)
  );
}

/** Tết (mùng 1 tháng Giêng) của năm âm lunarYear = sóc thứ 2 sau tháng 11 năm trước. */
function tetOf(starts: number[], lunarYear: number, timeZone = TZ): number {
  const a11 = getLunarMonth11(lunarYear - 1, timeZone);
  const idx = starts.indexOf(a11);
  if (idx < 0 || idx + 2 >= starts.length) {
    throw new Error(`Không tính được Tết năm ${lunarYear}`);
  }
  return starts[idx + 2];
}

export function solarToLunar(y: number, m: number, d: number): LunarDate {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new Error('Ngày/tháng/năm phải là số nguyên');
  }
  if (m < 1 || m > 12) throw new Error(`Tháng không hợp lệ: ${m}`);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new Error(`Ngày không hợp lệ: ${d}/${m}/${y}`);
  }

  const dayNumber = jdFromDate(d, m, y);
  const starts = buildMonthStarts(y);

  // Tháng âm chứa ngày này = sóc gần nhất không sau ngày này.
  let monthStartIdx = -1;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i] <= dayNumber) monthStartIdx = i;
    else break;
  }
  if (monthStartIdx < 0) throw new Error('Ngày nằm ngoài phạm vi tính toán');
  const monthStart = starts[monthStartIdx];
  const lunarDay = dayNumber - monthStart + 1;

  // Năm âm = năm có Tết gần nhất không sau ngày này.
  let lunarYear = y;
  for (const cand of [y - 1, y, y + 1]) {
    const tet = tetOf(starts, cand);
    if (tet <= dayNumber) lunarYear = cand;
  }

  // Đi bộ từ Tết đến tháng chứa ngày này:
  // - tháng Tết: số 1, không nhuận (tháng Giêng luôn có trung khí).
  // - mỗi tháng sau: nếu là tháng nhuận thì giữ số tháng trước nó;
  //   nếu không thì tăng số tháng lên 1.
  const tetIdx = starts.indexOf(tetOf(starts, lunarYear));
  let lunarMonth = 1;
  let leap = false;
  for (let j = tetIdx + 1; j <= monthStartIdx; j++) {
    if (isLeapMonth(starts, j)) {
      leap = j === monthStartIdx;
    } else {
      lunarMonth += 1;
      leap = false;
    }
  }

  return { day: lunarDay, month: lunarMonth, year: lunarYear, leap };
}
