'use client';

import { useState } from 'react';

const NAV = [
  { href: '/', label: 'Trang chủ' },
  { href: '/xem-ngay', label: 'Xem ngày tốt' },
  { href: '/tra-menh', label: 'Tra mệnh' },
  { href: '/huong-nha', label: 'Hướng nhà' },
  { href: '/dat-ten', label: 'Đặt tên con' },
  { href: '/luan-so', label: 'Luận số' },
  { href: '/van-han', label: 'Vận hạn' },
  { href: '/bang-gia', label: 'Bảng giá' },
  { href: '/bai-viet', label: 'Bài viết' },
  { href: '/than-so-hoc', label: 'Thần số học' },
  { href: '/gieo-que', label: 'Gieo quẻ' },
  { href: '/the-so-menh', label: 'Thẻ số mệnh' },
  { href: '/lo-trinh-nam', label: 'Lộ trình' },
  { href: '/luan-giai', label: 'Luận giải' },
];

// Header dùng chung: desktop giữ nguyên hàng link ngang; mobile (dưới md)
// chỉ hiện nút hamburger, bấm để mở/đóng panel link xếp dọc.
export default function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="border-b border-gold/40 bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <a href="/" className="font-display text-xl font-bold text-primary">
          Khang An <span className="text-gold">Phong Thủy</span>
        </a>
        <nav className="ml-auto hidden flex-wrap gap-x-4 gap-y-1 text-sm md:flex">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-primary">
              {item.label}
            </a>
          ))}
          <a href="/admin" className="text-primary underline">
            Quản trị
          </a>
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
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded px-2 py-2 hover:bg-creamDark hover:text-primary"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <a
              href="/admin"
              className="rounded px-2 py-2 text-primary underline"
              onClick={() => setOpen(false)}
            >
              Quản trị
            </a>
          </nav>
        ) : null}
      </div>
    </header>
  );
}
