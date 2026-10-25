// Cung phi, bát trạch, giờ hoàng đạo, sao ngày (bộ cơ bản).
import {
  BRANCHES,
  HOANG_DAO_GODS,
  HOUR_GODS,
  HOUR_LABELS,
  branchIndex,
  mod,
  parseCanChi,
} from './constants';

export type HuongInfo = { sao: string; tot: boolean };

export type GioInfo = { gio: string; sao: string; hoangDao: boolean };

// ---- Cung phi ----

const CUNG_BY_NUMBER: Record<number, string> = {
  1: 'Khảm',
  2: 'Khôn',
  3: 'Chấn',
  4: 'Tốn',
  6: 'Càn',
  7: 'Đoài',
  8: 'Cấn',
  9: 'Ly',
};

const DONG_TU = new Set([1, 3, 4, 9]); // Khảm, Chấn, Tốn, Ly

function digitRoot1to9(n: number): number {
  let s = Math.abs(n);
  while (s > 9) {
    s = String(s)
      .split('')
      .reduce((acc, ch) => acc + Number(ch), 0);
  }
  return s === 0 ? 9 : s;
}

/**
 * Cung phi từ NĂM ÂM LỊCH (người sinh tháng 1-2 dương trước Tết phải đổi
 * sang năm âm trước rồi mới gọi hàm này).
 * Rút gọn tổng chữ số năm về 1-9; nam = 11 - số đó; nữ = số đó + 4;
 * nếu > 9 trừ 9; nam ra 5 -> 2 (Khôn), nữ ra 5 -> 8 (Cấn).
 */
export function cungPhi(
  gioiTinh: 'nam' | 'nu',
  lunarYear: number,
): { cung: string; nhom: 'Đông' | 'Tây' } {
  if (gioiTinh !== 'nam' && gioiTinh !== 'nu') {
    throw new Error(`Giới tính không hợp lệ: ${gioiTinh}`);
  }
  const digitSum = String(Math.abs(lunarYear))
    .split('')
    .reduce((acc, ch) => acc + Number(ch), 0);
  const num = digitRoot1to9(digitSum);
  let n: number;
  if (gioiTinh === 'nam') {
    n = 11 - num;
    if (n > 9) n -= 9;
    if (n === 5) n = 2;
  } else {
    n = num + 4;
    if (n > 9) n -= 9;
    if (n === 5) n = 8;
  }
  const cung = CUNG_BY_NUMBER[n];
  if (!cung) throw new Error(`Không map được cung phi từ số ${n}`);
  return { cung, nhom: DONG_TU.has(n) ? 'Đông' : 'Tây' };
}

