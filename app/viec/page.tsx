import type { Metadata } from 'next';
import Link from 'next/link';
import { VIEC_LIST } from '@/lib/data';
import { slugify } from '@/lib/seo';
import ViecFlow from '@/components/site/ViecFlow';

export function generateMetadata(): Metadata {
  return {
    title: 'Xem ngày theo việc: động thổ, khai trương, cưới hỏi…',
    description:
      'Chọn việc rồi chọn ngày: xem can chi, sao ngày, giờ hoàng đạo và ghi chú xung tuổi — kèm rõ những gì engine chưa hỗ trợ.',
  };
}

export default function ViecPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Xem ngày theo việc</h1>
      <p className="text-ink/80">
        Chọn một việc bên dưới để xem theo từng việc, hoặc dùng luồng xem nhanh ngay tại trang
        này. Kết quả dựa trên can chi, sao ngày (bộ cơ bản) và giờ hoàng đạo từ engine; yêu cầu
        riêng của từng việc mà engine chưa có sẽ được ghi rõ là “chưa hỗ trợ”, không bịa thêm.
      </p>
      <section>
        <h2 className="font-display text-xl font-bold text-primary">Chọn việc</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {VIEC_LIST.map((v) => (
            <Link key={v} href={`/viec/${slugify(v)}`} className="card block text-center hover:border-gold hover:shadow-md">
              <span className="font-semibold text-primary">{v}</span>
            </Link>
          ))}
        </div>
      </section>
      <section>
        <h2 className="font-display text-xl font-bold text-primary">Xem nhanh tại đây</h2>
        <div className="mt-3">
          <ViecFlow />
        </div>
      </section>
    </div>
  );
}
