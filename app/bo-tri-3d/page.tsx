'use client';

// Bố trí nhà 3D theo bát trạch: khác /la-ban (đặt phòng thủ công từng hướng),
// trang này TỰ ĐỘNG tối ưu: nhập kích thước + cửa, máy liệt kê mọi cách gán
// phòng → hướng và trả phương án điểm cao nhất theo quy tắc công khai dưới đây.
// Đây là phương án TỐT NHẤT THEO QUY TẮC ĐÃ NÊU, chỉ để tham khảo — không
// phải "hoàn hảo" tuyệt đối và không có thầy nào duyệt qua.
import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Disclaimer from '@/components/site/Disclaimer';
import { getBirthdate, getGender, profileFromBirthdate, type GioiTinh } from '@/lib/personal';
import { batTrach, cungPhi } from '@/lib/engine';
import {
  ALL_ROOMS,
  doorPosition,
  optimizeLayout,
  zoneRect,
  type DoorWall,
  type OptimizedLayout,
} from '@/lib/boTri3d';

const BoTri3DView = dynamic(() => import('@/components/site/BoTri3DView'), { ssr: false });

const WALL_LABEL: Record<DoorWall, string> = {
  truoc: 'Mặt trước (cạnh dưới sơ đồ, phía Nam)',
  sau: 'Mặt sau (cạnh trên sơ đồ, phía Bắc)',
  trai: 'Bên trái (cạnh Tây)',
  phai: 'Bên phải (cạnh Đông)',
};

const CORNER_HINT: Record<DoorWall, string> = {
  truoc: 'Đo từ góc Tây Nam (góc dưới–trái) đi về phía Đông.',
  sau: 'Đo từ góc Tây Bắc (góc trên–trái) đi về phía Đông.',
  trai: 'Đo từ góc Tây Bắc (góc trên–trái) đi về phía Nam.',
  phai: 'Đo từ góc Đông Bắc (góc trên–phải) đi về phía Nam.',
};

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

