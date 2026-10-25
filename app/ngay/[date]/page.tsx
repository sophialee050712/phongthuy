import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { buildMetadata } from '@/lib/seo';
import { canChiDay, canChiYear, hoangDaoHours, saoNgay, solarToLunar } from '@/lib/engine';

// Route SEO theo ngày: /ngay/yyyy-mm-dd.
// LƯU Ý VỀ HỢP ĐỒNG ENGINE: hợp đồng chỉ chốt tên hàm + shape LunarDate
// { day, month, year, leap }, CHƯA chốt chữ ký tham số (Date hay (năm, tháng, ngày)).
// Vì vậy file này dùng adapter "thử nhiều dạng tham số, chỉ nhận kết quả đúng hình
// dạng" — cùng quy ước mà agent trang công khai đang dùng — thay vì đoán một chữ ký
// rồi hiển thị sai hoặc crash khi engine chọn dạng khác. Mọi hàm engine vẫn được
// import trực tiếp từ '@/lib/engine' và dữ liệu hiển thị là kết quả tính thật.
// Hai hàm canChiMonth và getTodayInfo KHÔNG dùng ở đây: canChiMonth chưa rõ nhận
// Date hay (năm âm, tháng âm), còn getTodayInfo không cần cho trang theo ngày cụ
// thể. Trang vẫn đủ "ngày âm, can chi, giờ hoàng đạo, sao tốt/xấu" từ các hàm trên.
// Nếu một hàm engine không trả về đúng hình dạng, mục đó hiển thị "chưa có dữ liệu"
// thay vì làm hỏng cả trang.

export const dynamic = 'force-dynamic';

type Params = { params: { date: string } };

type LunarLike = { day: number; month: number; year: number; leap: boolean };

