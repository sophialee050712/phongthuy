// Hàm dùng chung cho trang quản trị — tự code, không thêm dependency.
// Lưu ý: khu vực admin KHÔNG thu thập, lưu hay log CCCD dưới bất kỳ hình thức nào.

export type PostStatus = 'draft' | 'published' | 'scheduled';

export type PostRow = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image: string | null;
  seo_title: string | null;
  seo_description: string | null;
  aeo_answer: string | null;
  faq: { q: string; a: string }[] | null;
  status: PostStatus;
  published_at: string | null;
  author_id: string | null;
  created_at: string | null;
};

export type LeadRow = {
  id: string;
  phone: string;
  zalo: string | null;
  source: string | null;
  note: string | null;
  status: 'new' | 'contacted';
  created_at: string | null;
};

export type MediaRow = {
  id: string;
  path: string;
  url: string;
  alt_text: string | null;
  uploaded_by: string | null;
  created_at: string | null;
};

export const CATEGORIES = [
  'Ngày tốt',
  'Phong thủy nhà',
  'Kiến thức',
  'Đặt tên',
  'Luận số',
  'Vận hạn',
];

export const STATUS_LABEL: Record<PostStatus, string> = {
  draft: 'Bản nháp',
  published: 'Đã xuất bản',
  scheduled: 'Hẹn giờ',
};

/** Bỏ dấu tiếng Việt -> slug ascii: "Ngày Tốt Khai Trương!" -> "ngay-tot-khai-truong". */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Markdown tối thiểu, tự code (không thêm lib): tiêu đề #, ##, ###,
 * in đậm **text**, danh sách - hoặc *, đoạn văn.
 * Nội dung được escape trước khi chèn thẻ nên không chạy HTML lạ.
 */
export function renderMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  let listOpen = false;
  const closeList = () => {
    if (listOpen) {
      out.push('</ul>');
      listOpen = false;
    }
  };
  const inline = (s: string) =>
    escapeHtml(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  for (const raw of lines) {
    const line = raw.trim();
    if (line.startsWith('### ')) {
      closeList();
      out.push(`<h3>${inline(line.slice(4))}</h3>`);
    } else if (line.startsWith('## ')) {
      closeList();
      out.push(`<h2>${inline(line.slice(3))}</h2>`);
    } else if (line.startsWith('# ')) {
      closeList();
      out.push(`<h1>${inline(line.slice(2))}</h1>`);
    } else if (/^[-*]\s+/.test(line)) {
      if (!listOpen) {
        out.push('<ul>');
        listOpen = true;
      }
      out.push(`<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (line === '') {
      closeList();
    } else {
      closeList();
      out.push(`<p>${inline(line)}</p>`);
    }
  }
  closeList();
  return out.join('\n');
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString('vi-VN');
}

/** Chuyển datetime-local (YYYY-MM-DDTHH:mm) sang ISO để lưu published_at. */
export function localToIso(local: string): string | null {
  if (!local) return null;
  const d = new Date(local);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/** Chuyển ISO sang giá trị cho input datetime-local. */
export function isoToLocal(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}
