import type { Metadata } from 'next';
import TuViTuan from '@/components/site/TuViTuan';

export function generateMetadata(): Metadata {
  return {
    title: 'Tử vi tuần theo tuổi: 7 ngày, ngày tốt nhất tuần',
    description:
      'Chọn ngày sinh hoặc 1 trong 60 tuổi can chi để xem tử vi tuần: điểm vận từng ngày, ngày tốt nhất tuần và màu may mắn — cùng công thức với Vận hạn trong ngày, chỉ mang tính tham khảo.',
  };
}

export default function TuViTuanPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Tử vi tuần theo tuổi</h1>
      <p className="text-ink/80">
        Xem cả tuần Thứ 2 đến Chủ nhật cho tuổi của bạn: điểm vận từng ngày, ngày tốt nhất
        tuần và gợi ý chung theo mệnh. Điểm tuần dùng cùng công thức rút gọn với Vận hạn
        trong ngày nên hai trang không vênh nhau.
      </p>
      <TuViTuan />
    </div>
  );
}
