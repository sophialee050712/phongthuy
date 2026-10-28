'use client';

import { useMemo, useState } from 'react';
import { canChiYear, menhNapAm, chamDiemTen } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import { safeSolarToLunar } from './engine-utils';
import {
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
  normalizeScore,
  parseISODate,
  sinhKhac,
  TEN_POOL,
  todayISO,
} from './format';

export default function DatTenForm() {
  const [ho, setHo] = useState('');
  const [tenDem, setTenDem] = useState('');
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [submitted, setSubmitted] = useState(false);
  const [tenCuThe, setTenCuThe] = useState('');
  const [phanTich, setPhanTich] = useState<{
    full: string;
    diem: number | null;
    nguHanhTen: string;
    soTen: string;
    quanHe: string;
    giaiThich: string;
    amDieu: string;
  } | null>(null);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    if (!d || !ho.trim()) return null;
    const lunar = safeSolarToLunar(d);
    let menh = '';
    let ccYear = '';
    try {
      if (lunar) {
        const y = canChiYear(lunar.year) as unknown;
        ccYear = typeof y === 'string' ? y : String(y ?? '');
        const mm = menhNapAm(ccYear) as unknown;
        menh = typeof mm === 'string' ? mm : String(mm ?? '');
      }
    } catch {
      // giữ rỗng
    }
    const menhElement = nguHanhFromMenh(menh);
    const hoClean = ho.trim();
    const demClean = tenDem.trim();
    const goiY = TEN_POOL.map((item) => {
      const full = demClean ? `${hoClean} ${demClean} ${item.ten}` : `${hoClean} ${item.ten}`;
      let diem: number | null = null;
      let nhanXet = '';
      try {
        // Hợp đồng engine: chamDiemTen(họ, tên, mệnh-ngũ-hành).
        if (menhElement) {
          const s = normalizeScore(chamDiemTen(hoClean, item.ten, menhElement));
          diem = s.diem;
          nhanXet = s.nhanXet;
        }
      } catch {
        // giữ null
      }
      const quanHe = menhElement ? sinhKhac(item.nguHanh, menhElement) : 'binh';
      // Thứ tự ưu tiên: tên sinh cho mệnh > cùng hành > mệnh sinh tên > khắc.
      const rank = quanHe === 'sinh' ? 0 : item.nguHanh === menhElement ? 1 : quanHe === 'binh' ? 2 : 3;
      return { ...item, full, diem, nhanXet, quanHe, rank };
    })
      .sort((a, b) => a.rank - b.rank || (b.diem ?? -1) - (a.diem ?? -1))
      .slice(0, 12);
    return { d, lunar, menh, ccYear, menhElement, goiY };
  }, [submitted, ho, tenDem, ngaySinh, gioiTinh]);

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="dt-ho">
            Họ của bé
          </label>
          <input
            id="dt-ho"
            className="input"
            value={ho}
            onChange={(e) => {
              setHo(e.target.value);
              setSubmitted(false);
            }}
            placeholder="VD: Nguyễn"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="dt-dem">
            Tên đệm dự kiến (không bắt buộc)
          </label>
          <input
            id="dt-dem"
            className="input"
            value={tenDem}
            onChange={(e) => {
              setTenDem(e.target.value);
              setSubmitted(false);
            }}
            placeholder="VD: Minh"
          />
        </div>
        <div>
          <label className="label" htmlFor="dt-ngay">
            Ngày sinh của bé (dương lịch)
          </label>
          <input
            id="dt-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => {
              setNgaySinh(e.target.value);
              setSubmitted(false);
            }}
            required
          />
        </div>
        <div>
          <span className="label">Giới tính của bé</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dt-gioi-tinh"
                checked={gioiTinh === 'nam'}
                onChange={() => setGioiTinh('nam')}
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="dt-gioi-tinh"
                checked={gioiTinh === 'nu'}
                onChange={() => setGioiTinh('nu')}
              />
              Nữ
            </label>
          </div>
          <p className="mt-1 text-xs text-ink/70">
            Giới tính hiện chỉ dùng để hiển thị gợi ý; việc chấm điểm tên chưa phân biệt giới tính.
          </p>
        </div>
        <button type="submit" className="btn-primary">
          Gợi ý tên
        </button>
      </form>

      {ketQua ? (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Gợi ý tên cho bé</h2>
            <p>
              Ngày sinh: <strong>{fmtSolar(ketQua.d)}</strong> — âm lịch{' '}
              <strong>{fmtLunar(ketQua.lunar)}</strong>
            </p>
            <p>
              Mệnh nạp âm theo năm sinh: <strong>{ketQua.menh || 'Đang cập nhật'}</strong>
              {ketQua.menhElement ? ` (ngũ hành ${ketQua.menhElement})` : ''}
            </p>
            <p className="text-sm text-ink/80">
              Danh sách dưới đây lấy từ pool tên mẫu (tên Việt phổ biến).
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ketQua.goiY.map((g) => (
              <div key={g.full} className="card">
                <p className="font-display text-lg font-bold text-primary">{g.full}</p>
                <p className="text-sm">
                  Ngũ hành tên: <strong>{g.nguHanh}</strong>
                  {ketQua.menhElement
                    ? g.quanHe === 'sinh'
                      ? ' — tương sinh với mệnh bé'
                      : g.nguHanh === ketQua.menhElement
                        ? ' — cùng hành với mệnh bé'
                        : g.quanHe === 'khac'
                          ? ' — tương khắc với mệnh bé'
                          : ''
                    : ''}
                </p>
                <p className="text-sm">Ý nghĩa: {g.yNghia}</p>
                {g.diem !== null ? (
                  <p className="text-sm">
                    Điểm chấm tên: <strong>{g.diem}</strong>
                    {g.nhanXet ? ` — ${g.nhanXet}` : ''}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          <div className="card space-y-4">
            <h2 className="font-display text-xl font-bold text-primary">
              Phân tích đa tiêu chí cho một tên cụ thể
            </h2>
            <p className="text-sm text-ink/80">
              Nhập họ tên đầy đủ cần chấm (dùng mệnh của bé ở trên). Mỗi tiêu chí hiển thị tách
              bạch; tiêu chí nào engine chưa hỗ trợ sẽ ghi rõ, không bịa điểm.
            </p>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const words = tenCuThe.trim().split(/\s+/).filter(Boolean);
                if (words.length < 2 || !ketQua.menhElement) {
                  setPhanTich(null);
                  return;
                }
                const hoPt = words[0];
                const tenPt = words[words.length - 1];
                let diem: number | null = null;
                let nguHanhTen = '';
                let giaiThich = '';
                try {
                  const r = chamDiemTen(hoPt, tenPt, ketQua.menhElement);
                  diem = r.diem;
                  nguHanhTen = r.nguHanh;
                  giaiThich = r.giaiThich;
                } catch {
                  // giữ null
                }
                const soTenMatch = /số tên (\d+)/.exec(giaiThich);
                const soTen = soTenMatch ? soTenMatch[1] : 'Đang cập nhật';
                // Quan hệ có hướng giữa hành tên và mệnh bé.
                const SINH: Record<string, string> = {
                  Mộc: 'Hỏa',
                  Hỏa: 'Thổ',
                  Thổ: 'Kim',
                  Kim: 'Thủy',
                  Thủy: 'Mộc',
                };
                const KHAC: Record<string, string> = {
                  Mộc: 'Thổ',
                  Thổ: 'Thủy',
                  Thủy: 'Hỏa',
                  Hỏa: 'Kim',
                  Kim: 'Mộc',
                };
                const menhEl = ketQua.menhElement;
                let quanHe = 'Không sinh không khắc trực tiếp';
                if (nguHanhTen) {
                  if (SINH[nguHanhTen] === menhEl) quanHe = `Hành tên (${nguHanhTen}) sinh cho mệnh bé (${menhEl})`;
                  else if (SINH[menhEl] === nguHanhTen) quanHe = `Mệnh bé (${menhEl}) sinh cho hành tên (${nguHanhTen}) — sinh xuất`;
                  else if (nguHanhTen === menhEl) quanHe = `Cùng hành ${menhEl}`;
                  else if (KHAC[nguHanhTen] === menhEl) quanHe = `Hành tên (${nguHanhTen}) khắc mệnh bé (${menhEl})`;
                  else if (KHAC[menhEl] === nguHanhTen) quanHe = `Mệnh bé (${menhEl}) khắc hành tên (${nguHanhTen})`;
                }
                // Âm điệu: đếm thanh bằng (không dấu, huyền) và thanh trắc
                // (sắc, hỏi, ngã, nặng) theo dấu thanh từng tiếng — chỉ mô tả,
                // không chấm điểm âm điệu.
                let bang = 0;
                let trac = 0;
                for (const w of words) {
                  const nfd = w.normalize('NFD');
                  if (
                    nfd.includes('́') ||
                    nfd.includes('̉') ||
                    nfd.includes('̃') ||
                    nfd.includes('̣')
                  ) {
                    trac += 1;
                  } else {
                    bang += 1;
                  }
                }
                setPhanTich({
                  full: tenCuThe.trim(),
                  diem,
                  nguHanhTen,
                  soTen,
                  quanHe,
                  giaiThich,
                  amDieu: `${bang} tiếng thanh bằng, ${trac} tiếng thanh trắc (không chấm điểm)`,
                });
              }}
            >
              <div>
                <label className="label" htmlFor="dt-ten-cu-the">
                  Họ tên đầy đủ cần phân tích
                </label>
                <input
                  id="dt-ten-cu-the"
                  className="input"
                  value={tenCuThe}
                  onChange={(e) => setTenCuThe(e.target.value)}
                  placeholder="VD: Nguyễn Minh An"
                  required
                />
              </div>
              <button type="submit" className="btn-gold">
                Phân tích tên này
              </button>
            </form>
            {phanTich ? (
              <>
              <table className="w-full text-sm">
                <tbody>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Tên phân tích</td>
                    <td className="py-2">{phanTich.full}</td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Số tên + hành của số tên</td>
                    <td className="py-2">
                      Số tên {phanTich.soTen}
                      {phanTich.nguHanhTen ? ` — hành ${phanTich.nguHanhTen}` : ''}
                    </td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Tương sinh / tương khắc với mệnh bé</td>
                    <td className="py-2">{phanTich.quanHe}</td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Âm điệu</td>
                    <td className="py-2">{phanTich.amDieu}</td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Điểm tham khảo (mô hình đơn giản)</td>
                    <td className="py-2">
                      {phanTich.diem !== null ? `${phanTich.diem}/100` : 'Đang cập nhật'}
                      {phanTich.giaiThich ? ` — ${phanTich.giaiThich}` : ''}
                    </td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Đếm nét chữ</td>
                    <td className="py-2">
                      Chưa hỗ trợ — engine hiện không có bảng đếm nét chữ, không bịa điểm nét.
                    </td>
                  </tr>
                  <tr className="border-t border-gold/30">
                    <td className="py-2 pr-2 font-semibold">Nghĩa tên theo từ điển</td>
                    <td className="py-2">
                      Chưa hỗ trợ — engine hiện không có từ điển nghĩa tên, không bịa điểm nghĩa.
                      (Ý nghĩa ngắn trong danh sách gợi ý chỉ là nghĩa thông thường, không phải
                      điểm số.)
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="mt-4">
                <ToolShareCard
                  title={`Chấm điểm tên ${phanTich.full}`}
                  lines={[
                    `Số tên ${phanTich.soTen}${phanTich.nguHanhTen ? ` — hành ${phanTich.nguHanhTen}` : ''}`,
                    phanTich.quanHe,
                    ...(phanTich.diem !== null ? [`Điểm tham khảo: ${phanTich.diem}/100`] : []),
                  ]}
                />
              </div>
              </>
            ) : null}
          </div>
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
