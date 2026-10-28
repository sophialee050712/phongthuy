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
  minArea,
  optimizeLayout,
  roomFootprint,
  zoneRect,
  type DoorWall,
  type OptimizedLayout,
} from '@/lib/boTri3d';
import { scoreFreePlan, validatePlan, type RoomRect } from '@/lib/plan3d';
import PlanEditor2D from '@/components/site/PlanEditor2D';

const BoTri3DView = dynamic(() => import('@/components/site/BoTri3DView'), { ssr: false });
const Plan3DView = dynamic(() => import('@/components/site/Plan3DView'), { ssr: false });

const WALL_LABEL: Record<DoorWall, string> = {
  truoc: 'Mặt trước (cạnh rộng phía Nam)',
  sau: 'Mặt sau (cạnh rộng phía Bắc)',
  trai: 'Bên trái (cạnh dài phía Tây)',
  phai: 'Bên phải (cạnh dài phía Đông)',
};

const CORNER_HINT: Record<DoorWall, string> = {
  truoc: 'Đo từ góc Tây Nam (góc dưới–trái) đi về phía Đông.',
  sau: 'Đo từ góc Tây Bắc (góc trên–trái) đi về phía Đông.',
  trai: 'Đo từ góc Tây Bắc (góc trên–trái) đi về phía Nam.',
  phai: 'Đo từ góc Đông Bắc (góc trên–phải) đi về phía Nam.',
};

// Kiểu nhà chỉ là mẫu điền sẵn kích thước (mặt tiền × chiều sâu × trần) và
// đặt cửa giữa mặt tiền — khách vẫn sửa lại từng số được, không ràng buộc gì
// thêm vào bài toán tối ưu (vị trí phòng vẫn do bát trạch quyết định).
type HouseStyleId = 'tu-do' | 'nha-ong' | 'nha-cap-4' | 'biet-thu' | 'can-ho' | 'nha-vuon';
const HOUSE_STYLES: Record<string, { label: string; facade: number; depth: number; height: number; desc: string }> = {
  'nha-ong': { label: 'Nhà ống', facade: 5, depth: 18, height: 3.4, desc: 'Mặt tiền hẹp, chiều sâu lớn; cửa chính thường ở mặt tiền hẹp.' },
  'nha-cap-4': { label: 'Nhà cấp 4', facade: 10, depth: 14, height: 3.6, desc: 'Một tầng, mặt tiền vừa, chiều sâu vừa; thường có sân trước/sau.' },
  'biet-thu': { label: 'Biệt thự', facade: 14, depth: 13, height: 3.8, desc: 'Mặt tiền rộng, nhiều phòng, sân vườn bao quanh.' },
  'can-ho': { label: 'Căn hộ chung cư', facade: 9, depth: 8, height: 2.9, desc: 'Mặt bằng gọn, trần thấp hơn nhà đất.' },
  'nha-vuon': { label: 'Nhà vườn', facade: 12, depth: 16, height: 3.6, desc: 'Nhà giữa vườn, mặt tiền thoáng, chiều sâu lớn.' },
};

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

