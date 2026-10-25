'use client';

import { useEffect, useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import { getBirthdate, getGender, profileFromBirthdate, type GioiTinh } from '@/lib/personal';
import {
  canChiDay,
  cungPhi,
  hoangDaoHours,
  saoNgay,
  solarToLunar,
  thanSoHoc,
} from '@/lib/engine';

type PersonResult = {
  ngaySinh: string;
  lunarLabel: string;
  canChiNam: string;
  menh: string;
  nguHanh: string;
  cung: string;
  nhom: string;
  soChuDao: number | null;
  giaiThichSo: string;
};

function nguHanhFromMenh(menh: string): string {
  for (const h of ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ']) {
    if (menh.includes(h)) return h;
  }
  return '';
}

function personInfo(ngaySinh: string, gioiTinh: GioiTinh): PersonResult | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(ngaySinh.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const profile = profileFromBirthdate(ngaySinh);
  if (!profile) return null;
  let cung = '';
  let nhom = '';
  try {
    const cp = cungPhi(gioiTinh, profile.lunar.year);
    cung = cp.cung;
    nhom = cp.nhom;
  } catch {
    // giữ rỗng
  }
  let soChuDao: number | null = null;
  let giaiThichSo = '';
  try {
    const ts = thanSoHoc(d, mo, y);
    soChuDao = ts.soChuDao;
    giaiThichSo = ts.giaiThich;
  } catch {
    // giữ rỗng
  }
  return {
    ngaySinh,
    lunarLabel: `ngày ${profile.lunar.day} tháng ${profile.lunar.month}${profile.lunar.leap ? ' nhuận' : ''} năm ${profile.lunar.year} âm lịch`,
    canChiNam: profile.canChiNam,
    menh: profile.menh,
    nguHanh: nguHanhFromMenh(profile.menh),
    cung,
    nhom,
    soChuDao,
    giaiThichSo,
  };
}

type DayResult = {
  solar: string;
  canChi: string;
  saoTot: string[];
  saoXau: string[];
  hoangDao: string[];
};

function dayInfo(iso: string): DayResult | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  try {
    const lunar = solarToLunar(y, mo, d);
    const cc = canChiDay(y, mo, d);
    const sao = saoNgay(cc, lunar.month);
    const hd = hoangDaoHours(cc)
      .filter((g) => g.hoangDao)
      .map((g) => `${g.gio} (${g.sao})`);
    return {
      solar: `ngày ${d} tháng ${mo} năm ${y}`,
      canChi: cc,
      saoTot: sao.tot,
      saoXau: sao.xau,
      hoangDao: hd,
    };
  } catch {
    return null;
  }
}

