import type { Metadata } from 'next';
import ShareCard from '@/components/share/ShareCard';
import { buildMetadata } from '@/lib/seo';

// Trang thẻ kết quả dọc 9:16 để share: đọc query ?t (tiêu đề) và ?d (chi tiết,
// các mục nối bằng ký tự `|`), render qua components/share/ShareCard.
// Không có mã QR (không vẽ QR giả). h1 duy nhất nằm trong thẻ (tiêu đề).

type SearchParams = { t?: string | string[]; d?: string | string[] };

function firstParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? (value[0] ?? '') : (value ?? '');
}

function parseShareParams(searchParams: SearchParams): { title: string; details: string[] } {
  const title = firstParam(searchParams.t).trim().slice(0, 120) || 'Kết quả tra cứu';
  const details = firstParam(searchParams.d)
    .split('|')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 10);
  return { title, details };
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const { title } = parseShareParams(searchParams);
  return buildMetadata({
    title: `${title} — Thẻ chia sẻ`,
    description: `Thẻ kết quả dọc 9:16 từ Khang An Phong Thủy: ${title}. Chụp màn hình để chia sẻ.`,
    path: '/chia-se',
  });
}

export default function ChiaSePage({ searchParams }: { searchParams: SearchParams }) {
  const { title, details } = parseShareParams(searchParams);
  return (
    <div>
      <ShareCard title={title} details={details} />
      <p className="mt-4 text-center text-sm opacity-80">
        Chụp màn hình thẻ trên để chia sẻ cho bạn bè, người thân.
      </p>
      {details.length === 0 ? (
        <p className="mt-2 text-center text-sm opacity-80">
          Mẹo: thêm <code>?t=Tiêu đề&amp;d=Dòng 1|Dòng 2</code> vào đường link để tạo thẻ của
          riêng bạn.
        </p>
      ) : null}
      <p className="mt-4 text-center">
        <a href="/" className="text-sm font-semibold text-primary underline">
          ← Về trang chủ
        </a>
      </p>
    </div>
  );
}