/** date phải đúng yyyy-mm-dd và là ngày có thật (kiểm tra bằng round-trip UTC). */
function parseNgayParam(date: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  return { year, month, day };
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Thử lần lượt các dạng tham số, trả về kết quả đầu tiên qua được `accept`. */
function tryShapes<T>(fn: unknown, attempts: unknown[][], accept: (value: unknown) => value is T): T | null {
  const callable = fn as unknown as (...args: unknown[]) => unknown;
  for (const args of attempts) {
    try {
      const result = callable(...args);
      if (accept(result)) return result;
    } catch {
      // Thử dạng tham số tiếp theo.
    }
  }
  return null;
}

function isLunarLike(value: unknown): value is LunarLike {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return typeof v.day === 'number' && typeof v.month === 'number' && typeof v.year === 'number';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeSolarToLunar(dateObj: Date): LunarLike | null {
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate();
  const result = tryShapes(solarToLunar, [[y, m, d], [dateObj], [d, m, y]], isLunarLike);
  return result ? { day: result.day, month: result.month, year: result.year, leap: !!result.leap } : null;
}

function safeCanChiDay(dateObj: Date): string | null {
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate();
  // Dạng đúng hợp đồng [năm, tháng, ngày] thử TRƯỚC — dạng Date chỉ là fallback.
  const result = tryShapes(canChiDay, [[y, m, d], [dateObj], [d, m, y]], isNonEmptyString);
  return result && !result.includes('undefined') ? result.trim() : null;
}

function safeCanChiYear(lunarYear: number, dateObj: Date): string | null {
  const result = tryShapes(canChiYear, [[lunarYear], [dateObj]], isNonEmptyString);
  return result ? result.trim() : null;
}

function safeHoangDaoHours(dateObj: Date): unknown {
  // hoangDaoHours cần chuỗi can chi ngày (hợp đồng engine), không nhận Date
  // hay (năm, tháng, ngày) — tính can chi trước rồi gọi trực tiếp.
  const ccDay = safeCanChiDay(dateObj);
  if (!ccDay) return null;
  try {
    return hoangDaoHours(ccDay);
  } catch {
    return null;
  }
}

function safeSaoNgay(dateObj: Date, lunarMonth?: number): unknown {
  // saoNgay cần chuỗi can chi ngày + tháng âm (optional) — tính can chi trước.
  const ccDay = safeCanChiDay(dateObj);
  if (!ccDay) return null;
  try {
    return saoNgay(ccDay, lunarMonth);
  } catch {
    try {
      return saoNgay(ccDay);
    } catch {
      return null;
    }
  }
}

/** Chuẩn hóa kết quả sao ngày về { tot, xau }. */
function normalizeSao(value: unknown): { tot: string[]; xau: string[] } {
  if (Array.isArray(value)) {
    return { tot: value.map((item) => String(item)), xau: [] };
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const pick = (keys: string[]): string[] => {
      for (const key of keys) {
        const arr = record[key];
        if (Array.isArray(arr)) return arr.map((item) => String(item));
      }
      return [];
    };
    return {
      tot: pick(['tot', 'saoTot', 'good', 'cat']),
      xau: pick(['xau', 'saoXau', 'bad', 'hung']),
    };
  }
  return { tot: [], xau: [] };
}

/** Chuẩn hóa giờ hoàng đạo: CHỈ giữ giờ có cờ hoangDao, kèm tên sao. */
function normalizeHours(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (typeof item === 'string') {
      out.push(item);
      continue;
    }
    if (item && typeof item === 'object') {
      const record = item as Record<string, unknown>;
      if (record.hoangDao !== true) continue;
      const gioKey = ['gio', 'hour', 'name', 'label'].find(
        (k) => typeof record[k] === 'string',
      );
      const label = gioKey ? (record[gioKey] as string) : '';
      const sao = typeof record.sao === 'string' ? record.sao : '';
      if (label) out.push(sao ? `${label} — ${sao}` : label);
    }
  }
  return out;
}

function getDayInfo(parsed: { year: number; month: number; day: number }) {
  const dateObj = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day));
  const lunar = safeSolarToLunar(dateObj);
  return {
    dateObj,
    lunar,
    canChiNam: lunar ? safeCanChiYear(lunar.year, dateObj) : null,
    canChiNgay: safeCanChiDay(dateObj),
    gioHoangDao: normalizeHours(safeHoangDaoHours(dateObj)),
    sao: normalizeSao(safeSaoNgay(dateObj, lunar?.month)),
  };
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const parsed = parseNgayParam(params.date);
  if (!parsed) notFound();
  const info = getDayInfo(parsed);
  const display = `${pad(parsed.day)}/${pad(parsed.month)}/${parsed.year}`;
  const lunarText = info.lunar
    ? `ngày ${info.lunar.day} tháng ${info.lunar.month}${info.lunar.leap ? ' nhuận' : ''} năm ${info.lunar.year} âm lịch`
    : 'âm lịch';
  return buildMetadata({
    title: `Lịch ngày ${display} — âm lịch, can chi, giờ hoàng đạo, sao tốt xấu`,
    description: `Lịch ngày ${display} (${lunarText}${info.canChiNgay ? `, ${info.canChiNgay}` : ''}). Giờ hoàng đạo: ${info.gioHoangDao.join(', ') || 'xem chi tiết'}. Sao tốt, sao xấu và giờ tốt tra theo lịch vạn niên — nội dung tham khảo.`,
    path: `/ngay/${params.date}`,
  });
}