// ---- Bát trạch ----
// Bảng hướng -> sao cho từng cung. 4 sao tốt: Sinh Khí, Thiên Y, Diên Niên,
// Phục Vị. 4 sao xấu: Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại.
// LƯU Ý ĐỘ LỆCH SO VỚI BẢN TASK: task ghi Khảm "Diên Niên Bắc" nhưng như
// vậy Khảm sẽ có 2 sao ở Bắc (Diên Niên + Phục Vị) và thiếu hướng Nam —
// phá vỡ tính song ánh 8 sao / 8 hướng của bát trạch. Bảng chuẩn phổ biến
// ghi Khảm Diên Niên = Nam, engine dùng bảng chuẩn này. Xem README §5.
// Các cung còn lại khớp hoàn toàn với bảng trong task.
const BAT_TRACH_TABLE: Record<string, Record<string, string>> = {
  Càn: {
    Tây: 'Sinh Khí',
    'Đông Bắc': 'Thiên Y',
    'Tây Nam': 'Diên Niên',
    'Tây Bắc': 'Phục Vị',
    Nam: 'Tuyệt Mệnh',
    Đông: 'Ngũ Quỷ',
    Bắc: 'Lục Sát',
    'Đông Nam': 'Họa Hại',
  },
  Khảm: {
    'Đông Nam': 'Sinh Khí',
    Đông: 'Thiên Y',
    Nam: 'Diên Niên',
    Bắc: 'Phục Vị',
    'Tây Nam': 'Tuyệt Mệnh',
    'Đông Bắc': 'Ngũ Quỷ',
    'Tây Bắc': 'Lục Sát',
    Tây: 'Họa Hại',
  },
  Cấn: {
    'Tây Nam': 'Sinh Khí',
    Tây: 'Thiên Y',
    'Tây Bắc': 'Diên Niên',
    'Đông Bắc': 'Phục Vị',
    'Đông Nam': 'Tuyệt Mệnh',
    Bắc: 'Ngũ Quỷ',
    Đông: 'Lục Sát',
    Nam: 'Họa Hại',
  },
  Chấn: {
    Nam: 'Sinh Khí',
    Bắc: 'Thiên Y',
    'Đông Nam': 'Diên Niên',
    Đông: 'Phục Vị',
    Tây: 'Tuyệt Mệnh',
    'Tây Bắc': 'Ngũ Quỷ',
    'Đông Bắc': 'Lục Sát',
    'Tây Nam': 'Họa Hại',
  },
  Tốn: {
    Bắc: 'Sinh Khí',
    Nam: 'Thiên Y',
    Đông: 'Diên Niên',
    'Đông Nam': 'Phục Vị',
    'Đông Bắc': 'Tuyệt Mệnh',
    'Tây Nam': 'Ngũ Quỷ',
    Tây: 'Lục Sát',
    'Tây Bắc': 'Họa Hại',
  },
  Ly: {
    Đông: 'Sinh Khí',
    'Đông Nam': 'Thiên Y',
    Bắc: 'Diên Niên',
    Nam: 'Phục Vị',
    'Tây Bắc': 'Tuyệt Mệnh',
    Tây: 'Ngũ Quỷ',
    'Tây Nam': 'Lục Sát',
    'Đông Bắc': 'Họa Hại',
  },
  Khôn: {
    'Đông Bắc': 'Sinh Khí',
    'Tây Bắc': 'Thiên Y',
    Tây: 'Diên Niên',
    'Tây Nam': 'Phục Vị',
    Bắc: 'Tuyệt Mệnh',
    'Đông Nam': 'Ngũ Quỷ',
    Nam: 'Lục Sát',
    Đông: 'Họa Hại',
  },
  Đoài: {
    'Tây Bắc': 'Sinh Khí',
    'Tây Nam': 'Thiên Y',
    'Đông Bắc': 'Diên Niên',
    Tây: 'Phục Vị',
    Đông: 'Tuyệt Mệnh',
    Nam: 'Ngũ Quỷ',
    'Đông Nam': 'Lục Sát',
    Bắc: 'Họa Hại',
  },
};

const GOOD_STARS = new Set(['Sinh Khí', 'Thiên Y', 'Diên Niên', 'Phục Vị']);

export function batTrach(cung: string): Record<string, HuongInfo> {
  const table = BAT_TRACH_TABLE[cung];
  if (!table) throw new Error(`Cung không hợp lệ: ${cung}`);
  const out: Record<string, HuongInfo> = {};
  for (const dir of Object.keys(table)) {
    out[dir] = { sao: table[dir], tot: GOOD_STARS.has(table[dir]) };
  }
  return out;
}

// ---- Giờ hoàng đạo ----
// 12 thần quay vòng theo giờ, bắt đầu từ giờ Tý. Vị trí Thanh Long tại giờ
// Tý theo chi ngày: TL = (4 - 2*branchIndex) mod 12.
// LƯU Ý ĐỘ LỆCH SO VỚI BẢN TASK: task ghi TL = (2*branchIndex - 4) mod 12.
// Công thức đó chỉ đúng khi (2b-4) mod 12 rơi vào 0 hoặc 6 (ngày Dần, Tỵ,
// ...) và SAI ở vector 3 (ngày Ngọ: task cho 8 = Thiên Lao tại giờ Tý,
// trong khi vector yêu cầu Tý = Kim Quỹ = 4) cũng như sai ở 2 ví dụ độc
// lập (ngày Tân Mão, ngày Mậu Tý). Công thức (4 - 2b) mod 12 pass cả 3
// vector của task và cả 2 ví dụ độc lập đó. Xem README §6.
export function hoangDaoHours(canChiDay: string): GioInfo[] {
  const { branch } = parseCanChi(canChiDay);
  const dayBranch = branchIndex(branch);
  const tl = mod(4 - 2 * dayBranch, 12);
  return BRANCHES.map((_, hourBranch) => {
    const sao = HOUR_GODS[mod(tl + hourBranch, 12)];
    return {
      gio: HOUR_LABELS[hourBranch],
      sao,
      hoangDao: HOANG_DAO_GODS.has(sao),
    };
  });
}

// ---- Sao ngày (bộ cơ bản) ----
// Thiên Đức / Nguyệt Đức / Nguyệt Phá cần tháng âm nên chỉ tính khi caller
// truyền lunarMonth (1-12). Các sao còn lại chỉ cần can chi ngày.
// Bộ này là BỘ CƠ BẢN, cần chuyên gia mở rộng/đối chiếu trước khi public.

