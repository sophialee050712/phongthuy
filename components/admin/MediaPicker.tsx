'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MediaRow } from './helpers';

// Hộp thoại chọn ảnh từ Thư viện (bảng media) — dùng chung cho cả 3 mục đích:
// ảnh đại diện bài viết, ảnh thẻ chia sẻ và ảnh minh họa trang tool (qua
// ToolIllustrationPicker). Chỉ trả về URL ảnh đã chọn, không tự ghi vào đâu.
// Mở rộng 2026-10-25 (nhóm Tăng trưởng): thêm ô tìm kiếm theo alt text /
// đường dẫn và prop `title` để mỗi nơi gọi hiển thị đúng mục đích sử dụng.
export default function MediaPicker({
  onSelect,
  onClose,
  title = 'Chọn ảnh từ Thư viện',
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
  title?: string;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(60)
      .then(({ data, error: err }) => {
        if (err) setError('Không tải được thư viện: ' + err.message);
        else setItems((data ?? []) as MediaRow[]);
      });
  }, []);

  const needle = query.trim().toLowerCase();
  const visible = needle
    ? items.filter((item) =>
        `${item.alt_text ?? ''} ${item.path}`.toLowerCase().includes(needle),
      )
    : items;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card max-h-[85vh] w-full max-w-3xl overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">{title}</h2>
          <button type="button" className="btn-gold" onClick={onClose}>
            Đóng
          </button>
        </div>
        <div className="mt-3">
          <label className="label" htmlFor="media-picker-search">
            Tìm trong thư viện (theo mô tả hoặc tên file)
          </label>
          <input
            id="media-picker-search"
            className="input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="VD: khai trương, mam-cung…"
          />
        </div>
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        {items.length === 0 && !error ? (
          <p className="mt-3 text-sm">
            Thư viện trống. Vào <a className="underline" href="/admin/thu-vien">Thư viện</a> để
            tải ảnh lên trước.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-3 text-sm">Không tìm thấy ảnh nào khớp “{query.trim()}”.</p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {visible.map((item) => (
            <button
              key={item.id}
              type="button"
              className="overflow-hidden rounded border border-gold/40 text-left hover:ring-2 hover:ring-gold"
              onClick={() => onSelect(item.url)}
              title={item.alt_text ?? item.path}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.url} alt={item.alt_text ?? ''} className="h-32 w-full object-cover" />
              <span className="block truncate px-2 py-1 text-xs">
                {item.alt_text || item.path}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
