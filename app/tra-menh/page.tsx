import type { Metadata } from 'next';
import TraMenhForm from '@/components/site/TraMenhForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Tra bản mệnh, cung phi, Phật bản mệnh | Khang An Phong Thủy',
    description:
      'Nhập ngày sinh và giới tính để tra mệnh nạp âm, can chi năm, cung phi Đông/Tây tứ mệnh, màu hợp/kỵ, số hợp và Phật bản mệnh.',
  };
}

export default function TraMenhPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Tra bản mệnh &amp; cung phi</h1>
      <p className="text-ink/80">
        Nhập ngày sinh dương lịch và giới tính để xem mệnh nạp âm, cung phi, màu hợp/kỵ và Phật
        bản mệnh theo tuổi.
      </p>
      <ToolIllustration toolSlug="tra-menh" alt="Ảnh minh họa tra mệnh" />
      <TraMenhForm />
      <FreemiumCTA />
    </div>
  );
}
