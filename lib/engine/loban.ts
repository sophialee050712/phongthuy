// Thước Lỗ Ban 52,2 cm (thông thủy) — bảng tra truyền thống.
//
// NGUỒN ĐỐI CHIẾU (truy cập 2026-10-25):
//  [1] https://menoithat.vn/cach-su-dung-thuoc-lo-ban
//      — đọc toàn văn: 8 cung lớn theo thứ tự Quý Nhân, Hiểm Họa, Thiên Tai,
//      Nhân Lộc, Cô Độc, Thiên Tặc, Tể Tướng (bảng liệt kê thiếu Thiên Tai
//      nhưng tiêu đề bảng vẫn ghi đủ 8 cung); mỗi cung lớn 65 mm, mỗi cung
//      lớn chia 5 cung nhỏ 13 mm; liệt kê đầy đủ tên 5 tiểu cung của 7 cung
//      lớn (trừ Thiên Tai) cùng đánh giá tốt/xấu và ý nghĩa từng cung lớn.
//  [2] https://daquyanhvu.com/cach-tra-kich-thuoc-lo-ban-phong-thuy-chuan-huong-dan-chi-tiet-tu-a-z/
//      — 8 cung lớn cùng thứ tự và tốt/xấu như [1]; mỗi cung lớn 65 mm,
//      chia 5 cung nhỏ 13 mm; chu kỳ 522 mm.
//  [3] https://kientrucanhung.com/?p=5948
//      — cùng 8 cung lớn, thứ tự và tốt/xấu; mỗi cung lớn 65 mm, 5 cung nhỏ 13 mm.
//  [4] https://dattenhay.com/y-nghia-va-cach-dung-thuoc-lo-ban-phong-thuy-7-5-met/
//      — cùng 8 cung lớn và tốt/xấu; ghi mỗi cung lớn 65,25 mm, mỗi cung lớn
//      có 4 cung nhỏ (KHÁC với [1][2][3] về số tiểu cung).
//
// NHỮNG ĐIỂM NGUỒN KHÔNG THỐNG NHẤT — cách xử lý trong file này:
//  * Độ dài mỗi cung lớn: [1][2][3] ghi 65 mm (8 × 65 = 520 mm, thiếu 2 mm
//    so với chu kỳ 522 mm); [4] ghi 65,25 mm (= 522 / 8, khép đúng chu kỳ).
//    Công cụ dùng 65,25 mm/cung để các khoảng khép đúng 522 mm và ghi rõ
//    điều này trên giao diện. Chênh lệch tối đa so với cách ghi 65 mm là
//    2 mm ở cuối chu kỳ.
//  * Số tiểu cung: đa số nguồn ([1][2][3]) ghi 5 tiểu cung/cung lớn;
//    [4] và một số nguồn khác ghi 4. Công cụ theo phương án 5 tiểu cung
//    (13,05 mm/tiểu cung = 65,25 / 5, khép đúng cung lớn) và ghi chú rõ.
//  * Tên tiểu cung cung Thiên Tai: [1] không liệt kê; chỉ gặp trong bản
//    tóm tắt của một nguồn khác (alux.com.vn, trang bị chặn bot nên không
//    đọc được toàn văn để đối chiếu). Vì vậy toàn bộ tiểu cung Thiên Tai
//    được đánh dấu verified: false và giao diện hiển thị "chưa xác minh".
//  * Cách viết khác nhau giữa các nguồn (không đổi nghĩa): Nhân Lộc còn
//    được gọi là Phúc Lộc; Thiên Tặc còn được viết là Thiên Tắc. Cả hai
//    tên thay thế đều được ghi trong trường `alias` để người dùng đối chiếu.
//  * Tốt/xấu của tiểu cung: các nguồn không quy định tốt/xấu riêng cho
//    từng tiểu cung trong thước 52,2 cm (chỉ quy định ở cấp cung lớn).
//    Vì vậy tiểu cung KẾ THỪA tốt/xấu của cung lớn chứa nó; file này
//    KHÔNG tự đặt tốt/xấu riêng cho tiểu cung.
//
// QUY ƯỚC RANH GIỚI: khoảng là [bắt đầu, kết thúc) — điểm đúng ranh giới
// thuộc về cung bắt đầu tại đó. Số đo đúng bội số của 522 mm có phần dư 0
// nên rơi vào đầu chu kỳ mới (cung Quý Nhân).

