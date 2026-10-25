'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { SITE } from '@/lib/data';
import AdminShell from '@/components/admin/AdminShell';

// Cài đặt site lưu vào bảng site_settings (key/value).
// Khi chưa có Supabase: đọc fallback từ SITE trong @/lib/data.ts và chỉ hiển
// thị (không lưu được) — kèm chú thích rõ ràng.
const FIELDS = [
  { key: 'site_name', label: 'Tên site', fallback: SITE.name },
  { key: 'slogan', label: 'Slogan', fallback: SITE.slogan },
  { key: 'zalo_oa', label: 'Link Zalo OA', fallback: SITE.zaloOa },
  { key: 'affiliate_link', label: 'Link affiliate', fallback: '[CHỜ ĐIỀN]' },
] as const;

export default function AdminSettingsPage() {
  const [values, setValues] = useState<Record<string, string>>(
    Object.fromEntries(FIELDS.map((f) => [f.key, f.fallback])),
  );
  const [fromDb, setFromDb] = useState(false);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('site_settings')
      .select('key, value')
      .then(({ data, error }) => {
        if (error) {
          setMessage('Không đọc được cài đặt từ database (dùng giá trị mặc định): ' + error.message);
          return;
        }
        if (data && data.length > 0) {
          setFromDb(true);
          setValues((prev) => {
            const next = { ...prev };
            for (const row of data as { key: string; value: string }[]) next[row.key] = row.value;
            return next;
          });
        }
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      setMessage('Chưa cấu hình Supabase nên chưa lưu được — xem HUONG-DAN-DEPLOY.md.');
      return;
    }
    setSaving(true);
    setMessage('');
    const rows = FIELDS.map((f) => ({ key: f.key, value: values[f.key] ?? '' }));
    const { error } = await supabase.from('site_settings').upsert(rows, { onConflict: 'key' });
    setSaving(false);
    setMessage(
      error ? 'Không lưu được: ' + error.message : 'Đã lưu cài đặt.',
    );
    if (!error) setFromDb(true);
  }

  return (
    <AdminShell title="Cài đặt">
      {!supabase ? (
        <p className="card mb-4 text-sm">
          Chưa cấu hình Supabase — đang hiển thị giá trị mặc định từ dữ liệu mẫu
          (lib/data.ts). Cấu hình Supabase xong mới lưu được thay đổi.
        </p>
      ) : !fromDb ? (
        <p className="card mb-4 text-sm">
          Chưa có cài đặt trong database — đang hiển thị giá trị mặc định. Bấm Lưu để ghi
          vào bảng site_settings.
        </p>
      ) : null}
      <form onSubmit={save} className="card space-y-3">
        {FIELDS.map((f) => (
          <div key={f.key}>
            <label className="label" htmlFor={`setting-${f.key}`}>{f.label}</label>
            <input
              id={`setting-${f.key}`}
              className="input"
              value={values[f.key] ?? ''}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder="[CHỜ ĐIỀN]"
            />
          </div>
        ))}
        <button type="submit" className="btn-primary" disabled={saving || !supabase}>
          {saving ? 'Đang lưu…' : 'Lưu cài đặt'}
        </button>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </form>
    </AdminShell>
  );
}
