'use client';

// Lộ trình 12 tháng âm lịch — xem đầy đủ miễn phí.
// Hiển thị cả 12 tháng, không khóa nội dung.
// Đánh dấu tháng theo những gì engine tính được: can chi tháng, ngũ hành
// can tháng so với mệnh người xem, và tháng xung tuổi. Engine chỉ có sao
// theo NGÀY (saoNgay), không có "sao tháng" — trang này không bịa sao tháng,
// mà ghi rõ: chi tiết từng ngày xem thêm ở công cụ xem ngày.

import { useEffect, useMemo, useState } from 'react';
import {
  canChiMonth,
  canChiYear,
  menhNapAm,
  nguHanhOfCan,
  solarToLunar,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import { TUOI_12 } from '@/lib/data';
import Disclaimer from '@/components/site/Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
  parseISODate,
  todayISO,
  zodiacOfLunarYear,
} from '@/components/site/format';

const SINH: Record<string, string> = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
const KHAC: Record<string, string> = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' };

export default function LoTrinhNamPage() {
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [namXem, setNamXem] = useState(String(new Date().getFullYear()));
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    const nam = Number(namXem);
    if (!d || !Number.isInteger(nam) || nam < 1900 || nam > 2100) return null;
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
      const tuoi = zodiacOfLunarYear(lunar.year);
      const tuoiIdx = TUOI_12.indexOf(tuoi);
      const ccNamXem = canChiYear(nam);
      const thang = [];
      for (let m = 1; m <= 12; m++) {
        const cc = canChiMonth(nam, m);
        const [can, chi] = cc.split(' ');
        const hanhThang = nguHanhOfCan(can);
        const chiIdx = TUOI_12.indexOf(chi);
        const xung = Math.abs(chiIdx - tuoiIdx) === 6;
        let trangThai: 'thuận lợi' | 'cần chú ý' | 'bình thường' = 'bình thường';
        let ghiChu = '';
        if (xung) {
          trangThai = 'cần chú ý';
          ghiChu = `Tháng xung tuổi ${tuoi} — nên cân nhắc kỹ việc lớn.`;
        } else if (KHAC[hanhThang] === nguHanh) {
          trangThai = 'cần chú ý';
          ghiChu = `Ngũ hành tháng (${hanhThang}) khắc mệnh ${nguHanh} — nên thận trọng.`;
        } else if (SINH[hanhThang] === nguHanh) {
          trangThai = 'thuận lợi';
          ghiChu = `Ngũ hành tháng (${hanhThang}) sinh cho mệnh ${nguHanh}.`;
        } else if (SINH[nguHanh] === hanhThang) {
          ghiChu = `Mệnh ${nguHanh} sinh cho ngũ hành tháng (${hanhThang}) — nên giữ sức.`;
        } else {
          ghiChu = 'Không sinh không khắc trực tiếp với mệnh.';
        }
        thang.push({ m, cc, hanhThang, xung, trangThai, ghiChu });
      }
      return { d, lunar, ccYear, menh, nguHanh, tuoi, ccNamXem, thang };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, namXem]);

  const canChuY = ketQua?.thang.filter((t) => t.trangThai === 'cần chú ý') ?? [];
  const thuanLoi = ketQua?.thang.filter((t) => t.trangThai === 'thuận lợi') ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Lộ trình 12 tháng âm lịch</h1>
      <p className="text-ink/80">
        Nhập ngày sinh và năm âm lịch cần xem để có lộ trình 12 tháng: can chi từng tháng,
        tháng nào thuận lợi, tháng nào cần chú ý (tháng xung tuổi hoặc ngũ hành tháng khắc
        mệnh). Xem đầy đủ miễn phí cả 12 tháng.
      </p>
      <p className="text-sm text-ink/80">
        Lưu ý trung thực: engine của site chỉ tính sao theo từng ngày, không có bảng
        &quot;sao tháng&quot; riêng — vì vậy lộ trình này không bịa sao tháng. Muốn chọn ngày
        cụ thể trong tháng, hãy dùng thêm công cụ xem ngày.
      </p>

      <form
        className="card space-y-4 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="lt-ngay">Ngày sinh dương lịch</label>
          <input
            id="lt-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="lt-nam">Năm âm lịch cần xem</label>
          <input
            id="lt-nam"
            className="input"
            inputMode="numeric"
            value={namXem}
            onChange={(e) => setNamXem(e.target.value)}
            placeholder="VD: 2026"
            required
          />
        </div>
        <button type="submit" className="btn-primary">Xem lộ trình</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Thông tin chưa hợp lệ. Kiểm tra lại ngày sinh và năm xem (1900–2100).</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">


              <section className="border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Lộ trình 12 tháng bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Lộ trình 12 tháng âm lịch năm {namXem} ({ketQua.ccNamXem})</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Người xem: sinh {fmtSolar(ketQua.d)} — mệnh {ketQua.menh}, tuổi {ketQua.tuoi}
                </p>
                <p className="mt-1 text-center text-xs opacity-75">
                  Tháng nhuận (nếu có trong năm) mang cùng can chi với tháng thường cùng số.
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gold/50">
                      <th className="py-2 pr-2">Tháng âm</th>
                      <th className="py-2 pr-2">Can chi</th>
                      <th className="py-2 pr-2">Ngũ hành tháng</th>
                      <th className="py-2">Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ketQua.thang.map((t) => (
                      <tr key={t.m} className="border-b border-gold/20 align-top">
                        <td className="py-2 pr-2 font-bold">{t.m}</td>
                        <td className="py-2 pr-2">{t.cc}</td>
                        <td className="py-2 pr-2">{t.hanhThang}</td>
                        <td className="py-2">
                          <span className="font-semibold">{t.trangThai}</span> — {t.ghiChu}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống.</p>
                </div>
              </section>

          <div className="no-print">
            <ToolShareCard
              title={`Lộ trình năm ${namXem} — tuổi ${ketQua.tuoi}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Tháng cần chú ý: ${canChuY.length > 0 ? canChuY.map((t) => t.m).join(', ') : 'không có'}`,
                `Tháng thuận lợi: ${thuanLoi.length > 0 ? thuanLoi.map((t) => t.m).join(', ') : 'không có'}`,
              ]}
            />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
