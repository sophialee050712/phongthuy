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
  // Ảnh thẻ chia sẻ: xem ghi chú ở mục "Ảnh thẻ chia sẻ" — bảng posts hiện
  // CHƯA có cột share_image nên giá trị này chưa được lưu vào database (chỉ
  // dùng để xem trước trong phiên); khi có cột thì bật dòng share_image
  // trong payload của save() bên dưới.
  const [shareImage, setShareImage] = useState('');
  // Từ khóa chính: CHỈ dùng để chấm điểm SEO tại chỗ trong phiên này, không
  // lưu vào database và không ảnh hưởng nút Lưu/Xuất bản.
  const [keyword, setKeyword] = useState('');
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? '');
  const [seoDesc, setSeoDesc] = useState(initial?.seo_description ?? '');
  const [aeoAnswer, setAeoAnswer] = useState(initial?.aeo_answer ?? '');
  const [faq, setFaq] = useState<{ q: string; a: string }[]>(initial?.faq ?? []);
  const [scheduleAt, setScheduleAt] = useState(isoToLocal(initial?.published_at ?? null));
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [pickerTarget, setPickerTarget] = useState<'cover' | 'share' | null>(null);
  const [role, setRole] = useState<string>('');
  const [userId, setUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    const client = supabase;
    if (!client) return;
    client.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setUserId(data.user.id);
      const { data: profile } = await client
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();
      setRole((profile as { role?: string } | null)?.role ?? '');
    });
  }, []);

  const isEditor = role === 'editor';

  // Luật xóa theo policy posts_delete trong supabase/schema.sql: admin xóa
  // được mọi bài; editor chỉ xóa được nháp của chính mình. Khi role chưa tải
  // xong thì vẫn cho bấm (RLS chặn ở DB và lỗi sẽ hiện rõ), tránh khóa nhầm.
  const canDelete = !initial
    ? false
    : role === 'admin'
      ? true
      : role === 'editor'
        ? userId !== '' && initial.author_id === userId && initial.status === 'draft'
        : true;

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
    try {
      const { data: userData } = await supabase.auth.getUser();
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        excerpt: excerpt.trim(),
        content,
        category,
        cover_image: cover.trim() || null,
        // BẬT dòng dưới khi bảng posts đã có cột share_image (migration ngoài
        // phạm vi nhóm Tăng trưởng — xem ghi chú mục "Ảnh thẻ chia sẻ"):
        // share_image: shareImage.trim() || null,
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
        // Điều hướng kèm tham số ?saved= để trang danh sách vừa hiện banner
        // xác nhận, vừa tải lại danh sách mới (tránh cache router của Next
        // giữ lại danh sách cũ khi quay về trong vòng ~30s).
        router.push(`/admin/bai-viet?saved=${status}`);
        router.refresh();
      }
    } catch (err) {
      setSaving(false);
      setMessage('Không lưu được: ' + (err instanceof Error ? err.message : String(err)));
    }
  }

  // Chấm điểm SEO — tính toán thuần phía client từ field form, KHÔNG gọi
  // API ngoài và KHÔNG ảnh hưởng hành vi lưu/xuất bản. Mỗi mục có 3 trạng
  // thái: pass (đạt), fail (chưa đạt), neutral (không áp dụng — không tính
  // vào điểm, vd meta title để trống là hợp lệ vì sẽ dùng tiêu đề).
  type SeoCheck = { label: string; state: 'pass' | 'fail' | 'neutral'; hint: string };
  const seoChecks: SeoCheck[] = (() => {
    const effectiveTitle = (seoTitle.trim() || title.trim());
    const titleLen = effectiveTitle.length;
    const excerptLen = excerpt.trim().length;
    const descLen = seoDesc.trim().length;
    const contentLen = content.trim().length;
    const kw = keyword.trim().toLowerCase();
    const haystack = `${title} ${excerpt} ${content}`.toLowerCase();
    const faqDone = faq.filter((f) => f.q.trim() && f.a.trim()).length;
    const lenHint = (len: number, min: number, max: number, name: string) =>
      len === 0
        ? `${name} đang trống.`
        : len < min
          ? `${name} hiện ${len} ký tự — nên viết dài hơn (khoảng ${min}–${max}).`
          : len > max
            ? `${name} hiện ${len} ký tự — nên rút gọn về khoảng ${min}–${max}.`
            : `${name} hiện ${len} ký tự — trong khoảng tốt ${min}–${max}.`;
    return [
      {
        label: 'Tiêu đề đủ dài (30–70 ký tự)',
        state: titleLen === 0 ? 'fail' : titleLen >= 30 && titleLen <= 70 ? 'pass' : 'fail',
        hint: lenHint(titleLen, 30, 70, 'Tiêu đề'),
      },
      {
        label: 'Tiêu đề chứa từ khóa chính',
        state: !kw ? 'neutral' : haystack.includes(kw) ? 'pass' : 'fail',
        hint: !kw
          ? 'Nhập từ khóa chính ở khung chấm điểm để kiểm tra.'
          : haystack.includes(kw)
            ? `Tiêu đề/tóm tắt/nội dung có chứa “${keyword.trim()}”.`
            : `Chưa thấy “${keyword.trim()}” trong tiêu đề, tóm tắt hay nội dung.`,
      },
      {
        label: 'Đã có slug',
        state: slug.trim() ? 'pass' : 'fail',
        hint: slug.trim() ? `Đường dẫn sẽ là /bai-viet/${slug.trim()}.` : 'Slug đang trống.',
      },
      {
        label: 'Đã có tóm tắt (120–160 ký tự)',
        state: excerptLen === 0 ? 'fail' : excerptLen >= 120 && excerptLen <= 160 ? 'pass' : 'fail',
        hint: lenHint(excerptLen, 120, 160, 'Tóm tắt'),
      },
      {
        label: 'Nội dung đủ dài (≥ 300 ký tự)',
        state: contentLen >= 300 ? 'pass' : 'fail',
        hint:
          contentLen >= 300
            ? `Nội dung hiện ${contentLen} ký tự.`
            : `Nội dung hiện ${contentLen} ký tự — nên viết thêm cho đủ ý.`,
      },
      {
        label: 'Đã có ảnh đại diện',
        state: cover.trim() ? 'pass' : 'fail',
        hint: cover.trim() ? 'Ảnh đại diện đã chọn.' : 'Chưa chọn ảnh đại diện.',
      },
      {
        label: 'Đã có ảnh thẻ chia sẻ riêng',
        state: shareImage.trim() ? 'pass' : 'neutral',
        hint: shareImage.trim()
          ? 'Đã chọn ảnh thẻ chia sẻ riêng (xem ghi chú về việc lưu ở mục ảnh).'
          : 'Chưa chọn riêng — khi chia sẻ sẽ dùng ảnh đại diện.',
      },
      {
        label: 'Đã có meta title riêng',
        state: seoTitle.trim() ? 'pass' : 'neutral',
        hint: seoTitle.trim()
          ? 'Meta title đã nhập.'
          : 'Để trống là hợp lệ — trang công khai sẽ dùng tiêu đề bài.',
      },
      {
        label: 'Đã có meta description (120–160 ký tự)',
        state: descLen === 0 ? 'fail' : descLen >= 120 && descLen <= 160 ? 'pass' : 'fail',
        hint: lenHint(descLen, 120, 160, 'Meta description'),
      },
      {
        label: 'Đã có khối SEO/AEO (câu trả lời trực tiếp)',
        state: aeoAnswer.trim() ? 'pass' : 'fail',
        hint: aeoAnswer.trim()
          ? 'Đã có câu trả lời trực tiếp cho AI/search trích dẫn.'
          : 'Chưa nhập câu trả lời trực tiếp (mục AEO bên dưới).',
      },
      {
        label: 'Đã có ít nhất 1 cặp FAQ đầy đủ',
        state: faqDone > 0 ? 'pass' : 'fail',
        hint:
          faqDone > 0
            ? `Đã có ${faqDone} cặp hỏi–đáp đầy đủ.`
            : 'Chưa có cặp hỏi–đáp nào đủ cả câu hỏi và trả lời.',
      },
    ];
  })();
  const seoScored = seoChecks.filter((c) => c.state !== 'neutral');
  const seoPassed = seoScored.filter((c) => c.state === 'pass').length;
  const seoScore = seoScored.length > 0 ? Math.round((seoPassed / seoScored.length) * 100) : 0;

  // Xóa bài dùng hộp xác nhận TRONG TRANG (không dùng window.confirm):
  // hộp thoại native bị trình duyệt tự động đóng trong môi trường test tự
  // động (trả về false im lặng) nên lần test trước bấm mãi vẫn không có gì
  // xảy ra; hộp trong trang thì người thật và trình duyệt test đều thấy và
  // bấm được. Sau khi xóa thành công thì refresh để danh sách không giữ
  // bản cache cũ (cùng lỗi cache từng gặp ở luồng lưu bài).
  async function remove() {
    if (!initial) {
      setMessage('Không xác định được bài viết cần xóa.');
      return;
    }
    if (!supabase) {
      setMessage('Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md.');
      return;
    }
    setDeleting(true);
    setMessage('');
    try {
      const { error } = await supabase.from('posts').delete().eq('id', initial.id);
      setDeleting(false);
      if (error) {
        setMessage('Không xóa được: ' + error.message);
      } else {
        setConfirmDelete(false);
        router.push('/admin/bai-viet?deleted=1');
        router.refresh();
      }
    } catch (err) {
      setDeleting(false);
      setMessage('Không xóa được: ' + (err instanceof Error ? err.message : String(err)));
    }
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
          <button type="button" className="btn-gold" onClick={() => setPickerTarget('cover')}>
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
        <p className="font-display text-lg font-bold text-primary">Ảnh thẻ chia sẻ</p>
        <p className="text-sm text-ink/70">
          Ảnh này dùng làm ảnh xem trước khi chia sẻ bài lên mạng xã hội. Nếu để
          trống, ảnh đại diện ở trên sẽ được dùng thay.
        </p>
        <p className="text-sm text-primary">
          Lưu ý: bảng posts hiện chưa có cột share_image nên ảnh chọn ở đây CHƯA
          được lưu khi bấm Lưu/Xuất bản — lựa chọn sẽ mất khi tải lại form. Cần
          thêm cột share_image vào bảng posts rồi bật dòng share_image trong
          payload của form này thì ảnh mới được lưu thật. Trong lúc chờ, cứ dùng
          ảnh đại diện làm ảnh chia sẻ.
        </p>
        {shareImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shareImage} alt="" className="h-48 w-full rounded object-cover" />
        ) : null}
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-gold" onClick={() => setPickerTarget('share')}>
            Chọn từ Thư viện
          </button>
          {shareImage ? (
            <button type="button" className="btn-gold" onClick={() => setShareImage('')}>
              Gỡ ảnh
            </button>
          ) : null}
        </div>
        <div>
          <label className="label" htmlFor="post-share">Hoặc dán link ảnh</label>
          <input
            id="post-share"
            className="input"
            value={shareImage}
            onChange={(e) => setShareImage(e.target.value)}
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
          Ảnh OG: trang công khai dùng ảnh đại diện ở trên; khi ảnh thẻ chia sẻ
          riêng đã lưu được (sau khi có cột share_image), trang công khai ưu
          tiên ảnh đó — phần gắn OG ở trang công khai do coordinator nối sau.
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
        <p className="font-display text-lg font-bold text-primary">Chấm điểm SEO</p>
        <p className="text-sm text-ink/70">
          Điểm tính ngay tại chỗ từ các field trong form — không gọi API ngoài,
          không chặn việc lưu bài. Điểm thấp vẫn lưu/xuất bản được bình thường.
        </p>
        <div>
          <label className="label" htmlFor="post-keyword">
            Từ khóa chính (tùy chọn, chỉ dùng để chấm điểm tại chỗ — không lưu)
          </label>
          <input
            id="post-keyword"
            className="input"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="VD: ngày tốt khai trương"
          />
        </div>
        <p className="font-display text-2xl font-bold text-primary">
          {seoScore}/100{' '}
          <span className="text-base font-semibold text-ink/70">
            ({seoPassed}/{seoScored.length} mục đạt)
          </span>
        </p>
        <div
          className="h-3 overflow-hidden rounded bg-creamDark"
          role="progressbar"
          aria-valuenow={seoScore}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Điểm SEO"
        >
          <div className="h-full bg-gold" style={{ width: `${seoScore}%` }} />
        </div>
        <ul className="space-y-2 text-sm">
          {seoChecks.map((check) => (
            <li key={check.label} className="flex gap-2">
              <span aria-hidden="true">
                {check.state === 'pass' ? '✓' : check.state === 'fail' ? '✕' : '–'}
              </span>
              <span>
                <span className="font-semibold">{check.label}</span>
                <span className="text-ink/70"> — {check.hint}</span>
              </span>
            </li>
          ))}
        </ul>
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
            <button
              type="button"
              className="btn-gold"
              disabled={deleting || !canDelete}
              title={
                !canDelete
                  ? 'Chỉ admin hoặc tác giả của bản nháp mới xóa được bài này.'
                  : undefined
              }
              onClick={() => {
                setMessage('');
                setConfirmDelete(true);
              }}
            >
              {deleting ? 'Đang xóa…' : 'Xóa bài'}
            </button>
          ) : null}
        </div>
        {confirmDelete && initial ? (
          <div className="rounded border border-primary/40 bg-creamDark p-3 text-sm" role="alert">
            <p className="font-semibold">Xóa bài viết “{title || initial.title}”?</p>
            <p className="mt-1 text-ink/70">
              Hành động này không hoàn tác được. Quyền xóa do database quyết định: admin xóa
              được mọi bài, biên tập viên chỉ xóa được nháp của chính mình.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn-primary" disabled={deleting} onClick={remove}>
                {deleting ? 'Đang xóa…' : 'Xóa vĩnh viễn'}
              </button>
              <button
                type="button"
                className="btn-gold"
                disabled={deleting}
                onClick={() => setConfirmDelete(false)}
              >
                Giữ lại
              </button>
            </div>
          </div>
        ) : null}
        {message ? <p className="text-sm text-primary">{message}</p> : null}
      </div>

      {pickerTarget ? (
        <MediaPicker
          title={
            pickerTarget === 'cover'
              ? 'Chọn ảnh đại diện từ Thư viện'
              : 'Chọn ảnh thẻ chia sẻ từ Thư viện'
          }
          onSelect={(url) => {
            if (pickerTarget === 'cover') setCover(url);
            else setShareImage(url);
            setPickerTarget(null);
          }}
          onClose={() => setPickerTarget(null)}
        />
      ) : null}
    </div>
  );
}
