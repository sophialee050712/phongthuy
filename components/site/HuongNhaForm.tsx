'use client';

import { useEffect, useMemo, useState } from 'react';
import { cungPhi, batTrach } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import { getBirthdate, getGender, profileFromBirthdate, type GioiTinh } from '@/lib/personal';
import { DIRECTIONS } from './format';

type HuongInfo = { sao: string; tot: boolean };

/** Ý nghĩa truyền thống của 8 sao bát trạch, diễn giải bằng ngôn ngữ đời thường. */
const SAO_GIAI_NGHIA: Record<string, string> = {
  'Sinh Khí':
    'Sao tốt nhất trong bát trạch, chủ về sinh khí dồi dào, công việc thuận lợi và tài lộc tăng trưởng. Hợp nhất để đặt hướng nhà và cửa chính.',
  'Thiên Y':
    'Sao chủ về sức khỏe và sự che chở, nhà ở hướng này theo quan niệm truyền thống giúp người trong nhà ít ốm đau, sống thọ. Hợp để đặt cửa chính và phòng ngủ.',
  'Diên Niên':
    'Sao chủ về hòa thuận và bền vững trong quan hệ gia đình, vợ chồng, con cái. Hợp để đặt cửa chính, bếp và bàn thờ, giúp nhà cửa yên ấm.',
  'Phục Vị':
    'Sao chủ về sự bình yên, ổn định và vững tâm, tốt cho học tập và công việc cần sự tập trung. Hợp để đặt bàn thờ, phòng làm việc và hướng nhà khi không chọn được 3 hướng tốt trên.',
  'Tuyệt Mệnh':
    'Sao xấu nhất trong bát trạch, theo quan niệm truyền thống chủ về hao tổn, bệnh nặng và tai nạn. Cần tránh tuyệt đối cho hướng nhà, cửa chính, bếp và bàn thờ.',
  'Ngũ Quỷ':
    'Sao chủ về thị phi, tranh chấp và hao tài, theo quan niệm truyền thống còn liên quan đến nguy cơ hỏa hoạn, trộm cắp. Nên tránh cho hướng nhà, cửa chính, bếp và bàn thờ.',
  'Lục Sát':
    'Sao chủ về cãi vã, trục trặc tình cảm và những hao tổn nhỏ nhưng dai dẳng. Nên tránh cho hướng nhà, cửa chính, bếp và bàn thờ.',
  'Họa Hại':
    'Sao chủ về vận xui, lời đồn và những rắc rối nhỏ không đáng có. Nên tránh cho hướng nhà, cửa chính, bếp và bàn thờ.',
};

