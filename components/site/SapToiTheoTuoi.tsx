'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getTodayInfo, saoNgay } from '@/lib/engine';
import { chiOfCanChi, chiXung, tuoiFromStoredBirthdate } from './XemNgayForm';
import { fmtLunar, normalizeStars } from './format';

const THU = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

// Dải 7 ngày tới trên trang chủ (ý 1 của kế hoạch kéo người dùng): âm lịch +
// sao tốt/xấu từng ngày + cờ xung tuổi lấy từ ngày sinh đã lưu ở trình duyệt
// (không bắt đăng nhập). Kết luận chỉ dựa trên số sao và xung tuổi, ghi rõ là
// tham khảo — không tự đặt điểm số hay khẳng định ngày tốt tuyệt đối.
export default function SapToiTheoTuoi() {
  const [tuoi, setTuoi] = useState<string | null>(null);

  useEffect(() => {
    setTuoi(tuoiFromStoredBirthdate());
  }, []);

  const ngay = useMemo(() => {
    const homNay = getTodayInfo();
    const goc = Date.UTC(homNay.solar.y, homNay.solar.m - 1, homNay.solar.d);
    return Array.from({ length: 7 }, (_, k) => {
      const info = getTodayInfo(new Date(goc + (k + 1) * 86400000));
      const ccDay = info.canChi.ngay;
      const sao = normalizeStars(saoNgay(ccDay, info.lunar.month));
      const chi = chiOfCanChi(ccDay);
      const xung = tuoi ? chiXung(tuoi) === chi : false;
      const thu = THU[new Date(Date.UTC(info.solar.y, info.solar.m - 1, info.solar.d)).getUTCDay()];
      return {
        thu,
        duong: `${info.solar.d}/${info.solar.m}`,
        am: fmtLunar(info.lunar),
        tot: sao.tot.length,
        xau: sao.xau.length,
        xung,
      };
    });
  }, [tuoi]);

  return (
    <div className="mt-3 space-y-2 border-t border-gold/30 pt-3">
      <h3 className="font-display text-lg font-bold text-primary">7 ngày tới theo tuổi của bạn</h3>
      {tuoi ? (
        <p className="text-sm text-ink/70">
          Tuổi {tuoi} (lấy từ hồ sơ đã lưu trên trình duyệt). Ngày xung tuổi được gắn cờ
          để bạn tránh việc lớn — kết luận chỉ mang tính tham khảo.
        </p>
      ) : (
        <p className="text-sm text-ink/70">
          <Link href="/ho-so" className="font-semibold text-primary underline">
            Lưu ngày sinh ở Hồ sơ
          </Link>{' '}
          để xem ngày nào xung tuổi bạn.
        </p>
      )}
      <ul className="space-y-1">
        {ngay.map((n) => (
          <li key={n.duong} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-sm">
            <span className="font-semibold">
              {n.thu}, {n.duong}
            </span>
            <span className="text-ink/70">({n.am})</span>
            <span>
              sao tốt {n.tot} · sao xấu {n.xau}
            </span>
            {n.xung && tuoi ? (
              <span className="font-semibold text-red-700">Xung tuổi {tuoi} — nên tránh việc lớn</span>
            ) : n.tot > n.xau ? (
              <span className="text-ink/70">Ngày thuận (tham khảo)</span>
            ) : null}
            <Link href="/xem-ngay" className="font-semibold text-primary underline">
              Xem ngày →
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
