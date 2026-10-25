import type { Metadata } from 'next';
import { TUOI_12, VIEC_LIST } from './data';

// Helper SEO dùng chung cho các route tự sinh (sitemap, /tuoi, /ngay, /chia-se).
// Site URL lấy từ biến môi trường, KHÔNG hard-code domain giả: khi chưa có
// NEXT_PUBLIC_SITE_URL thì absoluteUrl trả về đường dẫn tương đối và
// buildMetadata bỏ qua canonical/openGraph.url — sitemap/canonical chỉ hợp lệ
// tuyệt đối sau khi đặt biến môi trường thật trước lúc public.

/** NEXT_PUBLIC_SITE_URL đã bỏ dấu `/` cuối, hoặc chuỗi rỗng khi chưa cấu hình. */
export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || '';
  return raw.replace(/\/+$/, '');
}

/** Ghép đường dẫn thành URL tuyệt đối khi có site URL, nếu không giữ nguyên path. */
export function absoluteUrl(path: string): string {
  if (!path) return siteUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const base = siteUrl();
  return base ? `${base}${normalized}` : normalized;
}

type BuildMetadataArgs = {
  title: string;
  description: string;
  /** Đường dẫn trang, vd `/ngay/2026-10-25`. Chỉ dùng làm canonical khi có site URL. */
  path?: string;
  type?: 'website' | 'article';
};

/** Metadata chuẩn Next.js: title/description + openGraph, canonical chỉ khi có site URL. */
export function buildMetadata({ title, description, path, type = 'website' }: BuildMetadataArgs): Metadata {
  const base = siteUrl();
  const canonical = base && path ? absoluteUrl(path) : undefined;
  return {
    title,
    description,
    alternates: canonical ? { canonical } : undefined,
    openGraph: {
      title,
      description,
      type,
      siteName: 'Khang An Phong Thủy',
      locale: 'vi_VN',
      ...(canonical ? { url: canonical } : {}),
    },
  };
}

/** Slug không dấu, vd "Cưới hỏi" -> "cuoi-hoi", "Ký hợp đồng" -> "ky-hop-dong". */
export function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Giải mã an toàn một param route (Next đã decode một lần; decode lại có thể lỗi với ký tự `%`). */
function safeDecode(param: string): string {
  try {
    return decodeURIComponent(param);
  } catch {
    return param;
  }
}

/**
 * Tuổi trên URL phải khớp CHÍNH XÁC một mục trong TUOI_12 (vd `Tý`, `Sửu`).
 * Cố tình KHÔNG khớp theo slug: "Tý" và "Tỵ" đều slug thành "ty" nên slug gây mơ hồ.
 */
export function resolveTuoiParam(param: string): string | null {
  const candidates = [param, safeDecode(param)];
  for (const candidate of candidates) {
    if (TUOI_12.includes(candidate)) return candidate;
  }
  return null;
}

/**
 * Việc trên URL chấp nhận tên đầy đủ (vd `Cưới hỏi`) hoặc slug (vd `cuoi-hoi`).
 * Slug của VIEC_LIST là duy nhất nên khớp slug an toàn (khác với TUOI_12).
 */
export function resolveViecParam(param: string): string | null {
  const decoded = safeDecode(param);
  if (VIEC_LIST.includes(decoded)) return decoded;
  const slug = slugify(decoded);
  return VIEC_LIST.find((viec) => slugify(viec) === slug) ?? null;
}
