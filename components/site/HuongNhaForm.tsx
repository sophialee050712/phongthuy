'use client';

import { useMemo, useState } from 'react';
import { cungPhi, batTrach } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import { DIRECTIONS } from './format';

type HuongInfo = { sao: string; tot: boolean };

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export default function HuongNhaForm() {
  const [namSinh, setNamSinh] = useState('1990');
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [truocTet, setTruocTet] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const solarYear = Number(namSinh);
    if (!solarYear || solarYear < 1900 || solarYear > 2100) return null;
    // Cung phi tính theo năm âm lịch: sinh trước Tết Nguyên đán thì
    // năm âm lùi 1 so với năm dương.
    const lunarYear = truocTet ? solarYear - 1 : solarYear;
    let cung = '';
    let nhom = '';
    const huong: Record<string, HuongInfo> = {};
    try {
      const cp = cungPhi(gioiTinh, lunarYear) as unknown as { cung?: unknown; nhom?: unknown };
      cung = String(cp?.cung ?? '');
      nhom = String(cp?.nhom ?? '');
      const bt = batTrach(cung) as unknown as Record<string, unknown>;
      for (const dir of DIRECTIONS) {
        const v = bt?.[dir];
        if (v && typeof v === 'object') {
          const rec = v as Record<string, unknown>;
          huong[dir] = { sao: String(rec.sao ?? ''), tot: rec.tot === true };
        }
      }
    } catch {
      // giữ rỗng, vẫn hiển thị form
    }
    const totList = DIRECTIONS.filter((d) => huong[d]?.tot);
    const xauList = DIRECTIONS.filter((d) => huong[d] && !huong[d].tot);
    const totSao = (sao: string) => totList.filter((d) => huong[d]?.sao === sao);
    const cuaChinh = [...totSao('Sinh Khí'), ...totSao('Thiên Y'), ...totSao('Diên Niên')];
    const bepBanTho = [...totSao('Diên Niên'), ...totSao('Phục Vị'), ...totSao('Thiên Y')];
    return { solarYear, lunarYear, cung, nhom, huong, totList, xauList, cuaChinh, bepBanTho };
  }, [submitted, namSinh, gioiTinh, truocTet]);

  const cx = 200;
  const cy = 200;
  const rOut = 185;
  const rIn = 62;

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
          <label className="label" htmlFor="hn-nam">
            Năm sinh dương lịch của gia chủ
          </label>
          <input
            id="hn-nam"
            type="number"
            className="input"
            value={namSinh}
            onChange={(e) => {
              setNamSinh(e.target.value);
              setSubmitted(false);
            }}
            min={1900}
            max={2100}
            required
          />
        </div>
        <div>
          <span className="label">Giới tính gia chủ</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hn-gioi-tinh"
                checked={gioiTinh === 'nam'}
                onChange={() => setGioiTinh('nam')}
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hn-gioi-tinh"
                checked={gioiTinh === 'nu'}
                onChange={() => setGioiTinh('nu')}
              />
              Nữ
            </label>
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={truocTet}
            onChange={(e) => setTruocTet(e.target.checked)}
            className="mt-1"
          />
          <span>
            Sinh trước Tết Nguyên đán (năm âm lịch lùi 1 so với năm dương — ví dụ sinh tháng 1
            dương lịch trước Tết thì năm âm là năm trước đó)
          </span>
        </label>
        <button type="submit" className="btn-primary">
          Xem hướng nhà
        </button>
      </form>

      {ketQua ? (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Mệnh quái của gia chủ</h2>
            <p>
              Năm âm lịch tính cung phi: <strong>{ketQua.lunarYear}</strong> — cung{' '}
              <strong>{ketQua.cung || 'Đang cập nhật'}</strong>
              {ketQua.nhom ? (
                <>
                  {' '}
                  — <strong>{ketQua.nhom} tứ mệnh</strong>
                </>
              ) : null}
            </p>
            <p className="text-sm text-ink/80">
              La bàn tô màu theo bát trạch: <span className="font-semibold text-primary">vàng nhạt = hướng tốt</span>,{' '}
              <span className="font-semibold">hồng nhạt = hướng xấu</span>.
            </p>
          </div>

          <div className="card">
            <svg viewBox="0 0 400 400" className="mx-auto w-full max-w-md" role="img" aria-label="La bàn bát trạch 8 hướng">
              {DIRECTIONS.map((dir, i) => {
                const a0 = i * 45 - 22.5;
                const a1 = i * 45 + 22.5;
                const [x0, y0] = polar(cx, cy, rOut, a0);
                const [x1, y1] = polar(cx, cy, rOut, a1);
                const [ix0, iy0] = polar(cx, cy, rIn, a1);
                const [ix1, iy1] = polar(cx, cy, rIn, a0);
                const [lx, ly] = polar(cx, cy, 132, i * 45);
                const info = ketQua.huong[dir];
                const tot = info?.tot === true;
                const hasData = !!info;
                return (
                  <g key={dir}>
                    <path
                      d={`M ${x0} ${y0} A ${rOut} ${rOut} 0 0 1 ${x1} ${y1} L ${ix0} ${iy0} A ${rIn} ${rIn} 0 0 0 ${ix1} ${iy1} Z`}
                      fill={hasData ? (tot ? '#F5E9C8' : '#F3D9D9') : '#FAF6EF'}
                      stroke="#C9A227"
                      strokeWidth="1"
                    />
                    <text x={lx} y={ly - 4} textAnchor="middle" fontSize="13" fontWeight="700" fill="#2C1810">
                      {dir}
                    </text>
                    <text x={lx} y={ly + 12} textAnchor="middle" fontSize="11" fill="#7B1E1E">
                      {info?.sao ?? ''}
                    </text>
                  </g>
                );
              })}
              <circle cx={cx} cy={cy} r={rIn - 4} fill="#FFFFFF" stroke="#C9A227" strokeWidth="1.5" />
              <text x={cx} y={cy - 4} textAnchor="middle" fontSize="15" fontWeight="700" fill="#7B1E1E">
                {ketQua.cung || '?'}
              </text>
              <text x={cx} y={cy + 16} textAnchor="middle" fontSize="11" fill="#2C1810">
                {ketQua.nhom ? `${ketQua.nhom} tứ mệnh` : ''}
              </text>
            </svg>
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
              {DIRECTIONS.map((dir) => {
                const info = ketQua.huong[dir];
                if (!info) return null;
                return (
                  <p key={dir} className="text-sm">
                    <strong>{dir}:</strong> {info.sao}{' '}
                    <span className={info.tot ? 'font-semibold text-primary' : 'text-ink/70'}>
                      ({info.tot ? 'Tốt' : 'Xấu'})
                    </span>
                  </p>
                );
              })}
            </div>
          </div>

          <div className="card space-y-2">
            <h3 className="font-display text-lg font-bold text-primary">Gợi ý bố trí</h3>
            <p>
              Hướng cửa chính nên chọn:{' '}
              <strong>{ketQua.cuaChinh.length > 0 ? ketQua.cuaChinh.join(', ') : ketQua.totList.join(', ') || 'Đang cập nhật'}</strong>{' '}
              (ưu tiên Sinh Khí, Thiên Y, Diên Niên).
            </p>
            <p>
              Hướng bếp và bàn thờ nên chọn:{' '}
              <strong>{ketQua.bepBanTho.length > 0 ? [...new Set(ketQua.bepBanTho)].join(', ') : ketQua.totList.join(', ') || 'Đang cập nhật'}</strong>{' '}
              (ưu tiên Diên Niên, Phục Vị, Thiên Y).
            </p>
            <p>
              Hướng nên tránh đặt cửa chính, bếp, bàn thờ:{' '}
              <strong>{ketQua.xauList.join(', ') || 'Đang cập nhật'}</strong>.
            </p>
            <p className="text-sm text-ink/80">
              Lưu ý: hướng nhà còn phụ thuộc thế đất, đường đi và bố cục thực tế — kết quả trên
              chỉ xét theo cung phi bát trạch.
            </p>
          </div>
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
