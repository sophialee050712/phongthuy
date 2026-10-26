import type { Metadata } from 'next';
import ThanSoForm from '@/components/site/ThanSoForm';

export function generateMetadata(): Metadata {
  return {
    title: 'Thần số học: tính số chủ đạo từ ngày sinh',
    description:
      'Nhập ngày sinh dương lịch để tính số chủ đạo theo công thức engine (cộng tất cả chữ số rồi rút gọn, giữ số master 11, 22) — kết quả tham khảo.',
  };
}

export default function ThanSoHocPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Thần số học</h1>
      <p className="text-ink/80">
        Số chủ đạo được tính từ ngày sinh dương lịch của bạn theo đúng công thức của engine.
        Đây là công cụ tra cứu tham khảo, mô tả xu hướng chung — không phải kết luận về tính
        cách hay vận mệnh của một người cụ thể, và không kèm tư vấn 1-1.
      </p>
      <ThanSoForm />
    </div>
  );
}
