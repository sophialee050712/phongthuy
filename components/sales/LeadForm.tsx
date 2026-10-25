'use client';

import { useState } from 'react';

// Form để lại SĐT/Zalo để team liên hệ lại (dùng dưới kết quả các công cụ).
// Gửi về /api/leads. Khi chưa cấu hình Supabase, API trả stored:false và form
// hiển thị đúng thông báo đó — không báo gửi thành công giả.

/** Chuẩn hóa SĐT nhập tay: bỏ khoảng trắng/dấu chấm, đổi +84 thành 0. */
export function normalizeVnPhone(value: string): string {
  const s = value.trim().replace(/[\s.]/g, '');
  if (s.startsWith('+84')) return '0' + s.slice(3);
  return s;
}

/** SĐT di động Việt Nam hợp lệ: 10 chữ số, bắt đầu 03/05/07/08/09. */
export function isValidVnMobile(value: string): boolean {
  return /^0(?:3|5|7|8|9)\d{8}$/.test(normalizeVnPhone(value));
}

export default function LeadForm({ source }: { source: string }) {
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const phoneTrimmed = phone.trim();
  const phoneInvalid = phoneTrimmed !== '' && !isValidVnMobile(phoneTrimmed);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phoneInvalid) {
      setMessage('Số điện thoại chưa đúng định dạng. Vui lòng nhập số di động Việt Nam 10 chữ số, bắt đầu bằng 03, 05, 07, 08 hoặc 09.');
      return;
    }
    setStatus('sending');
    setMessage('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, zalo, note, source }),
      });
      const data = await res.json();
      if (res.ok && data.stored) {
        setStatus('done');
        setMessage('Đã gửi. Team sẽ liên hệ lại với bạn.');
      } else {
        setStatus('error');
        setMessage(data.message || 'Chưa gửi được. Vui lòng thử lại sau.');
      }
    } catch {
      setStatus('error');
      setMessage('Lỗi kết nối. Vui lòng thử lại sau.');
    }
  }

  if (status === 'done') {
    return <p className="card text-primary">{message}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-3">
      <p className="font-display text-lg font-bold text-primary">
        Để lại số điện thoại để được liên hệ
      </p>
      <div>
        <label className="label" htmlFor="lead-phone">
          Số điện thoại
        </label>
        <input
          id="lead-phone"
          className="input"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="VD: 09xxxxxxxx"
          inputMode="tel"
          aria-invalid={phoneInvalid}
        />
        {phoneInvalid ? (
          <p className="mt-1 text-sm text-primary">
            Số điện thoại chưa đúng định dạng. Vui lòng nhập số di động Việt Nam 10 chữ số,
            bắt đầu bằng 03, 05, 07, 08 hoặc 09.
          </p>
        ) : null}
      </div>
      <div>
        <label className="label" htmlFor="lead-zalo">
          Zalo (nếu khác SĐT)
        </label>
        <input
          id="lead-zalo"
          className="input"
          value={zalo}
          onChange={(e) => setZalo(e.target.value)}
          placeholder="Để trống nếu dùng chung SĐT"
        />
      </div>
      <div>
        <label className="label" htmlFor="lead-note">
          Bạn cần gì thêm?
        </label>
        <input
          id="lead-note"
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Nhập ghi chú nếu cần"
        />
      </div>
      <button
        type="submit"
        className="btn-primary"
        disabled={status === 'sending' || !phone.trim() || phoneInvalid}
      >
        {status === 'sending' ? 'Đang gửi...' : 'Gửi yêu cầu liên hệ'}
      </button>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
    </form>
  );
}
