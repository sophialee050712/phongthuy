'use client';

import { useEffect, useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import { canChiDay, saoNgay, solarToLunar } from '@/lib/engine';

const NHAT_KY_KEY = 'khang-an-nhat-ky';

const TAM_TRANG_LIST = ['Vui', 'Bình thường', 'Mệt', 'Căng thẳng', 'Buồn', 'Hào hứng'];

type Entry = {
  id: string;
  ngay: string; // YYYY-MM-DD
  tamTrang: string;
  ghiChu: string;
};

function loadEntries(): Entry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(NHAT_KY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Entry[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e) => e && typeof e.ngay === 'string' && typeof e.ghiChu === 'string',
    );
  } catch {
    return [];
  }
}

function saveEntries(entries: Entry[]) {
  try {
    window.localStorage.setItem(NHAT_KY_KEY, JSON.stringify(entries));
  } catch {
    // bỏ qua lỗi storage
  }
}

function dayForecast(iso: string): { canChi: string; saoTot: string[]; saoXau: string[] } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  try {
    const lunar = solarToLunar(y, mo, d);
    const cc = canChiDay(y, mo, d);
    const sao = saoNgay(cc, lunar.month);
    return { canChi: cc, saoTot: sao.tot, saoXau: sao.xau };
  } catch {
    return null;
  }
}

export default function NhatKyPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [ngay, setNgay] = useState('');
  const [tamTrang, setTamTrang] = useState(TAM_TRANG_LIST[1]);
  const [ghiChu, setGhiChu] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    setEntries(loadEntries());
    const d = new Date();
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
      d.getDate(),
    ).padStart(2, '0')}`;
    setNgay(iso);
  }, []);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => (a.ngay < b.ngay ? 1 : a.ngay > b.ngay ? -1 : 0)),
    [entries],
  );

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!ngay || !ghiChu.trim()) {
      setMessage('Vui lòng chọn ngày và nhập ghi chú.');
      return;
    }
    const entry: Entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ngay,
      tamTrang,
      ghiChu: ghiChu.trim(),
    };
    const next = [...entries, entry];
    setEntries(next);
    saveEntries(next);
    setGhiChu('');
    setMessage('Đã lưu vào nhật ký trên trình duyệt của bạn.');
  }

  function handleDelete(id: string) {
    const next = entries.filter((e) => e.id !== id);
    setEntries(next);
    saveEntries(next);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Nhật ký vận khí</h1>
      <p className="text-ink/80">
        Ghi lại tâm trạng và cảm nhận mỗi ngày, đối chiếu với can chi và sao của ngày đó từ engine
        lịch vạn niên. Nhật ký chỉ lưu trong trình duyệt của bạn (localStorage), không gửi lên máy
        chủ. Việc đối chiếu chỉ mang tính tham khảo, không dùng để chẩn đoán hay kết luận nguyên
        nhân.
      </p>
      <form className="card space-y-4" onSubmit={handleAdd}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="nk-ngay">
              Ngày
            </label>
            <input
              id="nk-ngay"
              type="date"
              className="input"
              value={ngay}
              onChange={(e) => setNgay(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="nk-tam">
              Tâm trạng
            </label>
            <select
              id="nk-tam"
              className="input"
              value={tamTrang}
              onChange={(e) => setTamTrang(e.target.value)}
            >
              {TAM_TRANG_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="nk-ghi">
            Ghi chú
          </label>
          <textarea
            id="nk-ghi"
            className="input"
            rows={3}
            value={ghiChu}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="VD: Hôm nay làm việc suôn sẻ, ngủ ngon..."
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Lưu nhật ký
        </button>
        {message ? <p className="text-sm text-ink/80">{message}</p> : null}
      </form>

      <div className="space-y-3">
        {sorted.length === 0 ? (
          <p className="text-sm text-ink/80">Chưa có mục nhật ký nào.</p>
        ) : (
          sorted.map((entry) => {
            const fc = dayForecast(entry.ngay);
            return (
              <div key={entry.id} className="card space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-display font-bold text-primary">
                    {entry.ngay} — <span className="chip">{entry.tamTrang}</span>
                  </p>
                  <button type="button" className="btn-gold" onClick={() => handleDelete(entry.id)}>
                    Xóa
                  </button>
                </div>
                <p className="text-sm">{entry.ghiChu}</p>
                {fc ? (
                  <p className="text-sm text-ink/80">
                    Đối chiếu ngày đó: can chi <strong>{fc.canChi}</strong> — sao tốt:{' '}
                    {fc.saoTot.length ? fc.saoTot.join(', ') : '—'} — sao xấu:{' '}
                    {fc.saoXau.length ? fc.saoXau.join(', ') : '—'} (bộ sao cơ bản của engine).
                  </p>
                ) : (
                  <p className="text-sm text-ink/80">Không tính được thông tin ngày đó.</p>
                )}
              </div>
            );
          })
        )}
      </div>
      <Disclaimer />
    </div>
  );
}
