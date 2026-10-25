'use client';

import { useState } from 'react';

// Form để lại SĐT/Zalo dưới kết quả việc lớn.
// Gửi về /api/leads. Khi chưa cấu hình Supabase, API trả stored:false và form
// hiển thị đúng thông báo đó — không báo gửi thành công giả.
export default function LeadForm({ source }: { source: string }) {
  const [phone, setPhone] = useState('');
  const [zalo, setZalo] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
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
        Nhận tư vấn miễn phí cho việc này
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
          placeholder="VD: 0901234567"
          inputMode="tel"
        />
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
          Bạn cần tư vấn gì?
        </label>
        <input
          id="lead-note"
          className="input"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="VD: khai trương cửa hàng tháng tới"
        />
      </div>
      <button type="submit" className="btn-primary" disabled={status === 'sending' || !phone.trim()}>
        {status === 'sending' ? 'Đang gửi...' : 'Gửi yêu cầu tư vấn'}
      </button>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
    </form>
  );
}
