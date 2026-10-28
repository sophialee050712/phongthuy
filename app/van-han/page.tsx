import type { Metadata } from 'next';
import VanHanForm from '@/components/site/VanHanForm';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Vận hạn trong ngày theo tuổi',
    description:
      'Xem vận hạn rút gọn theo tuổi và ngày xem: điểm vận, việc nên làm, việc nên tránh và màu may mắn.',
  };
}

export default function VanHanPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Vận hạn trong ngày</h1>
      <p className="text-ink/80">
        Bản rút gọn tham khảo theo can chi ngày xem và mệnh nạp âm của bạn — không phải lá số tử
        vi đầy đủ, chỉ dùng để tham khảo sắp xếp công việc trong ngày.
      </p>
      <ToolIllustration toolSlug="van-han" alt="Ảnh minh họa vận hạn" />
      <VanHanForm />
    </div>
  );
}
