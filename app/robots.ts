import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Kiểm tra 2026-10-25 (nhóm Tăng trưởng):
// - TRƯỚC: chỉ có `allow: '/'` cho mọi bot, KHÔNG chặn khu vực quản trị —
//   bot có thể crawl /admin (trang đăng nhập/quản trị) dù không có ích cho SEO.
// - SAU: cho phép crawl toàn bộ trang công khai, chặn /admin và /api
//   (khu vực quản trị + API nội bộ không có nội dung để index).
// Sitemap chỉ khai báo khi có NEXT_PUBLIC_SITE_URL thật — khi chưa cấu hình
// thì không trỏ tới domain giả, đặt biến môi trường trước khi public.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
