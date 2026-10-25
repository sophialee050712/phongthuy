// Hồ sơ cá nhân phía client — CHỈ lưu trong localStorage của trình duyệt,
// KHÔNG tài khoản, KHÔNG gửi ngày sinh lên server.
// Key thống nhất cho ngày sinh: 'khang-an-birthdate', giá trị 'YYYY-MM-DD'.
// Giới tính (chỉ dùng để tính cung phi) lưu riêng ở key phụ, cũng local-only.

import { solarToLunar, canChiYear, menhNapAm } from '@/lib/engine';

export const BIRTHDATE_KEY = 'khang-an-birthdate';
export const GENDER_KEY = 'khang-an-gender';

export type GioiTinh = 'nam' | 'nu';

export function isValidISODate(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return false;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return (
    d.getFullYear() === Number(m[1]) &&
    d.getMonth() === Number(m[2]) - 1 &&
    d.getDate() === Number(m[3])
  );
}

/** Đọc ngày sinh đã lưu, hoặc null khi chưa lưu / giá trị hỏng. */
export function getBirthdate(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(BIRTHDATE_KEY);
    return v && isValidISODate(v) ? v : null;
  } catch {
    return null;
  }
}

/** Lưu ngày sinh (chuỗi 'YYYY-MM-DD'). Trả false khi định dạng không hợp lệ. */
export function setBirthdate(value: string): boolean {
  if (!isValidISODate(value)) return false;
  if (typeof window === 'undefined') return false;
  try {
    window.localStorage.setItem(BIRTHDATE_KEY, value.trim());
    return true;
  } catch {
    return false;
  }
}

export function clearBirthdate(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(BIRTHDATE_KEY);
  } catch {
    // bỏ qua lỗi storage
  }
}

export function getGender(): GioiTinh | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(GENDER_KEY);
    return v === 'nam' || v === 'nu' ? v : null;
  } catch {
    return null;
  }
}

export function setGender(value: GioiTinh): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(GENDER_KEY, value);
  } catch {
    // bỏ qua lỗi storage
  }
}

export type BirthProfile = {
  /** Ngày sinh dương lịch dạng 'YYYY-MM-DD'. */
  solar: string;
  /** Âm lịch tương ứng (day/month/year/leap). */
  lunar: { day: number; month: number; year: number; leap: boolean };
  /** Tuổi dương lịch (tính tới hôm nay, theo ngày sinh nhật đã qua hay chưa). */
  tuoi: number;
  /** Con giáp theo năm âm lịch. */
  conGiap: string;
  /** Can chi năm âm lịch. */
  canChiNam: string;
  /** Mệnh nạp âm theo năm âm lịch. */
  menh: string;
};

const CON_GIAP_12 = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];

/**
 * Tính tuổi + con giáp + mệnh từ ngày sinh dương lịch.
 * Trả null khi ngày không hợp lệ hoặc engine không tính được.
 * Lưu ý: con giáp/mệnh lấy theo NĂM ÂM LỊCH (người sinh tháng 1–2 dương
 * trước Tết thuộc năm âm trước).
 */
export function profileFromBirthdate(value: string, today = new Date()): BirthProfile | null {
  if (!isValidISODate(value)) return null;
  const [y, m, d] = value.split('-').map(Number);
  try {
    const lunar = solarToLunar(y, m, d);
    const canChiNam = canChiYear(lunar.year);
    const menh = menhNapAm(canChiNam);
    let tuoi = today.getFullYear() - y;
    const birthdayPassed =
      today.getMonth() + 1 > m ||
      (today.getMonth() + 1 === m && today.getDate() >= d);
    if (!birthdayPassed) tuoi -= 1;
    const conGiap = CON_GIAP_12[((lunar.year - 4) % 12 + 12) % 12];
    return {
      solar: value,
      lunar: { day: lunar.day, month: lunar.month, year: lunar.year, leap: !!lunar.leap },
      tuoi,
      conGiap,
      canChiNam,
      menh,
    };
  } catch {
    return null;
  }
}
