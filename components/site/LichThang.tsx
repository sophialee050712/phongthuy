// Lịch tháng ngày tốt theo việc × tháng × tuổi (ý 3).
// Điểm ngày tính theo sao ngày chung + xung tuổi (cùng công thức ViecFlow).
// Việc chọn KHÔNG đổi điểm số — trang ghi rõ điều này, không bịa mapping sao theo việc.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TUOI_12, VIEC_LIST } from '@/lib/data';
import { ngayThang } from '@/lib/lich-thang';
import { fmtLunar } from './format';
import { chiXung, tuoiFromStoredBirthdate } from './XemNgayForm';
import Disclaimer from './Disclaimer';

const THU_DAU_TUAN = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export default function LichThang() {
  const homNay = new Date();
  const [nam, setNam] = useState(homNay.getFullYear());
  const [thang, setThang] = useState(homNay.getMonth() + 1);
  const [viec, setViec] = useState(VIEC_LIST[0]);
  const [tuoi, setTuoi] = useState('');
  const [chon, setChon] = useState<number | null>(null);

  useEffect(() => {
    const t = tuoiFromStoredBirthdate();
    if (t) setTuoi(t);
  }, []);

  const xungChi = tuoi ? chiXung(tuoi) : null;
  const days = useMemo(() => ngayThang(nam, thang, xungChi), [nam, thang, xungChi]);
  const oTrongDau = useMemo(() => {
    const wd = new Date(Date.UTC(nam, thang - 1, 1)).getUTCDay();
    return (wd + 6) % 7; // tuần bắt đầu thứ 2
  }, [nam, thang]);

  const ngayTot = days.filter((d) => d.muc === 'Ngày tương đối tốt' && !d.xung);
  const ngayChon = chon !== null ? days[chon] : null;
  const namLuaChon = [homNay.getFullYear() - 1, homNay.getFullYear(), homNay.getFullYear() + 1, homNay.getFullYear() + 2];

  function doiThang(delta: number) {
    let t = thang + delta;
    let y = nam;
    if (t < 1) {
      t = 12;
      y -= 1;
    }
    if (t > 12) {
      t = 1;
      y += 1;
    }
    setThang(t);
    setNam(y);
    setChon(null);
  }

  return (
    <div className="space-y-6">
      <form className="card space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="label" htmlFor="lt-thang">Tháng</label>
            <select
              id="lt-thang"
              className="input"
              value={thang}
              onChange={(e) => {
                setThang(Number(e.target.value));
                setChon(null);
              }}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={m}>
                  Tháng {m}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lt-nam">Năm</label>
            <select
              id="lt-nam"
              className="input"
              value={nam}
              onChange={(e) => {
                setNam(Number(e.target.value));
                setChon(null);
              }}
            >
              {namLuaChon.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lt-viec">Việc dự định làm</label>
            <select id="lt-viec" className="input" value={viec} onChange={(e) => setViec(e.target.value)}>
              {VIEC_LIST.map((v) => (
                <option key={v} value={v}>
                  {v}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="lt-tuoi">Tuổi của bạn</label>
            <select id="lt-tuoi" className="input" value={tuoi} onChange={(e) => setTuoi(e.target.value)}>
              <option value="">Chưa chọn tuổi</option>
              {TUOI_12.map((t) => (
                <option key={t} value={t}>
                  Tuổi {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-sm opacity-80">
          Lịch tô màu theo sao ngày chung và xung tuổi — giống công cụ Xem ngày theo việc.
          Việc bạn chọn chỉ để bạn đối chiếu kế hoạch, không làm thay đổi điểm số của ngày
          (site chưa có bảng sao riêng cho từng việc nên không tự đặt ra).
        </p>
        {!tuoi ? (
          <p className="text-sm">
            Chưa chọn tuổi nên lịch chưa trừ ngày xung.{' '}
            <Link href="/ho-so" className="font-semibold text-primary underline">
              Lưu ngày sinh ở Hồ sơ
            </Link>{' '}
            để lịch tự trừ ngày xung tuổi bạn.
          </p>
        ) : null}
      </form>

      <section aria-label={`Lịch tháng ${thang}/${nam}`}>
        <div className="mb-3 flex items-center justify-between">
          <button type="button" className="btn" onClick={() => doiThang(-1)}>
            ← Tháng trước
          </button>
          <h2 className="font-display text-lg font-bold text-primary">
            Tháng {thang}/{nam} — {viec}
            {tuoi ? ` — tuổi ${tuoi}` : ''}
          </h2>
          <button type="button" className="btn" onClick={() => doiThang(1)}>
            Tháng sau →
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold sm:gap-2">
          {THU_DAU_TUAN.map((t) => (
            <div key={t} className="py-1 text-primary">
              {t}
            </div>
          ))}
          {Array.from({ length: oTrongDau }).map((_, i) => (
            <div key={`trong-${i}`} />
          ))}
          {days.map((d, i) => {
            const mau =
              d.muc === 'Ngày tương đối tốt'
                ? 'border-emerald-300 bg-emerald-50'
                : d.muc === 'Ngày chưa thuận'
                  ? 'border-red-200 bg-red-50'
                  : 'border-gold/30 bg-white';
            return (
              <button
                key={d.duong.d}
                type="button"
                onClick={() => setChon(i)}
                className={`rounded-lg border p-1 text-left sm:p-2 ${mau} ${chon === i ? 'ring-2 ring-gold' : ''}`}
              >
                <span className="block font-display text-base font-bold text-primary">{d.duong.d}</span>
                <span className="block text-[11px] opacity-70">
                  {d.lunar.day}/{d.lunar.month}
                  {d.lunar.leap ? ' nhuận' : ''}
                </span>
                <span className="block text-[11px]">
                  tốt {d.saoTot.length} · xấu {d.saoXau.length}
                </span>
                {d.xung ? <span className="block text-[11px] font-semibold text-red-600">Xung tuổi {tuoi}</span> : null}
              </button>
            );
          })}
        </div>
      </section>

      {ngayChon ? (
        <section className="card space-y-2">
          <h3 className="font-display text-lg font-bold text-primary">
            Ngày {ngayChon.duong.d}/{ngayChon.duong.m}/{ngayChon.duong.y} — {fmtLunar(ngayChon.lunar)}
          </h3>
          <p className="text-sm">
            Can chi ngày: <strong>{ngayChon.canChiNgay}</strong> — {ngayChon.muc}
            {ngayChon.xung ? ` — xung tuổi ${tuoi}, nên tránh việc lớn` : ''}
          </p>
          <p className="text-sm">
            Sao tốt: {ngayChon.saoTot.length > 0 ? ngayChon.saoTot.join(', ') : 'Không có sao tốt nổi bật'}
          </p>
          <p className="text-sm">
            Sao xấu: {ngayChon.saoXau.length > 0 ? ngayChon.saoXau.join(', ') : 'Không có sao xấu nổi bật'}
          </p>
          <p className="text-sm">
            <Link href="/xem-ngay" className="font-semibold text-primary underline">
              Xem chi tiết ngày này →
            </Link>
          </p>
        </section>
      ) : null}

      <section className="card space-y-2">
        <h3 className="font-display text-lg font-bold text-primary">
          Ngày tương đối tốt trong tháng{tuoi ? ' (không xung tuổi)' : ' (theo sao chung)'}
        </h3>
        {ngayTot.length > 0 ? (
          <ul className="space-y-1 text-sm">
            {ngayTot.map((d) => (
              <li key={d.duong.d}>
                <button type="button" className="font-semibold text-primary underline" onClick={() => setChon(d.duong.d - 1)}>
                  {d.duong.d}/{d.duong.m}
                </button>{' '}
                — {fmtLunar(d.lunar)} — sao tốt {d.saoTot.length} · sao xấu {d.saoXau.length}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm">
            Tháng này không có ngày tương đối tốt{tuoi ? ' không xung tuổi' : ''} — thử tháng khác,
            hoặc xem các ngày bình thường trong lịch.
          </p>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
