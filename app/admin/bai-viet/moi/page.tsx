'use client';

import AdminShell from '@/components/admin/AdminShell';
import PostForm from '@/components/admin/PostForm';

export default function AdminNewPostPage() {
  return (
    <AdminShell title="Viết bài mới">
      <PostForm initial={null} />
    </AdminShell>
  );
}
