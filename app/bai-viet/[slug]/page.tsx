import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug } from '@/components/site/posts';
import { absoluteUrl, siteUrl } from '@/lib/seo';

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const post = await getPostBySlug(params.slug);
  if (!post) return { title: 'Không tìm thấy bài viết' };
  return {
    title: post.seo_title || `${post.title} | Khang An Phong Thủy`,
    description: post.seo_description || post.excerpt,
    openGraph: {
      title: post.seo_title || post.title,
      description: post.seo_description || post.excerpt,
      type: 'article',
      ...(post.cover_image ? { images: [post.cover_image] } : {}),
    },
  };
}

export default async function BaiVietDetailPage({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug);
  if (!post) notFound();

  const paragraphs = post.content.split(/\n\s*\n/).filter(Boolean);
  // JSON-LD Article (kiểm tra 2026-10-25, nhóm Tăng trưởng): TRƯỚC đây trang
  // chỉ có FAQPage, thiếu Article nên công cụ tìm kiếm không nhận diện được
  // bài viết (tiêu đề/tác giả/ngày đăng/ảnh). Article dùng cùng dữ liệu đã có
  // trên trang, không bịa tác giả thật: author lấy tên hiển thị của bài, nếu
  // bài không có tên tác giả thì dùng tên site (bút danh/bài mẫu vẫn hiển thị
  // đúng như trên trang). URL tuyệt đối chỉ gắn khi đã cấu hình
  // NEXT_PUBLIC_SITE_URL (tránh URL tương đối trong schema).
  const base = siteUrl();
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.seo_description || post.excerpt || undefined,
    ...(base ? { url: absoluteUrl(`/bai-viet/${post.slug}`) } : {}),
    ...(post.cover_image ? { image: post.cover_image } : {}),
    ...(post.published_at ? { datePublished: post.published_at } : {}),
    author: {
      '@type': 'Person',
      name: post.author || 'Khang An Phong Thủy',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Khang An Phong Thủy',
      ...(base ? { url: base } : {}),
    },
  };
  const faqSchema =
    post.faq && post.faq.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: post.faq.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }
      : null;

  return (
    <article className="space-y-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      ) : null}
      <p>
        <Link href="/bai-viet" className="text-sm font-semibold text-primary underline">
          ← Về kho bài viết
        </Link>
      </p>
      <p className="chip">{post.category}</p>
      {post.demo ? <span className="chip ml-2">Bài mẫu demo</span> : null}
      <h1 className="font-display text-3xl font-bold text-primary">{post.title}</h1>
      {post.author ? <p className="text-sm text-ink/60">Tác giả: {post.author}</p> : null}
      {post.published_at ? <p className="text-sm text-ink/60">Đăng ngày {post.published_at}</p> : null}
      {post.aeo_answer ? (
        <div className="rounded border border-gold/50 bg-creamDark px-4 py-3">
          <p className="font-semibold text-primary">Câu trả lời trực tiếp:</p>
          <p className="mt-1">{post.aeo_answer}</p>
        </div>
      ) : null}
      <div className="space-y-4 text-ink/90">
        {paragraphs.map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      {post.faq && post.faq.length > 0 ? (
        <section className="space-y-3">
          <h2 className="font-display text-2xl font-bold text-primary">Câu hỏi thường gặp</h2>
          {post.faq.map((f) => (
            <div key={f.q} className="card">
              <p className="font-semibold">{f.q}</p>
              <p className="mt-1 text-sm text-ink/80">{f.a}</p>
            </div>
          ))}
        </section>
      ) : null}
    </article>
  );
}
