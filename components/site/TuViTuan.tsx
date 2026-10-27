// Tử vi tuần theo tuổi (ý 2): 7 ngày Thứ 2 → Chủ nhật, mỗi ngày chấm bằng ĐÚNG
// công thức điểm vận của /van-han (lib/van-han.ts) — không có thang điểm thứ hai.
// Người xem chọn tuổi bằng ngày sinh (mệnh từ năm âm lịch) hoặc trực tiếp 1 trong
// 60 tuổi can chi (mệnh từ can chi đó). Kết quả chỉ mang tính tham khảo.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { canChiYear, getTodayInfo, menhNapAm, nguHanhOfCan } from '@/lib/engine';
import { diemVanHan, mucVanHan } from '@/lib/van-han';
import { getBirthdate } from '@/lib/personal';
import { fmtLunar, MAU_HOP_KY, nguHanhFromMenh, parseISODate, sinhKhac } from './format';
import { safeSolarToLunar } from './engine-utils';
import { NEN_THEO_NGU_HANH, TRANH_THEO_NGU_HANH } from './VanHanForm';
import ToolShareCard from '@/components/share/ToolShareCard';
import Disclaimer from './Disclaimer';

const THU = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// 60 tuổi can chi: năm âm lịch 1984 (Giáp Tý) → 2043 đủ một vòng 60.
const TUOI_60: { canChi: string; nam: number }[] = Array.from({ length: 60 }, (_, i) => {
  const nam = 1984 + i;
  const cc = canChiYear(nam) as unknown;
  return { canChi: typeof cc === 'string' ? cc : String(cc ?? ''), nam };
});

function asStr(v: unknown): string {
  return typeof v === 'string' ? v : String(v ?? '');
}

