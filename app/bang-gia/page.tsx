import type { Metadata } from 'next';

export function generateMetadata(): Metadata {
  return {
    title: 'Bảng giá gói tra cứu & hội viên | Khang An Phong Thủy',
    description:
      'Bảng giá các gói tra cứu phong thủy và hội viên của Khang An Phong Thủy. Giá sẽ được cập nhật sau.',
  };
}

const GOI = [
  {
    ten: 'Miễn phí',
    gia: '[CHỜ ĐIỀN]',
    moTa: 'Tra cứu cơ bản mỗi ngày, không cần đăng ký.',
    tinhNang: [
      'Xem ngày tốt xấu cơ bản',
      'Tra bản mệnh, cung phi',
      'Đọc kho bài viết cẩm nang',
    ],
  },
  {
    ten: 'Hội viên',
    gia: '[CHỜ ĐIỀN]',
    moTa: 'Tra cứu chuyên sâu cho nhu cầu thường xuyên.',
    tinhNang: [
      'Luận giải chuyên sâu ngày tốt, hướng nhà, luận số',
      'Nhắc lịch cát nhật, giờ hoàng đạo',
      'Tải hồ sơ lá số phong thủy dạng PDF',
    ],
  },
  {
    ten: 'Tư vấn 1-1',
    gia: '[CHỜ ĐIỀN]',
    moTa: 'Tư vấn trực tiếp cho việc lớn: cưới hỏi, khai trương, động thổ, mua nhà.',
    tinhNang: [
      'Tư vấn trực tiếp với chuyên gia',
      'Chốt ngày giờ và phương án cho việc cụ thể',
      'Theo dõi sau tư vấn',
    ],
  },
];

export default function BangGiaPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Bảng giá gói dịch vụ &amp; hội viên</h1>
      <p className="text-ink/80">
        Trang này hiện chỉ là giao diện bảng giá (paywall UI). Giá các gói đang chờ điền chính
        thức — chưa áp dụng giá tham khảo của bất kỳ đối thủ nào.
      </p>
      <div className="rounded border border-gold/40 bg-creamDark px-4 py-3 text-sm">
        <p className="font-semibold text-primary">TODO — tích hợp thanh toán (chưa làm):</p>
        <ul className="mt-1 list-disc pl-5">
          <li>Tích hợp MoMo</li>
          <li>Tích hợp ZaloPay</li>
          <li>Chỉ mở thanh toán sau khi giá chính thức đã được điền và duyệt.</li>
        </ul>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {GOI.map((g) => (
          <div key={g.ten} className="card flex flex-col">
            <h2 className="font-display text-xl font-bold text-primary">{g.ten}</h2>
            <p className="mt-2 text-2xl font-bold">{g.gia}</p>
            <p className="mt-1 text-sm text-ink/80">{g.moTa}</p>
            <ul className="mt-3 flex-1 list-disc space-y-1 pl-5 text-sm">
              {g.tinhNang.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <button type="button" className="btn-gold mt-4" disabled>
              Chưa mở đăng ký
            </button>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/80">
        Mọi mức giá trên trang này đều đang ở trạng thái [CHỜ ĐIỀN] cho đến khi có giá chính thức.
        Chưa có hình thức thanh toán nào được tích hợp.
      </p>
    </div>
  );
}
