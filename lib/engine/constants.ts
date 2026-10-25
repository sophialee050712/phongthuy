// Bảng tra cứu chuẩn dùng chung cho engine phong thủy.
// Quy ước chính tả: chi thứ 6 viết là "Tỵ" (theo bảng can chi trong hợp đồng).
// Vector 3 của task viết "Tân Tị" — đó chỉ là biến thể chính tả của "Tân Tỵ".

export const STEMS = [
  'Giáp',
  'Ất',
  'Bính',
  'Đinh',
  'Mậu',
  'Kỷ',
  'Canh',
  'Tân',
  'Nhâm',
  'Quý',
] as const;

export const BRANCHES = [
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
] as const;

export type NguHanh = 'Kim' | 'Mộc' | 'Thủy' | 'Hỏa' | 'Thổ';

export const STEM_ELEMENT: Record<string, NguHanh> = {
  Giáp: 'Mộc',
  Ất: 'Mộc',
  Bính: 'Hỏa',
  Đinh: 'Hỏa',
  Mậu: 'Thổ',
  Kỷ: 'Thổ',
  Canh: 'Kim',
  Tân: 'Kim',
  Nhâm: 'Thủy',
  Quý: 'Thủy',
};

// Mệnh nạp âm: 60 hoa giáp, mỗi cặp 2 can chi liên tiếp chung một nạp âm.
// Thứ tự bắt đầu từ Giáp Tý. Đã đối chiếu: Giáp Ngọ -> Sa Trung Kim (đúng ví dụ trong hợp đồng).
export const NAP_AM_30 = [
  'Hải Trung Kim', // Giáp Tý, Ất Sửu
  'Lư Trung Hỏa', // Bính Dần, Đinh Mão
  'Đại Lâm Mộc', // Mậu Thìn, Kỷ Tỵ
  'Lộ Bàng Thổ', // Canh Ngọ, Tân Mùi
  'Kiếm Phong Kim', // Nhâm Thân, Quý Dậu
  'Sơn Đầu Hỏa', // Giáp Tuất, Ất Hợi
  'Giản Hạ Thủy', // Bính Tý, Đinh Sửu
  'Thành Đầu Thổ', // Mậu Dần, Kỷ Mão
  'Bạch Lạp Kim', // Canh Thìn, Tân Tỵ
  'Dương Liễu Mộc', // Nhâm Ngọ, Quý Mùi
  'Tuyền Trung Thủy', // Giáp Thân, Ất Dậu
  'Ốc Thượng Thổ', // Bính Tuất, Đinh Hợi
  'Tích Lịch Hỏa', // Mậu Tý, Kỷ Sửu
  'Tùng Bách Mộc', // Canh Dần, Tân Mão
  'Trường Lưu Thủy', // Nhâm Thìn, Quý Tỵ
  'Sa Trung Kim', // Giáp Ngọ, Ất Mùi
  'Sơn Hạ Hỏa', // Bính Thân, Đinh Dậu
  'Bình Địa Mộc', // Mậu Tuất, Kỷ Hợi
  'Bích Thượng Thổ', // Canh Tý, Tân Sửu
  'Kim Bạch Kim', // Nhâm Dần, Quý Mão
  'Phúc Đăng Hỏa', // Giáp Thìn, Ất Tỵ
  'Thiên Hà Thủy', // Bính Ngọ, Đinh Mùi
  'Đại Dịch Thổ', // Mậu Thân, Kỷ Dậu
  'Thoa Xuyến Kim', // Canh Tuất, Tân Hợi
  'Tang Đố Mộc', // Nhâm Tý, Quý Sửu
  'Đại Khê Thủy', // Giáp Dần, Ất Mão
  'Sa Trung Thổ', // Bính Thìn, Đinh Tỵ
  'Thiên Thượng Hỏa', // Mậu Ngọ, Kỷ Mùi
  'Thạch Lựu Mộc', // Canh Thân, Tân Dậu
  'Đại Hải Thủy', // Nhâm Tuất, Quý Hợi
] as const;

export const DIRECTIONS = [
  'Bắc',
  'Đông Bắc',
  'Đông',
  'Đông Nam',
  'Nam',
  'Tây Nam',
  'Tây',
  'Tây Bắc',
] as const;

// 12 thần giờ hoàng đạo, đúng thứ tự quay vòng.
export const HOUR_GODS = [
  'Thanh Long',
  'Minh Đường',
  'Thiên Hình',
  'Chu Tước',
  'Kim Quỹ',
  'Bảo Quang',
  'Bạch Hổ',
  'Ngọc Đường',
  'Thiên Lao',
  'Câu Trận',
  'Tư Mệnh',
  'Nguyên Vũ',
] as const;

export const HOANG_DAO_GODS = new Set([
  'Thanh Long',
  'Minh Đường',
  'Kim Quỹ',
  'Bảo Quang',
  'Ngọc Đường',
  'Tư Mệnh',
]);

export const HOUR_LABELS = [
  'Tý (23h-1h)',
  'Sửu (1h-3h)',
  'Dần (3h-5h)',
  'Mão (5h-7h)',
  'Thìn (7h-9h)',
  'Tỵ (9h-11h)',
  'Ngọ (11h-13h)',
  'Mùi (13h-15h)',
  'Thân (15h-17h)',
  'Dậu (17h-19h)',
  'Tuất (19h-21h)',
  'Hợi (21h-23h)',
] as const;

/** mod dương (trả về 0..m-1 kể cả khi n âm). */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

export function stemIndex(stem: string): number {
  const i = (STEMS as readonly string[]).indexOf(stem);
  if (i < 0) throw new Error(`Can không hợp lệ: ${stem}`);
  return i;
}

export function branchIndex(branch: string): number {
  const i = (BRANCHES as readonly string[]).indexOf(branch);
  if (i < 0) throw new Error(`Chi không hợp lệ: ${branch}`);
  return i;
}

/** Tách "Giáp Dần" -> { stem: 'Giáp', branch: 'Dần' }. */
export function parseCanChi(canChi: string): { stem: string; branch: string } {
  const parts = canChi.trim().split(/\s+/);
  if (parts.length !== 2) throw new Error(`Can chi không hợp lệ: ${canChi}`);
  // Validate để báo lỗi sớm thay vì trả kết quả sai.
  stemIndex(parts[0]);
  branchIndex(parts[1]);
  return { stem: parts[0], branch: parts[1] };
}

/** Tương sinh: Mộc->Hỏa->Thổ->Kim->Thủy->Mộc. */
export const SINH: Record<NguHanh, NguHanh> = {
  Mộc: 'Hỏa',
  Hỏa: 'Thổ',
  Thổ: 'Kim',
  Kim: 'Thủy',
  Thủy: 'Mộc',
};

/** Tương khắc: Mộc->Thổ->Thủy->Hỏa->Kim->Mộc. */
export const KHAC: Record<NguHanh, NguHanh> = {
  Mộc: 'Thổ',
  Thổ: 'Thủy',
  Thủy: 'Hỏa',
  Hỏa: 'Kim',
  Kim: 'Mộc',
};

/** Ngũ hành của chữ số (dùng cho luận số và số tên). */
export const DIGIT_ELEMENT: Record<string, NguHanh> = {
  '0': 'Hỏa',
  '1': 'Thủy',
  '2': 'Thổ',
  '3': 'Mộc',
  '4': 'Mộc',
  '5': 'Thổ',
  '6': 'Kim',
  '7': 'Kim',
  '8': 'Thổ',
  '9': 'Hỏa',
};
