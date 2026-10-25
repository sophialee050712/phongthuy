// Hàm thuần túy dùng chung cho các trang công khai: chuẩn hóa kết quả engine
// (vì engine đang được build song song, các hàm này chấp nhận nhiều dạng
// trả về hợp lý và suy biến an toàn thay vì crash trang) + bảng tra tĩnh
// đã được công nhận rộng rãi (màu hợp/kỵ theo ngũ hành, Phật bản mệnh
// theo 12 con giáp). Không chứa secret, không chứa giá hay số điện thoại.

import { TUOI_12 } from '@/lib/data';

export type LunarDateLike = {
  day: number;
  month: number;
  year: number;
  leap?: boolean;
};

export function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISODate(value: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (d.getFullYear() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null;
  return d;
}

export function fmtSolar(d: Date): string {
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

export function fmtLunar(l: LunarDateLike | null | undefined): string {
  if (!l) return '[CHỜ ĐIỀN]';
  return `ngày ${l.day} tháng ${l.month}${l.leap ? ' nhuận' : ''} năm ${l.year} âm lịch`;
}

export function zodiacOfLunarYear(lunarYear: number): string {
  const idx = ((lunarYear - 4) % 12 + 12) % 12;
  return TUOI_12[idx];
}

/** Lấy ngũ hành từ chuỗi mệnh nạp âm, VD "Hải Trung Kim" -> "Kim". */
export function nguHanhFromMenh(menh: string): string {
  for (const h of ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']) {
    if (menh.includes(h)) return h;
  }
  return '';
}

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((v) => String(v)).filter(Boolean);
  if (typeof value === 'string') return value.split(/[,;|]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

export function normalizeStars(result: unknown): { tot: string[]; xau: string[] } {
  if (!result || typeof result !== 'object') return { tot: [], xau: [] };
  const r = result as Record<string, unknown>;
  return {
    tot: asStringArray(r.tot ?? r.saoTot ?? r.good ?? r.sao_tot),
    xau: asStringArray(r.xau ?? r.saoXau ?? r.bad ?? r.sao_xau),
  };
}

export function normalizeLuanSo(result: unknown): {
  tongNut: string;
  nguHanhChuDao: string;
  phanTich: string;
} {
  if (!result || typeof result !== 'object') return { tongNut: '', nguHanhChuDao: '', phanTich: '' };
  const r = result as Record<string, unknown>;
  const phanTichRaw = r.phanTich ?? r.phan_tich ?? r.nhanXet ?? r.luanGiai ?? '';
  const phanTich = Array.isArray(phanTichRaw)
    ? phanTichRaw.map((v) => String(v)).join(' ')
    : String(phanTichRaw ?? '');
  return {
    tongNut: String(r.tongNut ?? r.tong_nut ?? r.nut ?? ''),
    nguHanhChuDao: String(r.nguHanhChuDao ?? r.ngu_hanh_chu_dao ?? r.chuDao ?? ''),
    phanTich,
  };
}

export function normalizeScore(result: unknown): { diem: number | null; nhanXet: string } {
  if (typeof result === 'number') return { diem: result, nhanXet: '' };
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    const raw = r.diem ?? r.tongDiem ?? r.score ?? null;
    const diem = typeof raw === 'number' ? raw : raw != null && !Number.isNaN(Number(raw)) ? Number(raw) : null;
    return { diem, nhanXet: String(r.nhanXet ?? r.nhan_xet ?? r.danhGia ?? r.giaiThich ?? '') };
  }
  return { diem: null, nhanXet: '' };
}

export function normalizeThanSo(result: unknown): number | null {
  if (typeof result === 'number') return result;
  if (result && typeof result === 'object') {
    const r = result as Record<string, unknown>;
    const raw = r.soChuDao ?? r.chuDao ?? r.so_chu_dao ?? r.number ?? null;
    if (typeof raw === 'number') return raw;
    if (raw != null && !Number.isNaN(Number(raw))) return Number(raw);
  }
  return null;
}

export const MAU_HOP_KY: Record<string, { hop: string[]; ky: string[] }> = {
  Kim: { hop: ['Trắng', 'Xám', 'Vàng', 'Nâu đất'], ky: ['Đỏ', 'Hồng', 'Tím'] },
  Mộc: { hop: ['Xanh lá', 'Đen', 'Xanh dương'], ky: ['Trắng', 'Xám', 'Ghi'] },
  Thủy: { hop: ['Đen', 'Xanh dương', 'Trắng', 'Xám'], ky: ['Vàng', 'Nâu đất'] },
  Hỏa: { hop: ['Đỏ', 'Hồng', 'Tím', 'Xanh lá'], ky: ['Đen', 'Xanh dương'] },
  Thổ: { hop: ['Vàng', 'Nâu đất', 'Đỏ', 'Hồng'], ky: ['Xanh lá'] },
};

// Số hợp theo ngũ hành, mang tính tham khảo (quy ước phổ biến trong
// các bảng tra phong thủy; không phải kết luận tuyệt đối).
export const SO_HOP: Record<string, number[]> = {
  Kim: [6, 7],
  Mộc: [3, 4],
  Thủy: [1, 6],
  Hỏa: [2, 7],
  Thổ: [5, 8],
};

// Phật bản mệnh theo 12 con giáp (bảng chuẩn phổ biến).
export const PHAT_BAN_MENH: Record<string, string> = {
  Tý: 'Thiên Thủ Thiên Nhãn Bồ Tát (Quan Âm nghìn mắt nghìn tay)',
  Sửu: 'Hư Không Tạng Bồ Tát',
  Dần: 'Hư Không Tạng Bồ Tát',
  Mão: 'Văn Thù Bồ Tát',
  Thìn: 'Phổ Hiền Bồ Tát',
  Tỵ: 'Phổ Hiền Bồ Tát',
  Ngọ: 'Đại Thế Chí Bồ Tát',
  Mùi: 'Như Lai Đại Nhật',
  Thân: 'Như Lai Đại Nhật',
  Dậu: 'Bất Động Minh Vương',
  Tuất: 'Phật A Di Đà',
  Hợi: 'Phật A Di Đà',
};

export const DIRECTIONS = ['Bắc', 'Đông Bắc', 'Đông', 'Đông Nam', 'Nam', 'Tây Nam', 'Tây', 'Tây Bắc'];

// Pool tên mẫu: tên Việt phổ biến + ngũ hành của tên + ý nghĩa ngắn gọn,
// theo nghĩa từ điển thông thường (không bịa ý nghĩa cao siêu).
// GHI CHÚ: pool mẫu cần mở rộng thêm trước khi dùng cho tư vấn chính thức.
export const TEN_POOL: { ten: string; nguHanh: string; yNghia: string }[] = [
  { ten: 'An', nguHanh: 'Thổ', yNghia: 'Bình an, yên ổn' },
  { ten: 'Minh', nguHanh: 'Hỏa', yNghia: 'Sáng suốt, rõ ràng' },
  { ten: 'Anh', nguHanh: 'Mộc', yNghia: 'Tinh anh, lanh lợi' },
  { ten: 'Bảo', nguHanh: 'Thổ', yNghia: 'Quý giá, được nâng niu' },
  { ten: 'Châu', nguHanh: 'Kim', yNghia: 'Ngọc châu, trong sáng' },
  { ten: 'Dũng', nguHanh: 'Thổ', yNghia: 'Dũng cảm, mạnh mẽ' },
  { ten: 'Đức', nguHanh: 'Thổ', yNghia: 'Đức độ, nhân hậu' },
  { ten: 'Gia', nguHanh: 'Mộc', yNghia: 'Gia đình, tốt đẹp' },
  { ten: 'Hà', nguHanh: 'Thủy', yNghia: 'Dòng sông, hiền hòa' },
  { ten: 'Hải', nguHanh: 'Thủy', yNghia: 'Biển rộng, bao dung' },
  { ten: 'Hạnh', nguHanh: 'Mộc', yNghia: 'Hạnh phúc, nết na' },
  { ten: 'Hiếu', nguHanh: 'Thủy', yNghia: 'Hiếu thảo với cha mẹ' },
  { ten: 'Huy', nguHanh: 'Hỏa', yNghia: 'Rực rỡ, sáng chói' },
  { ten: 'Khánh', nguHanh: 'Kim', yNghia: 'Mừng vui, phúc lành' },
  { ten: 'Khang', nguHanh: 'Kim', yNghia: 'Khỏe mạnh, an khang' },
  { ten: 'Lan', nguHanh: 'Mộc', yNghia: 'Hoa lan, thanh cao' },
  { ten: 'Linh', nguHanh: 'Hỏa', yNghia: 'Linh hoạt, tinh anh' },
  { ten: 'Long', nguHanh: 'Thủy', yNghia: 'Rồng, mạnh mẽ' },
  { ten: 'Ngọc', nguHanh: 'Kim', yNghia: 'Ngọc quý, trong sáng' },
  { ten: 'Nhân', nguHanh: 'Kim', yNghia: 'Nhân hậu, tình người' },
  { ten: 'Phong', nguHanh: 'Thủy', yNghia: 'Gió, phóng khoáng' },
  { ten: 'Phúc', nguHanh: 'Thủy', yNghia: 'Phúc lành, may mắn' },
  { ten: 'Quân', nguHanh: 'Mộc', yNghia: 'Quân tử, ngay thẳng' },
  { ten: 'Sơn', nguHanh: 'Thổ', yNghia: 'Núi, vững chãi' },
  { ten: 'Thanh', nguHanh: 'Kim', yNghia: 'Trong trẻo, thanh cao' },
  { ten: 'Thảo', nguHanh: 'Mộc', yNghia: 'Cỏ thơm, dịu dàng' },
  { ten: 'Tuấn', nguHanh: 'Kim', yNghia: 'Tuấn tú, khôi ngô' },
  { ten: 'Tú', nguHanh: 'Kim', yNghia: 'Tinh tú, sáng đẹp' },
];

export function sinhKhac(a: string, b: string): 'sinh' | 'khac' | 'binh' {
  // a sinh/khắc b? Vòng tương sinh: Mộc->Hỏa->Thổ->Kim->Thủy->Mộc.
  // Vòng tương khắc: Mộc->Thổ->Thủy->Hỏa->Kim->Mộc.
  const sinh: Record<string, string> = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
  const khac: Record<string, string> = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' };
  if (sinh[a] === b || sinh[b] === a) return 'sinh';
  if (khac[a] === b || khac[b] === a) return 'khac';
  return 'binh';
}
