// Can chi năm / tháng / ngày / giờ và ngũ hành, mệnh nạp âm.
import {
  BRANCHES,
  NAP_AM_30,
  STEMS,
  STEM_ELEMENT,
  branchIndex,
  mod,
  parseCanChi,
  stemIndex,
  type NguHanh,
} from './constants';
import { jdFromDate } from './lunar';

/** Can chi năm âm lịch. Mốc: 1984 = Giáp Tý. */
export function canChiYear(lunarYear: number): string {
  if (!Number.isInteger(lunarYear)) {
    throw new Error(`Năm âm không hợp lệ: ${lunarYear}`);
  }
  const idx = mod(lunarYear - 1984, 60);
  return `${STEMS[idx % 10]} ${BRANCHES[idx % 12]}`;
}

/**
 * Can chi tháng âm lịch.
 * Chi tháng: tháng 1 = Dần, tháng 2 = Mão, ..., tháng 11 = Tý, tháng 12 = Sửu.
 * Can tháng Giêng theo can năm: Giáp/Kỷ -> Bính Dần; Ất/Canh -> Mậu Dần;
 * Bính/Tân -> Canh Dần; Đinh/Nhâm -> Nhâm Dần; Mậu/Quý -> Giáp Dần.
 * Tháng nhuận mang cùng can chi với tháng thường cùng số.
 */
export function canChiMonth(lunarYear: number, lunarMonth: number): string {
  if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
    throw new Error(`Tháng âm không hợp lệ: ${lunarMonth}`);
  }
  const yearStem = stemIndex(parseCanChi(canChiYear(lunarYear)).stem);
  const firstStem = mod(2 * yearStem + 2, 10);
  const stem = mod(firstStem + (lunarMonth - 1), 10);
  const branch = mod(lunarMonth + 1, 12);
  return `${STEMS[stem]} ${BRANCHES[branch]}`;
}

/**
 * Can chi ngày từ ngày dương lịch.
 * index = (JDN + 49) mod 60, với JDN là số ngày Julius tại giữa trưa UTC
 * (jdFromDate). Mốc kiểm chứng: 10/10/2014 -> Giáp Dần.
 */
export function canChiDay(y: number, m: number, d: number): string {
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    throw new Error('Ngày/tháng/năm phải là số nguyên');
  }
  const idx = mod(jdFromDate(d, m, y) + 49, 60);
  return `${STEMS[idx % 10]} ${BRANCHES[idx % 12]}`;
}

/**
 * Can chi giờ. Giờ Tý = 23h-1h, Sửu = 1h-3h, ..., Hợi = 21h-23h.
 * Can giờ Tý theo can ngày: Giáp/Kỷ -> Giáp Tý; Ất/Canh -> Bính Tý;
 * Bính/Tân -> Mậu Tý; Đinh/Nhâm -> Canh Tý; Mậu/Quý -> Nhâm Tý.
 */
export function canChiHour(dayCanChi: string, hour: number): string {
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`Giờ không hợp lệ (0-23): ${hour}`);
  }
  const dayStem = stemIndex(parseCanChi(dayCanChi).stem);
  const ziStem = mod(2 * dayStem, 10);
  const branch = mod(Math.floor((hour + 1) / 2), 12);
  const stem = mod(ziStem + branch, 10);
  return `${STEMS[stem]} ${BRANCHES[branch]}`;
}

/** Ngũ hành của thiên can. */
export function nguHanhOfCan(can: string): NguHanh {
  const el = STEM_ELEMENT[can];
  if (!el) throw new Error(`Can không hợp lệ: ${can}`);
  return el;
}

/** Mệnh nạp âm của năm (nhận can chi năm, ví dụ "Giáp Ngọ" -> "Sa Trung Kim"). */
export function menhNapAm(canChiYearStr: string): string {
  const { stem, branch } = parseCanChi(canChiYearStr);
  const s = stemIndex(stem);
  const b = branchIndex(branch);
  for (let i = 0; i < 60; i++) {
    if (i % 10 === s && i % 12 === b) {
      return NAP_AM_30[Math.floor(i / 2)];
    }
  }
  throw new Error(`Không tìm được hoa giáp: ${canChiYearStr}`);
}
