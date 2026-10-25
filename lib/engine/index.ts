// Điểm xuất duy nhất của engine phong thủy Khang An.
// Các agent khác import từ 'lib/engine' (hoặc '@/lib/engine') theo đúng
// tên hàm trong hợp đồng API. Xem README.md cùng thư mục để biết công thức
// nào đã đối chiếu, công thức nào còn cần duyệt trước khi public.

export type { LunarDate } from './lunar';
export { solarToLunar } from './lunar';

export {
  canChiYear,
  canChiMonth,
  canChiDay,
  canChiHour,
  nguHanhOfCan,
  menhNapAm,
} from './canchi';

export {
  cungPhi,
  batTrach,
  hoangDaoHours,
  saoNgay,
  type HuongInfo,
  type GioInfo,
} from './batrach';

export {
  thanSoHoc,
  chamDiemTen,
  luanSo,
} from './numerology';

import { solarToLunar, type LunarDate } from './lunar';
import { canChiYear, canChiMonth, canChiDay } from './canchi';
import { hoangDaoHours, type GioInfo } from './batrach';

/**
 * Thông tin ngày hôm nay (mặc định) hoặc của một mốc Date cho trước.
 * Ngày được quy về giờ Việt Nam (UTC+7) bất kể múi giờ của máy chủ,
 * vì âm lịch/can chi của site tính theo lịch Việt Nam.
 */
export function getTodayInfo(d?: Date): {
  solar: { y: number; m: number; d: number };
  lunar: LunarDate;
  canChi: { nam: string; thang: string; ngay: string };
  hoangDao: GioInfo[];
} {
  const src = d ?? new Date();
  // getTime() là mốc UTC tuyệt đối; cộng 7h rồi đọc bằng getUTC* sẽ ra
  // wall-clock giờ Việt Nam, bất kể múi giờ của máy chủ.
  const vn = new Date(src.getTime() + 7 * 3600 * 1000);
  const y = vn.getUTCFullYear();
  const m = vn.getUTCMonth() + 1;
  const day = vn.getUTCDate();

  const lunar = solarToLunar(y, m, day);
  const ngay = canChiDay(y, m, day);
  return {
    solar: { y, m, d: day },
    lunar,
    canChi: {
      nam: canChiYear(lunar.year),
      thang: canChiMonth(lunar.year, lunar.month),
      ngay,
    },
    // Đủ 12 khung giờ, mỗi giờ kèm cờ hoangDao (xem hoangDaoHours).
    hoangDao: hoangDaoHours(ngay),
  };
}
