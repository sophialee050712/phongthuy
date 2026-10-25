'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import PostForm from '@/components/admin/PostForm';
import type { PostRow } from '@/components/admin/helpers';

export default function AdminEditPostPage({ params }: { params: { id: string } }) {
  const [post, setPost] = useState<PostRow | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase
      .from('posts')
      .select('*')
      .eq('id', params.id)
      .single()
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) setError('Không tải được bài viết: ' + err.message);
        else setPost(data as PostRow);
      });
  }, [params.id]);

  return (
    <AdminShell title="Sửa bài viết">
      {loading ? <p>Đang tải…</p> : null}
      {error ? <p className="text-sm text-primary">{error}</p> : null}
      {!loading && !error && post ? <PostForm initial={post} /> : null}
      {!loading && !error && !post && supabase ? (
        <p className="card text-sm">Không tìm thấy bài viết này.</p>
      ) : null}
    </AdminShell>
  );
}