export default function BoTri3DPage() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [length, setLength] = useState('12');
  const [width, setWidth] = useState('9');
  const [height, setHeight] = useState('3.2');
  const [doorWall, setDoorWall] = useState<DoorWall>('truoc');
  const [doorDistance, setDoorDistance] = useState('6');
  const [selected, setSelected] = useState<string[]>(['Phòng khách', 'Bếp', 'Phòng ngủ', 'Phòng thờ']);
  const [areas, setAreas] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) setNgaySinh(stored);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const result = useMemo((): { cung: string; nhom: string; layout: OptimizedLayout } | null => {
    if (!submitted) return null;
    const profile = profileFromBirthdate(ngaySinh);
    if (!profile) return null;
    try {
      const cp = cungPhi(gioiTinh, profile.lunar.year);
      const table = batTrach(cp.cung);
      const layout = optimizeLayout({
        zones: table,
        rooms: selected.map((name) => ({
          name,
          area: areas[name] ? Number(areas[name]) : undefined,
        })),
        doorWall,
        doorDistance: Number(doorDistance),
        length: Number(length),
        width: Number(width),
      });
      return { cung: cp.cung, nhom: cp.nhom, layout };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh, selected, areas, doorWall, doorDistance, length, width]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const L = Number(length);
    const W = Number(width);
    const H = Number(height);
    const d = Number(doorDistance);
    const wallLen = doorWall === 'truoc' || doorWall === 'sau' ? L : W;
    if (!profileFromBirthdate(ngaySinh)) {
      setError('Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.');
      setSubmitted(false);
      return;
    }
    if (!(L > 0) || !(W > 0) || !(H > 0)) {
      setError('Chiều dài, chiều rộng và chiều cao trần phải là số dương.');
      setSubmitted(false);
      return;
    }
    if (L > 100 || W > 100 || H > 10) {
      setError('Kích thước vượt giới hạn hiển thị (dài/rộng tối đa 100 m, trần tối đa 10 m).');
      setSubmitted(false);
      return;
    }
    if (!(d >= 0) || d > wallLen) {
      setError(`Khoảng cách cửa phải từ 0 đến ${wallLen} m (chiều dài tường đã chọn).`);
      setSubmitted(false);
      return;
    }
    if (selected.length === 0) {
      setError('Chọn ít nhất một phòng để bố trí.');
      setSubmitted(false);
      return;
    }
    for (const name of selected) {
      if (areas[name] && !(Number(areas[name]) > 0)) {
        setError(`Diện tích của ${name} phải là số dương (hoặc để trống để tự chia).`);
        setSubmitted(false);
        return;
      }
    }
    setSubmitted(true);
  }

  const L = Number(length) || 0;
  const W = Number(width) || 0;
  const H = Number(height) || 0;
  const svgW = 600;
  const svgH = L > 0 ? Math.round((600 * W) / L) : 450;
  const doorPos = result && L > 0 && W > 0
    ? doorPosition(doorWall, Number(doorDistance), L, W)
    : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Bố trí nhà 3D theo bát trạch</h1>
      <p className="text-ink/80">
        Nhập ngày sinh gia chủ để tính cung phi, nhập kích thước nhà và vị trí cửa chính, chọn các
        phòng muốn bố trí — hệ thống tự tìm phương án điểm cao nhất theo quy tắc bát trạch. Khác
        với <a href="/la-ban" className="underline">la bàn tương tác</a> (bạn tự đặt từng phòng),
        ở đây máy tối ưu thay bạn.
      </p>

      <div className="card space-y-2">
        <h2 className="font-display text-xl font-bold text-primary">Quy tắc chấm điểm (công khai)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink/80">
          <li>Phòng tốt (Phòng khách, Bếp, Phòng ngủ, Phòng thờ) ở hướng tốt: +10; ở hướng xấu: −10.</li>
          <li>Phòng xấu (Nhà vệ sinh, Kho) ở hướng xấu: +10 (nguyên tắc “lấy độc trị độc”); ở hướng tốt: −10.</li>
          <li>Phòng trung tính (Phòng ăn, Phòng làm việc) ở hướng tốt: +3; ở hướng xấu: −3.</li>
          <li>Cửa chính ở hướng tốt: +5; ở hướng xấu: −5. Vị trí cửa do bạn nhập và không bao giờ bị dời.</li>
        </ul>
        <p className="text-sm text-ink/80">
          Mặt bằng chia thành lưới 3×3: 8 ô biên là 8 hướng bát trạch, ô giữa là không gian chung
          (không gán phòng). Sơ đồ vẽ theo hướng Bắc lên trên; mặt trước là cạnh dưới (phía Nam).
          Kết quả là phương án tốt nhất <em>theo đúng các quy tắc trên</em>, chỉ để tham khảo.
        </p>
      </div>

      <form className="card space-y-4" onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="bt-ngay">Ngày sinh gia chủ (dương lịch)</label>
            <input
              id="bt-ngay"
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
              Đã tự điền từ <a href="/ho-so" className="underline">hồ sơ của bạn</a> nếu đã lưu.
            </p>
          </div>
          <div>
            <span className="label">Giới tính (dùng để tính cung phi)</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bt-gt" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
                Nam
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="bt-gt" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
                Nữ
              </label>
            </div>
          </div>
          <div>
            <label className="label" htmlFor="bt-dai">Chiều dài nhà (m, hướng Đông–Tây)</label>
            <input id="bt-dai" type="number" step="0.1" min="0" className="input" value={length} onChange={(e) => { setLength(e.target.value); setSubmitted(false); }} required />
          </div>
          <div>
            <label className="label" htmlFor="bt-rong">Chiều rộng nhà (m, hướng Bắc–Nam)</label>
            <input id="bt-rong" type="number" step="0.1" min="0" className="input" value={width} onChange={(e) => { setWidth(e.target.value); setSubmitted(false); }} required />
          </div>
          <div>
            <label className="label" htmlFor="bt-cao">Chiều cao trần (m)</label>
            <input id="bt-cao" type="number" step="0.1" min="0" className="input" value={height} onChange={(e) => { setHeight(e.target.value); setSubmitted(false); }} required />
          </div>
          <div>
            <label className="label" htmlFor="bt-tuong">Cửa chính ở tường nào</label>
            <select id="bt-tuong" className="input" value={doorWall} onChange={(e) => { setDoorWall(e.target.value as DoorWall); setSubmitted(false); }}>
              {(Object.keys(WALL_LABEL) as DoorWall[]).map((w) => (
                <option key={w} value={w}>{WALL_LABEL[w]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="bt-kc">Khoảng cách cửa từ góc (m)</label>
            <input id="bt-kc" type="number" step="0.1" min="0" className="input" value={doorDistance} onChange={(e) => { setDoorDistance(e.target.value); setSubmitted(false); }} required />
            <p className="mt-1 text-xs text-ink/70">{CORNER_HINT[doorWall]}</p>
          </div>
        </div>

        <div>
          <span className="label">Các phòng muốn bố trí (tối đa 8 — mỗi hướng chỉ một phòng)</span>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {ALL_ROOMS.map((room) => {
              const checked = selected.includes(room);
              return (
                <div key={room} className="flex items-center gap-2 rounded border border-gold/30 px-2 py-2">
                  <input
                    type="checkbox"
                    id={`bt-phong-${room}`}
                    checked={checked}
                    onChange={() => {
                      setSubmitted(false);
                      setSelected((prev) =>
                        prev.includes(room) ? prev.filter((r) => r !== room) : [...prev, room],
                      );
                    }}
                  />
                  <label htmlFor={`bt-phong-${room}`} className="flex-1 text-sm font-semibold">{room}</label>
                  {checked && (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Diện tích (m², để trống = tự chia)"
                      aria-label={`Diện tích ${room}`}
                      className="input !w-40 !py-1 text-sm"
                      value={areas[room] ?? ''}
                      onChange={(e) => {
                        setAreas((prev) => ({ ...prev, [room]: e.target.value }));
                        setSubmitted(false);
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-xs text-ink/70">
            Diện tích để trống sẽ được chia đều phần còn lại của mặt bằng; nếu tổng diện tích nhập
            vượt mặt bằng, hệ thống co theo tỷ lệ và cảnh báo.
          </p>
        </div>

        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" className="btn-primary">Tối ưu bố trí và xem 3D</button>
      </form>

      {result ? (
        <div className="space-y-4">
          <div className="card space-y-1">
            <p>
              Cung phi gia chủ: <strong>{result.cung}</strong> (nhóm {result.nhom} tứ mệnh).
            </p>
            <p>
              Cửa chính: hướng <strong>{result.layout.door.direction}</strong> (sao{' '}
              {result.layout.door.sao}, {result.layout.door.tot ? 'hướng tốt' : 'hướng xấu'}) — điểm{' '}
              {result.layout.door.score > 0 ? `+${result.layout.door.score}` : result.layout.door.score}.
              Vị trí cửa giữ nguyên như bạn đã nhập, không bị dời để lấy điểm.
            </p>
            <p className="text-sm text-ink/80">
              Tổng điểm: <strong>{result.layout.total}</strong> (phòng tốt {result.layout.breakdown.phongTot >= 0 ? `+${result.layout.breakdown.phongTot}` : result.layout.breakdown.phongTot}
              {' · '}phòng xấu {result.layout.breakdown.phongXau >= 0 ? `+${result.layout.breakdown.phongXau}` : result.layout.breakdown.phongXau}
              {' · '}phòng trung tính {result.layout.breakdown.phongTrung >= 0 ? `+${result.layout.breakdown.phongTrung}` : result.layout.breakdown.phongTrung}
              {' · '}cửa {result.layout.breakdown.cua >= 0 ? `+${result.layout.breakdown.cua}` : result.layout.breakdown.cua}).
            </p>
            {result.layout.warnings.map((w) => (
              <p key={w} className="rounded bg-gold/20 px-2 py-1 text-sm font-semibold text-primary">{w}</p>
            ))}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Giải thích từng phòng</h2>
            {result.layout.assignments.map((a) => (
              <p key={a.room} className="text-sm">
                <strong>{a.room}</strong> — {a.explanation} Diện tích hiển thị {a.area} m².
                (Điểm {a.score > 0 ? `+${a.score}` : a.score})
              </p>
            ))}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Khung nhìn 3D tương tác</h2>
            <BoTri3DView layout={result.layout} length={L} width={W} height={H} />
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Sơ đồ mặt bằng 2D (nhìn từ trên xuống, Bắc ở trên)</h2>
            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              className="w-full rounded-lg border border-gold/40 bg-white"
              role="img"
              aria-label="Sơ đồ mặt bằng 2D với các phòng đã bố trí và vị trí cửa"
            >
              {result.layout.assignments.map((a, i) => {
                const r = zoneRect(a.direction, L, W);
                const sx = (r.x / L) * svgW;
                const sy = (r.y / W) * svgH;
                const sw = (r.w / L) * svgW;
                const sh = (r.h / W) * svgH;
                return (
                  <g key={a.room}>
                    <rect x={sx} y={sy} width={sw} height={sh} fill={ROOM_COLORS[i % ROOM_COLORS.length]} fillOpacity={0.85} stroke="#fff" strokeWidth={2} />
                    <text x={sx + sw / 2} y={sy + sh / 2 - 8} textAnchor="middle" fill="#fff" fontSize={15} fontWeight="bold">{a.room}</text>
                    <text x={sx + sw / 2} y={sy + sh / 2 + 12} textAnchor="middle" fill="#fff" fontSize={12}>{a.direction} · {a.sao}</text>
                    <text x={sx + sw / 2} y={sy + sh / 2 + 30} textAnchor="middle" fill="#fff" fontSize={11}>{a.area} m²</text>
                  </g>
                );
              })}
              {/* Ô giữa chưa gán phòng: ghi chú không gian chung. */}
              <text x={svgW / 2} y={svgH / 2 - 6} textAnchor="middle" fontSize={12} fill="#2C1810" opacity={0.7}>
                {result.layout.assignments.length < 8 ? 'Giữa nhà (không gian chung)' : ''}
              </text>
              {doorPos && (
                <g>
                  <rect
                    x={(doorPos.x / L) * svgW - 22}
                    y={(doorPos.y / W) * svgH - 12}
                    width={44}
                    height={24}
                    rx={4}
                    fill="#C9A227"
                    stroke="#7B1E1E"
                    strokeWidth={1.5}
                  />
                  <text x={(doorPos.x / L) * svgW} y={(doorPos.y / W) * svgH + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#7B1E1E">CỬA</text>
                </g>
              )}
            </svg>
            <p className="text-xs text-ink/70">
              Chú thích: mỗi ô màu là một phòng đã bố trí; nhãn ghi hướng bát trạch, sao và diện tích
              hiển thị. Ô vàng “CỬA” là cửa chính đúng vị trí bạn nhập.
            </p>
          </div>
        </div>
      ) : submitted ? (
        <p className="text-sm text-ink/80">Không tính được bố trí — vui lòng kiểm tra lại ngày sinh và kích thước.</p>
      ) : null}
      <Disclaimer text="Phương án trên là bố trí tốt nhất theo đúng các quy tắc chấm điểm đã nêu, chỉ để tham khảo. Đây không phải bố trí phong thủy “hoàn hảo” tuyệt đối, không thay thế đo đạc và tư vấn thực tế, và không có thầy phong thủy nào duyệt qua kết quả này." />
    </div>
  );
}
