'use client';

import { useEffect, useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import { getBirthdate, profileFromBirthdate } from '@/lib/personal';
import { canChiDay, canChiMonth, saoNgay, solarToLunar } from '@/lib/engine';

type ThangInfo = {
  /** Ngày dương đầu tháng âm. */
  solar: string;
  lunarLabel: string;
  canChiThang: string;
  canChiNgayDauThang: string;
  saoTot: string[];
  saoXau: string[];
};

function fmtSolar(d: Date): string {
  return `ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
}

/** Quét từ hôm nay tới tối đa ~400 ngày, lấy ngày dương đầu tiên của 12 tháng âm liên tiếp. */
function next12LunarMonths(from: Date): ThangInfo[] {
  const out: ThangInfo[] = [];
  const seen = new Set<string>();
  const cursor = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  for (let i = 0; i < 400 && out.length < 12; i++) {
    const y = cursor.getFullYear();
    const m = cursor.getMonth() + 1;
    const d = cursor.getDate();
    let lunar;
    try {
      lunar = solarToLunar(y, m, d);
    } catch {
      cursor.setDate(cursor.getDate() + 1);
      continue;
    }
    const key = `${lunar.year}-${lunar.month}-${lunar.leap ? 'nhuan' : ''}`;
    if (lunar.day === 1 && !seen.has(key)) {
      seen.add(key);
      let canChiThang = '';
      let canChiNgay = '';
      let saoTot: string[] = [];
      let saoXau: string[] = [];
      try {
        canChiThang = canChiMonth(lunar.year, lunar.month);
      } catch {
        // giữ rỗng
      }
      try {
        canChiNgay = canChiDay(y, m, d);
        const sao = saoNgay(canChiNgay, lunar.month);
        saoTot = sao.tot;
        saoXau = sao.xau;
      } catch {
        // giữ rỗng
      }
      out.push({
        solar: fmtSolar(cursor),
        lunarLabel: `tháng ${lunar.month}${lunar.leap ? ' nhuận' : ''} năm ${lunar.year} âm lịch`,
        canChiThang,
        canChiNgayDauThang: canChiNgay,
        saoTot,
        saoXau,
      });
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export default function VanHanCaNhanPage() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [submitted, setSubmitted] = useState('');

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) {
      setNgaySinh(stored);
      setSubmitted(stored);
    }
  }, []);

  const profile = useMemo(
    () => (submitted ? profileFromBirthdate(submitted) : null),
    [submitted],
  );
  const timeline = useMemo(() => next12LunarMonths(new Date()), []);

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Timeline vận hạn cá nhân</h1>
      <p className="text-ink/80">
        Nhập ngày sinh để xem timeline 12 tháng âm lịch tới: mỗi tháng kèm can chi tháng và sao của
        ngày đầu tháng (tính bằng engine lịch vạn niên). Đây là thông tin tham khảo, không phải dự
        báo chắc chắn cho từng người.
      </p>
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(ngaySinh);
        }}
      >
        <div>
          <label className="label" htmlFor="vhcn-ngay">
            Ngày sinh (dương lịch)
          </label>
          <input
            id="vhcn-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
          <p className="mt-1 text-xs text-ink/70">
            Đã tự điền từ <a href="/ho-so" className="underline">hồ sơ của bạn</a> nếu bạn đã lưu;
            sửa tay tại đây không làm thay đổi hồ sơ.
          </p>
        </div>
        <button type="submit" className="btn-primary">
          Xem timeline
        </button>
      </form>

      {profile ? (
        <div className="card space-y-1">
          <p>
            Bạn sinh <strong>{profile.conGiap}</strong> — năm âm lịch{' '}
            <strong>{profile.canChiNam}</strong>, mệnh nạp âm <strong>{profile.menh}</strong>.
          </p>
          <p className="text-sm text-ink/80">
            Timeline dưới đây là lịch tháng chung tính từ hôm nay; việc đối chiếu tháng với tuổi
            của bạn chỉ mang tính tham khảo.
          </p>
        </div>
      ) : submitted ? (
        <p className="text-sm text-ink/80">Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.</p>
      ) : null}

      <div className="space-y-3">
        {timeline.map((t, i) => (
          <div key={`${t.lunarLabel}-${i}`} className="card">
            <p className="font-display text-lg font-bold text-primary">
              Tháng {i + 1}: {t.lunarLabel}
            </p>
            <p className="text-sm">Bắt đầu dương lịch: {t.solar}</p>
            <p className="text-sm">
              Can chi tháng: <strong>{t.canChiThang || 'Đang cập nhật'}</strong> — Can chi ngày
              đầu tháng: <strong>{t.canChiNgayDauThang || 'Đang cập nhật'}</strong>
            </p>
            <p className="text-sm">
              Sao tốt ngày đầu tháng:{' '}
              {t.saoTot.length ? <strong>{t.saoTot.join(', ')}</strong> : 'Không có sao tốt trong bộ sao cơ bản của engine'}
            </p>
            <p className="text-sm">
              Sao xấu ngày đầu tháng:{' '}
              {t.saoXau.length ? <strong>{t.saoXau.join(', ')}</strong> : 'Không có sao xấu trong bộ sao cơ bản của engine'}
            </p>
          </div>
        ))}
        {timeline.length === 0 ? (
          <p className="text-sm text-ink/80">Không tính được timeline, vui lòng thử lại sau.</p>
        ) : null}
      </div>
      <Disclaimer />
    </div>
  );
}
