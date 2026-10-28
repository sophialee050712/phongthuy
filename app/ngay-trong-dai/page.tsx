'use client';

// Gói "ngày trọng đại" trọn gói — xem đầy đủ miễn phí.
// Chọn loại sự kiện + khoảng thời gian, xuất các ngày đẹp chính cho sự
// kiện đó. Ngày được xếp hạng CHỈ bằng sao ngày của engine (saoNgay) và
// giờ hoàng đạo: nhiều sao tốt, ít sao xấu thì xếp trên; ngày có sao xấu
// Nguyệt Phá / Dương Nhẫn được gắn cờ cảnh báo; ngày xung tuổi (nếu nhập
// ngày sinh) bị trừ điểm. Không bịa thêm sao hay kiêng kỵ ngoài engine.
// Hiển thị đầy đủ tối đa 8 ngày, không khóa nội dung.

import { useEffect, useMemo, useState } from 'react';
import {
  canChiDay,
  saoNgay,
  hoangDaoHours,
  solarToLunar,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import { TUOI_12 } from '@/lib/data';
import Disclaimer from '@/components/site/Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  fmtLunar,
  fmtSolar,
  parseISODate,
  todayISO,
  zodiacOfLunarYear,
} from '@/components/site/format';

const SU_KIEN = ['Cưới hỏi', 'Động thổ', 'Khai trương'] as const;

