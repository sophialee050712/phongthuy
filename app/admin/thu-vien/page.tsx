'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { compressImageFile, seoFriendlyFileName } from '@/components/admin/compressImage';
import { type MediaRow } from '@/components/admin/helpers';

// Thư viện ảnh: upload lên Supabase Storage bucket 'media' (bucket tạo bằng tay
// theo HUONG-DAN-DEPLOY.md — code chỉ giả định bucket đã tồn tại).
// TRƯỚC KHI UPLOAD, ảnh được nén phía client bằng canvas: tối đa 1600px,
// JPEG chất lượng 0.82. Thông tin ảnh (đường dẫn, link, alt) lưu ở bảng media.
export default function AdminMediaPage() {
  const [items, setItems] = useState<MediaRow[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [alt, setAlt] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [copiedId, setCopiedId] = useState('');

  async function load() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) setMessage('Không tải được thư viện: ' + error.message);
    else setItems((data ?? []) as MediaRow[]);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase || !file) return;
    setUploading(true);
    setMessage('');
    try {
      const blob = await compressImageFile(file);
      // Tên file thân thiện SEO (bỏ dấu, slug hoá) qua helper dùng chung.
      const path = `${Date.now()}-${seoFriendlyFileName(file.name)}`;
      const { error: upErr } = await supabase.storage.from('media').upload(path, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });
      if (upErr) throw new Error(upErr.message);
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
      const { data: userData } = await supabase.auth.getUser();
      const { error: rowErr } = await supabase.from('media').insert({
        path,
        url: pub.publicUrl,
        alt_text: alt.trim() || null,
        uploaded_by: userData.user?.id ?? null,
      });
      if (rowErr) throw new Error(rowErr.message);
      setFile(null);
      setAlt('');
      setMessage('Đã tải ảnh lên thành công (đã nén về tối đa 1600px, JPEG 0.82).');
      await load();
    } catch (err) {
      setMessage('Upload thất bại: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setUploading(false);
    }
  }

  async function saveAlt(item: MediaRow, altText: string) {
    if (!supabase) return;
    const { error } = await supabase
      .from('media')
      .update({ alt_text: altText.trim() || null })
      .eq('id', item.id);
    if (error) setMessage('Không lưu được alt text: ' + error.message);
    else {
      setMessage('Đã lưu alt text.');
      setItems(items.map((i) => (i.id === item.id ? { ...i, alt_text: altText } : i)));
    }
  }

  async function copyLink(item: MediaRow) {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(''), 2000);
    } catch {
      setMessage('Không copy được tự động — hãy copy tay link: ' + item.url);
    }
  }

  async function remove(item: MediaRow) {
    if (!supabase) return;
    if (!window.confirm('Xóa ảnh này khỏi thư viện?')) return;
    await supabase.storage.from('media').remove([item.path]);
    const { error } = await supabase.from('media').delete().eq('id', item.id);
    if (error) setMessage('Không xóa được: ' + error.message);
    else setItems(items.filter((i) => i.id !== item.id));
  }

  return (
    <AdminShell title="Thư viện ảnh">
      <div className="card mb-4 space-y-2 text-sm">
        <p className="font-display text-lg font-bold text-primary">Ảnh trong thư viện dùng ở đâu?</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Ảnh đại diện bài viết:</strong> chọn trong form bài viết
            (/admin/bai-viet) — đã có từ trước, giữ nguyên.
          </li>
          <li>
            <strong>Ảnh thẻ chia sẻ:</strong> chọn trong form bài viết, mục “Ảnh thẻ
            chia sẻ” (khi chưa có cột lưu riêng, ảnh đại diện vẫn là ảnh chia sẻ
            mặc định — xem ghi chú trong form).
          </li>
          <li>
            <strong>Ảnh minh họa trang tool:</strong> chọn qua component
            ToolIllustrationPicker, lưu URL vào bảng site_settings với key{' '}
            <code>tool_illustration_&lt;slug-tool&gt;</code> (vd{' '}
            <code>tool_illustration_xem-ngay</code>). Cách nối vào trang Cài đặt
            xem trong ghi chú của component đó.
          </li>
        </ul>
        <p className="text-ink/70">
          Đặt alt text mô tả đúng nội dung ảnh — alt text tốt cho SEO và cho người
          dùng trình đọc màn hình.
        </p>
      </div>
      <form onSubmit={upload} className="card mb-4 space-y-3">
        <p className="font-display text-lg font-bold text-primary">Tải ảnh lên</p>
        <p className="text-sm text-ink/70">
          Ảnh tự nén trước khi upload (tối đa 1600px, JPEG 0.82) vào bucket{' '}
          <code>media</code>. Bucket này tạo bằng tay theo HUONG-DAN-DEPLOY.md.
        </p>
        <div>
          <label className="label" htmlFor="media-file">Chọn ảnh</label>
          <input
            id="media-file"
            type="file"
            accept="image/*"
            className="input"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <div>
          <label className="label" htmlFor="media-alt">Alt text (mô tả ảnh, tốt cho SEO)</label>
          <input
            id="media-alt"
            className="input"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="VD: Mâm cúng khai trương cửa hàng"
          />
        </div>
        <button type="submit" className="btn-primary" disabled={uploading || !file || !supabase}>
          {uploading ? 'Đang nén và tải lên…' : 'Tải lên'}
        </button>
      </form>
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}
      {items.length === 0 ? (
        <p className="card text-sm">
          {supabase
            ? 'Thư viện trống — tải ảnh đầu tiên lên ở trên.'
            : 'Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md.'}
        </p>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <div key={item.id} className="card space-y-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.alt_text ?? ''} className="h-40 w-full rounded object-cover" />
            <input
              className="input text-sm"
              defaultValue={item.alt_text ?? ''}
              placeholder="Alt text"
              onBlur={(e) => {
                if (e.target.value !== (item.alt_text ?? '')) saveAlt(item, e.target.value);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-gold text-sm" onClick={() => copyLink(item)}>
                {copiedId === item.id ? 'Đã copy!' : 'Copy link ảnh'}
              </button>
              <button type="button" className="btn-gold text-sm" onClick={() => remove(item)}>
                Xóa
              </button>
            </div>
            <p className="break-all text-xs text-ink/60">{item.url}</p>
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
