'use client';

import { useEffect, useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import { getBirthdate, getGender, profileFromBirthdate, type GioiTinh } from '@/lib/personal';
import { batTrach, cungPhi } from '@/lib/engine';

const HUONG_GRID: (string | null)[] = [
  'Tây Bắc',
  'Bắc',
  'Đông Bắc',
  'Tây',
  null, // giữa nhà — không phải một hướng bát trạch
  'Đông',
  'Tây Nam',
  'Nam',
  'Đông Nam',
];

const PHONG_LIST = [
  'Phòng khách',
  'Bếp',
  'Phòng ngủ',
  'Bàn thờ',
  'Phòng làm việc',
  'Phòng ăn',
  'Nhà vệ sinh',
  'Kho',
];

export default function LaBanPage() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [submitted, setSubmitted] = useState(false);
  // Mỗi hướng đặt tối đa một phòng; phòng đã đặt ở hướng khác sẽ tự dời sang hướng mới.
  const [datPhong, setDatPhong] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) setNgaySinh(stored);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const cungInfo = useMemo(() => {
    if (!submitted) return null;
    const profile = profileFromBirthdate(ngaySinh);
    if (!profile) return null;
    try {
      const cp = cungPhi(gioiTinh, profile.lunar.year);
      const table = batTrach(cp.cung);
      return { cung: cp.cung, nhom: cp.nhom, table };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh]);

  function chonPhong(huong: string, phong: string) {
    setDatPhong((prev) => {
      const next = { ...prev };
      // Một phòng chỉ ở một hướng: gỡ khỏi hướng cũ nếu có.
      for (const h of Object.keys(next)) {
        if (next[h] === phong) delete next[h];
      }
      if (phong) next[huong] = phong;
      else delete next[huong];
      return next;
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">La bàn bát trạch tương tác</h1>
      <p className="text-ink/80">
        Nhập ngày sinh để tính cung phi, chọn hướng nhà rồi đặt từng phòng lên sơ đồ mặt bằng. Mỗi
        ô tô màu theo sao bát trạch của cung đó: màu xanh là hướng tốt (Sinh Khí, Thiên Y, Diên
        Niên, Phục Vị), màu đỏ là hướng xấu (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại). Sơ đồ chỉ là
        mô hình tham khảo, không thay thế đo đạc thực tế.
      </p>
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="lb-ngay">
              Ngày sinh (dương lịch)
            </label>
            <input
              id="lb-ngay"
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
                <input type="radio" name="lb-gt" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
                Nam
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="lb-gt" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
                Nữ
              </label>
            </div>
          </div>
        </div>
        <button type="submit" className="btn-primary">
          Tính cung và vẽ la bàn
        </button>
      </form>

      {cungInfo ? (
        <div className="space-y-4">
          <div className="card">
            <p>
              Cung phi của bạn: <strong>{cungInfo.cung}</strong> (nhóm {cungInfo.nhom} tứ mệnh).
            </p>
            <p className="text-sm text-ink/80">
              Tại mỗi ô, chọn phòng muốn đặt vào hướng đó. Một phòng chỉ nằm ở một hướng; chọn
              phòng sang hướng khác sẽ tự dời phòng đi.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {HUONG_GRID.map((huong, i) => {
              if (!huong) {
                return (
                  <div key="giua" className="card flex items-center justify-center bg-creamDark">
                    <p className="text-center text-sm font-semibold">Giữa nhà</p>
                  </div>
                );
              }
              const info = cungInfo.table[huong];
              const tot = info?.tot ?? false;
              return (
                <div
                  key={huong}
                  className={`rounded-lg border p-3 shadow-sm ${
                    tot ? 'border-green-600/50 bg-green-50' : 'border-red-600/50 bg-red-50'
                  }`}
                >
                  <p className="font-display font-bold text-primary">{huong}</p>
                  <p className="text-sm">
                    Sao: <strong>{info?.sao ?? '—'}</strong> ({tot ? 'tốt' : 'xấu'})
                  </p>
                  <label className="label mt-2" htmlFor={`lb-phong-${i}`}>
                    Phòng đặt tại đây
                  </label>
                  <select
                    id={`lb-phong-${i}`}
                    className="input"
                    value={datPhong[huong] ?? ''}
                    onChange={(e) => chonPhong(huong, e.target.value)}
                  >
                    <option value="">— Trống —</option>
                    {PHONG_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="card space-y-1">
            <h2 className="font-display text-xl font-bold text-primary">Tổng hợp bố trí</h2>
            {Object.keys(datPhong).length === 0 ? (
              <p className="text-sm text-ink/80">Chưa đặt phòng nào. Chọn phòng tại từng ô ở trên.</p>
            ) : (
              Object.entries(datPhong).map(([huong, phong]) => {
                const info = cungInfo.table[huong];
                return (
                  <p key={huong} className="text-sm">
                    {phong} — hướng {huong}: <strong>{info?.sao}</strong> (
                    {info?.tot ? 'hướng tốt' : 'hướng xấu'} theo bát trạch của cung {cungInfo.cung}
                    ).
                  </p>
                );
              })
            )}
          </div>
        </div>
      ) : submitted ? (
        <p className="text-sm text-ink/80">Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.</p>
      ) : null}
      <Disclaimer />
    </div>
  );
}
