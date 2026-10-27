'use client';

// Luận số — tính toán hoàn toàn phía client.
// TAB CCCD: chỉ tính trong trình duyệt, KHÔNG fetch, KHÔNG POST,
// KHÔNG console.log, KHÔNG lưu số CCCD lên server dưới bất kỳ hình thức
// nào. Kết quả không hiển thị lại toàn bộ số CCCD, chỉ hiện 4 số cuối
// để đối chiếu. Import luanSo trực tiếp từ '@/lib/engine'.

import { useState } from 'react';
import { luanSo } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import { normalizeLuanSo, sinhKhac } from './format';

type Tab = 'sdt' | 'bienso' | 'stk' | 'cccd';
type LuanKetQua = { tongNut: string; nguHanhChuDao: string; phanTich: string };

const TABS: { id: Tab; label: string; placeholder: string; hint: string }[] = [
  { id: 'sdt', label: 'Số điện thoại', placeholder: 'VD: 09xxxxxxxx', hint: 'Nhập 10 chữ số của số điện thoại.' },
  { id: 'bienso', label: 'Biển số xe', placeholder: 'VD: 43A12345', hint: 'Chỉ phần số của biển số được đưa vào tính toán.' },
  { id: 'stk', label: 'Số tài khoản', placeholder: 'VD: 1234567890', hint: 'Nhập dãy số tài khoản ngân hàng.' },
  { id: 'cccd', label: 'CCCD', placeholder: '12 chữ số CCCD', hint: 'Chỉ tính trong trình duyệt của bạn, không gửi đi đâu.' },
];

const MENH = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'] as const;

function luanMotSo(tab: Tab, raw: string): { digits: string; result: LuanKetQua } | { error: string } {
  const digits = raw.replace(/\D/g, '');
  if (tab === 'cccd' && digits.length !== 12)
    return { error: 'CCCD phải đủ 12 chữ số. Vui lòng kiểm tra lại (số chỉ tính trong trình duyệt, không được lưu).' };
  if (tab === 'sdt' && digits.length !== 10)
    return { error: 'Số điện thoại thường có 10 chữ số. Vui lòng kiểm tra lại.' };
  if (!digits) return { error: 'Vui lòng nhập dãy số cần luận.' };
  try {
    return { digits, result: normalizeLuanSo(luanSo(digits)) };
  } catch {
    return { error: 'Chưa luận được dãy số này. Vui lòng thử lại sau.' };
  }
}

/** Xếp hạng quan hệ với mệnh: sinh (hợp nhất) > cùng hành/bình > khắc. Không có điểm số. */
function hangQuanHe(el: string, menh: string): number {
  if (el === menh) return 1;
  const q = sinhKhac(el, menh);
  if (q === 'sinh') return 2;
  if (q === 'khac') return 0;
  return 1;
}

function moTaQuanHe(el: string, menh: string): string {
  if (el === menh) return 'cùng hành với mệnh';
  const q = sinhKhac(el, menh);
  if (q === 'sinh') return 'tương sinh với mệnh';
  if (q === 'khac') return 'tương khắc với mệnh';
  return 'không sinh khắc với mệnh';
}