export default function SoSanhPage() {
  const [cheDo, setCheDo] = useState<'nguoi' | 'ngay'>('nguoi');
  const [ngay1, setNgay1] = useState('');
  const [gioi1, setGioi1] = useState<GioiTinh>('nam');
  const [ngay2, setNgay2] = useState('');
  const [gioi2, setGioi2] = useState<GioiTinh>('nu');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) setNgay1(stored);
    const g = getGender();
    if (g) setGioi1(g);
  }, []);

  const p1 = useMemo(
    () => (submitted && cheDo === 'nguoi' ? personInfo(ngay1, gioi1) : null),
    [submitted, cheDo, ngay1, gioi1],
  );
  const p2 = useMemo(
    () => (submitted && cheDo === 'nguoi' ? personInfo(ngay2, gioi2) : null),
    [submitted, cheDo, ngay2, gioi2],
  );
  const d1 = useMemo(
    () => (submitted && cheDo === 'ngay' ? dayInfo(ngay1) : null),
    [submitted, cheDo, ngay1],
  );
  const d2 = useMemo(
    () => (submitted && cheDo === 'ngay' ? dayInfo(ngay2) : null),
    [submitted, cheDo, ngay2],
  );

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">So sánh 2 người / 2 ngày</h1>
      <p className="text-ink/80">
        Đặt hai người hoặc hai ngày cạnh nhau để đối chiếu mệnh, cung, thần số hoặc can chi, sao,
        giờ hoàng đạo. Bảng chỉ nêu giống/khác theo bảng tra — không kết luận tuyệt đối hợp hay
        khắc, mọi quyết định vẫn cần cân nhắc thêm nhiều yếu tố khác.
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          className={cheDo === 'nguoi' ? 'btn-primary' : 'btn-gold'}
          onClick={() => {
            setCheDo('nguoi');
            setSubmitted(false);
          }}
        >
          So 2 người
        </button>
        <button
          type="button"
          className={cheDo === 'ngay' ? 'btn-primary' : 'btn-gold'}
          onClick={() => {
            setCheDo('ngay');
            setSubmitted(false);
          }}
        >
          So 2 ngày
        </button>
      </div>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="ss-ngay1">
              {cheDo === 'nguoi' ? 'Ngày sinh người 1' : 'Ngày 1 (dương lịch)'}
            </label>
            <input
              id="ss-ngay1"
              type="date"
              className="input"
              value={ngay1}
              onChange={(e) => {
                setNgay1(e.target.value);
                setSubmitted(false);
              }}
              required
            />
            {cheDo === 'nguoi' ? (
              <p className="mt-1 text-xs text-ink/70">
                Đã tự điền từ <a href="/ho-so" className="underline">hồ sơ của bạn</a> nếu đã lưu.
              </p>
            ) : null}
          </div>
          <div>
            <label className="label" htmlFor="ss-ngay2">
              {cheDo === 'nguoi' ? 'Ngày sinh người 2' : 'Ngày 2 (dương lịch)'}
            </label>
            <input
              id="ss-ngay2"
              type="date"
              className="input"
              value={ngay2}
              onChange={(e) => {
                setNgay2(e.target.value);
                setSubmitted(false);
              }}
              required
            />
          </div>
        </div>
        {cheDo === 'nguoi' ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <span className="label">Giới tính người 1</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ss-gt1" checked={gioi1 === 'nam'} onChange={() => setGioi1('nam')} />
                  Nam
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ss-gt1" checked={gioi1 === 'nu'} onChange={() => setGioi1('nu')} />
                  Nữ
                </label>
              </div>
            </div>
            <div>
              <span className="label">Giới tính người 2</span>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ss-gt2" checked={gioi2 === 'nam'} onChange={() => setGioi2('nam')} />
                  Nam
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="ss-gt2" checked={gioi2 === 'nu'} onChange={() => setGioi2('nu')} />
                  Nữ
                </label>
              </div>
            </div>
          </div>
        ) : null}
        <button type="submit" className="btn-primary">
          So sánh
        </button>
      </form>

      {cheDo === 'nguoi' && p1 && p2 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[p1, p2].map((p, i) => (
              <div key={i} className="card space-y-1">
                <h2 className="font-display text-xl font-bold text-primary">Người {i + 1}</h2>
                <p className="text-sm">Ngày sinh: {p.ngaySinh} — âm lịch {p.lunarLabel}</p>
                <p className="text-sm">
                  Năm âm lịch: <strong>{p.canChiNam}</strong> — Mệnh nạp âm:{' '}
                  <strong>{p.menh}</strong> (ngũ hành {p.nguHanh})
                </p>
                <p className="text-sm">
                  Cung phi: <strong>{p.cung || 'Đang cập nhật'}</strong>
                  {p.nhom ? ` (nhóm ${p.nhom} tứ mệnh)` : ''}
                </p>
                <p className="text-sm">
                  Số chủ đạo: <strong>{p.soChuDao ?? 'Đang cập nhật'}</strong>
                  {p.giaiThichSo ? ` — ${p.giaiThichSo}` : ''}
                </p>
              </div>
            ))}
          </div>
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Bảng đối chiếu tham khảo</h2>
            <p className="text-sm">
              Ngũ hành mệnh:{' '}
              <strong>
                {p1.nguHanh === p2.nguHanh ? `Giống nhau (${p1.nguHanh})` : `Khác nhau (${p1.nguHanh} – ${p2.nguHanh})`}
              </strong>
            </p>
            <p className="text-sm">
              Nhóm cung phi:{' '}
              <strong>
                {p1.nhom && p1.nhom === p2.nhom
                  ? `Cùng nhóm ${p1.nhom} tứ mệnh`
                  : `Khác nhóm (${p1.nhom || '—'} – ${p2.nhom || '—'})`}
              </strong>
            </p>
            <p className="text-sm">
              Số chủ đạo:{' '}
              <strong>
                {p1.soChuDao !== null && p1.soChuDao === p2.soChuDao
                  ? `Giống nhau (${p1.soChuDao})`
                  : `Khác nhau (${p1.soChuDao ?? '—'} – ${p2.soChuDao ?? '—'})`}
              </strong>
            </p>
            <p className="text-sm text-ink/80">
              Bảng này chỉ đối chiếu các chỉ số tra cứu được; không đưa ra kết luận hợp/khắc tuyệt
              đối giữa hai người.
            </p>
          </div>
        </div>
      ) : null}

      {cheDo === 'ngay' && d1 && d2 ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[d1, d2].map((d, i) => (
              <div key={i} className="card space-y-1">
                <h2 className="font-display text-xl font-bold text-primary">Ngày {i + 1}: {d.solar}</h2>
                <p className="text-sm">
                  Can chi ngày: <strong>{d.canChi}</strong>
                </p>
                <p className="text-sm">Sao tốt: {d.saoTot.length ? d.saoTot.join(', ') : '—'}</p>
                <p className="text-sm">Sao xấu: {d.saoXau.length ? d.saoXau.join(', ') : '—'}</p>
                <p className="text-sm">
                  Giờ hoàng đạo: {d.hoangDao.length ? d.hoangDao.join('; ') : 'Đang cập nhật'}
                </p>
              </div>
            ))}
          </div>
          <div className="card space-y-1">
            <h2 className="font-display text-xl font-bold text-primary">Đối chiếu nhanh</h2>
            <p className="text-sm">
              Can chi: {d1.canChi === d2.canChi ? 'Giống nhau' : `Khác nhau (${d1.canChi} – ${d2.canChi})`}
            </p>
            <p className="text-sm">
              Số sao tốt (bộ sao cơ bản): {d1.saoTot.length} so với {d2.saoTot.length}; số sao xấu:{' '}
              {d1.saoXau.length} so với {d2.saoXau.length}.
            </p>
            <p className="text-sm text-ink/80">
              So sánh số lượng sao chỉ mang tính tham khảo; bộ sao của engine hiện là bộ cơ bản,
              chưa đầy đủ trực và nhị thập bát tú.
            </p>
          </div>
        </div>
      ) : null}

      {submitted && ((cheDo === 'nguoi' && (!p1 || !p2)) || (cheDo === 'ngay' && (!d1 || !d2))) ? (
        <p className="text-sm text-ink/80">Ngày nhập chưa hợp lệ, vui lòng kiểm tra lại.</p>
      ) : null}
      <Disclaimer />
    </div>
  );
}
