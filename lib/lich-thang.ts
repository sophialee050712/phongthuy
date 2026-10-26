// Lịch tháng ngày tốt theo việc × tháng × tuổi (ý 3).
// Dùng ĐÚNG công thức sàng lọc của ViecFlow (xem-ngay theo việc):
//   diem = số sao tốt − số sao xấu; diem >= 2 → "tương đối tốt",
//   diem <= -1 → "chưa thuận", còn lại "bình thường"; cộng cờ xung tuổi.
// Việc chọn KHÔNG đổi điểm số (site hiện không có mapping sao riêng theo việc)
// nên hàm này chỉ nhận xungChi, không nhận việc — việc chỉ hiển thị ở giao diện.

import { getTodayInfo, saoNgay, type LunarDate } from './engine';
// Không dùng normalizeStars từ components/site/format ở đây: file đó kéo theo
// alias @/ mà vitest không hiểu, trong khi saoNgay đã trả đúng dạng {tot, xau}.

export type MucNgay = 'Ngày tương đối tốt' | 'Ngày bình thường' | 'Ngày chưa thuận';

export type NgayThang = {
  duong: { y: number; m: number; d: number };
  lunar: LunarDate;
  canChiNgay: string;
  chiNgay: string;
  saoTot: string[];
  saoXau: string[];
  diem: number;
  muc: MucNgay;
  xung: boolean;
};

/** Ngưỡng mức ngày — khớp ViecFlow, đừng đổi một phía. */
export function mucNgay(diem: number): MucNgay {
  if (diem >= 2) return 'Ngày tương đối tốt';
  if (diem <= -1) return 'Ngày chưa thuận';
  return 'Ngày bình thường';
}

/** Lấy chi từ chuỗi can chi dạng "Giáp Dần" (từ cuối sau khoảng trắng). */
export function chiCuaNgay(canChiNgay: string): string {
  const parts = canChiNgay.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/**
 * Tính toàn bộ ngày trong một tháng dương lịch (thang 1–12).
 * xungChi: chi xung với tuổi người xem (từ chiXung), hoặc null khi chưa chọn tuổi.
 * Lặp ngày bằng mốc Date.UTC rồi đưa qua getTodayInfo (tự cộng 7h ra giờ VN),
 * cùng pattern với dải 7 ngày trên trang chủ.
 */
export function ngayThang(nam: number, thang: number, xungChi: string | null): NgayThang[] {
  const soNgay = new Date(Date.UTC(nam, thang, 0)).getUTCDate();
  const out: NgayThang[] = [];
  for (let k = 1; k <= soNgay; k += 1) {
    const info = getTodayInfo(new Date(Date.UTC(nam, thang - 1, k)));
    const sao = saoNgay(info.canChi.ngay, info.lunar.month);
    const chiNgay = chiCuaNgay(info.canChi.ngay);
    const diem = sao.tot.length - sao.xau.length;
    out.push({
      duong: info.solar,
      lunar: info.lunar,
      canChiNgay: info.canChi.ngay,
      chiNgay,
      saoTot: sao.tot,
      saoXau: sao.xau,
      diem,
      muc: mucNgay(diem),
      xung: xungChi !== null && xungChi === chiNgay,
    });
  }
  return out;
}
