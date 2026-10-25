import type { Metadata } from 'next';
import LuanSoTabs from '@/components/site/LuanSoTabs';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolIllustration from '@/components/site/ToolIllustration';

export function generateMetadata(): Metadata {
  return {
    title: 'Luận số phong thủy: SĐT, biển số, STK, CCCD | Khang An Phong Thủy',
    description:
      'Luận số điện thoại, biển số xe, số tài khoản và CCCD theo tổng nút và ngũ hành chủ đạo. Riêng CCCD chỉ tính phía client, không lưu trữ.',
  };
}

export default function LuanSoPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Luận số phong thủy</h1>
      <p className="text-ink/80">
        Chọn loại số cần luận. Lưu ý riêng với CCCD: số của bạn chỉ được tính toán trong trình
        duyệt, trang này không gửi hay lưu trữ số CCCD.
      </p>
      <ToolIllustration toolSlug="luan-so" alt="Ảnh minh họa luận số" />
      <LuanSoTabs />
      <FreemiumCTA />
    </div>
  );
}
