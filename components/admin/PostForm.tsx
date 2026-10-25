'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  CATEGORIES,
  isoToLocal,
  localToIso,
  renderMarkdown,
  slugify,
  type PostRow,
  type PostStatus,
} from './helpers';
import MediaPicker from './MediaPicker';

// Form bài viết dùng chung cho tạo mới và sửa.
// - Slug tự sinh từ tiêu đề (chỉ tự sinh khi người dùng chưa sửa slug tay).
// - Nội dung: textarea + xem trước trực tiếp, markdown tối thiểu.
// - Khối SEO + AEO (câu trả lời trực tiếp + FAQ lưu dạng JSONB).
// - Editor chỉ được lưu nháp: nút Xuất bản / Hẹn giờ bị khóa ở UI và bị
//   RLS policy chặn ở DB (xem supabase/schema.sql).
export default function PostForm({ initial }: { initial: PostRow | null }) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [slug, setSlug] = useState(initial?.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initial);
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
  const [content, setContent] = useState(initial?.content ?? '');
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [cover, setCover] = useState(initial?.cover_image ?? '');
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(initial?.seo_description ?? '');
  const [aeoAnswer, setAeoAnswer] = useState(initial?.aeo_answer ?? '');
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(initial?.faq ?? []);
  const [scheduleAt, setScheduleAt] = useState(isoToLocal(initial?.published_at ?? null));
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [role, setRole] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      setRole((profile as { role?: string } | null)?.role ?? '');
    });
  }, []);

  const isEditor = role === 'editor';

  function onTitleChange(v: string) {
    setTitle(v);
    if (!slugTouched) setSlug(slugify(v));
  }

  async function save(status: PostStatus) {
    if (!supabase) {
      setMessage('Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md.');
      return;
    }
    if (!title.trim() || !slug.trim()) {
      setMessage('Vui lòng nhập tiêu đề và slug.');
      return;
    }
    if (status === 'scheduled') {
      if (!scheduleAt || !localToIso(scheduleAt)) {
        setMessage('Hẹn giờ cần chọn ngày giờ đăng hợp lệ.');
        return;
      }
    }
    setSaving(true);
    setMessage('');
    const { data: userData } = await supabase.auth.getUser();
    const payload = {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim(),
      content,
      category,
      cover_image: cover.trim() || null,
      seo_title: seoTitle.trim() || null,
      seo_description: seoDesc.trim() || null,
      aeo_answer: aeoAnswer.trim() || null,
      faq: faq.filter((f) => f.q.trim() || f.a.trim()),
      status,
      published_at:
        status === 'published'
          ? new Date().toISOString()
          : status === 'scheduled'
            ? localToIso(scheduleAt)
            : initial?.status === 'published'
              ? initial.published_at
              : null,
      author_id: userData.user?.id ?? initial?.author_id ?? null,
    };
    const result = initial
      ? await supabase.from('posts').update(payload).eq('id', initial.id)
      : await supabase.from('posts').insert(payload);
    setSaving(false);
    if (result.error) {
      setMessage('Không lưu được: ' + result.error.message);
    } else {
      router.push('/admin/bai-viet');
    }
  }

  async function remove() {
    if (!initial || !supabase) return;
    if (!window.confirm('Xóa bài viết này? Hành động này không hoàn tác được.')) return;
    setDeleting(true);
    const { error } = await supabase.from('posts').delete().eq('id', initial.id);
    setDeleting(false);
    if (error) setMessage('Không xóa được: ' + error.message);
    else router.push('/admin/bai-viet');
  }

  return (
    <div className="space-y-4">
      {isEditor ? (
        <p className="card !bg-creamDark text-sm">
          Tài khoản của bạn có quyền Biên tập viên: chỉ được tạo và sửa bài nháp của chính
          mình, không được xuất bản hay hẹn giờ (quyền này cũng bị chặn ở database).
        </p>
      ) : null}

      <div className="card space-y-3">
        <div>
          <label className="label" htmlFor="post-title">Tiêu đề</label>
          <input
            id="post-title"
            className="input"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="VD: Cách chọn ngày tốt khai trương"
          />
        </div>
        <div>
          <label className="label" htmlFor="post-slug">
            Slug (đường dẫn, tự sinh từ tiêu đề)
          </label>
          <input
            id="post-slug"
            className="input"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(slugify(e.target.value));
            }}
            placeholder="ngay-tot-khai-truong"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="post-category">Chuyên mục</label>
            <input
              id="post-category"
              className="input"
              list="post-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <datalist id="post-categories">
              {CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="label" htmlFor="post-excerpt">Tóm tắt ngắn (hiện ở danh sách)</label>
            <input
              id="post-excerpt"
              className="input"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="card space-y-3">
        <div className="flex gap-2">
          <button
            type="button"
            className={tab === 'edit' ? 'btn-primary' : 'btn-gold'}
            onClick={() => setTab('edit')}
          >
            Soạn thảo
          </button>
          <button
            type="button"
            className={tab === 'preview' ? 'btn-primary' : 'btn-gold'}
            onClick={() => setTab('preview')}
          >
            Xem trước
          </button>
        </div>
        {tab === 'edit' ? (
          <>
            <label className="label" htmlFor="post-content">
              Nội dung (hỗ trợ markdown tối thiểu: # tiêu đề, **in đậm**, danh sách - )
            </label>
            <textarea
              id="post-content"
              className="input min-h-[320px] font-mono text-sm"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'# Tiêu đề đoạn\n\nĐoạn văn với **chữ in đậm**.\n\n- Ý thứ nhất\n- Ý thứ hai'}
            />
          </>
        ) : (
          <div
            className="prose max-w-none space-y-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{
              __html: renderMarkdown(content) || '<p><em>Chưa có nội dung.</em></p>',
            }}
          />
        )}
      </div>

      <div className="card space-y-3">
        <p className="font-display text-lg font-bold text-primary">Ảnh đại diện</p>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="h-48 w-full rounded object-cover" />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-gold" onClick={() => setPickerOpen(true)}>
            Chọn từ Thư viện
          </button>
          {cover ? (
            <button type="button" className="btn-gold" onClick={() => setCover('')}>
              Gỡ ảnh
            </button>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="post-cover">Hoặc dán link ảnh</label>
          <input
            id="post-cover"
            className="input"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="https://…"
          />
        </div>
      </div>

      <div className="card space-y-3">
        <p className="font-display text-lg font-bold text-primary">SEO</p>
        <div>
          <label className="label" htmlFor="post-seo-title">Meta title (để trống = dùng tiêu đề)</label>
          <input
            id="post-seo-title"
            className="input"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </div>
        <div>
          <label className="label" htmlFor="post-seo-desc">Meta description</label>
          <textarea
            id="post-seo-desc"
            className="input"
            rows={2}
            value={seoDesc}
            onChange={(e) => setSeoDesc(e.target.value)}
          />
        </div>
        <p className="text-sm text-ink/70">
          Ảnh OG dùng ảnh đại diện ở trên (nếu trang công khai chưa dùng, cần agent trang
          công khai gắn thêm — ngoài phạm vi admin).
        </p>
      </div>

      <div className="card space-y-3">
        <p className="font-display text-lg font-bold text-primary">AEO — trả lời trực tiếp + FAQ</p>
        <div>
          <label className="label" htmlFor="post-aeo">
            Câu trả lời trực tiếp đầu bài (1–2 câu, cho AI/search trích dẫn)
          </label>
          <textarea
            id="post-aeo"
            className="input"
            rows={2}
            value={aeoAnswer}
            onChange={(e) => setAeoAnswer(e.target.value)}
          />
        </div>
        {faq.map((item, i) => (
          <div key={i} className="grid gap-2 rounded border border-gold/40 p-3 sm:grid-cols-2">
            <input
              className="input"
              value={item.q}
              placeholder="Câu hỏi"
              onChange={(e) =>
                setFaq(faq.map((f, j) => (j === i ? { ...f, q: e.target.value } : f)))
              }
            />
            <input
              className="input"
              value={item.a}
              placeholder="Trả lời"
              onChange={(e) =>
                setFaq(faq.map((f, j) => (j === i ? { ...f, a: e.target.value } : f)))
              }
            />
            <button
              type="button"
              className="btn-gold sm:col-span-2"
              onClick={() => setFaq(faq.filter((_, j) => j !== i))}
            >
              Xóa câu hỏi này
            </button>
          </div>
        ))}
        <button type="button" className="btn-gold" onClick={() => setFaq([...faq, { q: '', a: '' }])}>
          + Thêm câu hỏi FAQ
        </button>
      </div>

      <div className="card space-y-3">
        <p className="font-display text-lg font-bold text-primary">Đăng bài</p>
        <div>
          <label className="label" htmlFor="post-schedule">Ngày giờ đăng (chỉ dùng khi bấm Hẹn giờ)</label>
          <input
            id="post-schedule"
            type="datetime-local"
            className="input"
            value={scheduleAt}
            onChange={(e) => setScheduleAt(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-gold" disabled={saving} onClick={() => save('draft')}>
            {saving ? 'Đang lưu…' : 'Lưu nháp'}
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || isEditor}
            title={isEditor ? 'Biên tập viên không được xuất bản' : undefined}
            onClick={() => save('published')}
          >
            Xuất bản ngay
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving || isEditor}
            title={isEditor ? 'Biên tập viên không được hẹn giờ' : undefined}
            onClick={() => save('scheduled')}
          >
            Hẹn giờ đăng
          </button>
          {initial ? (
            <button type="button" className="btn-gold" disabled={deleting} onClick={remove}>
              {deleting ? 'Đang xóa…' : 'Xóa bài'}
            </button>
          ) : null}
        </div>
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </div>

      {pickerOpen ? (
        <MediaPicker
          onSelect={(url) => {
            setCover(url);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      ) : null}
    </div>
  );
}
