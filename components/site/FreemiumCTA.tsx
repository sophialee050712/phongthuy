// CTA freemium đặt cuối các tool miễn phí, dẫn tới các sản phẩm in.
// Câu chữ TRUNG THỰC: không tạo khan hiếm giả, không đếm ngược, không
// "chỉ còn X suất", không dark pattern. Giá nêu rõ là giá demo tham khảo
// cho tới khi chủ site xác nhận giá thật trong trang quản trị.

import Link from 'next/link';

const LINKS = [
  { href: '/the-so-menh', label: 'Thẻ số mệnh' },
  { href: '/lo-trinh-nam', label: 'Lộ trình 12 tháng âm lịch' },
  { href: '/bao-cao', label: 'Báo cáo tổng hợp' },
  { href: '/ngay-trong-dai', label: 'Gói ngày trọng đại' },
  { href: '/bang-gia', label: 'Xem bảng giá' },
];

export default function FreemiumCTA({ exclude }: { exclude?: string }) {
  const links = LINKS.filter((l) => l.href !== exclude);
  return (
    <section className="card space-y-3" aria-label="Sản phẩm in">
      <h2 className="font-display text-xl font-bold text-primary">
        Muốn giữ lại kết quả dưới dạng bản in đẹp?
      </h2>
      <p className="text-sm text-ink/80">
        Các công cụ tra cứu trên site vẫn miễn phí. Nếu bạn muốn giữ lại nội dung quan
        trọng dưới dạng bản in đẹp, gọn để lưu giữ, bạn có thể đặt in — không bắt buộc,
        không giới hạn thời gian, và bạn luôn xem trước miễn phí trước khi quyết định.
      </p>
      <p className="text-sm text-ink/80">
        Giá hiển thị hiện là giá demo tham khảo (Thẻ số mệnh 49.000đ, Lộ trình 99.000đ,
        Báo cáo 99.000–299.000đ); giá chính thức sẽ được chủ site xác nhận sau.
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="btn-gold text-sm">
            {l.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
