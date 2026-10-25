'use client';

import { useEffect, useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';

const THU_THACH_KEY = 'khang-an-thu-thach';

// Thói quen tích cực chung, không hứa hẹn đổi vận hay chữa bệnh.
const THOI_QUEN = [
  'Dọn dẹp góc làm việc hoặc nhà cửa 10 phút',
  'Dậy sớm hơn thường lệ 15 phút',
  'Uống đủ nước trong ngày',
  'Đi bộ hoặc vận động nhẹ 20 phút',
  'Viết ra 3 điều biết ơn trong ngày',
  'Đọc sách 15 phút thay vì lướt điện thoại',
  'Ngủ đúng giờ, tránh thức khuya',
  'Gọi điện hỏi thăm một người thân',
  'Sắp xếp lại kế hoạch ngày mai trước khi ngủ',
  'Ăn một bữa rau xanh đầy đủ',
];

type Progress = {
  soNgay: number;
  batDau: string; // YYYY-MM-DD
  hoanThanh: Record<string, boolean>; // key: 'YYYY-MM-DD'
};

function todayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function addDays(iso: string, n: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return iso;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]) + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate(),
  ).padStart(2, '0')}`;
}

function loadProgress(): Progress | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(THU_THACH_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Progress;
    if (p && (p.soNgay === 7 || p.soNgay === 21) && typeof p.batDau === 'string') return p;
    return null;
  } catch {
    return null;
  }
}

function saveProgress(p: Progress) {
  try {
    window.localStorage.setItem(THU_THACH_KEY, JSON.stringify(p));
  } catch {
    // bỏ qua lỗi storage
  }
}

export default function ThuThachPage() {
  const [progress, setProgress] = useState<Progress | null>(null);
  const [soNgayChon, setSoNgayChon] = useState<7 | 21>(7);

  useEffect(() => {
    setProgress(loadProgress());
  }, []);

  const days = useMemo(() => {
    if (!progress) return [];
    return Array.from({ length: progress.soNgay }, (_, i) => {
      const iso = addDays(progress.batDau, i);
      return { iso, nhiemVu: THOI_QUEN[i % THOI_QUEN.length], xong: !!progress.hoanThanh[iso] };
    });
  }, [progress]);

  const doneCount = days.filter((d) => d.xong).length;
  const pct = days.length ? Math.round((doneCount / days.length) * 100) : 0;

  function start() {
    const p: Progress = { soNgay: soNgayChon, batDau: todayISO(), hoanThanh: {} };
    setProgress(p);
    saveProgress(p);
  }

  function toggle(iso: string) {
    if (!progress) return;
    const next: Progress = {
      ...progress,
      hoanThanh: { ...progress.hoanThanh, [iso]: !progress.hoanThanh[iso] },
    };
    if (!next.hoanThanh[iso]) delete next.hoanThanh[iso];
    setProgress(next);
    saveProgress(next);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Thử thách cải vận 7 / 21 ngày</h1>
      <p className="text-ink/80">
        Chương trình checklist thói quen tích cực chung: mỗi ngày một nhiệm vụ nhỏ như dọn dẹp, dậy
        sớm, uống đủ nước, vận động nhẹ. Tiến độ lưu trong trình duyệt của bạn. Chương trình không
        cam kết đổi vận, không chữa bệnh và không thay thế tư vấn chuyên môn.
      </p>

      {!progress ? (
        <div className="card space-y-4">
          <p className="font-semibold">Chọn độ dài thử thách:</p>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tt-so-ngay"
                checked={soNgayChon === 7}
                onChange={() => setSoNgayChon(7)}
              />
              7 ngày
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="tt-so-ngay"
                checked={soNgayChon === 21}
                onChange={() => setSoNgayChon(21)}
              />
              21 ngày
            </label>
          </div>
          <button type="button" className="btn-primary" onClick={start}>
            Bắt đầu từ hôm nay
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="card space-y-2">
            <p>
              Thử thách <strong>{progress.soNgay} ngày</strong>, bắt đầu{' '}
              <strong>{progress.batDau}</strong> — đã hoàn thành{' '}
              <strong>
                {doneCount}/{progress.soNgay} ({pct}%)
              </strong>
            </p>
            <div className="h-3 w-full overflow-hidden rounded bg-creamDark">
              <div className="h-full bg-gold" style={{ width: `${pct}%` }} />
            </div>
            {doneCount === progress.soNgay ? (
              <p className="text-sm font-semibold text-primary">
                Chúc mừng bạn đã hoàn thành thử thách! Duy trì thói quen tốt là phần thưởng bền nhất.
              </p>
            ) : null}
            <button
              type="button"
              className="btn-gold"
              onClick={() => {
                try {
                  window.localStorage.removeItem(THU_THACH_KEY);
                } catch {
                  // bỏ qua
                }
                setProgress(null);
              }}
            >
              Bắt đầu lại thử thách mới
            </button>
          </div>
          <div className="space-y-3">
            {days.map((d, i) => (
              <label key={d.iso} className="card flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={d.xong}
                  onChange={() => toggle(d.iso)}
                />
                <span>
                  <span className="font-display font-bold text-primary">
                    Ngày {i + 1} ({d.iso})
                  </span>
                  <span className="block text-sm">{d.nhiemVu}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
      )}
      <Disclaimer text="Thử thách này chỉ là checklist thói quen tích cực chung (dọn dẹp, vận động, ngủ đủ giấc...), không cam kết hiệu quả phong thủy hay sức khỏe, không thay thế tư vấn chuyên môn." />
    </div>
  );
}