export const LOBAN_CYCLE_MM = 522;
export const LOBAN_MAJOR_MM = 65.25; // 522 / 8
export const LOBAN_MINOR_MM = 13.05; // 65.25 / 5
/** Giới hạn nhập hợp lệ: (0, 100000] mm, tức tối đa 100 m. */
export const LOBAN_MAX_MM = 100000;

export interface LoBanMinor {
  name: string;
  /** false = tên này chưa đối chiếu được với ≥2 nguồn, UI phải ghi "chưa xác minh". */
  verified: boolean;
}

export interface LoBanMajor {
  name: string;
  alias?: string;
  tot: boolean;
  meaning: string;
  minors: LoBanMinor[];
}

export const LOBAN_MAJORS: LoBanMajor[] = [
  {
    name: 'Quý Nhân',
    tot: true,
    meaning:
      'Theo quan niệm truyền thống: gặp quý nhân giúp đỡ, gia cảnh thịnh vượng, nhiều tài lộc, con cái thành đạt, thông minh.',
    minors: [
      { name: 'Quyền Lộc', verified: true },
      { name: 'Trung Tín', verified: true },
      { name: 'Tác Quan', verified: true },
      { name: 'Phát Đạt', verified: true },
      { name: 'Thông Minh', verified: true },
    ],
  },
  {
    name: 'Hiểm Họa',
    tot: false,
    meaning:
      'Theo quan niệm truyền thống: gia đạo dễ lục đục, tán gia bại sản, tật bệnh, con cái bất hòa.',
    minors: [
      { name: 'Án Thành', verified: true },
      { name: 'Hỗ Nhân', verified: true },
      { name: 'Thất Hiếu', verified: true },
      { name: 'Tai Họa', verified: true },
      { name: 'Trường Bệnh', verified: true },
    ],
  },
  {
    name: 'Thiên Tai',
    tot: false,
    meaning:
      'Theo quan niệm truyền thống: dễ gặp ốm đau, chuyện không hay, mất của, gia đình lục đục.',
    // Chưa xác minh: chỉ gặp ở một nguồn tóm tắt, nguồn đối chiếu chính
    // ([1]) không liệt kê tiểu cung của cung này.
    minors: [
      { name: 'Hoàn Tử', verified: false },
      { name: 'Quan Tài', verified: false },
      { name: 'Thân Tàn', verified: false },
      { name: 'Thất Tài', verified: false },
      { name: 'Hệ Quả', verified: false },
    ],
  },
  {
    name: 'Thiên Tài',
    tot: true,
    meaning:
      'Theo quan niệm truyền thống: gia cảnh hưng thịnh, nhiều may mắn, con cái ngoan ngoãn, đủ đầy tiền tài lợi lộc.',
    minors: [
      { name: 'Thi Thơ', verified: true },
      { name: 'Văn Học', verified: true },
      { name: 'Thanh Quý', verified: true },
      { name: 'Tác Lộc', verified: true },
      { name: 'Thiên Lộc', verified: true },
    ],
  },
  {
    name: 'Nhân Lộc',
    alias: 'Phúc Lộc',
    tot: true,
    meaning:
      'Theo quan niệm truyền thống: gia cảnh phát triển, lộc con cái, bình yên và phú quý.',
    minors: [
      { name: 'Trí Tôn', verified: true },
      { name: 'Phú Quý', verified: true },
      { name: 'Tiến Bửu', verified: true },
      { name: 'Thập Thiện', verified: true },
      { name: 'Văn Chương', verified: true },
    ],
  },
  {
    name: 'Cô Độc',
    tot: false,
    meaning:
      'Theo quan niệm truyền thống: dễ mất người, tốn của, chia ly, đau thương, con cái ngỗ ngược.',
    minors: [
      { name: 'Bạc Nghịch', verified: true },
      { name: 'Vô Vọng', verified: true },
      { name: 'Ly Tán', verified: true },
      { name: 'Tửu Thục', verified: true },
      { name: 'Dâm Dục', verified: true },
    ],
  },
  {
    name: 'Thiên Tặc',
    alias: 'Thiên Tắc',
    tot: false,
    meaning:
      'Theo quan niệm truyền thống: dễ gặp bạo bệnh bất ngờ, tai họa, kiện tụng, lao tù.',
    minors: [
      { name: 'Phong Bệnh', verified: true },
      { name: 'Chiêu Ôn', verified: true },
      { name: 'Ơn Tài', verified: true },
      { name: 'Ngục Tù', verified: true },
      { name: 'Quan Tài', verified: true },
    ],
  },
  {
    name: 'Tể Tướng',
    tot: true,
    meaning:
      'Theo quan niệm truyền thống: gia đạo hanh thông, con cái thành tài, được quý nhân giúp đỡ.',
    minors: [
      { name: 'Đại Tài', verified: true },
      { name: 'Thi Thơ', verified: true },
      { name: 'Hoạch Tài', verified: true },
      { name: 'Hiếu Tử', verified: true },
      { name: 'Quý Nhân', verified: true },
    ],
  },
];

