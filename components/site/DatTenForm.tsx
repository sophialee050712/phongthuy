'use client';

import { useMemo, useState } from 'react';
import { canChiYear, menhNapAm, chamDiemTen } from '@/lib/engine';
import Disclaimer from './Disclaimer';
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
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
