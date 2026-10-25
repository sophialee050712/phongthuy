import type { Metadata } from 'next';
import Link from 'next/link';
import { getTodayInfo } from '@/lib/engine';
import ToolCard from '@/components/site/ToolCard';
import { getPosts } from '@/components/site/posts';
import { fmtLunar, type LunarDateLike } from '@/components/site/format';

export function generateMetadata(): Metadata {
  return {
    title: 'Khang An Phong Thủy — Xem ngày tốt, tra mệnh, hướng nhà',
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
  const posts = await getPosts();

  return (
    <div className="space-y-10">
      <section className="rounded-lg border border-gold/40 bg-primary px-5 py-8 text-cream">
        <p className="text-sm font-semibold tracking-wide text-brass">KHANG AN PHONG THỦY</p>
        <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
          Khơi Vận May Mắn, Khai Mở Cát Tường
        </h1>
        <p className="mt-3 max-w-2xl text-cream/90">
          Tra cứu theo lịch vạn niên và các bảng tra truyền thống: xem ngày tốt xấu, bản mệnh,
          hướng nhà, tên con, luận số và vận hạn — giải thích dễ hiểu, không hoa mỹ.
        </p>
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
        <p className="mt-3">
          <Link href="/xem-ngay" className="btn-primary inline-block">
            Xem ngày tốt cho việc của bạn
          </Link>
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-bold text-primary">Công cụ tra cứu</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <ToolCard href="/xem-ngay" icon="📅" title="Xem ngày tốt xấu" desc="Chọn ngày dương, chọn việc — xem sao tốt/xấu, giờ hoàng đạo và kết luận tham khảo." />
          <ToolCard href="/tra-menh" icon="☯️" title="Tra bản mệnh & cung phi" desc="Mệnh nạp âm, cung phi Đông/Tây tứ mệnh, màu hợp/kỵ, Phật bản mệnh theo tuổi." />
          <ToolCard href="/huong-nha" icon="🧭" title="Hướng nhà bát trạch" desc="La bàn 8 hướng tô màu tốt/xấu theo cung phi, gợi ý cửa chính, bếp, bàn thờ." />
          <ToolCard href="/dat-ten" icon="👶" title="Đặt tên con" desc="Gợi ý tên theo ngũ hành năm sinh bé, chấm điểm tên và ý nghĩa ngắn gọn." />
          <ToolCard href="/luan-so" icon="🔢" title="Luận số phong thủy" desc="Luận SĐT, biển số xe, số tài khoản và CCCD (CCCD chỉ tính phía client)." />
          <ToolCard href="/van-han" icon="🌙" title="Vận hạn trong ngày" desc="Bản rút gọn tham khảo: điểm vận, việc nên/tránh, màu may mắn theo can chi ngày." />
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
