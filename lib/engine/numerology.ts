// Thần số học, chấm điểm tên, luận số.
// LƯU Ý: chấm điểm tên là MÔ HÌNH ĐƠN GIẢN do engine tự đặt trọng số
// (xem README §9) — bắt buộc phải có chuyên gia duyệt trước khi public.
import {
  DIGIT_ELEMENT,
  KHAC,
  SINH,
  type NguHanh,
} from './constants';

function sumDigits(n: number): number {
  return String(Math.abs(n))
    .split('')
    .reduce((acc, ch) => acc + Number(ch), 0);
}

/** Rút gọn về 1 chữ số; nếu keepMasters thì dừng ở 11, 22. */
export function reduceNumber(n: number, keepMasters = true): number {
  let v = Math.abs(n);
  while (v > 9) {
    if (keepMasters && (v === 11 || v === 22)) return v;
    v = sumDigits(v);
  }
  return v;
}

/** Tổng nút: rút gọn về 1 chữ số theo quy ước digital root (10 -> 1, 19 -> 1, 18 -> 9). */
export function digitalRoot(n: number): number {
  const s = Math.abs(n);
  if (s === 0) return 0;
  return ((s - 1) % 9) + 1;
}

const LIFE_PATH_MEANING: Record<number, string> = {
  1: 'Số 1: độc lập, tiên phong, quyết đoán, thích dẫn đầu.',
  2: 'Số 2: hòa hợp, nhạy cảm, hợp tác, giỏi kết nối.',
  3: 'Số 3: sáng tạo, lạc quan, giao tiếp tốt, giàu cảm hứng.',
  4: 'Số 4: thực tế, kỷ luật, bền bỉ, coi trọng nền tảng.',
  5: 'Số 5: tự do, linh hoạt, thích thay đổi và trải nghiệm.',
  6: 'Số 6: trách nhiệm, yêu thương, hướng về gia đình và cộng đồng.',
  7: 'Số 7: chiêm nghiệm, phân tích, ham học hỏi và tìm hiểu chiều sâu.',
  8: 'Số 8: thực lực, tham vọng, giỏi quản lý và xây dựng thành tựu.',
  9: 'Số 9: nhân ái, bao dung, lý tưởng và tinh thần phụng sự.',
  11: 'Số 11 (master): trực giác mạnh, cảm hứng và khả năng truyền cảm hứng.',
  22: 'Số 22 (master): tầm nhìn lớn, biến ý tưởng thành công trình thực tế.',
};

/**
 * Số chủ đạo từ ngày/tháng/năm sinh (dương lịch).
 * Cộng tất cả chữ số của ngày + tháng + năm rồi rút gọn, giữ số master 11, 22.
 */
export function thanSoHoc(
  ngay: number,
  thang: number,
  nam: number,
): { soChuDao: number; giaiThich: string } {
  if (
    !Number.isInteger(ngay) ||
    !Number.isInteger(thang) ||
    !Number.isInteger(nam)
  ) {
    throw new Error('Ngày/tháng/năm phải là số nguyên');
  }
  const total = sumDigits(ngay) + sumDigits(thang) + sumDigits(nam);
  const soChuDao = reduceNumber(total, true);
  return {
    soChuDao,
    giaiThich:
      LIFE_PATH_MEANING[soChuDao] ?? `Số chủ đạo ${soChuDao}.`,
  };
}

// ---- Chấm điểm tên (mô hình đơn giản) ----

const PYTHAGOREAN: Record<string, number> = {
  a: 1,
  j: 1,
  s: 1,
  b: 2,
  k: 2,
  t: 2,
  c: 3,
  l: 3,
  u: 3,
  d: 4,
  m: 4,
  v: 4,
  e: 5,
  n: 5,
  w: 5,
  f: 6,
  o: 6,
  x: 6,
  g: 7,
  p: 7,
  y: 7,
  h: 8,
  q: 8,
  z: 8,
  i: 9,
  r: 9,
};

function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .toLowerCase();
}

/** Số tên: tổng giá trị Pythagoras của các chữ cái họ + tên, rút gọn (giữ 11, 22). */
export function nameNumber(ho: string, ten: string): number {
  const letters = stripDiacritics(`${ho} ${ten}`).replace(/[^a-z]/g, '');
  if (!letters) throw new Error('Tên không có chữ cái hợp lệ');
  let total = 0;
  for (const ch of letters) total += PYTHAGOREAN[ch] ?? 0;
  return reduceNumber(total, true);
}

const VALID_MENH = new Set(['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']);

/**
 * Chấm điểm tên (thang 0-100, mô hình đơn giản):
 * - Ngũ hành của tên (từ số tên -> hành theo bảng chữ số) so với mệnh:
 *   tên sinh mệnh 70, đồng hành 50, mệnh sinh tên 35, mệnh khắc tên 25,
 *   tên khắc mệnh 10.
 * - Thần số học của tên: số master 11/22 cộng 30; số 6, 8, 9 cộng 20;
 *   các số còn lại cộng 10.
 * Tổng = điểm hành + điểm số, chặn 0-100.
 */
