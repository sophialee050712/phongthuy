import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/seo';

// Cho phép index toàn bộ. Sitemap chỉ khai báo khi có NEXT_PUBLIC_SITE_URL thật —
// khi chưa cấu hình thì không trỏ tới domain giả, đặt biến môi trường trước khi public.
export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
