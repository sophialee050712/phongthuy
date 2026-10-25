import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Khang An Phong Thủy — Tra cứu chuẩn lịch vạn niên',
    template: '%s | Khang An Phong Thủy',
  },
  description:
    'Xem ngày tốt xấu, tra bản mệnh, hướng nhà bát trạch, đặt tên con, luận số và vận hạn — tính toán đối chiếu lịch vạn niên, giải thích dễ hiểu.',
};

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
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
          rel="stylesheet"
        />
        {siteUrl ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                '@context': 'https://schema.org',
                '@type': 'Organization',
                name: 'Khang An Phong Thủy',
                url: siteUrl,
              }),
            }}
          />
        ) : null}
      </head>
      <body className="bg-cream font-sans text-ink">
        <header className="border-b border-gold/40 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
            <a href="/" className="font-display text-xl font-bold text-primary">
              Khang An <span className="text-gold">Phong Thủy</span>
            </a>
            <nav className="ml-auto flex flex-wrap gap-x-4 gap-y-1 text-sm">
              {NAV.map((item) => (
                <a key={item.href} href={item.href} className="hover:text-primary">
                  {item.label}
                </a>
              ))}
              <a href="/admin" className="text-primary underline">
                Quản trị
              </a>
            </nav>
          </div>
        </header>
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-gold/40 bg-primaryDark px-4 py-8 text-sm text-cream">
          <div className="mx-auto max-w-6xl">
            <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
            <p className="mt-2 opacity-90">
              Nội dung tra cứu mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống,
              không thay thế tư vấn chuyên môn cho quyết định quan trọng.
            </p>
            <p className="mt-2 opacity-90">
              Hotline: [CHỜ ĐIỀN] — Zalo OA: [CHỜ ĐIỀN]
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
