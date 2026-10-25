import type { Metadata } from 'next';
import './globals.css';
import SiteHeader from '@/components/site/SiteHeader';

export const metadata: Metadata = {
  title: {
    default: 'Khang An Phong Thủy — Tra cứu chuẩn lịch vạn niên',
    template: '%s | Khang An Phong Thủy',
  },
  description:
    'Xem ngày tốt xấu, tra bản mệnh, hướng nhà bát trạch, đặt tên con, luận số và vận hạn — tính toán đối chiếu lịch vạn niên, giải thích dễ hiểu.',
};

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
        <SiteHeader />
        <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6">{children}</main>
        <footer className="border-t border-gold/40 bg-primaryDark px-4 py-8 text-sm text-cream">
          <div className="mx-auto max-w-6xl">
            <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
            <p className="mt-2 opacity-90">
              Nội dung tra cứu mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống,
              không thay thế tư vấn chuyên môn cho quyết định quan trọng.
            </p>
            <p className="mt-2 opacity-90">
              Muốn giữ lại kết quả tra cứu dưới dạng bản in đẹp? Xem{' '}
              <a href="/bang-gia" className="underline">
                bảng giá sản phẩm in
              </a>
              : Thẻ số mệnh, Lộ trình 12 tháng âm lịch, Báo cáo PDF.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