export default function LuanSoTabs() {
  const [tab, setTab] = useState<Tab>('sdt');
  const [mode, setMode] = useState<'single' | 'compare'>('single');
  const [inputs, setInputs] = useState<Record<Tab, string>>({ sdt: '', bienso: '', stk: '', cccd: '' });
  const [result, setResult] = useState<{ tab: Tab; digits: string } & LuanKetQua | null>(null);
  const [so1, setSo1] = useState('');
  const [so2, setSo2] = useState('');
  const [compare, setCompare] = useState<{ digits1: string; r1: LuanKetQua; digits2: string; r2: LuanKetQua } | null>(null);
  const [menh, setMenh] = useState('');
  const [error, setError] = useState('');

  const current = TABS.find((t) => t.id === tab) as (typeof TABS)[number];

  function onAnalyze() {
    setError('');
    setResult(null);
    const r = luanMotSo(tab, inputs[tab]);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    setResult({ tab, digits: r.digits, ...r.result });
  }

  function onCompare() {
    setError('');
    setCompare(null);
    const a = luanMotSo(tab, so1);
    if ('error' in a) {
      setError(`Số 1: ${a.error}`);
      return;
    }
    const b = luanMotSo(tab, so2);
    if ('error' in b) {
      setError(`Số 2: ${b.error}`);
      return;
    }
    setCompare({ digits1: a.digits, r1: a.result, digits2: b.digits, r2: b.result });
  }

  function hienSo(digits: string) {
    return tab === 'cccd' ? `••••••••${digits.slice(-4)}` : digits;
  }

  const ketLuan =
    compare && menh
      ? (() => {
          const h1 = hangQuanHe(compare.r1.nguHanhChuDao, menh);
          const h2 = hangQuanHe(compare.r2.nguHanhChuDao, menh);
          if (h1 === h2) return 'Hai số ngang nhau về quan hệ với mệnh của bạn (chỉ mang tính tham khảo).';
          return h1 > h2
            ? 'Số 1 hợp với mệnh của bạn hơn số 2 (chỉ mang tính tham khảo).'
            : 'Số 2 hợp với mệnh của bạn hơn số 1 (chỉ mang tính tham khảo).';
        })()
      : '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Loại số cần luận">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? 'btn-primary' : 'btn-gold'}
            onClick={() => {
              setTab(t.id);
              setResult(null);
              setCompare(null);
              setError('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2" aria-label="Chế độ luận số">
        <button
          type="button"
          className={mode === 'single' ? 'btn-primary' : 'btn-gold'}
          onClick={() => {
            setMode('single');
            setCompare(null);
            setError('');
          }}
        >
          Luận 1 số
        </button>
        <button
          type="button"
          className={mode === 'compare' ? 'btn-primary' : 'btn-gold'}
          onClick={() => {
            setMode('compare');
            setResult(null);
            setError('');
          }}
        >
          So sánh 2 số
        </button>
      </div>

      {tab === 'cccd' ? (
        <p className="rounded border border-primary/50 bg-creamDark px-3 py-2 text-sm font-semibold text-primary">
          ⚠️ Cảnh báo: số CCCD chỉ được tính toán ngay trong trình duyệt của bạn. Trang này không
          gửi, không lưu trữ và không ghi log số CCCD của bạn.
        </p>
      ) : null}

      {mode === 'single' ? (
        <div className="card space-y-4">
          <div>
            <label className="label" htmlFor="ls-input">
              {current.label}
            </label>
            <input
              id="ls-input"
              className="input"
              value={inputs[tab]}
              onChange={(e) => setInputs((prev) => ({ ...prev, [tab]: e.target.value }))}
              placeholder={current.placeholder}
              inputMode={tab === 'bienso' ? 'text' : 'numeric'}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
            <p className="mt-1 text-xs text-ink/70">{current.hint}</p>
          </div>
          <button type="button" className="btn-primary" onClick={onAnalyze}>
            Luận số
          </button>
          {error ? <p className="text-sm font-semibold text-primary">{error}</p> : null}
        </div>
      ) : (
        <div className="card space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="ls-so1">
                {current.label} 1
              </label>
              <input
                id="ls-so1"
                className="input"
                value={so1}
                onChange={(e) => setSo1(e.target.value)}
                placeholder={current.placeholder}
                inputMode={tab === 'bienso' ? 'text' : 'numeric'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
            <div>
              <label className="label" htmlFor="ls-so2">
                {current.label} 2
              </label>
              <input
                id="ls-so2"
                className="input"
                value={so2}
                onChange={(e) => setSo2(e.target.value)}
                placeholder={current.placeholder}
                inputMode={tab === 'bienso' ? 'text' : 'numeric'}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
              />
            </div>
          </div>
          <p className="text-xs text-ink/70">{current.hint} Hai số phải cùng loại.</p>
          <div>
            <label className="label" htmlFor="ls-menh">
              Mệnh của bạn (tùy chọn — chỉ khi chọn mệnh mới có kết luận số nào hợp hơn)
            </label>
            <select
              id="ls-menh"
              className="input"
              value={menh}
              onChange={(e) => setMenh(e.target.value)}
            >
              <option value="">— Không chọn, chỉ đối chiếu 2 số —</option>
              {MENH.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
          <button type="button" className="btn-primary" onClick={onCompare}>
            So sánh 2 số
          </button>
          {error ? <p className="text-sm font-semibold text-primary">{error}</p> : null}
        </div>
      )}
      {result ? (
        <div className="card space-y-2">
          <h2 className="font-display text-xl font-bold text-primary">
            Kết quả luận số {TABS.find((t) => t.id === result.tab)?.label.toLowerCase()}
          </h2>
          <p className="text-sm text-ink/80">
            {result.tab === 'cccd'
              ? `Dãy số đã nhập (chỉ hiện 4 số cuối để đối chiếu): ••••••••${result.digits.slice(-4)}`
              : `Dãy số đã nhập: ${result.digits}`}
          </p>
          {result.tongNut ? (
            <p>
              Tổng nút: <strong>{result.tongNut}</strong>
            </p>
          ) : null}
          {result.nguHanhChuDao ? (
            <p>
              Ngũ hành chủ đạo: <strong>{result.nguHanhChuDao}</strong>
            </p>
          ) : null}
          {result.phanTich ? <p>{result.phanTich}</p> : null}
          <ToolShareCard
            title={`Luận số ${TABS.find((t) => t.id === result.tab)?.label.toLowerCase()}`}
            lines={[
              ...(result.tongNut ? [`Tổng nút: ${result.tongNut}`] : []),
              ...(result.nguHanhChuDao ? [`Ngũ hành chủ đạo: ${result.nguHanhChuDao}`] : []),
            ]}
          />
          <Disclaimer text="Kết quả luận số mang tính tham khảo theo các bảng tra truyền thống, không phải căn cứ duy nhất để chọn hay đổi số." />
        </div>
      ) : null}

      {compare ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl font-bold text-primary">
            Kết quả so sánh {current.label.toLowerCase()}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { label: 'Số 1', digits: compare.digits1, r: compare.r1 },
              { label: 'Số 2', digits: compare.digits2, r: compare.r2 },
            ].map((c) => (
              <div key={c.label} className="card space-y-2">
                <p className="font-display font-bold text-primary">{c.label}</p>
                <p className="text-sm text-ink/80">Dãy số đã nhập: {hienSo(c.digits)}</p>
                {c.r.tongNut ? (
                  <p>
                    Tổng nút: <strong>{c.r.tongNut}</strong>
                  </p>
                ) : null}
                {c.r.nguHanhChuDao ? (
                  <p>
                    Ngũ hành chủ đạo: <strong>{c.r.nguHanhChuDao}</strong>
                  </p>
                ) : null}
                {c.r.phanTich ? <p className="text-sm">{c.r.phanTich}</p> : null}
                {menh && c.r.nguHanhChuDao ? (
                  <p className="text-sm">
                    Với mệnh {menh}: {moTaQuanHe(c.r.nguHanhChuDao, menh)}.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
          {menh ? (
            <p className="card font-semibold">{ketLuan}</p>
          ) : (
            <p className="text-sm opacity-80">
              Chưa chọn mệnh nên chỉ đối chiếu 2 số — chọn mệnh của bạn ở trên để xem số nào hợp hơn.
            </p>
          )}
          <ToolShareCard
            title={`So sánh ${current.label.toLowerCase()}`}
            lines={[
              `Số 1: tổng nút ${compare.r1.tongNut || '?'} · ${compare.r1.nguHanhChuDao || '?'}`,
              `Số 2: tổng nút ${compare.r2.tongNut || '?'} · ${compare.r2.nguHanhChuDao || '?'}`,
              ketLuan || 'Đối chiếu tham khảo',
            ]}
          />
          <Disclaimer text="Kết quả luận số mang tính tham khảo theo các bảng tra truyền thống, không phải căn cứ duy nhất để chọn hay đổi số. Trang không tự đặt điểm số cho dãy số." />
        </div>
      ) : null}
    </div>
  );
}
