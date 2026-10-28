import type { Metadata } from 'next';
import Link from 'next/link';
import { getTodayInfo, saoNgay } from '@/lib/engine';
import ToolCard from '@/components/site/ToolCard';
import { LichHomNayTheoTuoi } from '@/components/site/XemNgayForm';
import SapToiTheoTuoi from '@/components/site/SapToiTheoTuoi';
import { getPosts } from '@/components/site/posts';
import { fmtLunar, normalizeStars, type LunarDateLike } from '@/components/site/format';

export function generateMetadata(): Metadata {
  return {
    title: 'Xem ngày tốt, tra mệnh, hướng nhà',
    description:
      'Lịch hôm nay theo lịch vạn niên, xem ngày tốt xấu, tra bản mệnh cung phi, hướng nhà bát trạch, đặt tên con, luận số và vận hạn.',
  };
}

function asLunar(value: unknown): LunarDateLike | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as Record<string, unknown>;
  if (typeof v.day !== 'number' || typeof v.month !== 'number' || typeof v.year !== 'number') return null;
  return { day: v.day, month: v.month, year: v.year, leap: v.leap === true };
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value : value != null ? String(value) : '';
}

export default async function HomePage() {
  const now = new Date();
  let info: Record<string, unknown> | null = null;
  try {
    const raw = getTodayInfo() as unknown;
    if (raw && typeof raw === 'object') info = raw as Record<string, unknown>;
  } catch {
    info = null;
  }
  const lunar = asLunar(info?.lunar ?? info?.amLich ?? info?.am_lich);
  // getTodayInfo() trả can chi dạng lồng nhau: { canChi: { ngay, thang, nam } }
  // (không phải canChiNgay/canChiDay ở cấp cao nhất — đó là lý do trang chủ
  // trước đây chỉ hiện placeholder "Đang cập nhật từ engine lịch").
  const ccObj =
    info?.canChi && typeof info.canChi === 'object'
      ? (info.canChi as Record<string, unknown>)
      : {};
  const ccDay = asString(ccObj.ngay ?? info?.canChiNgay ?? info?.canChiDay);
  const ccMonth = asString(ccObj.thang ?? info?.canChiThang ?? info?.canChiMonth);
  const ccYear = asString(ccObj.nam ?? info?.canChiNam ?? info?.canChiYear);
  const gioRaw = info?.gioHoangDao ?? info?.hoangDao ?? info?.hoangDaoHours;
  const gioHoangDao: string[] = Array.isArray(gioRaw)
    ? gioRaw
        .filter((g): g is Record<string, unknown> => !!g && typeof g === 'object')
        .filter((g) => g.hoangDao === true || g.hoang_dao === true)
        .map((g) => asString(g.gio))
        .filter(Boolean)
    : [];
  // Sao ngày hôm nay: luôn truyền tháng âm để tính đủ sao cần tháng
  // (Thiên Đức, Nguyệt Đức, Nguyệt Phá) — xem lib/engine/README.md §7.
  let saoHomNay = { tot: [] as string[], xau: [] as string[] };
  try {
    if (ccDay) saoHomNay = normalizeStars(lunar ? saoNgay(ccDay, lunar.month) : saoNgay(ccDay));
  } catch {
    saoHomNay = { tot: [], xau: [] };
  }
  const posts = await getPosts();

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-lg border border-gold/40">
        <img
          src="/hero-phong-khach.webp"
          alt="Phòng khách phong thủy hài hòa theo phong cách Á Đông"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-primary/75" />
        <div className="relative px-5 py-8 text-cream">
          <p className="text-sm font-semibold tracking-wide text-brass">KHANG AN PHONG THỦY</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
            Khơi Vận May Mắn, Khai Mở Cát Tường
          </h1>
          <p className="mt-3 max-w-2xl text-cream/90">
            Tra cứu theo lịch vạn niên và các bảng tra truyền thống: xem ngày tốt xấu, bản mệnh,
            hướng nhà, tên con, luận số và vận hạn — giải thích dễ hiểu, không hoa mỹ.
          </p>
        </div>
      </section>

      <section className="card">
        <h2 className="font-display text-2xl font-bold text-primary">Lịch hôm nay</h2>
        <p className="mt-2">
          Dương lịch:{' '}
          <strong>
            ngày {now.getDate()} tháng {now.getMonth() + 1} năm {now.getFullYear()}
          </strong>
        </p>
        <p>
          Âm lịch: <strong>{fmtLunar(lunar)}</strong>
        </p>
        <p>
          Can chi:{' '}
          <strong>
            {[ccDay, ccMonth, ccYear].filter(Boolean).join(' — ') || 'Đang cập nhật từ engine lịch'}
          </strong>
        </p>
        <p>
          Giờ hoàng đạo:{' '}
          <strong>{gioHoangDao.length > 0 ? gioHoangDao.join(', ') : 'Đang cập nhật'}</strong>
        </p>
        <p>
          Sao tốt:{' '}
          <strong>
            {saoHomNay.tot.length > 0 ? saoHomNay.tot.join(', ') : 'Không có sao tốt nổi bật'}
          </strong>{' '}
          — Sao xấu:{' '}
          <strong>
            {saoHomNay.xau.length > 0 ? saoHomNay.xau.join(', ') : 'Không có sao xấu nổi bật'}
          </strong>
        </p>
        <LichHomNayTheoTuoi
          canChiNgay={ccDay}
          saoTot={saoHomNay.tot}
          saoXau={saoHomNay.xau}
        />
        <SapToiTheoTuoi />
        <p className="mt-3">
          <Link href="/xem-ngay" className="btn-primary inline-block">
            Xem ngày tốt cho việc của bạn
          </Link>
        </p>
      </section>

      <section className="space-y-6">
        <h2 className="font-display text-2xl font-bold text-primary">Công cụ tra cứu</h2>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">Xem ngày & vận hạn</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard href="/xem-ngay" icon="📅" title="Xem ngày tốt xấu" desc="Chọn ngày dương, chọn việc — xem sao tốt/xấu, giờ hoàng đạo và kết luận tham khảo." />
            <ToolCard href="/viec" icon="🛠️" title="Xem ngày theo việc" desc="Luồng hướng dẫn từng việc: động thổ, khai trương, cưới hỏi, nhập trạch, mua xe, xuất hành, ký hợp đồng… theo ngày và tuổi." />
            <ToolCard href="/van-han" icon="🌙" title="Vận hạn trong ngày" desc="Bản rút gọn tham khảo: điểm vận, việc nên/tránh, màu may mắn theo can chi ngày." />
            <ToolCard href="/van-han-ca-nhan" icon="📈" title="Timeline vận hạn cá nhân" desc="12 tháng âm liên tiếp từ hôm nay: can chi tháng và sao ngày đầu tháng theo tuổi của bạn." />
            <ToolCard href="/tu-vi-tuan" icon="🗓️" title="Tử vi tuần theo tuổi" desc="7 ngày Thứ 2 đến Chủ nhật cho tuổi của bạn: điểm vận từng ngày, ngày tốt nhất tuần, ảnh chia sẻ." />
            <ToolCard href="/hoi-ngay" icon="💬" title="Hỏi ngày bằng ngôn ngữ tự nhiên" desc="Gõ như nói chuyện: “ngày tốt cưới tháng 11 cho tuổi Ngọ” — trang tự hiểu và tính." />
            <ToolCard href="/ngay-trong-dai" icon="🎉" title="Gói ngày trọng đại" desc="Chọn cưới hỏi, động thổ hay khai trương — nhận danh sách ngày đẹp xếp hạng cho sự kiện." />
            <ToolCard href="/lich-thang" icon="🗓️" title="Lịch tháng ngày tốt" desc="Xem cả tháng tô màu ngày tốt/xấu theo việc và tuổi, kèm danh sách ngày tương đối tốt không xung tuổi." />
            <ToolCard href="/gieo-que" icon="☯️" title="Gieo quẻ hằng ngày" desc="Quẻ của ngày theo 8 quẻ đơn, tính cố định theo ngày — chỉ mang tính tham khảo, giải trí." />
            <ToolCard href="/gio" icon="🕯️" title="Nhắc giỗ & văn khấn" desc="Đổi ngày giỗ âm lịch sang dương lịch các năm tới, kèm thư viện văn khấn chung tham khảo." />
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">Mệnh & con người</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard href="/tra-menh" icon="☯️" title="Tra bản mệnh & cung phi" desc="Mệnh nạp âm, cung phi Đông/Tây tứ mệnh, màu hợp/kỵ, Phật bản mệnh theo tuổi." />
            <ToolCard href="/quiz" icon="🎲" title="Quiz khám phá bản thân" desc="3 bước ngắn: mệnh, hướng tốt nhất, số chủ đạo — kèm công cụ gợi ý theo điều bạn quan tâm." />
            <ToolCard href="/than-so-hoc" icon="🔮" title="Thần số học" desc="Số chủ đạo từ ngày sinh dương lịch theo công thức engine, kèm giải thích ngắn gọn." />
            <ToolCard href="/boi-cap" icon="💞" title="Bói cặp đôi" desc="So sánh 2 ngày sinh: mệnh nạp âm, cung phi, thần số học — nhận xét tương hợp ở mức tham khảo." />
            <ToolCard href="/so-sanh" icon="⚖️" title="So sánh 2 người / 2 ngày" desc="Đối chiếu mệnh, cung, thần số của 2 người hoặc can chi, sao của 2 ngày — mức tham khảo." />
            <ToolCard href="/nhat-ky" icon="📓" title="Nhật ký vận khí" desc="Ghi tâm trạng mỗi ngày trên trình duyệt và đối chiếu với dự báo ngày đó — dữ liệu chỉ ở máy bạn." />
            <ToolCard href="/thu-thach" icon="✅" title="Thử thách cải vận 7/21 ngày" desc="Checklist thói quen tích cực mỗi ngày, tiến độ lưu trên trình duyệt — không cam kết đổi vận." />
            <ToolCard href="/ho-so" icon="👤" title="Hồ sơ của tôi" desc="Lưu ngày sinh trên trình duyệt để các công cụ tự điền tuổi và cá nhân hóa kết quả." />
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">Nhà cửa</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard href="/huong-nha" icon="🧭" title="Hướng nhà bát trạch" desc="La bàn 8 hướng tô màu tốt/xấu theo cung phi, gợi ý cửa chính, bếp, bàn thờ." />
            <ToolCard href="/la-ban" icon="🏠" title="La bàn bát trạch trên mặt bằng" desc="Đặt các phòng lên sơ đồ nhà, xem hướng nào tốt/xấu theo cung phi của bạn." />
            <ToolCard href="/thuoc-lo-ban" icon="📏" title="Thước Lỗ Ban 52,2cm" desc="Nhập kích thước cửa, bàn thờ, giường, tủ — xem rơi vào cung nào, tốt hay xấu, cần điều chỉnh bao nhiêu cm." />
            <ToolCard href="/bo-tri-3d" icon="🧱" title="Bố trí phòng 3D" desc="Nhập diện tích, chiều cao, vị trí cửa — nhận phương án bố trí phòng tốt nhất theo quy tắc bát trạch, xem 3D xoay được." />
            <ToolCard href="/tuoi-lam-nha" icon="🏗️" title="Tuổi làm nhà" desc="Xem tuổi mụ có phạm Kim Lâu, Hoang Ốc, Tam Tai không, kiểm tra người cho mượn tuổi, in checklist động thổ." />
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">Tên & số</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard href="/dat-ten" icon="👶" title="Đặt tên con" desc="Gợi ý tên theo ngũ hành năm sinh bé, chấm điểm tên và ý nghĩa ngắn gọn." />
            <ToolCard href="/luan-so" icon="🔢" title="Luận số phong thủy" desc="Luận SĐT, biển số xe, số tài khoản và CCCD (CCCD chỉ tính phía client)." />
            <ToolCard href="/luan-giai" icon="✨" title="Luận giải tự động theo câu hỏi" desc="Hỏi một câu, nhận luận giải tự động từ mẫu + engine — ghi rõ không phải tư vấn của thầy." />
          </div>
        </div>
        <div>
          <h3 className="font-display text-lg font-bold text-primary">Xem trọn vẹn</h3>
          <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ToolCard href="/the-so-menh" icon="🪪" title="Thẻ số mệnh" desc="Thẻ tóm tắt mệnh, cung, màu hợp/kỵ, hướng tốt — xem đầy đủ miễn phí." />
            <ToolCard href="/lo-trinh-nam" icon="🗓️" title="Lộ trình 12 tháng âm lịch" desc="12 tháng âm trong năm: tháng nào cần chú ý, tháng nào thuận lợi theo tuổi của bạn." />
            <ToolCard href="/bao-cao" icon="📄" title="Báo cáo tổng hợp" desc="Gộp mệnh, hướng nhà, ngày tốt, luận số thành một bản báo cáo đầy đủ." />
          </div>
        </div>
      </section>

      <section>
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-2xl font-bold text-primary">Bài viết mới</h2>
          <Link href="/bai-viet" className="text-sm font-semibold text-primary underline">
            Xem tất cả →
          </Link>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {posts.slice(0, 3).map((p) => (
            <Link key={p.slug} href={`/bai-viet/${p.slug}`} className="card block hover:border-gold hover:shadow-md">
              <p className="chip">{p.category}</p>
              {p.demo ? <span className="chip ml-2">Bài mẫu demo</span> : null}
              <h3 className="mt-2 font-display text-lg font-bold text-primary">{p.title}</h3>
              <p className="mt-1 text-sm text-ink/80">{p.excerpt}</p>
              {p.author ? <p className="mt-2 text-xs text-ink/60">Tác giả: {p.author}</p> : null}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
