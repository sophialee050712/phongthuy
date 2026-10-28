'use client';

// Báo cáo tổng hợp — xem đầy đủ miễn phí.
// Tổng hợp từ nhiều công cụ cho một người: mệnh + cung, hướng nhà (bát
// trạch), ngày dự định (sao ngày + giờ hoàng đạo), luận số và thần số học.

import { useEffect, useMemo, useState } from 'react';
import {
  batTrach,
  canChiDay,
  canChiYear,
  cungPhi,
  hoangDaoHours,
  luanSo,
  menhNapAm,
  saoNgay,
  solarToLunar,
  thanSoHoc,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import Disclaimer from '@/components/site/Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  DIRECTIONS,
  MAU_HOP_KY,
  PHAT_BAN_MENH,
  SO_HOP,
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
  parseISODate,
  todayISO,
  zodiacOfLunarYear,
} from '@/components/site/format';

export default function BaoCaoPage() {
  const [hoTen, setHoTen] = useState('');
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [daySo, setDaySo] = useState('');
  const [huongNha, setHuongNha] = useState('');
  const [ngayDuDinh, setNgayDuDinh] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    if (!d) return null;
    let lunar;
    try {
      lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    } catch {
      return null;
    }
    try {
      const ccYear = canChiYear(lunar.year);
      const menh = menhNapAm(ccYear);
      const nguHanh = nguHanhFromMenh(menh);
      const cp = cungPhi(gioiTinh, lunar.year);
      const bt = batTrach(cp.cung);
      const tuoi = zodiacOfLunarYear(lunar.year);
      let soChuDao: number | null = null;
      let giaiThichSo = '';
      try {
        const t = thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear());
        soChuDao = t.soChuDao;
        giaiThichSo = t.giaiThich;
      } catch {
        soChuDao = null;
      }
      const huongInfo = huongNha ? bt[huongNha] ?? null : null;
      let ngayInfo = null;
      if (ngayDuDinh) {
        const dd = parseISODate(ngayDuDinh);
        if (dd) {
          try {
            const lunarDd = solarToLunar(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
            const ccDd = canChiDay(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
            const sao = saoNgay(ccDd, lunarDd.month);
            const hoang = hoangDaoHours(ccDd).filter((g) => g.hoangDao).map((g) => g.gio);
            ngayInfo = { d: dd, lunar: lunarDd, cc: ccDd, sao, hoang };
          } catch {
            ngayInfo = null;
          }
        }
      }
      let luan = null;
      if (daySo.replace(/\D/g, '')) {
        try {
          luan = luanSo(daySo);
        } catch {
          luan = null;
        }
      }
      return {
        d, lunar, ccYear, menh, nguHanh,
        cung: cp.cung, nhom: cp.nhom,
        mau: MAU_HOP_KY[nguHanh],
        soHop: SO_HOP[nguHanh],
        tuoi, phat: PHAT_BAN_MENH[tuoi] ?? '',
        soChuDao, giaiThichSo, huongInfo, ngayInfo, luan,
      };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh, daySo, huongNha, ngayDuDinh]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Báo cáo tổng hợp</h1>
      <p className="text-ink/80">
        Một bản tổng hợp cho một người từ nhiều công cụ: mệnh, cung phi, hướng nhà, ngày dự
        định và luận số. Các mục tùy chọn (dãy số, hướng nhà, ngày dự định) cứ để trống nếu
        bạn không cần — báo cáo chỉ gồm những mục bạn đã nhập. Xem đầy đủ miễn phí.
      </p>

      <form
        className="card space-y-4 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="bc-ten">Họ tên</label>
          <input id="bc-ten" className="input" value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="VD: Nguyễn Văn An" required />
        </div>
        <div>
          <label className="label" htmlFor="bc-ngay">Ngày sinh dương lịch</label>
          <input id="bc-ngay" type="date" className="input" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} required />
        </div>
        <div>
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="bc-gioi-tinh" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} /> Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="bc-gioi-tinh" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} /> Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bc-so">Dãy số cần luận (tùy chọn — số điện thoại, biển số, số tài khoản)</label>
          <input id="bc-so" className="input" value={daySo} onChange={(e) => setDaySo(e.target.value)} placeholder="Chỉ dùng các chữ số trong dãy để luận" />
        </div>
        <div>
          <label className="label" htmlFor="bc-huong">Hướng nhà hiện tại (tùy chọn)</label>
          <select id="bc-huong" className="input" value={huongNha} onChange={(e) => setHuongNha(e.target.value)}>
            <option value="">Không chọn hướng nhà</option>
            {DIRECTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="bc-dinh">Ngày dự định làm việc quan trọng (tùy chọn)</label>
          <input id="bc-dinh" type="date" className="input" value={ngayDuDinh} onChange={(e) => setNgayDuDinh(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">Tạo báo cáo</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Ngày sinh chưa hợp lệ hoặc chưa đổi được sang âm lịch. Vui lòng thử lại.</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">

          <p className="text-sm text-ink/80 no-print">
            Giá báo cáo theo bảng giá là 99.000–299.000đ tùy độ dài; đơn ở đây tạm tính theo
            mức thấp nhất (99.000đ) — mức cuối do admin xác nhận khi duyệt đơn.
          </p>

              <section className="border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Báo cáo tổng hợp bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Báo cáo tổng hợp — {hoTen}</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Sinh {fmtSolar(ketQua.d)} — âm lịch {fmtLunar(ketQua.lunar)} — can chi năm {ketQua.ccYear} (tuổi {ketQua.tuoi})
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <div className="space-y-5 text-sm leading-relaxed">
                  <section>
                    <h3 className="font-display text-lg font-bold text-brass">1. Bản mệnh &amp; cung phi</h3>
                    <p>Mệnh nạp âm: <strong>{ketQua.menh}</strong> (ngũ hành {ketQua.nguHanh}). Cung phi: <strong>{ketQua.cung}</strong> ({ketQua.nhom} tứ mệnh).</p>
                    {ketQua.mau ? <p>Màu hợp: <strong>{ketQua.mau.hop.join(', ')}</strong> — màu kỵ: <strong>{ketQua.mau.ky.join(', ')}</strong>.</p> : null}
                    {ketQua.soHop ? <p>Số hợp (tham khảo): <strong>{ketQua.soHop.join(', ')}</strong>.</p> : null}
                    <p>Phật bản mệnh theo tuổi {ketQua.tuoi}: <strong>{ketQua.phat}</strong>.</p>
                    {ketQua.soChuDao !== null ? <p>Số chủ đạo (thần số học, tham khảo): <strong>{ketQua.soChuDao}</strong> — {ketQua.giaiThichSo}</p> : null}
                  </section>
                  {huongNha && ketQua.huongInfo ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">2. Hướng nhà</h3>
                      <p>Hướng {huongNha} với cung {ketQua.cung} mang sao <strong>{ketQua.huongInfo.sao}</strong> — {ketQua.huongInfo.tot ? 'hướng tốt theo bát trạch.' : 'hướng xấu theo bát trạch, nên cân nhắc khi bố trí cửa chính, bếp và bàn thờ.'}</p>
                    </section>
                  ) : null}
                  {ketQua.ngayInfo ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">3. Ngày dự định</h3>
                      <p>Ngày {fmtSolar(ketQua.ngayInfo.d)} (âm lịch {fmtLunar(ketQua.ngayInfo.lunar)}) — can chi ngày {ketQua.ngayInfo.cc}.</p>
                      <p>Sao tốt: <strong>{ketQua.ngayInfo.sao.tot.length > 0 ? ketQua.ngayInfo.sao.tot.join(', ') : 'không có sao tốt trong bộ sao cơ bản của engine'}</strong>.</p>
                      <p>Sao xấu: <strong>{ketQua.ngayInfo.sao.xau.length > 0 ? ketQua.ngayInfo.sao.xau.join(', ') : 'không có sao xấu trong bộ sao cơ bản của engine'}</strong>.</p>
                      <p>Giờ hoàng đạo: <strong>{ketQua.ngayInfo.hoang.join(', ')}</strong>.</p>
                    </section>
                  ) : null}
                  {ketQua.luan ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">4. Luận dãy số</h3>
                      <p>Tổng nút: <strong>{ketQua.luan.tongNut}</strong> — ngũ hành chủ đạo: <strong>{ketQua.luan.nguHanhChuDao}</strong>.</p>
                      <p>{ketQua.luan.phanTich}</p>
                    </section>
                  ) : null}
                </div>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.</p>
                </div>
              </section>

          <div className="no-print">
            <ToolShareCard
              title={`Báo cáo tổng hợp — ${hoTen}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Cung phi: ${ketQua.cung} (${ketQua.nhom} tứ mệnh)`,
                huongNha && ketQua.huongInfo ? `Hướng ${huongNha}: sao ${ketQua.huongInfo.sao}` : `Tuổi ${ketQua.tuoi} — Phật bản mệnh: ${ketQua.phat}`,
              ]}
            />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
