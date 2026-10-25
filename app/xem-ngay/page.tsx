import type { Metadata } from 'next';
import XemNgayForm from '@/components/site/XemNgayForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Xem ngày tốt xấu theo việc | Khang An Phong Thủy',
    description:
      'Chọn ngày dương lịch và loại việc để xem ngày âm, can chi, sao tốt/xấu, giờ hoàng đạo và kết luận tham khảo.',
  };
}

export default function XemNgayPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Xem ngày tốt xấu</h1>
      <p className="text-ink/80">
        Chọn ngày và việc cần làm. Kết quả đối chiếu sao tốt/xấu trong ngày và giờ hoàng đạo,
        kèm kết luận tham khảo — việc lớn nên cân nhắc kỹ và đối chiếu thêm nhiều nguồn
        trước khi quyết định.
      </p>
      <ToolIllustration toolSlug="xem-ngay" alt="Ảnh minh họa xem ngày" />
      <XemNgayForm />
      <FreemiumCTA />
    </div>
  );
}
