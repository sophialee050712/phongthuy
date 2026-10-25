'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { MediaRow } from './helpers';

// Hộp thoại chọn ảnh đại diện từ Thư viện (bảng media).
export default function MediaPicker({
  onSelect,
  onClose,
}: {
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<MediaRow[]>([]);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="card max-h-[85vh] w-full max-w-3xl overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-xl font-bold text-primary">Chọn ảnh từ Thư viện</h2>
          <button type="button" className="btn-gold" onClick={onClose}>
            Đóng
          </button>
        </div>
        {error ? <p className="mt-3 text-sm text-primary">{error}</p> : null}
        {items.length === 0 && !error ? (
          <p className="mt-3 text-sm">
            Thư viện trống. Vào <a className="underline" href="/admin/thu-vien">Thư viện</a> để
            tải ảnh lên trước.
          </p>
        ) : null}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((item) => (
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
