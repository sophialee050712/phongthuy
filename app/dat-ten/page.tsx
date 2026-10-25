import type { Metadata } from 'next';
import DatTenForm from '@/components/site/DatTenForm';

export function generateMetadata(): Metadata {
  return {
    title: 'Đặt tên con hợp phong thủy | Khang An Phong Thủy',
    description:
      'Nhập họ và ngày sinh của bé để nhận gợi ý tên theo ngũ hành, kèm điểm chấm tên và ý nghĩa ngắn gọn.',
  };
}

export default function DatTenPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Đặt tên con hợp phong thủy</h1>
      <p className="text-ink/80">
        Gợi ý tên theo ngũ hành của năm sinh bé, ưu tiên tên tương sinh với mệnh, kèm điểm chấm
        tên và ý nghĩa ngắn gọn, dễ hiểu.
      </p>
      <DatTenForm />
    </div>
  );
}
