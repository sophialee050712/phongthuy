import type { Metadata } from 'next';
import QuizForm from '@/components/site/QuizForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';

export function generateMetadata(): Metadata {
  return {
    title: 'Quiz khám phá bản thân: mệnh, hướng tốt, số chủ đạo',
    description:
      'Quiz 3 bước ngắn: nhập ngày sinh và giới tính, chọn điều quan tâm nhất — nhận mệnh nạp âm, cung phi và hướng tốt nhất, số chủ đạo, kèm công cụ gợi ý. Kết quả chỉ để tham khảo.',
  };
}

export default function QuizPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Quiz khám phá bản thân</h1>
      <p className="text-ink/80">
        3 bước ngắn để xem mệnh, hướng tốt và số chủ đạo của bạn — cùng công thức với các công
        cụ tra cứu đã có, trình bày lại cho vui và dễ chia sẻ. Kết quả chỉ để tham khảo, không
        chẩn đoán tính cách tuyệt đối.
      </p>
      <QuizForm />
      <FreemiumCTA />
    </div>
  );
}
