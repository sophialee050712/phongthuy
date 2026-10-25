'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { formatDate, STATUS_LABEL, type PostRow, type PostStatus } from '@/components/admin/helpers';

const SAVED_MESSAGE: Record<string, string> = {
  draft: 'Đã lưu nháp thành công.',
  published: 'Đã xuất bản thành công.',
  scheduled: 'Đã hẹn giờ đăng thành công.',
};

function AdminPostsList() {
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [filter, setFilter] = useState<'all' | PostStatus>('all');
  const [error, setError] = useState('');
  const searchParams = useSearchParams();
  const saved = searchParams.get('saved');
  const savedMessage = saved ? SAVED_MESSAGE[saved] : undefined;

  // Tải lại mỗi khi tham số ?saved= đổi (sau khi lưu bài từ form) để danh
  // sách không bị giữ bản cũ trong cache router của Next.
  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError('Không tải được danh sách bài: ' + err.message);
        else setPosts((data ?? []) as PostRow[]);
      });
  }, [saved]);

  const shown = filter === 'all' ? posts : posts.filter((p) => p.status === filter);

  return (
    <>
      {savedMessage ? (
        <p className="card mb-4 !bg-creamDark text-sm font-semibold text-primary">
          {savedMessage}
        </p>
      ) : null}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <a href="/admin/bai-viet/moi" className="btn-primary">
          + Viết bài mới
        </a>
        {(['all', 'draft', 'published', 'scheduled'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'btn-primary' : 'btn-gold'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Tất cả' : STATUS_LABEL[f]}
          </button>
        ))}
      </div>
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      {shown.length === 0 ? (
        <p className="card text-sm">
          {supabase
            ? 'Chưa có bài viết nào ở mục này. Lưu ý: khi database chưa có bài xuất bản thật, trang công khai sẽ hiển thị 3 bài mẫu demo — xuất bản bài thật để thay thế.'
            : 'Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md.'}
        </p>
      ) : null}
      <div className="space-y-3">
        {shown.map((p) => (
          <a key={p.id} href={`/admin/bai-viet/${p.id}`} className="card block hover:ring-2 hover:ring-gold/50">
            <p className="font-semibold">{p.title}</p>
            <p className="mt-1 text-sm text-ink/70">
              <span className="chip">{STATUS_LABEL[p.status]}</span>{' '}
              <span className="chip">{p.category}</span> · /{p.slug} ·{' '}
              {p.status === 'scheduled' ? `hẹn ${formatDate(p.published_at)}` : formatDate(p.published_at ?? p.created_at)}
            </p>
          </a>
        ))}
      </div>
    </>
  );
}

export default function AdminPostsPage() {
  return (
    <AdminShell title="Bài viết">
      <Suspense fallback={<p>Đang tải…</p>}>
        <AdminPostsList />
      </Suspense>
    </AdminShell>
  );
}
