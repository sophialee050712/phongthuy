import type { Metadata } from 'next';
import Link from 'next/link';

export function generateMetadata(): Metadata {
  return {
    title: 'Bảng giá sản phẩm in | Khang An Phong Thủy',
    description:
      'Bảng giá sản phẩm in của Khang An Phong Thủy: Thẻ số mệnh, Lộ trình 12 tháng âm lịch, Báo cáo PDF. Giá hiển thị là giá demo tham khảo, chưa mở thanh toán hay nạp tiền.',
  };
}

const SAN_PHAM = [
  {
    ten: 'Thẻ số mệnh',
    gia: '49.000đ/thẻ',
    moTa: 'Thẻ tóm tắt mệnh, cung phi, màu hợp/kỵ và Phật bản mệnh — in đẹp, gọn để giữ lại.',
    tinhNang: [
      'Mệnh nạp âm và cung phi theo tuổi',
      'Màu hợp/kỵ và số hợp tham khảo',
      'Phật bản mệnh theo con giáp',
    ],
  },
  {
    ten: 'Lộ trình 12 tháng âm lịch',
    gia: '99.000đ/bản',
    moTa: '12 tháng âm lịch trong năm: tháng nào cần chú ý việc gì, việc nên làm và nên tránh.',
    tinhNang: [
      'Tháng tốt/xấu theo tuổi trong năm',
      'Việc nên làm và nên tránh từng tháng',
      'Màu may mắn từng tháng',
    ],
  },
  {
    ten: 'Báo cáo PDF',
    gia: '99.000–299.000đ/bản',
    moTa: 'Báo cáo tổng hợp từ các công cụ tra cứu: mệnh, hướng nhà, ngày tốt, luận số — xuất file PDF để lưu và in.',
    tinhNang: [
      'Tổng hợp nhiều công cụ trong một bản',
      'File PDF tải về, in được',
      'Độ dài và chi tiết theo gói (bản demo)',
    ],
  },
];

export default function BangGiaPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Bảng giá sản phẩm in</h1>
      <p className="text-ink/80">
        Các công cụ tra cứu trên site vẫn miễn phí. Chỉ khi bạn muốn giữ lại nội dung quan
        trọng dưới dạng bản in đẹp mới tính phí — giá dưới đây là giá demo tham khảo, chưa
        phải giá chính thức. Tính năng đặt in và nạp tiền sẽ mở sau; hiện chưa có thanh toán
        hay đăng ký gói nào được tích hợp.
      </p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {SAN_PHAM.map((g) => (
          <div key={g.ten} className="card flex flex-col">
            <h2 className="font-display text-xl font-bold text-primary">{g.ten}</h2>
            <p className="mt-2 text-2xl font-bold">{g.gia}</p>
            <p className="mt-1 text-sm text-ink/80">{g.moTa}</p>
            <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm">
              {g.tinhNang.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <Link href="/xem-ngay" className="btn-gold mt-4 text-center">
              Liên hệ đặt in
            </Link>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/80">
        Giá demo tham khảo theo kế hoạch: Thẻ số mệnh 49.000đ, Lộ trình 12 tháng 99.000đ,
        Báo cáo PDF 99.000–299.000đ tùy độ dài. Giá chính thức sẽ được cập nhật sau; hiện
        chưa mở thanh toán hay nạp tiền.
      </p>
    </div>
  );
}
