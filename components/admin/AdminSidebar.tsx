'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Sidebar kiểu WordPress, dùng chung cho mọi trang /admin.
const NAV = [
  { href: '/admin', label: 'Tổng quan' },
  { href: '/admin/bai-viet', label: 'Bài viết' },
  { href: '/admin/thu-vien', label: 'Thư viện' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/cai-dat', label: 'Cài đặt' },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    if (supabase) await supabase.auth.signOut();
    router.push('/admin/dang-nhap');
  }

  return (
    <aside className="card flex flex-col gap-1 !bg-primaryDark !text-cream">
      <p className="px-2 pb-2 font-display text-lg font-bold">
        Khang An <span className="text-brass">Phong Thủy</span>
      </p>
      <p className="px-2 pb-3 text-xs uppercase tracking-wide opacity-70">Quản trị</p>
      {NAV.map((item) => {
        const active =
          item.href === '/admin' ? pathname === '/admin' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-2 text-sm font-semibold hover:bg-white/10 ${
              active ? 'bg-gold text-ink' : ''
            }`}
          >
            {item.label}
          </Link>
        );
      })}
      <a href="/" className="mt-2 rounded px-3 py-2 text-sm hover:bg-white/10">
        ↗ Xem trang công khai
      </a>
      <button
        type="button"
        onClick={logout}
        className="mt-4 rounded border border-cream/30 px-3 py-2 text-left text-sm hover:bg-white/10"
      >
        Đăng xuất
      </button>
    </aside>
  );
}
