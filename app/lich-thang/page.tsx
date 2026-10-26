import type { Metadata } from 'next';
import LichThang from '@/components/site/LichThang';

export function generateMetadata(): Metadata {
  return {
    title: 'Lịch tháng: ngày tốt theo việc và tuổi',
    description:
      'Xem cả tháng tô màu ngày tương đối tốt, ngày bình thường, ngày chưa thuận theo sao ngày chung và xung tuổi — việc chọn chỉ để đối chiếu kế hoạch, không đổi điểm số.',
  };
}

export default function LichThangPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Lịch tháng ngày tốt</h1>
      <p className="text-ink/80">
        Chọn tháng, việc dự định làm và tuổi của bạn để xem cả tháng: ngày nào tương đối tốt,
        ngày nào xung tuổi nên tránh việc lớn. Bấm vào một ngày để xem sao tốt/xấu của ngày đó.
      </p>
      <LichThang />
    </div>
  );
}