export default function BoTri3DPage() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [depth, setDepth] = useState('9');
  const [facade, setFacade] = useState('12');
  const [height, setHeight] = useState('3.2');
  const [doorWall, setDoorWall] = useState<DoorWall>('truoc');
  const [doorDistance, setDoorDistance] = useState('6');
  const [houseStyle, setHouseStyle] = useState<HouseStyleId>('tu-do');
  const [selected, setSelected] = useState<string[]>(['Phòng khách', 'Bếp', 'Phòng ngủ', 'Phòng thờ']);
  const [areas, setAreas] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  // Chế độ Vẽ tự do (3D v2): phòng là hình chữ nhật tự do, không còn lưới 3×3
  // ép hình. Mặt bằng mẫu mặc định lát kín nhà 12×9 bằng 4 phòng.
  const [mode, setMode] = useState<'auto' | 'free'>('auto');
  const [freeRooms, setFreeRooms] = useState<RoomRect[]>([
    { id: 'free-khach', room: 'Phòng khách', x: 0, y: 5, w: 6, d: 4 },
    { id: 'free-bep', room: 'Bếp', x: 6, y: 5, w: 6, d: 4 },
    { id: 'free-ngu', room: 'Phòng ngủ', x: 0, y: 0, w: 6, d: 5 },
    { id: 'free-tho', room: 'Phòng thờ', x: 6, y: 0, w: 6, d: 5 },
  ]);

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) setNgaySinh(stored);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const result = useMemo(
    ():
      | { ok: true; cung: string; nhom: string; layout: OptimizedLayout }
      | { ok: false; message: string }
      | null => {
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
          depth: Number(depth),
          facade: Number(facade),
        });
        return { ok: true, cung: cp.cung, nhom: cp.nhom, layout };
      } catch (e) {
        // Lỗi từ optimizeLayout (ví dụ "Không đủ diện tích...") phải hiện
        // nguyên văn cho người dùng — không nuốt thành câu chung chung.
        return { ok: false, message: e instanceof Error ? e.message : 'Không tính được bố trí.' };
      }
    },
    [submitted, ngaySinh, gioiTinh, selected, areas, doorWall, doorDistance, depth, facade],
  );

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const D = Number(depth);
    const F = Number(facade);
    const H = Number(height);
    const d = Number(doorDistance);
    const wallLen = doorWall === 'truoc' || doorWall === 'sau' ? F : D;
    if (!profileFromBirthdate(ngaySinh)) {
      setError('Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.');
      setSubmitted(false);
      return;
    }
    if (!(D > 0) || !(F > 0) || !(H > 0)) {
      setError('Chiều dài (chiều sâu), chiều rộng (mặt tiền) và chiều cao trần phải là số dương.');
      setSubmitted(false);
      return;
    }
    if (D > 100 || F > 100 || H > 10) {
      setError('Kích thước vượt giới hạn hiển thị (dài/rộng tối đa 100 m, trần tối đa 10 m).');
      setSubmitted(false);
      return;
    }
    if (!(d >= 0) || d > wallLen) {
      setError(`Khoảng cách cửa phải từ 0 đến ${wallLen} m (chiều dài tường đã chọn).`);
      setSubmitted(false);
      return;
    }
    if (mode === 'free') {
      const errs = validatePlan(freeRooms, F, D);
      if (freeRooms.length === 0) {
        setError('Vẽ ít nhất một phòng để chấm điểm.');
        setSubmitted(false);
        return;
      }
      if (errs.length > 0) {
        setError(errs.join(' '));
        setSubmitted(false);
        return;
      }
      setSubmitted(true);
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

  const freeResult = useMemo(() => {
    if (!submitted || mode !== 'free') return null;
    const profile = profileFromBirthdate(ngaySinh);
    if (!profile) return null;
    try {
      const cp = cungPhi(gioiTinh, profile.lunar.year);
      const table = batTrach(cp.cung);
      const scored = scoreFreePlan({
        zones: table,
        rooms: freeRooms,
        doorWall,
        doorDistance: Number(doorDistance),
        facade: Number(facade),
        depth: Number(depth),
      });
      return { ok: true as const, cung: cp.cung, nhom: cp.nhom, scored };
    } catch (e) {
      return { ok: false as const, message: e instanceof Error ? e.message : 'Không tính được bố trí.' };
    }
  }, [submitted, mode, ngaySinh, gioiTinh, freeRooms, doorWall, doorDistance, facade, depth]);

  const D = Number(depth) || 0;
  const F = Number(facade) || 0;
  const H = Number(height) || 0;
  const svgW = 600;
  const svgH = F > 0 ? Math.round((600 * D) / F) : 450;
  const doorPos = result && result.ok && D > 0 && F > 0
    ? doorPosition(doorWall, Number(doorDistance), D, F)
    : null;
  const sumArea = result && result.ok
    ? Math.round(result.layout.assignments.reduce((s, a) => s + a.area, 0) * 10) / 10
    : 0;
  const leftover = result && result.ok ? Math.round((D * F - sumArea) * 10) / 10 : 0;

  useEffect(() => {
    if ((result && result.ok) || (freeResult && freeResult.ok)) {
      document.getElementById('ket-qua')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [result, freeResult]);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Bố trí nhà 3D theo bát trạch</h1>
      <p className="text-ink/80">
        Nhập ngày sinh gia chủ để tính cung phi, chọn kiểu nhà (hoặc tự nhập kích thước), vị trí
        cửa chính và các phòng muốn bố trí — hệ thống tự tìm phương án điểm cao nhất theo quy tắc
        bát trạch. Khác
        với <a href="/la-ban" className="underline">la bàn tương tác</a> (bạn tự đặt từng phòng),
        ở đây máy tối ưu thay bạn. Muốn tự vẽ hình phòng theo ý mình (không theo lưới 3×3), chọn
        chế độ “Vẽ mặt bằng tự do” trong form dưới đây.
      </p>

      <div className="card space-y-2">
        <h2 className="font-display text-xl font-bold text-primary">Quy tắc chấm điểm (công khai)</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-ink/80">
          <li>Phòng tốt (Phòng khách, Bếp, Phòng ngủ, Phòng thờ) ở hướng tốt: +10; ở hướng xấu: −10.</li>
          <li>Phòng xấu (Nhà vệ sinh, Kho) ở hướng xấu: +10 (nguyên tắc “lấy độc trị độc”); ở hướng tốt: −10.</li>
          <li>Phòng trung tính (Phòng ăn, Phòng làm việc) ở hướng tốt: +3; ở hướng xấu: −3.</li>
          <li>Cửa chính ở hướng tốt: +5; ở hướng xấu: −5. Vị trí cửa do bạn nhập và không bao giờ bị dời.</li>
        </ul>
        <details className="text-sm text-ink/80">
          <summary className="cursor-pointer font-semibold text-primary">
            Giải thích thêm: lưới mặt bằng, mức tối thiểu và lưu ý phong thủy
          </summary>
          <p className="mt-2">
            Nhập đúng dạng nhà: chiều rộng là mặt tiền (cạnh có cửa chính), chiều dài là chiều sâu
            từ trước ra sau. Mặt bằng chia thành lưới 3×3: 8 ô biên là 8 hướng bát trạch, ô giữa là
            không gian chung (không gán phòng). Sơ đồ vẽ theo hướng Bắc lên trên; mặt trước là cạnh
            rộng phía dưới (phía Nam).
            Hòa điểm: phòng chọn trước được xếp vào sao tốt hơn (thứ tự Sinh Khí &gt; Thiên Y &gt;
            Diên Niên &gt; Phục Vị, phòng xấu thì ngược lại). Khối phòng vẽ đúng tỷ lệ diện tích hiển
            thị nên phòng lớn nhìn lớn hơn phòng nhỏ. Kết quả là phương án tốt nhất{' '}
            <em>theo đúng các quy tắc trên</em>, chỉ để tham khảo.
          </p>
        <p className="text-sm text-ink/80">
          Diện tích tối thiểu theo công năng (tham khảo, không phải chuẩn bắt buộc): khách 15, ngủ
          12, bếp 10, ăn 8, thờ 5, vệ sinh 3, kho 4 (m²); phòng làm việc chưa có chuẩn đáng tin cho
          nhà riêng nên không đặt mức cứng. Tool không co phòng nào xuống dưới mức này: nếu mặt
          bằng không đủ cho tất cả các phòng đã chọn thì báo thiếu diện tích và gợi ý bớt/gộp phòng
          hoặc tăng kích thước nhà, thay vì vẽ phòng nhỏ không ở được. Chuẩn pháp lý duy nhất xác
          minh được là QCVN 04:2019 cho chung cư (phòng ngủ ≥ 9 m²).
        </p>
        <p className="text-sm text-ink/80">
          Lưu ý phong thủy &amp; công năng (tham khảo, không tính điểm): phòng thờ đặt nơi cao ráo,
          trang nghiêm, tựa tường vững, tránh cạnh/dưới vệ sinh; bếp tránh đối diện cửa chính và đối
          diện vệ sinh; phòng ngủ tránh đầu giường tựa bếp/vệ sinh và tránh cửa đối cửa; vệ sinh tránh
          giữa nhà và tránh đối diện bếp/thờ; phòng khách gần cửa chính, sáng sủa. Phong thủy có nhiều
          trường phái khác nhau (ví dụ hướng bếp, hướng vệ sinh) nên các lưu ý này không khóa cứng
          thành điểm trừ.
        </p>
        </details>
      </div>

      <form className="card space-y-4" onSubmit={onSubmit}>
        <div>
          <span className="label">Chế độ bố trí</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={mode === 'auto' ? 'btn-primary' : 'btn-gold'}
              onClick={() => {
                setMode('auto');
                setSubmitted(false);
              }}
            >
              Tối ưu tự động (lưới 9 cung)
            </button>
            <button
              type="button"
              className={mode === 'free' ? 'btn-primary' : 'btn-gold'}
              onClick={() => {
                setMode('free');
                setSubmitted(false);
              }}
            >
              Vẽ mặt bằng tự do (3D mới)
            </button>
          </div>
          <p className="mt-1 text-xs text-ink/70">
            {mode === 'auto'
              ? 'Máy tự gán mỗi phòng vào một cung bát trạch để được điểm cao nhất.'
              : 'Bạn tự vẽ từng phòng (vị trí, rộng, sâu tùy ý) — hướng và điểm tính theo tâm phòng rơi vào cung nào, tường/vách/cửa sổ dựng theo hình thật.'}
          </p>
        </div>
        <div>
          <label className="label" htmlFor="bt-kieu">Kiểu nhà (chọn để điền sẵn kích thước mẫu)</label>
          <select
            id="bt-kieu"
            className="input"
            value={houseStyle}
            onChange={(e) => {
              const value = e.target.value as HouseStyleId;
              const preset = HOUSE_STYLES[value];
              if (preset) {
                setFacade(String(preset.facade));
                setDepth(String(preset.depth));
                setHeight(String(preset.height));
                setDoorDistance(String(preset.facade / 2));
              }
              setHouseStyle(value);
              setSubmitted(false);
            }}
          >
            <option value="tu-do">Tùy chỉnh (tự nhập kích thước)</option>
            {(Object.keys(HOUSE_STYLES) as HouseStyleId[]).map((k) => (
              <option key={k} value={k}>{HOUSE_STYLES[k].label}</option>
            ))}
          </select>
          {houseStyle !== 'tu-do' && (
            <p className="mt-1 text-xs text-ink/70">
              {HOUSE_STYLES[houseStyle].desc} Đã điền sẵn mặt tiền {HOUSE_STYLES[houseStyle].facade} m,
              chiều sâu {HOUSE_STYLES[houseStyle].depth} m, trần {HOUSE_STYLES[houseStyle].height} m và
              cửa giữa mặt tiền — bạn vẫn sửa lại từng số được.
            </p>
          )}
        </div>
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
            <label className="label" htmlFor="bt-dai">Chiều dài nhà (m, chiều sâu Bắc–Nam)</label>
            <input id="bt-dai" type="number" step="0.1" min="0" className="input" value={depth} onChange={(e) => { setDepth(e.target.value); setSubmitted(false); }} required />
          </div>
          <div>
            <label className="label" htmlFor="bt-rong">Chiều rộng nhà (m, mặt tiền Đông–Tây)</label>
            <input id="bt-rong" type="number" step="0.1" min="0" className="input" value={facade} onChange={(e) => { setFacade(e.target.value); setSubmitted(false); }} required />
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

        {mode === 'free' ? (
          <div className="space-y-2">
            <span className="label">Vẽ mặt bằng (kéo phòng để dời, bấm phòng để sửa số đo)</span>
            {F > 0 && D > 0 ? (
              <PlanEditor2D
                facade={F}
                depth={D}
                rooms={freeRooms}
                onChange={(r) => {
                  setFreeRooms(r);
                  setSubmitted(false);
                }}
                doorWall={doorWall}
                doorDistance={Number(doorDistance) || 0}
              />
            ) : (
              <p className="text-sm">Nhập chiều dài và chiều rộng nhà trước để vẽ mặt bằng.</p>
            )}
          </div>
        ) : (
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
                  <label htmlFor={`bt-phong-${room}`} className="flex-1 text-sm font-semibold">
                    {room}
                    {minArea(room) !== null ? ` (tối thiểu ${minArea(room)} m²)` : ''}
                  </label>
                  {checked && (
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      placeholder="Để trống = tự chia"
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
            Phòng để trống chia phần còn lại của mặt bằng (mỗi phòng lấy mức tối thiểu theo công
            năng trước rồi chia đều phần dư). Nếu mặt bằng không đủ cho tất cả ở mức tối thiểu thì
            hệ thống báo thiếu diện tích thay vì vẽ phòng nhỏ; trường hợp còn co được mà không vi
            phạm mức tối thiểu thì co theo tỷ lệ và cảnh báo.
          </p>
        </div>
        )}

        {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
        <button type="submit" className="btn-primary">
          {mode === 'free' ? 'Chấm điểm và xem 3D' : 'Tối ưu bố trí và xem 3D'}
        </button>
      </form>

      {mode === 'free' && freeResult && freeResult.ok ? (
        <div id="ket-qua" className="space-y-4">
          <div className="card space-y-1">
            <p>
              Cung phi gia chủ: <strong>{freeResult.cung}</strong> (nhóm {freeResult.nhom} tứ mệnh).
            </p>
            <p className="text-sm text-ink/80">
              Tổng điểm mặt bằng vẽ tay: <strong>{freeResult.scored.total}</strong> (hướng tính theo
              tâm phòng; phòng ở trung tâm không chấm điểm hướng).
            </p>
            {freeResult.scored.warnings.map((w) => (
              <p key={w} className="rounded bg-gold/20 px-2 py-1 text-sm font-semibold text-primary">{w}</p>
            ))}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Giải thích từng phòng</h2>
            {freeResult.scored.rooms.map((a) => (
              <p key={a.id} className="text-sm">
                <strong>{a.room}</strong> ({a.w} × {a.d} m = {Math.round(a.area * 10) / 10} m²) —{' '}
                {a.explanation} (Điểm {a.score > 0 ? `+${a.score}` : a.score})
              </p>
            ))}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Khung nhìn 3D tương tác (mặt bằng vẽ tay)</h2>
            <Plan3DView
              rooms={freeRooms}
              facade={F}
              depth={D}
              height={H}
              doorWall={doorWall}
              doorDistance={Number(doorDistance) || 0}
            />
          </div>
        </div>
      ) : mode === 'free' && submitted ? (
        <p className="text-sm font-semibold text-red-700">
          {freeResult && !freeResult.ok
            ? freeResult.message
            : 'Không tính được bố trí — vui lòng kiểm tra lại ngày sinh và mặt bằng.'}
        </p>
      ) : null}

      {result && result.ok ? (
        <div id="ket-qua" className="space-y-4">
          <div className="card space-y-1">
            <p>
              Cung phi gia chủ: <strong>{result.cung}</strong> (nhóm {result.nhom} tứ mệnh).
            </p>
            {houseStyle !== 'tu-do' && (
              <p>
                Kiểu nhà: <strong>{HOUSE_STYLES[houseStyle].label}</strong>.
              </p>
            )}
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
            <p className="text-sm text-ink/80">
              Tổng diện tích các phòng: <strong>{sumArea} m²</strong> / diện tích nhà{' '}
              <strong>{Math.round(D * F * 10) / 10} m²</strong>
              {leftover > 0
                ? `; còn lại ${leftover} m² làm không gian chung, lối đi và tường.`
                : ' — vừa kín mặt bằng.'}
            </p>
            {result.layout.warnings.map((w) => (
              <p key={w} className="rounded bg-gold/20 px-2 py-1 text-sm font-semibold text-primary">{w}</p>
            ))}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Giải thích từng phòng</h2>
            {result.layout.assignments.map((a) => {
              const fp = roomFootprint(a.area, F / 3, D / 3);
              return (
                <p key={a.room} className="text-sm">
                  <strong>{a.room}</strong> — {a.explanation} Diện tích hiển thị {a.area} m²
                  (khối ≈ {Math.round(fp.w * 10) / 10} × {Math.round(fp.h * 10) / 10} m).
                  (Điểm {a.score > 0 ? `+${a.score}` : a.score})
                </p>
              );
            })}
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Khung nhìn 3D tương tác</h2>
            <BoTri3DView layout={result.layout} facade={F} depth={D} height={H} />
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Sơ đồ mặt bằng 2D (nhìn từ trên xuống, Bắc ở trên)</h2>
            <svg
              viewBox={`-30 -30 ${svgW + 60} ${svgH + 60}`}
              className="w-full rounded-lg border border-gold/40 bg-white"
              role="img"
              aria-label="Sơ đồ mặt bằng 2D với các phòng đã bố trí và vị trí cửa"
            >
              {result.layout.assignments.map((a, i) => {
                const r = zoneRect(a.direction, D, F);
                const sx = 30 + (r.x / F) * svgW;
                const sy = 30 + (r.y / D) * svgH;
                const sw = (r.w / F) * svgW;
                const sh = (r.h / D) * svgH;
                const fp = roomFootprint(a.area, F / 3, D / 3);
                const iw = fp.scale * sw;
                const ih = fp.scale * sh;
                return (
                  <g key={a.room}>
                    <rect x={sx} y={sy} width={sw} height={sh} fill={ROOM_COLORS[i % ROOM_COLORS.length]} fillOpacity={0.18} stroke="#fff" strokeWidth={2} />
                    <rect x={sx + (sw - iw) / 2} y={sy + (sh - ih) / 2} width={iw} height={ih} fill={ROOM_COLORS[i % ROOM_COLORS.length]} fillOpacity={0.9} stroke="#fff" strokeWidth={1.5} />
                    <text x={sx + sw / 2} y={sy + sh / 2 - 8} textAnchor="middle" fill="#fff" stroke="#2C1810" strokeWidth={3} paintOrder="stroke" fontSize={15} fontWeight="bold">{a.room}</text>
                    <text x={sx + sw / 2} y={sy + sh / 2 + 12} textAnchor="middle" fill="#fff" stroke="#2C1810" strokeWidth={3} paintOrder="stroke" fontSize={12}>{a.direction} · {a.sao}</text>
                    <text x={sx + sw / 2} y={sy + sh / 2 + 30} textAnchor="middle" fill="#fff" stroke="#2C1810" strokeWidth={3} paintOrder="stroke" fontSize={11}>{a.area} m²</text>
                  </g>
                );
              })}
              {/* Ô giữa chưa gán phòng: ghi chú không gian chung. */}
              <text x={30 + svgW / 2} y={30 + svgH / 2 - 6} textAnchor="middle" fontSize={12} fill="#2C1810" opacity={0.7}>
                Giữa nhà (không gian chung)
              </text>
              {doorPos && (
                <g>
                  <rect
                    x={30 + (doorPos.x / F) * svgW - 22}
                    y={30 + (doorPos.y / D) * svgH - 12}
                    width={44}
                    height={24}
                    rx={4}
                    fill="#C9A227"
                    stroke="#7B1E1E"
                    strokeWidth={1.5}
                  />
                  <text x={30 + (doorPos.x / F) * svgW} y={30 + (doorPos.y / D) * svgH + 4} textAnchor="middle" fontSize={12} fontWeight="bold" fill="#7B1E1E">CỬA</text>
                </g>
              )}
            </svg>
            <p className="text-xs text-ink/70">
              Chú thích: mỗi ô là một hướng bát trạch; khối đậm bên trong co đúng diện tích hiển thị
              (phòng lớn nhìn lớn hơn phòng nhỏ). Nhãn ghi hướng, sao và diện tích. Ô vàng “CỬA” là
              cửa chính đúng vị trí bạn nhập.
            </p>
          </div>
        </div>
      ) : submitted ? (
        <p className="text-sm font-semibold text-red-700">
          {result && !result.ok
            ? result.message
            : 'Không tính được bố trí — vui lòng kiểm tra lại ngày sinh và kích thước.'}
        </p>
      ) : null}
      <Disclaimer text="Phương án trên là bố trí tốt nhất theo đúng các quy tắc chấm điểm đã nêu, chỉ để tham khảo. Đây không phải bố trí phong thủy “hoàn hảo” tuyệt đối, không thay thế đo đạc và tư vấn thực tế, và không có thầy phong thủy nào duyệt qua kết quả này." />
    </div>
  );
}
