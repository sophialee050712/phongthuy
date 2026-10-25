import type { MetadataRoute } from 'next';
import { SAMPLE_POSTS, TUOI_12, VIEC_LIST } from '@/lib/data';
import { absoluteUrl, slugify } from '@/lib/seo';
import { supabase } from '@/lib/supabase';

// PHỦ SITEMAP cho route tự sinh (mở rộng 2026-10-25, nhóm Tăng trưởng):
// - /tuoi: 12 tuổi × 6 năm (2025–2030) × toàn bộ 8 việc trong VIEC_LIST
//   = 576 URL. Route /tuoi vốn đã chấp nhận năm 1900–2100 và mọi việc
//   trong VIEC_LIST nên các URL này đều là route thật, có metadata riêng
//   qua buildMetadata (title/description/canonical theo tuổi+năm+việc).
// - /ngay: 90 ngày tới tính từ hôm nay (UTC), thay cho 30 ngày trước đây.
// - Trang tĩnh: route công khai chính + route tool mới (xem STATIC_ROUTES).
//   KHÔNG đưa vào: /chia-se (nội dung phụ thuộc query ?t/?d, không có
//   nội dung cố định), /ho-so, /van-han-ca-nhan, /nhat-ky và /thu-thach
//   (trang cá nhân hoá theo dữ liệu lưu ở trình duyệt, không có nội dung
//   chung để index), /admin và /api (khu vực quản trị/nội bộ — robots
//   cũng chặn).
// Lưu ý chất lượng: phủ rộng hơn đồng nghĩa nhiều URL template hơn — cần
// theo dõi độ bao phủ index trên Search Console, nếu Google đánh giá thấp
// thì thu hẹp lại cụm năm/việc thay vì mở thêm.
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
  { path: '/viec', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/than-so-hoc', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/boi-cap', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/gio', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/gieo-que', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/hoi-ngay', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/so-sanh', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/la-ban', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/the-so-menh', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/lo-trinh-nam', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/bao-cao', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/ngay-trong-dai', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/luan-giai', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/thuoc-lo-ban', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/bo-tri-3d', changeFrequency: 'monthly', priority: 0.7 },
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
  const entries: MetadataRoute.Sitemap = [];

  for (const route of STATIC_ROUTES) {
    entries.push({
      url: absoluteUrl(route.path === '/' ? '/' : route.path),
      lastModified: now,
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    });
  }

  // Trang /viec/<slug> cho 8 việc trong VIEC_LIST.
  for (const viec of VIEC_LIST) {
    entries.push({
      url: absoluteUrl(`/viec/${slugify(viec)}`),
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.6,
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

  // Cụm /tuoi mở rộng: 12 tuổi × năm 2025–2030 × toàn bộ VIEC_LIST.
  // Tuổi dùng tên đầy đủ đã encode (Tý/Tỵ slug trùng nhau nên không dùng slug).
  const TUOI_YEARS = [2025, 2026, 2027, 2028, 2029, 2030];
  for (const tuoi of TUOI_12) {
    for (const year of TUOI_YEARS) {
      for (const viec of VIEC_LIST) {
        entries.push({
          url: absoluteUrl(`/tuoi/${encodeURIComponent(tuoi)}/${year}/${slugify(viec)}`),
          lastModified: now,
          changeFrequency: 'monthly',
          priority: 0.6,
        });
      }
    }
  }

  // Cụm /ngay mở rộng: 90 ngày tới tính từ hôm nay (UTC).
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = 0; i < 90; i++) {
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
