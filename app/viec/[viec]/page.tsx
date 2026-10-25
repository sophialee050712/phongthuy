import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { resolveViecParam } from '@/lib/seo';
import ViecFlow from '@/components/site/ViecFlow';

export const dynamic = 'force-dynamic';

type Params = { params: { viec: string } };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const viec = resolveViecParam(params.viec);
  if (!viec) notFound();
  return {
    title: `Xem ngày ${viec.toLowerCase()} | Khang An Phong Thủy`,
    description: `Chọn ngày ${viec.toLowerCase()}: xem can chi, sao ngày, giờ hoàng đạo và ghi chú xung tuổi — kèm rõ những gì engine chưa hỗ trợ.`,
  };
}

export default function ViecChiTietPage({ params }: Params) {
  const viec = resolveViecParam(params.viec);
  if (!viec) notFound();
  return (
    <div className="space-y-4">
      <p>
        <Link href="/viec" className="text-sm font-semibold text-primary underline">
          ← Chọn việc khác
        </Link>
      </p>
      <h1 className="font-display text-3xl font-bold text-primary">
        Xem ngày {viec.toLowerCase()}
      </h1>
      <p className="text-ink/80">
        Nhập ngày dự định và (tùy chọn) tuổi người đứng làm việc. Kết quả dùng can chi, sao ngày
        và giờ hoàng đạo từ engine; phần “chưa hỗ trợ” trong kết quả liệt kê những gì engine
        chưa tính được cho việc {viec.toLowerCase()}.
      </p>
      <ViecFlow viecMacDinh={viec} />
    </div>
  );
}
