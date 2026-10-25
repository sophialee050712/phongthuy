import type { Metadata } from 'next';
import GioForm from '@/components/site/GioForm';

export function generateMetadata(): Metadata {
  return {
    title: 'Nhắc giỗ & văn khấn: đổi ngày giỗ âm sang dương | Khang An Phong Thủy',
    description:
      'Nhập ngày giỗ âm lịch để tra ngày dương các năm tới (quét và đối chiếu lịch vạn niên), kèm thư viện văn khấn chung tham khảo. Site chỉ liệt kê, không gửi thông báo đẩy hay email.',
  };
}

export default function GioPage() {
  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Nhắc giỗ & văn khấn</h1>
      <p className="text-ink/80">
        Nhập tháng và ngày âm lịch của ngày giỗ để xem ngày giỗ rơi vào ngày dương nào trong
        các năm tới. Vì engine chỉ đổi được dương→âm, site tìm ngày dương bằng cách quét từng
        ngày trong năm và đối chiếu sang âm lịch. Lưu ý: site chỉ liệt kê ngày giỗ trong trang
        này — <strong>không gửi nhắc qua thông báo đẩy hay email</strong>; bạn tự lưu bảng ngày
        hoặc tự đặt nhắc trên điện thoại.
      </p>
      <GioForm />
    </div>
  );
}
