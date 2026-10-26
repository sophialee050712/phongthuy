import type { Metadata } from 'next';
import BoiCapForm from '@/components/site/BoiCapForm';

export function generateMetadata(): Metadata {
  return {
    title: 'Bói cặp đôi: so sánh 2 ngày sinh',
    description:
      'Nhập 2 ngày sinh để so sánh mệnh nạp âm, cung phi và số chủ đạo — nhận xét tương hợp chỉ ở mức tham khảo, không khẳng định tuyệt đối.',
  };
}

export default function BoiCapPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Bói cặp đôi</h1>
      <p className="text-ink/80">
        So sánh hai ngày sinh theo mệnh nạp âm, cung phi (cần giới tính và năm âm lịch) và số
        chủ đạo từ engine. Mọi nhận xét tương hợp chỉ ở mức tham khảo — không khẳng định tuyệt
        đối hai người hợp hay khắc, không phải tư vấn tình cảm hay hôn nhân, và không kèm tư
        vấn 1-1.
      </p>
      <BoiCapForm />
    </div>
  );
}