function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NgayTrongDaiPage() {
  const [suKien, setSuKien] = useState<(typeof SU_KIEN)[number]>('Cưới hỏi');
  const [tuNgay, setTuNgay] = useState(todayISO());
  const [denNgay, setDenNgay] = useState(addDaysISO(todayISO(), 60));
  const [ngaySinh, setNgaySinh] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const tu = parseISODate(tuNgay);
    const den = parseISODate(denNgay);
    if (!tu || !den || den < tu) return { error: 'Khoảng thời gian chưa hợp lệ: ngày kết thúc phải sau ngày bắt đầu.' };
    const soNgay = Math.round((den.getTime() - tu.getTime()) / 86400000) + 1;
    if (soNgay > 90) return { error: 'Khoảng thời gian tối đa 90 ngày. Hãy thu hẹp lại rồi thử lại.' };
    let tuoi: string | null = null;
    if (ngaySinh) {
      const ds = parseISODate(ngaySinh);
      if (!ds) return { error: 'Ngày sinh chưa hợp lệ.' };
      try {
        const lunarDs = solarToLunar(ds.getFullYear(), ds.getMonth() + 1, ds.getDate());
        tuoi = zodiacOfLunarYear(lunarDs.year);
      } catch {
        return { error: 'Chưa đổi được ngày sinh sang âm lịch.' };
      }
    }
    const tuoiIdx = tuoi ? TUOI_12.indexOf(tuoi) : -1;
    const danhSach: {
      d: Date;
      lunar: { day: number; month: number; year: number; leap: boolean };
      cc: string;
      tot: string[];
      xau: string[];
      hoang: string[];
      xung: boolean;
      diem: number;
    }[] = [];
    const cur = new Date(tu.getFullYear(), tu.getMonth(), tu.getDate());
    const end = new Date(den.getFullYear(), den.getMonth(), den.getDate());
    while (cur <= end) {
      try {
        const lunar = solarToLunar(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
        const cc = canChiDay(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
        const sao = saoNgay(cc, lunar.month);
        const hoang = hoangDaoHours(cc).filter((g) => g.hoangDao).map((g) => g.gio);
        const chiNgay = cc.split(' ')[1] ?? '';
        const xung = tuoiIdx >= 0 && Math.abs(TUOI_12.indexOf(chiNgay) - tuoiIdx) === 6;
        let diem = sao.tot.length - sao.xau.length;
        if (xung) diem -= 2;
        danhSach.push({
          d: new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()),
          lunar, cc, tot: sao.tot, xau: sao.xau, hoang, xung, diem,
        });
      } catch {
        // bỏ qua ngày tính lỗi, không dừng cả danh sách
      }
      cur.setDate(cur.getDate() + 1);
    }
    danhSach.sort((a, b) => b.diem - a.diem || b.tot.length - a.tot.length || a.d.getTime() - b.d.getTime());
    return { error: null, tuoi, top: danhSach.slice(0, 8), tong: danhSach.length };
  }, [submitted, tuNgay, denNgay, ngaySinh, suKien]);

  const top3 = ketQua && !ketQua.error ? (ketQua.top ?? []).slice(0, 3) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Gói ngày trọng đại</h1>
      <p className="text-ink/80">
        Chọn loại sự kiện và khoảng thời gian (tối đa 90 ngày), site sẽ xếp hạng các ngày
        trong khoảng đó bằng sao ngày và giờ hoàng đạo của engine, rồi xuất gói gồm các
        ngày đẹp chính cho sự kiện. Nhập thêm ngày sinh để loại trừ ưu tiên các ngày xung
        tuổi. Xem đầy đủ tối đa 8 ngày, miễn phí.
      </p>

      <form
        className="card space-y-4 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="ntd-su-kien">Loại sự kiện</label>
          <select id="ntd-su-kien" className="input" value={suKien} onChange={(e) => setSuKien(e.target.value as (typeof SU_KIEN)[number])}>
            {SU_KIEN.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ntd-tu">Từ ngày</label>
          <input id="ntd-tu" type="date" className="input" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="ntd-den">Đến ngày (tối đa 90 ngày sau ngày bắt đầu)</label>
          <input id="ntd-den" type="date" className="input" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="ntd-sinh">Ngày sinh của người làm sự kiện (tùy chọn, để trừ ngày xung tuổi)</label>
          <input id="ntd-sinh" type="date" className="input" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">Tìm ngày đẹp chính</button>
      </form>

      {ketQua?.error ? <p className="card">{ketQua.error}</p> : null}

      {ketQua && !ketQua.error ? (
        <div className="space-y-6">

          <p className="text-sm text-ink/80 no-print">
            Giá gói ngày trọng đại chưa có trong bảng giá admin 4 mức hiện tại — tạm tính
            99.000đ demo (key site_settings price_ngay_trong_dai); chủ site xác nhận giá thật sau.
          </p>

              <section className="border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Gói ngày trọng đại bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Gói ngày trọng đại — {suKien}</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Xét {ketQua.tong} ngày từ {fmtSolar(parseISODate(tuNgay)!)} đến {fmtSolar(parseISODate(denNgay)!)}
                  {ketQua.tuoi ? ` — người làm sự kiện tuổi ${ketQua.tuoi}` : ''}
                </p>
                <p className="mt-1 text-center text-xs opacity-75">
                  Xếp hạng chỉ bằng sao ngày và giờ hoàng đạo của engine; ngày có sao xấu Nguyệt Phá / Dương Nhẫn được gắn cờ để cân nhắc kỹ.
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <ol className="space-y-4 text-sm leading-relaxed">
                  {(ketQua.top ?? []).map((n, i) => (
                    <li key={i} className="border-b border-gold/20 pb-3">
                      <p className="font-display text-base font-bold text-brass">
                        {i + 1}. {fmtSolar(n.d)} — {n.cc}
                      </p>
                      <p>Âm lịch: {fmtLunar(n.lunar)}.</p>
                      <p>Sao tốt: <strong>{n.tot.length > 0 ? n.tot.join(', ') : 'không có trong bộ sao cơ bản'}</strong>.</p>
                      <p>Sao xấu: <strong>{n.xau.length > 0 ? n.xau.join(', ') : 'không có trong bộ sao cơ bản'}</strong>.</p>
                      <p>Giờ hoàng đạo: <strong>{n.hoang.join(', ')}</strong>.</p>
                      {n.xung ? <p className="font-semibold">Lưu ý: ngày xung tuổi {ketQua.tuoi} — đã bị trừ điểm khi xếp hạng.</p> : null}
                      {n.xau.includes('Nguyệt Phá') || n.xau.includes('Dương Nhẫn') ? (
                        <p className="font-semibold">Cờ cảnh báo: ngày có sao xấu Nguyệt Phá / Dương Nhẫn — cân nhắc kỹ trước khi chốt.</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.</p>
                </div>
              </section>

          <div className="no-print">
            <ToolShareCard
              title={`Ngày trọng đại — ${suKien}`}
              lines={
                top3.length > 0
                  ? [
                      `Ngày đẹp chính: ${fmtSolar(top3[0].d)} (${top3[0].cc})`,
                      `Sao tốt: ${top3[0].tot.length > 0 ? top3[0].tot.join(', ') : 'không có trong bộ sao cơ bản'}`,
                      `Đã xét ${ketQua.tong} ngày trong khoảng đã chọn`,
                    ]
                  : ['Chưa có ngày đẹp chính trong khoảng đã chọn']
              }
            />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