/** Thứ hạng ưu tiên khi chọn hướng nhà / cửa chính: từ tốt nhất xuống. */
const THU_TU_UU_TIEN = ['Sinh Khí', 'Thiên Y', 'Diên Niên', 'Phục Vị'];

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export default function HuongNhaForm() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [submitted, setSubmitted] = useState(false);

  // Prefill ngày sinh đầy đủ + giới tính từ hồ sơ đã lưu trên trình duyệt (nếu có),
  // giống mẫu ở trang la bàn.
  useEffect(() => {
    const saved = getBirthdate();
    if (saved) setNgaySinh(saved);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    // profileFromBirthdate đã tự xử lý trường hợp sinh trước Tết Nguyên đán:
    // nó đổi ngày dương sang âm lịch bằng solarToLunar nên lunar.year chính
    // là năm âm lịch đúng (sinh tháng 1–2 dương trước Tết thuộc năm âm trước).
    const profile = profileFromBirthdate(ngaySinh);
    if (!profile) return null;
    const lunarYear = profile.lunar.year;
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
    if (!cung) return null;
    const huongTheoSao = (sao: string) =>
      DIRECTIONS.filter((d) => huong[d]?.sao === sao);
    const totList = DIRECTIONS.filter((d) => huong[d]?.tot);
    const xauList = DIRECTIONS.filter((d) => huong[d] && !huong[d].tot);
    // Xếp hạng hướng nhà từ tốt nhất xuống: Sinh Khí > Thiên Y > Diên Niên > Phục Vị.
    const xepHang = THU_TU_UU_TIEN.flatMap((sao) => huongTheoSao(sao));
    const cuaChinh = [...huongTheoSao('Sinh Khí'), ...huongTheoSao('Thiên Y'), ...huongTheoSao('Diên Niên')];
    const bepBanTho = [...huongTheoSao('Diên Niên'), ...huongTheoSao('Phục Vị'), ...huongTheoSao('Thiên Y')];
    const totTheoSao = THU_TU_UU_TIEN.map((sao) => ({
      sao,
      huong: huongTheoSao(sao),
    })).filter((row) => row.huong.length > 0);
    const xauTheoSao = ['Tuyệt Mệnh', 'Ngũ Quỷ', 'Lục Sát', 'Họa Hại']
      .map((sao) => ({ sao, huong: huongTheoSao(sao) }))
      .filter((row) => row.huong.length > 0);
    return {
      profile,
      lunarYear,
      cung,
      nhom,
      huong,
      totList,
      xauList,
      xepHang,
      cuaChinh,
      bepBanTho,
      totTheoSao,
      xauTheoSao,
    };
  }, [submitted, ngaySinh, gioiTinh]);

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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="hn-ngay">
              Ngày sinh đầy đủ của gia chủ (dương lịch)
            </label>
            <input
              id="hn-ngay"
              type="date"
              className="input"
              value={ngaySinh}
              onChange={(e) => {
                setNgaySinh(e.target.value);
                setSubmitted(false);
              }}
              required
            />
            <p className="mt-1 text-xs text-ink/70">
              Đã tự điền từ hồ sơ của bạn nếu đã lưu. Ngày sinh trước Tết Nguyên đán được tự động
              quy về năm âm lịch trước đó — không cần tick thêm ô nào.
            </p>
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
        </div>
        <button type="submit" className="btn-primary">
          Chọn hướng nhà
        </button>
      </form>

      {submitted && !ketQua ? (
        <p className="text-sm text-ink/80">Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Mệnh quái của gia chủ</h2>
            <p>
              Ngày sinh dương lịch: <strong>{ketQua.profile.solar}</strong> — tương ứng{' '}
              <strong>
                ngày {ketQua.profile.lunar.day} tháng {ketQua.profile.lunar.month}
                {ketQua.profile.lunar.leap ? ' nhuận' : ''} năm {ketQua.lunarYear} âm lịch
              </strong>{' '}
              ({ketQua.profile.canChiNam}, tuổi {ketQua.profile.conGiap}).
            </p>
            <p>
              Cung phi: <strong>{ketQua.cung}</strong>
              {ketQua.nhom ? (
                <>
                  {' '}
                  — <strong>{ketQua.nhom} tứ mệnh</strong>
                </>
              ) : null}
              {ketQua.nhom === 'Đông' ? (
                <span className="text-ink/80">
                  {' '}
                  (người Đông tứ mệnh hợp các hướng Đông, Đông Nam, Nam, Bắc)
                </span>
              ) : ketQua.nhom === 'Tây' ? (
                <span className="text-ink/80">
                  {' '}
                  (người Tây tứ mệnh hợp các hướng Tây, Tây Bắc, Tây Nam, Đông Bắc)
                </span>
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

          <div className="card space-y-3">
            <h3 className="font-display text-lg font-bold text-primary">4 hướng tốt — nên chọn</h3>
            {ketQua.totTheoSao.map((row) => (
              <p key={row.sao} className="text-sm">
                <strong>
                  {row.sao} — hướng {row.huong.join(', ')}:
                </strong>{' '}
                {SAO_GIAI_NGHIA[row.sao]}
              </p>
            ))}
          </div>

          <div className="card space-y-3">
            <h3 className="font-display text-lg font-bold text-primary">4 hướng xấu — nên tránh</h3>
            {ketQua.xauTheoSao.map((row) => (
              <p key={row.sao} className="text-sm">
                <strong>
                  {row.sao} — hướng {row.huong.join(', ')}:
                </strong>{' '}
                {SAO_GIAI_NGHIA[row.sao]}
              </p>
            ))}
          </div>

          <div className="card space-y-2">
            <h3 className="font-display text-lg font-bold text-primary">Khuyến nghị chọn hướng nhà</h3>
            <p>
              Hướng nhà tốt nhất cho gia chủ, xếp theo thứ tự ưu tiên:{' '}
              <strong>{ketQua.xepHang.join(' → ') || 'Đang cập nhật'}</strong>{' '}
              (tương ứng Sinh Khí → Thiên Y → Diên Niên → Phục Vị). Nếu không chọn được hướng đầu,
              chọn hướng tiếp theo trong danh sách vẫn là hướng tốt theo bát trạch.
            </p>
            <p>
              Hướng cửa chính nên chọn:{' '}
              <strong>{ketQua.cuaChinh.length > 0 ? ketQua.cuaChinh.join(', ') : ketQua.totList.join(', ') || 'Đang cập nhật'}</strong>{' '}
              (ưu tiên Sinh Khí, Thiên Y, Diên Niên — cửa là nơi đón khí vào nhà nên càng hợp sao
              tốt càng tốt).
            </p>
            <p>
              Hướng bếp và bàn thờ nên chọn:{' '}
              <strong>{ketQua.bepBanTho.length > 0 ? [...new Set(ketQua.bepBanTho)].join(', ') : ketQua.totList.join(', ') || 'Đang cập nhật'}</strong>{' '}
              (ưu tiên Diên Niên, Phục Vị, Thiên Y).
            </p>
            <p>
              Hướng nên tránh đặt cửa chính, bếp, bàn thờ:{' '}
              <strong>{ketQua.xauList.join(', ') || 'Đang cập nhật'}</strong> — đặc biệt tránh{' '}
              <strong>{ketQua.xauTheoSao[0]?.huong.join(', ') || ''}</strong>{' '}
              (Tuyệt Mệnh, sao xấu nhất) cho hướng nhà và cửa chính.
            </p>
            <p className="text-sm text-ink/80">
              Lưu ý: hướng nhà còn phụ thuộc thế đất, đường đi và bố cục thực tế — kết quả trên
              chỉ xét theo cung phi bát trạch.
            </p>
          </div>
          <ToolShareCard
            title={`Chọn hướng nhà — cung ${ketQua.cung || 'bát trạch'}`}
            lines={[
              `Cung phi: ${ketQua.cung}${ketQua.nhom ? ` (${ketQua.nhom} tứ mệnh)` : ''}`,
              `Hướng nhà tốt nhất: ${ketQua.xepHang[0] ?? 'Đang cập nhật'}`,
              `Hướng tốt: ${ketQua.totList.join(', ') || 'Đang cập nhật'}`,
              `Hướng xấu nên tránh: ${ketQua.xauList.join(', ') || 'Đang cập nhật'}`,
            ]}
          />
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
