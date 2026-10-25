// Cầu nối tới @/lib/engine cho 2 hàm mà hợp đồng chưa chốt chữ ký tham số:
// solarToLunar và canChiDay. Thử các dạng tham số hợp lý và chỉ nhận kết
// quả khi đúng hình dạng (âm lịch có day/month/year, can chi là chuỗi
// không rỗng), để trang không crash nếu engine chọn dạng khác.
// Các hàm engine còn lại được import trực tiếp từ '@/lib/engine' tại
// từng form theo đúng hợp đồng (cungPhi, batTrach, hoangDaoHours,
// saoNgay, thanSoHoc, chamDiemTen, luanSo, getTodayInfo...).

import { solarToLunar as solarToLunarRaw, canChiDay as canChiDayRaw } from '@/lib/engine';
import type { LunarDateLike } from './format';

function isLunar(value: unknown): value is LunarDateLike {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.day === 'number' && typeof v.month === 'number' && typeof v.year === 'number';
}

export function safeSolarToLunar(d: Date): LunarDateLike | null {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const fn = solarToLunarRaw as unknown as (...args: unknown[]) => unknown;
  const attempts: unknown[][] = [[y, m, day], [d], [day, m, y]];
  for (const args of attempts) {
    try {
      const r = fn(...args);
      if (isLunar(r)) return { day: r.day, month: r.month, year: r.year, leap: !!r.leap };
    } catch {
      // thử dạng tham số tiếp theo
    }
  }
  return null;
}

export function safeCanChiDay(d: Date): string | null {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const fn = canChiDayRaw as unknown as (...args: unknown[]) => unknown;
  const attempts: unknown[][] = [[d], [y, m, day], [day, m, y]];
  for (const args of attempts) {
    try {
      const r = fn(...args);
      if (typeof r === 'string' && r.trim()) return r.trim();
    } catch {
      // thử dạng tham số tiếp theo
    }
  }
  return null;
}