export function chamDiemTen(
  ho: string,
  ten: string,
  menh: string,
): { diem: number; nguHanh: string; giaiThich: string } {
  if (!VALID_MENH.has(menh)) {
    throw new Error(`Mệnh không hợp lệ: ${menh}`);
  }
  const menhEl = menh as NguHanh;
  const num = nameNumber(ho, ten);
  const single = num === 11 ? 2 : num === 22 ? 4 : num;
  const tenEl = DIGIT_ELEMENT[String(single)];

  let elementScore: number;
  let relation: string;
  if (SINH[tenEl] === menhEl) {
    elementScore = 70;
    relation = `hành ${tenEl} của tên sinh cho mệnh ${menhEl}`;
  } else if (tenEl === menhEl) {
    elementScore = 50;
    relation = `hành ${tenEl} của tên đồng hành với mệnh ${menhEl}`;
  } else if (SINH[menhEl] === tenEl) {
    elementScore = 35;
    relation = `mệnh ${menhEl} sinh cho hành ${tenEl} của tên (sinh xuất)`;
  } else if (KHAC[menhEl] === tenEl) {
    elementScore = 25;
    relation = `mệnh ${menhEl} khắc hành ${tenEl} của tên`;
  } else if (KHAC[tenEl] === menhEl) {
    elementScore = 10;
    relation = `hành ${tenEl} của tên khắc mệnh ${menhEl}`;
  } else {
    elementScore = 30;
    relation = `hành ${tenEl} của tên và mệnh ${menhEl} không sinh không khắc trực tiếp`;
  }

  let bonus: number;
  if (num === 11 || num === 22) bonus = 30;
  else if (num === 6 || num === 8 || num === 9) bonus = 20;
  else bonus = 10;

  const diem = Math.max(0, Math.min(100, elementScore + bonus));
  return {
    diem,
    nguHanh: tenEl,
    giaiThich:
      `Tên "${ho} ${ten}" có số tên ${num} ứng với hành ${tenEl}; ` +
      `${relation}. Điểm hành ${elementScore} + điểm số tên ${bonus} = ${diem}/100 ` +
      `(mô hình đơn giản, cần chuyên gia duyệt trước khi public).`,
  };
}

// ---- Luận số ----

const SIM_MEANING: Record<number, string> = {
  0: 'Số 0: khởi đầu, tiềm năng chưa định hình.',
  1: 'Tổng nút 1: độc lập, tiên phong, dẫn đầu.',
  2: 'Tổng nút 2: cân bằng, hợp tác, hài hòa.',
  3: 'Tổng nút 3: sáng tạo, vui vẻ, giao tiếp tốt.',
  4: 'Tổng nút 4: vững chắc, kỷ luật, thực tế.',
  5: 'Tổng nút 5: linh hoạt, thay đổi, tự do.',
  6: 'Tổng nút 6: thuận lợi, trách nhiệm, ấm êm.',
  7: 'Tổng nút 7: chiều sâu, học hỏi, chiêm nghiệm.',
  8: 'Tổng nút 8: phát đạt, thịnh vượng, thành tựu.',
  9: 'Tổng nút 9: viên mãn, trường cửu, bao dung.',
};

/**
 * Luận dãy số (số điện thoại, biển số, STK...).
 * - Tổng nút: cộng các chữ số rồi rút gọn về 1 chữ số theo quy ước
 *   digital root (ví dụ tổng 10 -> 1, tổng 19 -> 1, tổng 18 -> 9).
 * - Ngũ hành chủ đạo: hành có nhiều chữ số nhất trong dãy, theo bảng:
 *   0,9 Hỏa; 1 Thủy; 2,5,8 Thổ; 3,4 Mộc; 6,7 Kim.
 *   Hòa: ưu tiên hành của tổng nút nếu đồng hạng, sau đó theo thứ tự
 *   Kim, Mộc, Thủy, Hỏa, Thổ.
 */
export function luanSo(chuoiSo: string): {
  tongNut: number;
  nguHanhChuDao: string;
  phanTich: string;
} {
  const digits = (chuoiSo ?? '').replace(/\D/g, '');
  if (!digits) throw new Error('Chuỗi số không chứa chữ số nào');
  let sum = 0;
  const counts: Record<NguHanh, number> = {
    Kim: 0,
    Mộc: 0,
    Thủy: 0,
    Hỏa: 0,
    Thổ: 0,
  };
  for (const ch of digits) {
    sum += Number(ch);
    counts[DIGIT_ELEMENT[ch]] += 1;
  }
  const tongNut = digitalRoot(sum);
  const maxCount = Math.max(...Object.values(counts));
  const tied = (Object.keys(counts) as NguHanh[]).filter(
    (el) => counts[el] === maxCount,
  );
  const nutEl = DIGIT_ELEMENT[String(tongNut)] as NguHanh;
  let dominant: NguHanh;
  if (tied.includes(nutEl)) {
    dominant = nutEl;
  } else {
    const priority: NguHanh[] = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
    dominant = priority.find((el) => tied.includes(el)) ?? tied[0];
  }
  return {
    tongNut,
    nguHanhChuDao: dominant,
    phanTich:
      `${SIM_MEANING[tongNut] ?? `Tổng nút ${tongNut}.`} ` +
      `Dãy có ${digits.length} chữ số, hành chủ đạo là ${dominant} ` +
      `(${counts[dominant]} chữ số, nhiều nhất trong dãy). ` +
      `Quy ước tổng nút: cộng rồi rút gọn về 1 chữ số (10 -> 1).`,
  };
}
