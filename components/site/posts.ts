// Đọc bài viết: ưu tiên bảng posts trên Supabase khi đã cấu hình,
// nếu không (hoặc truy vấn lỗi) dùng SAMPLE_POSTS trong @/lib/data.
import { SAMPLE_POSTS, type Post } from '@/lib/data';
import { supabase, hasSupabase } from '@/lib/supabase';

function normalizeRow(row: Record<string, unknown>): Post | null {
  const slug = typeof row.slug === 'string' ? row.slug : '';
  const title = typeof row.title === 'string' ? row.title : '';
  if (!slug || !title) return null;
  const faqRaw = row.faq;
  const faq = Array.isArray(faqRaw)
    ? faqRaw
        .filter((f): f is Record<string, unknown> => !!f && typeof f === 'object')
        .map((f) => ({ q: String(f.q ?? ''), a: String(f.a ?? '') }))
        .filter((f) => f.q && f.a)
    : undefined;
  return {
    slug,
    title,
    excerpt: typeof row.excerpt === 'string' ? row.excerpt : '',
    content: typeof row.content === 'string' ? row.content : '',
    category: typeof row.category === 'string' ? row.category : 'Kiến thức',
    cover_image: typeof row.cover_image === 'string' ? row.cover_image : undefined,
    seo_title: typeof row.seo_title === 'string' ? row.seo_title : undefined,
    seo_description: typeof row.seo_description === 'string' ? row.seo_description : undefined,
    aeo_answer: typeof row.aeo_answer === 'string' ? row.aeo_answer : undefined,
    faq,
    published_at: typeof row.published_at === 'string' ? row.published_at : undefined,
  };
}

export async function getPosts(): Promise<Post[]> {
  if (hasSupabase && supabase) {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .in('status', ['published', 'scheduled'])
        .order('published_at', { ascending: false });
      if (!error && Array.isArray(data)) {
        const now = Date.now();
        const posts = data
          .filter((r): r is Record<string, unknown> => !!r && typeof r === 'object')
          // Trang công khai chỉ hiển thị bài đã xuất bản, hoặc bài hẹn giờ đã tới giờ
          // (bài hẹn giờ tự hiện khi quá published_at, không cần cron riêng).
          .filter((r) => {
            if (r.status === 'published') return true;
            if (r.status !== 'scheduled') return false;
            const t =
              typeof r.published_at === 'string' ? new Date(r.published_at).getTime() : NaN;
            return !Number.isNaN(t) && t <= now;
          })
          .map(normalizeRow)
          .filter((p): p is Post => p !== null);
        if (posts.length > 0) return posts;
      }
    } catch {
      // Rơi về dữ liệu mẫu bên dưới.
    }
  }
  return SAMPLE_POSTS;
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}
