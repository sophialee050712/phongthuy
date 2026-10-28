'use client';

// Thẻ số mệnh — xem đầy đủ miễn phí.
// Hiển thị: tên + mệnh + cung, màu hợp/kỵ, số hợp, hướng tốt, Phật bản mệnh.
// Không hiển thị số điện thoại; không bịa số tài khoản ngân hàng.

import { useEffect, useMemo, useState } from 'react';
import {
  batTrach,
  canChiDay,
  canChiHour,
  canChiYear,
  cungPhi,
  menhNapAm,
  solarToLunar,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import Disclaimer from '@/components/site/Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
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

const GIO_OPTIONS = [
  { chi: 'Tý', hour: 0 },
  { chi: 'Sửu', hour: 2 },
  { chi: 'Dần', hour: 4 },
  { chi: 'Mão', hour: 6 },
  { chi: 'Thìn', hour: 8 },
  { chi: 'Tỵ', hour: 10 },
  { chi: 'Ngọ', hour: 12 },
  { chi: 'Mùi', hour: 14 },
  { chi: 'Thân', hour: 16 },
  { chi: 'Dậu', hour: 18 },
  { chi: 'Tuất', hour: 20 },
  { chi: 'Hợi', hour: 22 },
];

export default function TheSoMenhPage() {
  const [hoTen, setHoTen] = useState('');
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [gioSinh, setGioSinh] = useState('');
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
      const huongTot = Object.entries(bt)
        .filter(([, v]) => v.tot)
        .map(([dir, v]) => `${dir} (${v.sao})`);
      const tuoi = zodiacOfLunarYear(lunar.year);
      let gioCanChi = '';
      if (gioSinh !== '') {
        const ccDay = canChiDay(d.getFullYear(), d.getMonth() + 1, d.getDate());
        gioCanChi = canChiHour(ccDay, Number(gioSinh));
      }
      return {
        d,
        lunar,
        ccYear,
        menh,
        nguHanh,
        cung: cp.cung,
        nhom: cp.nhom,
        huongTot,
        mau: MAU_HOP_KY[nguHanh],
        soHop: SO_HOP[nguHanh],
        tuoi,
        phat: PHAT_BAN_MENH[tuoi] ?? '',
        gioCanChi,
      };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh, gioSinh]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Thẻ số mệnh</h1>
      <p className="text-ink/80">
        Nhập họ tên và ngày sinh để xem thẻ số mệnh đầy đủ miễn phí: mệnh nạp âm, cung phi,
        ngũ hành, màu hợp/kỵ, số hợp, hướng tốt và Phật bản mệnh.
      </p>

      <form
        className="card space-y-4 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="tsm-ten">Họ tên (in lên thẻ)</label>
          <input
            id="tsm-ten"
            className="input"
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
            placeholder="VD: Nguyễn Văn An"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tsm-ngay">Ngày sinh dương lịch</label>
          <input
            id="tsm-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
        </div>
        <div>
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tsm-gioi-tinh" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tsm-gioi-tinh" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
              Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tsm-gio">Giờ sinh (tùy chọn)</label>
          <select
            id="tsm-gio"
            className="input"
            value={gioSinh}
            onChange={(e) => setGioSinh(e.target.value)}
          >
            <option value="">Không rõ giờ sinh</option>
            {GIO_OPTIONS.map((g) => (
              <option key={g.chi} value={g.hour}>Giờ {g.chi}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Tạo thẻ</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Ngày sinh chưa hợp lệ hoặc chưa đổi được sang âm lịch. Vui lòng thử lại.</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">


              <section className="mx-auto max-w-[560px] border-4 border-gold bg-primary px-6 py-8 text-center text-cream shadow-xl" aria-label="Thẻ số mệnh bản đầy đủ">
                <p className="text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <h2 className="font-display text-3xl font-bold">{hoTen}</h2>
                <p className="mt-2 text-sm opacity-90">
                  Sinh {fmtSolar(ketQua.d)} — âm lịch {fmtLunar(ketQua.lunar)}
                </p>
                <p className="mt-1 text-sm opacity-90">Can chi năm sinh: {ketQua.ccYear} (tuổi {ketQua.tuoi})</p>
                {ketQua.gioCanChi ? <p className="mt-1 text-sm opacity-90">Can chi giờ sinh: {ketQua.gioCanChi}</p> : null}
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <dl className="space-y-3 text-left text-base">
                  <div className="flex justify-between gap-4"><dt>Mệnh nạp âm</dt><dd className="font-bold">{ketQua.menh}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Ngũ hành</dt><dd className="font-bold">{ketQua.nguHanh}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Cung phi</dt><dd className="font-bold">{ketQua.cung} ({ketQua.nhom} tứ mệnh)</dd></div>
                  {ketQua.mau ? (
                    <>
                      <div className="flex justify-between gap-4"><dt>Màu hợp</dt><dd className="font-bold">{ketQua.mau.hop.join(', ')}</dd></div>
                      <div className="flex justify-between gap-4"><dt>Màu kỵ</dt><dd className="font-bold">{ketQua.mau.ky.join(', ')}</dd></div>
                    </>
                  ) : null}
                  {ketQua.soHop ? <div className="flex justify-between gap-4"><dt>Số hợp (tham khảo)</dt><dd className="font-bold">{ketQua.soHop.join(', ')}</dd></div> : null}
                  <div><dt className="mb-1">Hướng tốt (bát trạch)</dt><dd className="font-bold">{ketQua.huongTot.join(' · ')}</dd></div>
                  <div><dt className="mb-1">Phật bản mệnh theo tuổi {ketQua.tuoi}</dt><dd className="font-bold">{ketQua.phat}</dd></div>
                </dl>
                <div className="mt-6 border-t border-gold/50 pt-4">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống.</p>
                </div>
              </section>

          <div className="no-print">
            <ToolShareCard
              title={`Thẻ số mệnh — ${hoTen}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Cung phi: ${ketQua.cung} (${ketQua.nhom} tứ mệnh)`,
                `Tuổi ${ketQua.tuoi} — Phật bản mệnh: ${ketQua.phat}`,
              ]}
            />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
