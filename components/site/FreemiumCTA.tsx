// CTA freemium đặt cuối các tool miễn phí, dẫn tới các sản phẩm in.
// Câu chữ TRUNG THỰC: không tạo khan hiếm giả, không đếm ngược, không
// "chỉ còn X suất", không dark pattern.
//
// Từ đợt nâng cấp giao diện 26/10: khối này mặc định THU GỌN thành một dòng
// (thẻ <details>) để không chào mua ầm ĩ trước khi user nhận kết quả — ai cần
// thì bấm mở. Bước tiếp theo (đợt sau) là chỉ hiện sau khi có kết quả ở các
// trang công cụ, việc này cần sửa state của 6 form nên không gộp vội vào đợt 0.

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
    <details className="card" aria-label="Sản phẩm in">
      <summary className="cursor-pointer font-display text-lg font-bold text-primary">
        Muốn giữ lại kết quả dưới dạng bản in đẹp? (không bắt buộc)
      </summary>
      <div className="mt-3 space-y-3">
        <p className="text-sm text-ink/80">
          Các công cụ tra cứu trên site vẫn miễn phí. Nếu bạn muốn giữ lại nội dung quan
          trọng dưới dạng bản in đẹp, gọn để lưu giữ, bạn có thể đặt in — không bắt buộc,
          không giới hạn thời gian, và bạn luôn xem trước miễn phí trước khi quyết định.
        </p>
        <div className="flex flex-wrap gap-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="btn-gold text-sm">
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </details>
  );
}
