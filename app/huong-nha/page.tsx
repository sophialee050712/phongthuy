import type { Metadata } from 'next';
import HuongNhaForm from '@/components/site/HuongNhaForm';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Chọn hướng nhà theo tuổi | Khang An Phong Thủy',
    description:
      'Nhập ngày sinh đầy đủ và giới tính của gia chủ để xem cung phi, Đông/Tây tứ mệnh, 4 hướng tốt và 4 hướng xấu theo bát trạch cùng khuyến nghị hướng nhà, cửa chính, bếp và bàn thờ.',
  };
}

export default function HuongNhaPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Chọn hướng nhà</h1>
      <p className="text-ink/80">
        Nhập ngày sinh đầy đủ của gia chủ đứng tên nhà để xem cung phi, nhóm Đông/Tây tứ mệnh và
        la bàn 8 hướng tốt/xấu theo bát trạch: 4 hướng tốt (Sinh Khí, Thiên Y, Diên Niên, Phục Vị)
        và 4 hướng xấu nên tránh (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại), kèm khuyến nghị hướng
        nhà, cửa chính, bếp và bàn thờ.
      </p>
      <ToolIllustration toolSlug="huong-nha" alt="Ảnh minh họa hướng nhà" />
      <HuongNhaForm />
      <FreemiumCTA />
    </div>
  );
}
