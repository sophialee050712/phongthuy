import type { Metadata } from 'next';
import HuongNhaForm from '@/components/site/HuongNhaForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Xem hướng nhà bát trạch theo tuổi | Khang An Phong Thủy',
    description:
      'Nhập năm sinh và giới tính để xem mệnh quái, la bàn 8 hướng tốt/xấu theo bát trạch và gợi ý hướng cửa chính, bếp, bàn thờ.',
  };
}

export default function HuongNhaPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Xem hướng nhà bát trạch</h1>
      <p className="text-ink/80">
        Hướng tốt/xấu được xét theo cung phi của gia chủ đứng tên nhà. La bàn tô màu giúp nhìn
        nhanh 4 hướng tốt (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và 4 hướng xấu.
      </p>
      <ToolIllustration toolSlug="huong-nha" alt="Ảnh minh họa hướng nhà" />
      <HuongNhaForm />
      <FreemiumCTA />
    </div>
  );
}
