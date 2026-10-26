import type { Metadata } from 'next';
import TuoiLamNha from '@/components/site/TuoiLamNha';

export function generateMetadata(): Metadata {
  return {
    title: 'Tuổi làm nhà năm nay: Kim Lâu, Hoang Ốc, Tam Tai + mượn tuổi',
    description:
      'Nhập năm sinh và năm làm nhà để xem tuổi mụ có phạm Kim Lâu, Hoang Ốc, Tam Tai không, kiểm tra người cho mượn tuổi và in checklist trước động thổ.',
  };
}

export default function TuoiLamNhaPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Tuổi làm nhà</h1>
      <p className="text-ink/80">
        Xem tuổi làm nhà theo 3 hạn truyền thống: Kim Lâu (tuổi mụ chia 9), Hoang Ốc (vòng
        6 cung) và Tam Tai (nhóm Tam Hợp). Nếu phạm hạn, kiểm tra người cho mượn tuổi và in
        checklist chuẩn bị động thổ.
      </p>
      <TuoiLamNha />
    </div>
  );
}
