import type { Metadata } from 'next';
import GieoQueForm from '@/components/site/GieoQueForm';

export function generateMetadata(): Metadata {
  return {
    title: 'Gieo quẻ hằng ngày (8 quẻ đơn) | Khang An Phong Thủy',
    description:
      'Quẻ của ngày tính cố định theo ngày dương lịch, dùng 8 quẻ đơn với ý nghĩa ngắn gọn trung tính — chỉ mang tính tham khảo, giải trí.',
  };
}

export default function GieoQuePage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Gieo quẻ hằng ngày</h1>
      <p className="text-ink/80">
        Mỗi ngày có một quẻ cố định trong 8 quẻ đơn (Càn, Đoài, Ly, Chấn, Tốn, Khảm, Cấn,
        Khôn) — cùng ngày luôn ra cùng quẻ, không phụ thuộc người gieo. Kết quả{' '}
        <strong>chỉ mang tính tham khảo, giải trí</strong> theo tượng quái truyền thống, không
        phải lời khuyên hay dự đoán chắc chắn. 64 quẻ kép và hào động chưa được hỗ trợ trên
        site nên không hiển thị ở đây.
      </p>
      <GieoQueForm />
    </div>
  );
}
