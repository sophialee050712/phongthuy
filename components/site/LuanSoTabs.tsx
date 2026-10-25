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
import { normalizeLuanSo } from './format';

type Tab = 'sdt' | 'bienso' | 'stk' | 'cccd';

const TABS: { id: Tab; label: string; placeholder: string; hint: string }[] = [
  { id: 'sdt', label: 'Số điện thoại', placeholder: 'VD: 09xxxxxxxx', hint: 'Nhập 10 chữ số của số điện thoại.' },
  { id: 'bienso', label: 'Biển số xe', placeholder: 'VD: 43A12345', hint: 'Chỉ phần số của biển số được đưa vào tính toán.' },
  { id: 'stk', label: 'Số tài khoản', placeholder: 'VD: 1234567890', hint: 'Nhập dãy số tài khoản ngân hàng.' },
  { id: 'cccd', label: 'CCCD', placeholder: '12 chữ số CCCD', hint: 'Chỉ tính trong trình duyệt của bạn, không gửi đi đâu.' },
];

export default function LuanSoTabs() {
  const [tab, setTab] = useState<Tab>('sdt');
  const [inputs, setInputs] = useState<Record<Tab, string>>({ sdt: '', bienso: '', stk: '', cccd: '' });
  const [result, setResult] = useState<{ tab: Tab; digits: string; tongNut: string; nguHanhChuDao: string; phanTich: string } | null>(null);
  const [error, setError] = useState('');

  const current = TABS.find((t) => t.id === tab) as (typeof TABS)[number];

  function onAnalyze() {
    setError('');
    setResult(null);
    const raw = inputs[tab];
    const digits = raw.replace(/\D/g, '');
    if (tab === 'cccd' && digits.length !== 12) {
      setError('CCCD phải đủ 12 chữ số. Vui lòng kiểm tra lại (số chỉ tính trong trình duyệt, không được lưu).');
      return;
    }
    if (tab === 'sdt' && digits.length !== 10) {
      setError('Số điện thoại thường có 10 chữ số. Vui lòng kiểm tra lại.');
      return;
    }
    if (!digits) {
      setError('Vui lòng nhập dãy số cần luận.');
      return;
    }
    try {
      const r = normalizeLuanSo(luanSo(digits));
      setResult({ tab, digits, ...r });
    } catch {
      setError('Chưa luận được dãy số này. Vui lòng thử lại sau.');
    }
  }

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
              setError('');
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'cccd' ? (
        <p className="rounded border border-primary/50 bg-creamDark px-3 py-2 text-sm font-semibold text-primary">
          ⚠️ Cảnh báo: số CCCD chỉ được tính toán ngay trong trình duyệt của bạn. Trang này không
          gửi, không lưu trữ và không ghi log số CCCD của bạn.
        </p>
      ) : null}

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
    </div>
  );
}
