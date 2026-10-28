'use client';

import { useState } from 'react';

const NAV_CORE = [
  { href: '/', label: 'Trang chủ' },
  { href: '/xem-ngay', label: 'Xem ngày tốt' },
  { href: '/tra-menh', label: 'Tra mệnh' },
  { href: '/huong-nha', label: 'Hướng nhà' },
  { href: '/dat-ten', label: 'Đặt tên con' },
  { href: '/luan-so', label: 'Luận số' },
  { href: '/van-han', label: 'Vận hạn' },
  { href: '/bai-viet', label: 'Bài viết' },
];

const NAV_MORE = [
  { href: '/than-so-hoc', label: 'Thần số học' },
  { href: '/gieo-que', label: 'Gieo quẻ' },
  { href: '/the-so-menh', label: 'Thẻ số mệnh' },
  { href: '/lo-trinh-nam', label: 'Lộ trình' },
  { href: '/luan-giai', label: 'Luận giải' },
  { href: '/thuoc-lo-ban', label: 'Thước Lỗ Ban' },
  { href: '/bo-tri-3d', label: 'Bố trí 3D' },
];

// Header dùng chung: desktop hiện nhóm chính + menu "Thêm" gom các công cụ ít
// dùng hơn (trước đây 17 link tràn 2 dòng); mobile (dưới md) chỉ hiện nút
// hamburger, bấm để mở/đóng panel link xếp dọc. Không có link "Quản trị" ở
// menu công khai — admin vào thẳng /admin.
export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gold/40 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <a href="/" className="font-display text-xl font-bold text-primary">
          Khang An{' '}<span className="text-gold">Phong Thủy</span>
        </a>
        <nav className="ml-auto hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm md:flex">
          {NAV_CORE.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-primary">
              {item.label}
            </a>
          ))}
          <details className="relative">
            <summary className="cursor-pointer list-none hover:text-primary">Thêm ▾</summary>
            <div className="absolute right-0 top-full z-50 mt-2 flex w-48 flex-col rounded-lg border border-gold/40 bg-white p-2 shadow-md">
              {NAV_MORE.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  className="rounded px-2 py-2 hover:bg-creamDark hover:text-primary"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </details>
        </nav>
        <button
          type="button"
          className="btn-gold ml-auto px-3 py-2 text-sm md:hidden"
          aria-expanded={open}
          aria-label={open ? 'Đóng menu' : 'Mở menu'}
          onClick={() => setOpen(!open)}
        >
          {open ? '✕ Đóng' : '☰ Menu'}
        </button>
        {open ? (
          <nav className="flex w-full flex-col gap-1 border-t border-gold/30 pt-3 text-sm md:hidden">
            {[...NAV_CORE, ...NAV_MORE].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-2 py-2 hover:bg-creamDark hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