export default function NgayPage({ params }: Params) {
  const parsed = parseNgayParam(params.date);
  if (!parsed) notFound();
  const info = getDayInfo(parsed);
  const display = `${pad(parsed.day)}/${pad(parsed.month)}/${parsed.year}`;
  const lunarText = info.lunar
    ? `Ngày ${info.lunar.day} tháng ${info.lunar.month}${info.lunar.leap ? ' nhuận' : ''} năm ${info.lunar.year} âm lịch`
    : null;
  const prev = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day - 1));
  const next = new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day + 1));
  const prevIso = toIso(prev.getUTCFullYear(), prev.getUTCMonth() + 1, prev.getUTCDate());
  const nextIso = toIso(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
  const shareTitle = `Lịch ngày ${display} — Khang An Phong Thủy`;
  const shareDetails = [
    lunarText ?? 'Chưa tính được ngày âm',
    `Can chi năm: ${info.canChiNam ?? '—'} — Can chi ngày: ${info.canChiNgay ?? '—'}`,
    `Giờ hoàng đạo: ${info.gioHoangDao.join(', ') || '—'}`,
    `Sao tốt: ${info.sao.tot.join(', ') || '—'}`,
  ].join('|');
  const shareHref = `/chia-se?t=${encodeURIComponent(shareTitle)}&d=${encodeURIComponent(shareDetails)}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Lịch ngày {display}</h1>

      <section className="card" aria-label="Trả lời nhanh">
        <p className="font-semibold">Trả lời nhanh</p>
        <p className="mt-2">
          {lunarText ? (
            <>
              Ngày {display} là {lunarText.toLowerCase()}
              {info.canChiNgay ? `, can chi ngày ${info.canChiNgay}` : ''}
              {info.canChiNam ? `, năm ${info.canChiNam}` : ''}. Giờ hoàng đạo:{' '}
              {info.gioHoangDao.length > 0 ? info.gioHoangDao.join(', ') : 'xem chi tiết bên dưới'}.
            </>
          ) : (
            'Hiện chưa tính được lịch âm cho ngày này, vui lòng thử lại sau.'
          )}
        </p>
      </section>

      <section className="card" aria-label="Âm lịch và can chi">
        <h2 className="font-display text-xl font-bold text-primary">Âm lịch và can chi</h2>
        <ul className="mt-3 space-y-2">
          <li>
            <span className="font-semibold">Ngày âm: </span>
            {lunarText ?? 'Chưa có dữ liệu.'}
          </li>
          <li>
            <span className="font-semibold">Can chi năm: </span>
            {info.canChiNam ?? 'Chưa có dữ liệu.'}
          </li>
          <li>
            <span className="font-semibold">Can chi ngày: </span>
            {info.canChiNgay ?? 'Chưa có dữ liệu.'}
          </li>
        </ul>
      </section>

      <section className="card" aria-label="Giờ hoàng đạo">
        <h2 className="font-display text-xl font-bold text-primary">Giờ hoàng đạo</h2>
        {info.gioHoangDao.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {info.gioHoangDao.map((gio) => (
              <span key={gio} className="chip">
                {gio}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-3">Chưa có dữ liệu giờ hoàng đạo cho ngày này.</p>
        )}
      </section>

      <section className="card" aria-label="Sao tốt và sao xấu">
        <h2 className="font-display text-xl font-bold text-primary">Sao tốt và sao xấu</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <h3 className="font-semibold">Sao tốt</h3>
            {info.sao.tot.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {info.sao.tot.map((sao) => (
                  <li key={sao}>{sao}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">Không có sao tốt ghi nhận.</p>
            )}
          </div>
          <div>
            <h3 className="font-semibold">Sao xấu</h3>
            {info.sao.xau.length > 0 ? (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {info.sao.xau.map((sao) => (
                  <li key={sao}>{sao}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">Không có sao xấu ghi nhận.</p>
            )}
          </div>
        </div>
      </section>

      <p className="card text-sm opacity-90">
        Lưu ý: nội dung trên trang này chỉ mang tính tham khảo theo lịch vạn niên và các bảng tra
        truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.
      </p>

      <nav className="flex flex-wrap gap-3" aria-label="Điều hướng ngày">
        <a href={`/ngay/${prevIso}`} className="btn-gold">
          ← Ngày trước
        </a>
        <a href={`/ngay/${nextIso}`} className="btn-gold">
          Ngày sau →
        </a>
        <a href={shareHref} className="btn-primary">
          Tạo thẻ chia sẻ ngày này
        </a>
      </nav>
    </div>
  );
}