export interface LoBanLookup {
  inputMm: number;
  /** Phần dư trong chu kỳ 522 mm, thuộc [0, 522). */
  remainderMm: number;
  majorIndex: number;
  major: LoBanMajor;
  majorStartMm: number;
  majorEndMm: number;
  minorIndex: number;
  minor: LoBanMinor;
  minorStartMm: number;
  minorEndMm: number;
}

export function lookupLoBan(mm: number): LoBanLookup {
  if (!Number.isFinite(mm) || mm <= 0) {
    throw new Error('Số đo phải là số dương.');
  }
  const remainderMm = ((mm % LOBAN_CYCLE_MM) + LOBAN_CYCLE_MM) % LOBAN_CYCLE_MM;
  const majorIndex = Math.min(7, Math.floor(remainderMm / LOBAN_MAJOR_MM));
  const major = LOBAN_MAJORS[majorIndex];
  const majorStartMm = majorIndex * LOBAN_MAJOR_MM;
  const majorEndMm = majorStartMm + LOBAN_MAJOR_MM;
  const minorIndex = Math.min(
    4,
    Math.floor((remainderMm - majorStartMm) / LOBAN_MINOR_MM),
  );
  const minor = major.minors[minorIndex];
  const minorStartMm = majorStartMm + minorIndex * LOBAN_MINOR_MM;
  const minorEndMm = minorStartMm + LOBAN_MINOR_MM;
  return {
    inputMm: mm,
    remainderMm,
    majorIndex,
    major,
    majorStartMm,
    majorEndMm,
    minorIndex,
    minor,
    minorStartMm,
    minorEndMm,
  };
}

export interface NearestGood {
  /** Cung tốt đích (tên cung lớn). */
  majorName: string;
  /** Số đo đích tuyệt đối (mm), đã cộng/trừ qua chu kỳ khi cần. */
  targetMm: number;
  /** Khoảng điều chỉnh tuyệt đối (mm), luôn ≥ 0. */
  deltaMm: number;
  /** true khi số đo đã ở cung tốt và không cần điều chỉnh theo hướng này. */
  alreadyGood: boolean;
}

export interface NearestAuspicious {
  below: NearestGood;
  above: NearestGood;
}

/**
 * Cung tốt gần nhất phía dưới (bớt đi) và phía trên (thêm vào).
 * - Phía dưới: nếu đang ở cung xấu, đích là cuối cung tốt gần nhất phía
 *   dưới trong cùng chu kỳ (cung tốt đầu tiên bắt đầu từ 0 mm nên luôn có
 *   đích trong chu kỳ, trừ khi số đo đã ở cung tốt). Nếu đang ở cung tốt
 *   thì delta = 0 (không cần bớt).
 * - Phía trên: đích là đầu cung tốt tiếp theo; nếu đang ở cung Tể Tướng
 *   (cung tốt cuối chu kỳ) thì đích là đầu chu kỳ kế tiếp (cung Quý Nhân).
 */
