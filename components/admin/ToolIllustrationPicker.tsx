'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { slugify } from './helpers';
import MediaPicker from './MediaPicker';

// Chọn ảnh minh họa cho một trang tool, lưu URL vào bảng site_settings.
// Key lưu trữ: `tool_illustration_<slug>` — vd tool "Xem ngày" có slug
// "xem-ngay" -> key `tool_illustration_xem-ngay`. Dùng đúng pattern key/value
// của trang Cài đặt (/admin/cai-dat): upsert với onConflict 'key'.
// Trang công khai đọc được site_settings (policy public read trong schema)
// nên trang tool chỉ cần đọc key này là có URL ảnh — phần đọc/hiển thị ở
// trang tool do coordinator nối sau.
//
// CÁCH NỐI (không sửa /admin/cai-dat vì thuộc agent khác): ở trang quản trị
// muốn gắn ảnh minh họa (vd trang Cài đặt hoặc một trang quản trị riêng),
// render component này cho mỗi tool:
//   <ToolIllustrationPicker toolSlug="xem-ngay" toolName="Xem ngày" />
// Các slug tool gợi ý: xem-ngay, tra-menh, huong-nha, dat-ten, luan-so, van-han.
// LƯU Ý QUYỀN: policy site_settings chỉ cho admin ghi — tài khoản editor bấm
// Lưu sẽ nhận lỗi từ database và thấy thông báo, không ghi lén được.

/** Key site_settings lưu ảnh minh họa của một tool. Hàm thuần, tái dùng được. */
export function toolIllustrationKey(toolSlug: string): string {
  return `tool_illustration_${slugify(toolSlug) || 'tool'}`;
}

export default function ToolIllustrationPicker({
  toolSlug,
  toolName,
}: {
  /** Slug của tool, vd "xem-ngay". */
  toolSlug: string;
  /** Tên hiển thị của tool, vd "Xem ngày". */
  toolName: string;
}) {
  const key = toolIllustrationKey(toolSlug);
  const [url, setUrl] = useState('');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle()
      .then(({ data }) => {
        if (data && typeof data.value === 'string') setUrl(data.value);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  async function save(nextUrl: string) {
    if (!supabase) {
      setMessage('Chưa cấu hình Supabase nên chưa lưu được.');
      return;
    }
    setSaving(true);
    setMessage('');
    const { error } = await supabase
      .from('site_settings')
      .upsert({ key, value: nextUrl }, { onConflict: 'key' });
    setSaving(false);
    if (error) {
      setMessage('Không lưu được (chỉ tài khoản admin được ghi cài đặt): ' + error.message);
    } else {
      setUrl(nextUrl);
      setMessage(nextUrl ? 'Đã lưu ảnh minh họa.' : 'Đã gỡ ảnh minh họa.');
    }
  }

  return (
    <div className="card space-y-3">
      <p className="font-display text-lg font-bold text-primary">
        Ảnh minh họa — {toolName}
      </p>
      <p className="text-xs text-ink/60">
        Lưu vào site_settings với key <code>{key}</code>.
      </p>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" className="h-40 w-full rounded object-cover" />
      ) : (
        <p className="text-sm text-ink/70">Chưa chọn ảnh minh họa cho tool này.</p>
      )}
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-gold" onClick={() => setPickerOpen(true)}>
          Chọn từ Thư viện
        </button>
        {url ? (
          <button type="button" className="btn-gold" disabled={saving} onClick={() => save('')}>
            {saving ? 'Đang lưu…' : 'Gỡ ảnh'}
          </button>
        ) : null}
      </div>
      <div>
        <label className="label" htmlFor={`tool-illustration-${key}`}>
          Hoặc dán link ảnh
        </label>
        <div className="flex gap-2">
          <input
            id={`tool-illustration-${key}`}
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
          />
          <button type="button" className="btn-primary" disabled={saving} onClick={() => save(url.trim())}>
            {saving ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </div>
      {message ? <p className="text-sm text-primary">{message}</p> : null}
      {pickerOpen ? (
        <MediaPicker
          title={`Chọn ảnh minh họa cho ${toolName}`}
          onSelect={(selected) => {
            setPickerOpen(false);
            void save(selected);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
