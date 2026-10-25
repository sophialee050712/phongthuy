'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AdminSidebar from './AdminSidebar';

// TODO (production): bổ sung middleware kiểm tra role phía server — hiện tại
// chỉ kiểm tra session phía client, kẻ biết URL vẫn thấy khung trang trước khi
// bị chuyển hướng, và mọi quyền ghi thật sự dựa vào RLS policies trong
// supabase/schema.sql (lớp bảo vệ quyết định).
export default function AdminShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [state, setState] = useState<'loading' | 'ok' | 'no-supabase'>('loading');

  useEffect(() => {
    if (!supabase) {
      setState('no-supabase');
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace('/admin/dang-nhap');
      } else {
        setState('ok');
      }
    });
  }, [router]);

  if (state === 'no-supabase') {
    return (
      <div className="card">
        <h1 className="font-display text-2xl font-bold text-primary">{title}</h1>
        <p className="mt-3">
          Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md để thêm
          NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY, rồi chạy
          supabase/schema.sql và tạo bucket <code>media</code>.
        </p>
        <p className="mt-2 text-sm">
          Trang quản trị không hoạt động được khi chưa có Supabase, nhưng trang công
          khai vẫn chạy bằng dữ liệu mẫu.
        </p>
      </div>
    );
  }

  if (state !== 'ok') {
    return <p>Đang kiểm tra đăng nhập…</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <AdminSidebar />
      <div>
        <h1 className="mb-4 font-display text-2xl font-bold text-primary">{title}</h1>
        {children}
      </div>
    </div>
  );
}
