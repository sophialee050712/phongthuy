'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';

// Tổng quan: số bài đã xuất bản / bản nháp / lead mới.
// Khi chưa cấu hình Supabase: hiển thị 0 kèm chú thích chưa cấu hình.
export default function AdminDashboardPage() {
  const [counts, setCounts] = useState({ published: 0, draft: 0, scheduled: 0, leadsNew: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const [pub, draft, sched, leads] = await Promise.all([
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'scheduled'),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'new'),
      ]);
      const err = pub.error ?? draft.error ?? sched.error ?? leads.error;
      if (err) setError('Không tải được số liệu: ' + err.message);
      setCounts({
        published: pub.count ?? 0,
        draft: draft.count ?? 0,
        scheduled: sched.count ?? 0,
        leadsNew: leads.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: 'Bài đã xuất bản', value: counts.published, href: '/admin/bai-viet' },
    { label: 'Bản nháp', value: counts.draft, href: '/admin/bai-viet' },
    { label: 'Bài hẹn giờ', value: counts.scheduled, href: '/admin/bai-viet' },
    { label: 'Lead mới (chưa liên hệ)', value: counts.leadsNew, href: '/admin/leads' },
  ];

  return (
    <AdminShell title="Tổng quan">
      {!supabase ? (
        <p className="card mb-4 text-sm">
          Chưa cấu hình Supabase nên số liệu đang hiển thị 0 — xem HUONG-DAN-DEPLOY.md để
          cấu hình rồi số liệu thật sẽ hiện ở đây.
        </p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <a key={c.label} href={c.href} className="card hover:ring-2 hover:ring-gold/50">
            <p className="font-display text-4xl font-bold text-primary">{c.value}</p>
            <p className="mt-1 font-semibold">{c.label}</p>
          </a>
        ))}
      </div>
      <div className="card mt-4 space-y-2">
        <p className="font-display text-lg font-bold text-primary">Việc cần làm nhanh</p>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          <li>
            <a className="underline" href="/admin/bai-viet/moi">Viết bài mới</a> — slug tự sinh
            từ tiêu đề, có xem trước và khối SEO/AEO.
          </li>
          <li>
            <a className="underline" href="/admin/leads">Xem lead mới</a> và đánh dấu đã liên hệ
            sau khi gọi khách.
          </li>
          <li>
            <a className="underline" href="/admin/cai-dat">Cài đặt</a> — điền tên site, slogan,
            link Zalo OA và link affiliate ([CHỜ ĐIỀN] nếu chưa có).
          </li>
        </ul>
      </div>
    </AdminShell>
  );
}
