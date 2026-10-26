'use client';

import { useEffect, useMemo, useState } from 'react';
import { canChiYear, menhNapAm, cungPhi, nguHanhOfCan, thanSoHoc } from '@/lib/engine';
import LeadForm from '@/components/sales/LeadForm';
import ShareLink from './ShareLink';
import ToolShareCard from '@/components/share/ToolShareCard';
import { getBirthdate, getGender } from '@/lib/personal';
import Disclaimer from './Disclaimer';
import { safeSolarToLunar } from './engine-utils';
import {
  fmtLunar,
  fmtSolar,
  MAU_HOP_KY,
  SO_HOP,
  PHAT_BAN_MENH,
  nguHanhFromMenh,
  normalizeThanSo,
  parseISODate,
  zodiacOfLunarYear,
} from './format';

export default function TraMenhForm() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [submitted, setSubmitted] = useState(false);

  // Prefill từ hồ sơ đã lưu trên trình duyệt (nếu có) — xem lib/personal.ts.
  useEffect(() => {
    const saved = getBirthdate();
    if (saved) setNgaySinh(saved);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    if (!d) return null;
    const lunar = safeSolarToLunar(d);
    if (!lunar) return { d, lunar: null, error: true as const };
    let ccYear = '';
    let menh = '';
    let cung = '';
    let nhom = '';
    try {
      const y = canChiYear(lunar.year) as unknown;
      ccYear = typeof y === 'string' ? y : String(y ?? '');
      const mm = menhNapAm(ccYear) as unknown;
      menh = typeof mm === 'string' ? mm : String(mm ?? '');
      const cp = cungPhi(gioiTinh, lunar.year) as unknown as { cung?: unknown; nhom?: unknown };
      cung = String(cp?.cung ?? '');
      nhom = String(cp?.nhom ?? '');
    } catch {
      // giữ rỗng
    }
    const can = ccYear.split(' ')[0] ?? '';
    let nguHanhCan = '';
    try {
      if (can) {
        const nh = nguHanhOfCan(can) as unknown;
        nguHanhCan = typeof nh === 'string' ? nh : String(nh ?? '');
      }
    } catch {
      // giữ rỗng
    }
    const nguHanh = nguHanhFromMenh(menh) || nguHanhCan;
    const mau = MAU_HOP_KY[nguHanh];
    const soHop = SO_HOP[nguHanh];
    const tuoi = zodiacOfLunarYear(lunar.year);
    const phat = PHAT_BAN_MENH[tuoi] ?? '';
    let soChuDao: number | null = null;
    try {
      // Hợp đồng engine: thanSoHoc(ngày, tháng, năm) — số nguyên dương lịch.
      soChuDao = normalizeThanSo(thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear()));
    } catch {
      soChuDao = null;
    }
    return { d, lunar, ccYear, menh, cung, nhom, nguHanh, mau, soHop, tuoi, phat, soChuDao, error: false as const };
  }, [submitted, ngaySinh, gioiTinh]);

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
          <label className="label" htmlFor="tm-ngay">
            Ngày sinh dương lịch
          </label>
          <input
            id="tm-ngay"
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
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tm-gioi-tinh"
                checked={gioiTinh === 'nam'}
                onChange={() => setGioiTinh('nam')}
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tm-gioi-tinh"
                checked={gioiTinh === 'nu'}
                onChange={() => setGioiTinh('nu')}
              />
              Nữ
            </label>
          </div>
        </div>
        <button type="submit" className="btn-primary">
          Tra mệnh
        </button>
      </form>

      {ketQua ? (
        ketQua.error ? (
          <p className="card">Chưa đổi được ngày sinh sang âm lịch. Vui lòng thử lại sau.</p>
        ) : (
          <div className="space-y-4">
            <div className="card space-y-2">
              <h2 className="font-display text-xl font-bold text-primary">Bản mệnh của bạn</h2>
              <p>
                Ngày sinh: <strong>{fmtSolar(ketQua.d)}</strong> — âm lịch{' '}
                <strong>{fmtLunar(ketQua.lunar)}</strong>
              </p>
              <p>
                Can chi năm sinh: <strong>{ketQua.ccYear || 'Đang cập nhật'}</strong> (tuổi{' '}
                {ketQua.tuoi})
              </p>
              <p>
                Mệnh nạp âm: <strong>{ketQua.menh || 'Đang cập nhật'}</strong>
                {ketQua.nguHanh ? ` — ngũ hành ${ketQua.nguHanh}` : ''}
              </p>
              <p>
                Cung phi: <strong>{ketQua.cung || 'Đang cập nhật'}</strong>
                {ketQua.nhom ? (
                  <>
                    {' '}
                    — <strong>{ketQua.nhom} tứ mệnh</strong> (Đông tứ mệnh hợp hướng Đông, Đông
                    Nam, Nam, Bắc; Tây tứ mệnh hợp hướng Tây, Tây Bắc, Tây Nam, Đông Bắc)
                  </>
                ) : null}
              </p>
              {ketQua.mau ? (
                <p>
                  Màu hợp: <strong>{ketQua.mau.hop.join(', ')}</strong> — màu kỵ:{' '}
                  <strong>{ketQua.mau.ky.join(', ')}</strong>
                </p>
              ) : null}
              {ketQua.soHop ? (
                <p>
                  Số hợp (tham khảo): <strong>{ketQua.soHop.join(', ')}</strong>
                </p>
              ) : null}
              <p>
                Phật bản mệnh theo tuổi {ketQua.tuoi}: <strong>{ketQua.phat}</strong>
              </p>
              {ketQua.soChuDao !== null ? (
                <p>
                  Số chủ đạo (thần số học, tham khảo): <strong>{ketQua.soChuDao}</strong>
                </p>
              ) : null}
              <ShareLink
                tieuDe={`Tra mệnh ${ketQua.ccYear}`}
                chiTiet={[
                  `Ngày sinh: ${fmtSolar(ketQua.d)}`,
                  `Mệnh: ${ketQua.menh}`,
                  `Cung phi: ${ketQua.cung} (${ketQua.nhom} tứ mệnh)`,
                  `Phật bản mệnh: ${ketQua.phat}`,
                ].join(' | ')}
              />
              <ToolShareCard
                title={`Tra mệnh ${ketQua.ccYear}`}
                lines={[
                  `Mệnh: ${ketQua.menh}`,
                  `Cung phi: ${ketQua.cung}${ketQua.nhom ? ` (${ketQua.nhom} tứ mệnh)` : ''}`,
                  `Phật bản mệnh: ${ketQua.phat}`,
                ]}
              />
            </div>
            <Disclaimer />
            <LeadForm source="tra-menh" />
          </div>
        )
      ) : null}
    </div>
  );
}