/** Lộc của can: Giáp->Dần, Ất->Mão, Bính/Mậu->Tỵ, Đinh/Kỷ->Ngọ, Canh->Thân, Tân->Dậu, Nhâm->Hợi, Quý->Tý. */
const LOC: Record<string, string> = {
  Giáp: 'Dần',
  Ất: 'Mão',
  Bính: 'Tỵ',
  Mậu: 'Tỵ',
  Đinh: 'Ngọ',
  Kỷ: 'Ngọ',
  Canh: 'Thân',
  Tân: 'Dậu',
  Nhâm: 'Hợi',
  Quý: 'Tý',
};

/** Thiên Ất Quý Nhân của can. */
const QUY_NHAN: Record<string, string[]> = {
  Giáp: ['Sửu', 'Mùi'],
  Mậu: ['Sửu', 'Mùi'],
  Ất: ['Tý', 'Thân'],
  Kỷ: ['Tý', 'Thân'],
  Bính: ['Hợi', 'Dậu'],
  Đinh: ['Hợi', 'Dậu'],
  Canh: ['Ngọ', 'Dần'],
  Tân: ['Ngọ', 'Dần'],
  Nhâm: ['Tỵ', 'Mão'],
  Quý: ['Tỵ', 'Mão'],
};

/** Dương Nhẫn của can. */
const DUONG_NHAN: Record<string, string> = {
  Giáp: 'Mão',
  Ất: 'Dần',
  Bính: 'Ngọ',
  Đinh: 'Tỵ',
  Mậu: 'Ngọ',
  Kỷ: 'Tỵ',
  Canh: 'Dậu',
  Tân: 'Thân',
  Nhâm: 'Tý',
  Quý: 'Hợi',
};

/** Thiên Đức theo tháng âm: giá trị có thể là can hoặc chi. */
const THIEN_DUC: Record<number, { kind: 'can' | 'chi'; value: string }> = {
  1: { kind: 'can', value: 'Đinh' },
  2: { kind: 'chi', value: 'Thân' },
  3: { kind: 'can', value: 'Nhâm' },
  4: { kind: 'can', value: 'Tân' },
  5: { kind: 'chi', value: 'Hợi' },
  6: { kind: 'can', value: 'Giáp' },
  7: { kind: 'can', value: 'Quý' },
  8: { kind: 'chi', value: 'Dần' },
  9: { kind: 'can', value: 'Bính' },
  10: { kind: 'can', value: 'Ất' },
  11: { kind: 'chi', value: 'Tỵ' },
  12: { kind: 'can', value: 'Canh' },
};

/** Nguyệt Đức theo tháng âm: 1,5,9 -> Bính; 2,6,10 -> Giáp; 3,7,11 -> Nhâm; 4,8,12 -> Canh. */
const NGUYET_DUC: Record<number, string> = {
  1: 'Bính',
  5: 'Bính',
  9: 'Bính',
  2: 'Giáp',
  6: 'Giáp',
  10: 'Giáp',
  3: 'Nhâm',
  7: 'Nhâm',
  11: 'Nhâm',
  4: 'Canh',
  8: 'Canh',
  12: 'Canh',
};

export function saoNgay(
  canChiDay: string,
  lunarMonth?: number,
): { tot: string[]; xau: string[] } {
  const { stem, branch } = parseCanChi(canChiDay);
  const tot: string[] = [];
  const xau: string[] = [];

  // Sao chỉ cần can chi ngày.
  if (LOC[stem] === branch) tot.push('Lộc');
  if ((QUY_NHAN[stem] ?? []).includes(branch)) tot.push('Thiên Ất Quý Nhân');
  if (DUONG_NHAN[stem] === branch) xau.push('Dương Nhẫn');

  // Sao cần tháng âm.
  if (lunarMonth !== undefined) {
    if (!Number.isInteger(lunarMonth) || lunarMonth < 1 || lunarMonth > 12) {
      throw new Error(`Tháng âm không hợp lệ: ${lunarMonth}`);
    }
    const td = THIEN_DUC[lunarMonth];
    if (
      (td.kind === 'can' && td.value === stem) ||
      (td.kind === 'chi' && td.value === branch)
    ) {
      tot.push('Thiên Đức');
    }
    if (NGUYET_DUC[lunarMonth] === stem) tot.push('Nguyệt Đức');
    // Nguyệt Phá: chi ngày xung chi tháng (cách 6 cung).
    const monthBranch = mod(lunarMonth + 1, 12);
    if (mod(branchIndex(branch) - monthBranch, 12) === 6) {
      xau.push('Nguyệt Phá');
    }
  }

  return { tot, xau };
}