export function nearestAuspicious(mm: number): NearestAuspicious {
  const cur = lookupLoBan(mm);
  const r = cur.remainderMm;

  let below: NearestGood;
  if (cur.major.tot) {
    below = {
      majorName: cur.major.name,
      targetMm: mm,
      deltaMm: 0,
      alreadyGood: true,
    };
  } else {
    // Cung tốt gần nhất phía dưới: cung tốt có khoảng kết thúc ≤ r.
    let end = 0;
    let name = LOBAN_MAJORS[0].name;
    for (let i = 0; i < LOBAN_MAJORS.length; i++) {
      const s = i * LOBAN_MAJOR_MM;
      const e = s + LOBAN_MAJOR_MM;
      if (LOBAN_MAJORS[i].tot && e <= r + 1e-9) {
        end = e;
        name = LOBAN_MAJORS[i].name;
      }
    }
    const deltaMm = r - end;
    below = { majorName: name, targetMm: mm - deltaMm, deltaMm, alreadyGood: false };
  }

  let above: NearestGood;
  let nextStart: number | null = null;
  let nextName = '';
  for (let i = 0; i < LOBAN_MAJORS.length; i++) {
    const s = i * LOBAN_MAJOR_MM;
    if (LOBAN_MAJORS[i].tot && s > r + 1e-9) {
      nextStart = s;
      nextName = LOBAN_MAJORS[i].name;
      break;
    }
  }
  if (nextStart === null) {
    // Hết chu kỳ: cung tốt tiếp theo là Quý Nhân ở đầu chu kỳ sau.
    const deltaMm = LOBAN_CYCLE_MM - r;
    above = {
      majorName: LOBAN_MAJORS[0].name,
      targetMm: mm + deltaMm,
      deltaMm,
      alreadyGood: false,
    };
  } else {
    const deltaMm = nextStart - r;
    above = { majorName: nextName, targetMm: mm + deltaMm, deltaMm, alreadyGood: false };
  }
  return { below, above };
}

/**
 * Chuyển chuỗi nhập + đơn vị thành mm. Trả về thông báo lỗi tiếng Việt
 * (hoặc null nếu hợp lệ). Chấp nhận dấu phẩy thập phân kiểu Việt Nam.
 */
export function parseLoBanInput(
  raw: string,
  unit: 'cm' | 'mm',
): { mm: number } | { error: string } {
  const text = raw.trim().replace(',', '.');
  if (!text) return { error: 'Vui lòng nhập một số đo.' };
  if (!/^\d+(\.\d+)?$/.test(text)) {
    return { error: 'Số đo chỉ gồm chữ số (có thể có phần thập phân, ví dụ 81,5).' };
  }
  const value = Number(text);
  if (!Number.isFinite(value) || value <= 0) {
    return { error: 'Số đo phải lớn hơn 0.' };
  }
  const mm = unit === 'cm' ? value * 10 : value;
  if (mm > LOBAN_MAX_MM) {
    return {
      error: `Số đo vượt giới hạn hợp lệ (tối đa ${LOBAN_MAX_MM / 10} cm / ${LOBAN_MAX_MM} mm).`,
    };
  }
  return { mm };
}

/** Định dạng mm thành cm, tối đa 2 chữ số thập phân, bỏ số 0 thừa. */
export function formatCm(mm: number): string {
  const cm = mm / 10;
  return `${Math.round(cm * 100) / 100}`.replace('.', ',');
}

/** Định dạng mm, tối đa 2 chữ số thập phân, bỏ số 0 thừa. */
export function formatMm(mm: number): string {
  return `${Math.round(mm * 100) / 100}`.replace('.', ',');
}
