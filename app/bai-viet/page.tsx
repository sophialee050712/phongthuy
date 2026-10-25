import type { Metadata } from 'next';
import Link from 'next/link';
import { getPosts } from '@/components/site/posts';

export function generateMetadata(): Metadata {
  return {
    title: 'Kho bài viết cẩm nang phong thủy | Khang An Phong Thủy',
    description:
      'Các bài viết chuẩn SEO về ngày tốt, phong thủy nhà ở, ngũ hành và kiến thức tra cứu — giải thích dễ hiểu, có câu trả lời trực tiếp.',
  };
}

export default async function BaiVietPage({
  searchParams,
}: {
  searchParams?: { cat?: string };
}) {
  const posts = await getPosts();
  const categories = [...new Set(posts.map((p) => p.category))];
  const cat = searchParams?.cat;
  const filtered = cat ? posts.filter((p) => p.category === cat) : posts;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Kho bài viết cẩm nang</h1>
      <p className="text-ink/80">
        Bài viết học thuật ngắn gọn, có câu trả lời trực tiếp ngay đầu bài để tra cứu nhanh.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link href="/bai-viet" className={!cat ? 'btn-primary' : 'btn-gold'}>
          Tất cả
        </Link>
        {categories.map((c) => (
          <Link
            key={c}
            href={`/bai-viet?cat=${encodeURIComponent(c)}`}
            className={cat === c ? 'btn-primary' : 'btn-gold'}
          >
            {c}
          </Link>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="card">Chưa có bài viết trong chuyên mục này.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link key={p.slug} href={`/bai-viet/${p.slug}`} className="card block hover:border-gold hover:shadow-md">
              <p className="chip">{p.category}</p>
              {p.demo ? <span className="chip ml-2">Bài mẫu demo</span> : null}
              <h2 className="mt-2 font-display text-lg font-bold text-primary">{p.title}</h2>
              <p className="mt-1 text-sm text-ink/80">{p.excerpt}</p>
              {p.author ? <p className="mt-2 text-xs text-ink/60">Tác giả: {p.author}</p> : null}
              {p.published_at ? <p className="mt-1 text-xs text-ink/60">{p.published_at}</p> : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
