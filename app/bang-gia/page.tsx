import type { Metadata } from 'next';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export function generateMetadata(): Metadata {
  return {
    title: 'Bảng giá sản phẩm in',
    description:
      'Bảng giá sản phẩm in của Khang An Phong Thủy: Thẻ số mệnh, Lộ trình 12 tháng âm lịch, Báo cáo PDF. Giá niêm yết lấy từ cài đặt của chủ site.',
  };
}

// Giá đọc từ bảng site_settings (chủ site sửa trong /admin/cai-dat).
// Khi chưa có setting (chưa cấu hình Supabase hoặc chưa chạy migration),
// dùng giá niêm yết mặc định trong code.
const DEMO = {
  price_the_so_menh: 49000,
  price_lo_trinh: 99000,
  price_bao_cao_min: 99000,
  price_bao_cao_max: 299000,
};

function parsePrice(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const digits = raw.replace(/\D/g, '');
  const n = digits ? Number(digits) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function fmtVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

async function loadPrices(): Promise<typeof DEMO> {
  if (!supabase) return DEMO;
  const { data, error } = await supabase
    .from('site_settings')
    .select('key, value')
    .in('key', Object.keys(DEMO));
  if (error || !data) return DEMO;
  const map: Record<string, string> = {};
  for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
  return {
    price_the_so_menh: parsePrice(map.price_the_so_menh, DEMO.price_the_so_menh),
    price_lo_trinh: parsePrice(map.price_lo_trinh, DEMO.price_lo_trinh),
    price_bao_cao_min: parsePrice(map.price_bao_cao_min, DEMO.price_bao_cao_min),
    price_bao_cao_max: parsePrice(map.price_bao_cao_max, DEMO.price_bao_cao_max),
  };
}

export default async function BangGiaPage() {
  const gia = await loadPrices();
  const SAN_PHAM = [
    {
      ten: 'Thẻ số mệnh',
      gia: `${fmtVND(gia.price_the_so_menh)}/thẻ`,
      moTa: 'Thẻ tóm tắt mệnh, cung phi, màu hợp/kỵ và Phật bản mệnh — in đẹp, gọn để giữ lại.',
      tinhNang: [
        'Mệnh nạp âm và cung phi theo tuổi',
        'Màu hợp/kỵ và số hợp tham khảo',
        'Phật bản mệnh theo con giáp',
      ],
      href: '/the-so-menh',
    },
    {
      ten: 'Lộ trình 12 tháng âm lịch',
      gia: `${fmtVND(gia.price_lo_trinh)}/bản`,
      moTa: '12 tháng âm lịch trong năm: tháng nào cần chú ý việc gì, việc nên làm và nên tránh.',
      tinhNang: [
        'Tháng tốt/xấu theo tuổi trong năm',
        'Việc nên làm và nên tránh từng tháng',
        'Màu may mắn từng tháng',
      ],
      href: '/lo-trinh-nam',
    },
    {
      ten: 'Báo cáo PDF',
      gia: `${fmtVND(gia.price_bao_cao_min)}–${fmtVND(gia.price_bao_cao_max)}/bản`,
      moTa: 'Báo cáo tổng hợp từ các công cụ tra cứu: mệnh, hướng nhà, ngày tốt, luận số — xuất file PDF để lưu và in.',
      tinhNang: [
        'Tổng hợp nhiều công cụ trong một bản',
        'File PDF tải về, in được',
        'Độ dài và chi tiết theo gói',
      ],
      href: '/bao-cao',
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Bảng giá sản phẩm in</h1>
      <p className="text-ink/80">
        Các công cụ tra cứu trên site vẫn miễn phí. Chỉ khi bạn muốn giữ lại nội dung quan
        trọng dưới dạng bản in đẹp mới tính phí. Giá dưới đây là giá niêm yết hiện tại của
        các sản phẩm in.
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
            <Link href={g.href} className="btn-gold mt-4 text-center">
              Tạo bản xem trước
            </Link>
          </div>
        ))}
      </div>
      <p className="text-sm text-ink/80">
        Đặt in theo luồng chuyển khoản thủ công: bạn tạo mã đơn ở trang sản phẩm, chuyển
        khoản với nội dung là mã đơn, sau khi xác nhận bạn nhập lại mã để mở khóa in bản
        đầy đủ.
      </p>
    </div>
  );
}