export default function TuViTuan() {
  const [cheDo, setCheDo] = useState<'sinh' | 'tuoi'>('sinh');
  const [ngaySinh, setNgaySinh] = useState('');
  const [tuoiCanChi, setTuoiCanChi] = useState('Giáp Tý');
  const [tuanOffset, setTuanOffset] = useState(0); // 0 = tuần này, ±1 = tuần trước/sau

  useEffect(() => {
    const saved = getBirthdate();
    if (saved) setNgaySinh(saved);
  }, []);

  const menh = useMemo(() => {
    try {
      if (cheDo === 'tuoi') {
        const cc = tuoiCanChi;
        const mm = asStr(menhNapAm(cc));
        const el = nguHanhFromMenh(mm);
        return { canChi: cc, menh: mm, element: el, nhan: cc };
      }
      const birth = parseISODate(ngaySinh);
      if (!birth) return { canChi: '', menh: '', element: '', nhan: '' };
      const lunarBirth = safeSolarToLunar(birth);
      if (!lunarBirth) return { canChi: '', menh: '', element: '', nhan: '' };
      const ccYear = asStr(canChiYear(lunarBirth.year));
      const mm = asStr(menhNapAm(ccYear));
      const el = nguHanhFromMenh(mm);
      const chi = ccYear.trim().split(/\s+/).pop() ?? '';
      return { canChi: ccYear, menh: mm, element: el, nhan: chi ? `tuổi ${chi}` : '' };
    } catch {
      return { canChi: '', menh: '', element: '', nhan: '' };
    }
  }, [cheDo, ngaySinh, tuoiCanChi]);

  const tuan = useMemo(() => {
    const homNay = getTodayInfo().solar;
    const base = Date.UTC(homNay.y, homNay.m - 1, homNay.d) + tuanOffset * 7 * 86400000;
    const wd = new Date(base).getUTCDay();
    const thu2 = base - ((wd + 6) % 7) * 86400000;
    return Array.from({ length: 7 }, (_, i) => {
      const info = getTodayInfo(new Date(thu2 + i * 86400000));
      let ngayElement = '';
      try {
        const can = info.canChi.ngay.split(' ')[0] ?? '';
        if (can) ngayElement = asStr(nguHanhOfCan(can));
      } catch {
        ngayElement = '';
      }
      const quanHe = menh.element && ngayElement ? sinhKhac(ngayElement, menh.element) : 'binh';
      const cungHanh = Boolean(menh.element && ngayElement === menh.element);
      const diem = diemVanHan(info.solar.d, quanHe, cungHanh);
      return { info, ngayElement, quanHe, diem, muc: mucVanHan(diem) };
    });
  }, [tuanOffset, menh.element]);

  const ngayTotNhat = useMemo(() => {
    let best = tuan[0];
    for (const d of tuan) {
      if (d.diem > best.diem) best = d;
    }
    return best;
  }, [tuan]);

  const dauTuan = tuan[0].info.solar;
  const cuoiTuan = tuan[6].info.solar;
  const mauMayMan = menh.element ? MAU_HOP_KY[menh.element]?.hop[0] ?? '' : '';
  const nen = menh.element ? NEN_THEO_NGU_HANH[menh.element] ?? [] : [];
  const tranh = menh.element ? TRANH_THEO_NGU_HANH[menh.element] ?? [] : [];

  return (
    <div className="space-y-6">
      <form className="card space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="flex gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={cheDo === 'sinh'} onChange={() => setCheDo('sinh')} />
            Theo ngày sinh
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={cheDo === 'tuoi'} onChange={() => setCheDo('tuoi')} />
            Theo tuổi can chi
          </label>
        </div>
        {cheDo === 'sinh' ? (
          <div>
            <label className="label" htmlFor="tvt-sinh">Ngày sinh dương lịch</label>
            <input
              id="tvt-sinh"
              type="date"
              className="input"
              value={ngaySinh}
              onChange={(e) => setNgaySinh(e.target.value)}
            />
          </div>
        ) : (
          <div>
            <label className="label" htmlFor="tvt-tuoi">Tuổi can chi (60 tuổi)</label>
            <select id="tvt-tuoi" className="input" value={tuoiCanChi} onChange={(e) => setTuoiCanChi(e.target.value)}>
              {TUOI_60.map((t) => (
                <option key={t.canChi} value={t.canChi}>
                  {t.canChi} ({t.nam})
                </option>
              ))}
            </select>
          </div>
        )}
        {!menh.element ? (
          <p className="text-sm">Nhập ngày sinh hoặc chọn tuổi can chi để xem tử vi tuần.</p>
        ) : (
          <p className="text-sm">
            Mệnh nạp âm: <strong>{menh.menh || 'Đang cập nhật'}</strong>
            {menh.element ? ` (ngũ hành ${menh.element})` : ''}
            {mauMayMan ? ` — màu may mắn: ${mauMayMan}` : ''}
          </p>
        )}
      </form>

      {menh.element ? (
        <>
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <button type="button" className="btn" onClick={() => setTuanOffset((o) => o - 1)}>
                ← Tuần trước
              </button>
              <h2 className="font-display text-lg font-bold text-primary">
                Tuần {dauTuan.d}/{dauTuan.m} – {cuoiTuan.d}/{cuoiTuan.m}/{cuoiTuan.y}
                {menh.nhan ? ` — ${menh.nhan}` : ''}
              </h2>
              <button type="button" className="btn" onClick={() => setTuanOffset((o) => o + 1)}>
                Tuần sau →
              </button>
            </div>
            {tuanOffset !== 0 ? (
              <p className="text-center text-sm">
                <button type="button" className="font-semibold text-primary underline" onClick={() => setTuanOffset(0)}>
                  Về tuần này
                </button>
              </p>
            ) : null}
            <div className="space-y-2">
              {tuan.map((d, i) => {
                const totNhat = d === ngayTotNhat;
                const barColor =
                  d.muc === 'Vận tốt' ? 'bg-[#2E6B34]' : d.muc === 'Vận bình ổn' ? 'bg-gold' : 'bg-primary/70';
                return (
                  <div
                    key={d.info.solar.d + '-' + d.info.solar.m}
                    className={`card flex items-center justify-between gap-3 ${totNhat ? 'border-gold ring-1 ring-gold' : ''}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-display font-bold text-primary">
                        {THU[i]}, {d.info.solar.d}/{d.info.solar.m}
                        {totNhat ? ' ★ Ngày tốt nhất tuần' : ''}
                      </p>
                      <p className="text-sm opacity-80">
                        {fmtLunar(d.info.lunar)} — can chi ngày {d.info.canChi.ngay}
                        {d.quanHe === 'sinh' ? ' — ngày tương sinh với mệnh' : d.quanHe === 'khac' ? ' — ngày tương khắc với mệnh' : ''}
                      </p>
                      <div className="mt-2 h-2 w-full max-w-56 overflow-hidden rounded-full bg-creamDark" aria-hidden="true">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width: `${d.diem}%` }} />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-lg font-bold text-primary">{d.diem}/100</p>
                      <p className="text-sm">{d.muc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-sm opacity-80">
              Điểm tuần dùng cùng công thức rút gọn với Vận hạn trong ngày (nền 55, tương
              sinh +20, tương khắc −20, cùng hành +5) — chỉ mang tính tham khảo, không phải
              dự báo tuyệt đối cho cả tuần.
            </p>
          </section>

          <section className="card space-y-2">
            <h3 className="font-display text-lg font-bold text-primary">Gợi ý chung cho mệnh {menh.element}</h3>
            <p className="text-sm">
              Việc nên: {nen.length > 0 ? nen.join('; ') : 'Đang cập nhật'}
            </p>
            <p className="text-sm">
              Việc nên tránh: {tranh.length > 0 ? tranh.join('; ') : 'Đang cập nhật'}
            </p>
          </section>

          <ToolShareCard
            title={`Tử vi tuần ${dauTuan.d}/${dauTuan.m} – ${cuoiTuan.d}/${cuoiTuan.m}${menh.nhan ? ` — ${menh.nhan}` : ''}`}
            lines={[
              `Ngày tốt nhất: ${THU[tuan.indexOf(ngayTotNhat)]}, ${ngayTotNhat.info.solar.d}/${ngayTotNhat.info.solar.m} (${ngayTotNhat.diem}/100)`,
              `Mệnh: ${menh.menh || 'Đang cập nhật'}`,
              ...(mauMayMan ? [`Màu may mắn: ${mauMayMan}`] : []),
            ]}
          />
        </>
      ) : null}

      <Disclaimer />
    </div>
  );
}
