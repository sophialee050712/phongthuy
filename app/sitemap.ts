import type { MetadataRoute } from 'next';
import { SAMPLE_POSTS, TUOI_12, VIEC_LIST } from '@/lib/data';
import { absoluteUrl, slugify } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

// CỔNG CHẤT LƯỢNG cho route tự sinh — cố tình GIỚI HẠN, không liệt kê hàng nghìn URL:
// - Chỉ 12 tuổi × năm hiện tại × 3 việc đầu trong VIEC_LIST (36 URL /tuoi).
// - Chỉ 30 ngày tới cho /ngay (30 URL).
// Lý do: route tự sinh chỉ nên mở rộng dần theo cụm (năm sau, việc tiếp theo)
// sau khi nội dung từng cụm đã được kiểm tra chất lượng; liệt kê ồ ạt URL
// template mỏng sẽ làm loãng chất lượng index và khó kiểm soát.
// Khi chưa có NEXT_PUBLIC_SITE_URL, các URL ở đây là đường dẫn tương đối —
// đặt biến môi trường thật trước khi public thì sitemap mới hợp lệ tuyệt đối.

const STATIC_ROUTES: { path: string; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']; priority: number }[] = [
  { path: '/', changeFrequency: 'weekly', priority: 1 },
  { path: '/xem-ngay', changeFrequency: 'weekly', priority: 0.9 },
  { path: '/tra-menh', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/huong-nha', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/dat-ten', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/luan-so', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/van-han', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/bang-gia', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/bai-viet', changeFrequency: 'weekly', priority: 0.8 },
];

/**
 * Slug bài viết: lấy từ Supabase khi đã cấu hình (chỉ chọn cột `slug` để không
 * phụ thuộc vào các cột khác của bảng posts khi schema chưa chốt), nếu không
 * dùng SAMPLE_POSTS. Mọi lỗi truy vấn đều rơi về dữ liệu mẫu, không làm vỡ sitemap.
 */
async function getPostSlugs(): Promise<string[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.from('posts').select('slug').limit(1000);
      if (!error && Array.isArray(data)) {
        const slugs = [...new Set(
          data
            .map((row) => (row as { slug?: unknown }).slug)
            .filter((slug): slug is string => typeof slug === 'string' && slug.length > 0),
        )];
        if (slugs.length > 0) return slugs;
      }
    } catch {
      // Rơi về dữ liệu mẫu bên dưới.
    }
  }
  return SAMPLE_POSTS.map((post) => post.slug);
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    entries.push({
      url: absoluteUrl(route.path === '/' ? '/' : route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  const postSlugs = await getPostSlugs();
  for (const slug of postSlugs) {
    entries.push({
      url: absoluteUrl(`/bai-viet/${slug}`),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    });
  }

  // Cụm /tuoi giới hạn: 12 tuổi × năm hiện tại × 3 việc đầu.
  // Tuổi dùng tên đầy đủ đã encode (Tý/Tỵ slug trùng nhau nên không dùng slug).
  for (const tuoi of TUOI_12) {
    for (const viec of VIEC_LIST.slice(0, 3)) {
      entries.push({
        url: absoluteUrl(`/tuoi/${encodeURIComponent(tuoi)}/${currentYear}/${slugify(viec)}`),
        lastModified: now,
        changeFrequency: 'monthly',
        priority: 0.6,
      });
    }
  }

  // Cụm /ngay giới hạn: 30 ngày tới tính từ hôm nay (UTC).
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = 0; i < 30; i++) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + i);
    const iso = day.toISOString().slice(0, 10);
    entries.push({
      url: absoluteUrl(`/ngay/${iso}`),
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.6,
    });
  }

  return entries;
}
