import type { Metadata } from 'next';
import DatTenForm from '@/components/site/DatTenForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Đặt tên con hợp phong thủy',
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
        tên và ý nghĩa ngắn gọn, dễ hiểu. Sau danh sách gợi ý, bạn có thể phân tích đa tiêu chí
        cho một tên cụ thể: số tên, hành của số tên, tương sinh/khắc với mệnh và âm điệu — các
        tiêu chí đếm nét chữ và từ điển nghĩa tên hiện ghi rõ “chưa hỗ trợ”.
      </p>
      <ToolIllustration toolSlug="dat-ten" alt="Ảnh minh họa đặt tên" />
      <DatTenForm />
      <FreemiumCTA />
    </div>
  );
}
