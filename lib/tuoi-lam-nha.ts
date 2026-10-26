// Tuổi làm nhà: Kim Lâu / Hoang Ốc / Tam Tai + mượn tuổi (ý 4).
// Công thức đã xác minh đối chiếu bảng 2023 đầy đủ — xem
// workspace/goals/feng-shui-fortune-telling-website/hidden_files/tuoi-lam-nha-verification.md.
// Quy ước: tuổi mụ = năm làm nhà − năm sinh (DƯƠNG LỊCH) + 1. Các nguồn có khác nhau
// về năm sinh âm lịch cho người sinh trước Tết — trang công cụ ghi rõ quy ước này.
// Chỉ dùng import tương đối (vitest không hiểu alias @/).

import { canChiYear, menhNapAm } from './engine';

export type KimLau =
  | { pham: false }
  | { pham: true; loai: 'Thân' | 'Thê' | 'Tử' | 'Lục Súc'; du: number };

export type HoangOc =
  | { xet: false }
  | { xet: true; cung: number; ten: string; tot: boolean };

export type TamTai =
  | { pham: false }
  | { pham: true; nhom: string[]; namThu: 1 | 2 | 3 };

export const HOANG_OC_TEN: Record<number, string> = {
  1: 'Nhất Cát',
  2: 'Nhị Nghi',
  3: 'Tam Địa Sát',
  4: 'Tứ Tấn Tài',
  5: 'Ngũ Thọ Tử',
  6: 'Lục Hoang Ốc',
};

// 4 nhóm Tam Hợp → 3 năm Tam Tai tương ứng (thứ tự = năm thứ 1/2/3 trong chu kỳ).
export const TAM_HOP: { nhom: string[]; ky: string[] }[] = [
  { nhom: ['Thân', 'Tý', 'Thìn'], ky: ['Dần', 'Mão', 'Thìn'] },
  { nhom: ['Tỵ', 'Dậu', 'Sửu'], ky: ['Hợi', 'Tý', 'Sửu'] },
  { nhom: ['Dần', 'Ngọ', 'Tuất'], ky: ['Thân', 'Dậu', 'Tuất'] },
  { nhom: ['Hợi', 'Mão', 'Mùi'], ky: ['Tỵ', 'Ngọ', 'Mùi'] },
];

/** Tuổi mụ theo quy ước trang dùng: năm làm nhà − năm sinh dương lịch + 1. */
export function tuoiMu(namSinh: number, namLamNha: number): number {
  return namLamNha - namSinh + 1;
}

/** Kim Lâu: tuổi mụ chia 9; dư 1/3/6/8 thì phạm (3 = Thê, 6 = Tử theo đa số nguồn). */
export function kimLau(tuoi: number): KimLau {
  const du = ((tuoi % 9) + 9) % 9;
  const loai: Record<number, 'Thân' | 'Thê' | 'Tử' | 'Lục Súc'> = {
    1: 'Thân',
    3: 'Thê',
    6: 'Tử',
    8: 'Lục Súc',
  };
  const l = loai[du];
  return l ? { pham: true, loai: l, du } : { pham: false };
}

/**
 * Hoang Ốc: vòng 6 cung theo mốc chục (10 → 1, 20 → 2, …, 60 → 6, 70 → 1),
 * tuổi lẻ đếm tiếp từ mốc chục liền trước. Tốt: cung 1/2/4. Dưới 10 tuổi không xét.
 */
export function hoangOc(tuoi: number): HoangOc {
  if (tuoi < 10) return { xet: false };
  const cung = ((Math.floor((tuoi - 10) / 10) + (tuoi % 10)) % 6) + 1;
  return { xet: true, cung, ten: HOANG_OC_TEN[cung], tot: cung === 1 || cung === 2 || cung === 4 };
}

/** Lấy địa chi từ can chi dạng "Canh Ngọ" (từ cuối). */
export function chiCuaCanChi(canChi: string): string {
  const parts = canChi.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/** Tam Tai: địa chi năm sinh thuộc nhóm nào, địa chi năm xây có nằm trong 3 năm kỵ không. */
export function tamTai(chiSinh: string, chiNamXay: string): TamTai {
  for (const g of TAM_HOP) {
    if (!g.nhom.includes(chiSinh)) continue;
    const idx = g.ky.indexOf(chiNamXay);
    if (idx >= 0) return { pham: true, nhom: g.nhom, namThu: (idx + 1) as 1 | 2 | 3 };
    return { pham: false };
  }
  return { pham: false };
}

export type KetQuaTuoiLamNha = {
  tuoi: number;
  canChiSinh: string;
  chiSinh: string;
  canChiNamXay: string;
  chiNamXay: string;
  menh: string;
  menhElement: string;
  kimLau: KimLau;
  hoangOc: HoangOc;
  tamTai: TamTai;
  tot: boolean; // không phạm cả 3 hạn (Hoang Ốc dưới 10 tuổi tính là chưa xét, không tính là tốt)
};

/** Tính đủ 3 hạn cho một người (gia chủ hoặc người cho mượn tuổi). */
export function tuoiLamNha(namSinh: number, namLamNha: number): KetQuaTuoiLamNha {
  const tuoi = tuoiMu(namSinh, namLamNha);
  const canChiSinh = String(canChiYear(namSinh) ?? '');
  const canChiNamXay = String(canChiYear(namLamNha) ?? '');
  const chiSinh = chiCuaCanChi(canChiSinh);
  const chiNamXay = chiCuaCanChi(canChiNamXay);
  const menh = String(menhNapAm(canChiSinh) ?? '');
  const menhElement = menh.trim().split(/\s+/).pop() ?? '';
  const kl = kimLau(tuoi);
  const ho = hoangOc(tuoi);
  const tt = tamTai(chiSinh, chiNamXay);
  const tot = !kl.pham && (ho.xet ? ho.tot : false) && !tt.pham;
  return {
    tuoi,
    canChiSinh,
    chiSinh,
    canChiNamXay,
    chiNamXay,
    menh,
    menhElement,
    kimLau: kl,
    hoangOc: ho,
    tamTai: tt,
    tot,
  };
}

// Quan hệ ngũ hành (cùng vòng với format.ts sinhKhac, viết lại ở lib để tránh alias @/).
const SINH: Record<string, string> = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
const KHAC: Record<string, string> = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' };

/** Quan hệ mệnh người mượn với mệnh gia chủ: sinh / khắc / cùng hành / bình (khác hành, không sinh khắc). */
export function quanHeMenh(menhMuon: string, menhChu: string): 'sinh' | 'khac' | 'cung-hanh' | 'binh' {
  if (!menhMuon || !menhChu) return 'binh';
  if (menhMuon === menhChu) return 'cung-hanh';
  if (SINH[menhMuon] === menhChu || SINH[menhChu] === menhMuon) return 'sinh';
  if (KHAC[menhMuon] === menhChu || KHAC[menhChu] === menhMuon) return 'khac';
  return 'binh';
}

/** Hai chi có cùng nhóm Tam Hợp không (gợi ý chọn người mượn tuổi hợp tuổi). */
export function cungTamHop(chiA: string, chiB: string): boolean {
  return TAM_HOP.some((g) => g.nhom.includes(chiA) && g.nhom.includes(chiB));
}
