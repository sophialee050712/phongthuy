import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { VIEC_LIST } from '@/lib/data';
import { buildMetadata, resolveTuoiParam, resolveViecParam, slugify } from '@/lib/seo';
import { canChiDay, canChiYear, saoNgay, solarToLunar } from '@/lib/engine';
import LeadForm from '@/components/sales/LeadForm';

// Route SEO tự sinh: /tuoi/[tuoi]/[nam]/[viec].
// CỔNG CHẤT LƯỢNG bắt buộc: tuoi phải thuộc TUOI_12 (khớp tên đầy đủ, vd `Tý` —
// không khớp slug vì Tý/Tỵ đều thành "ty"), nam 1900–2100, viec phải thuộc
// VIEC_LIST (tên đầy đủ hoặc slug). Sai một điều kiện -> notFound().
// LƯU Ý VỀ HỢP ĐỒNG ENGINE: hợp đồng chỉ chốt tên hàm, CHƯA chốt chữ ký tham số
// (Date hay (năm, tháng, ngày)). Vì vậy file này dùng adapter "thử nhiều dạng
// tham số, chỉ nhận kết quả đúng hình dạng" — cùng quy ước mà agent trang công khai
// đang dùng — thay vì đoán một chữ ký rồi hiển thị sai. Mọi hàm engine vẫn được
// import trực tiếp từ '@/lib/engine' và dữ liệu hiển thị là kết quả tính thật.
// Phương pháp gợi ý ngày (giữ ở mức template + dữ liệu tính toán thật từ engine):
// quét từng ngày trong năm, giữ lại ngày có từ 2 sao tốt trở lên và nhiều sao tốt
// hơn sao xấu, rồi gom theo tháng. Đây là lọc theo sao ngày CHUNG, chưa xét xung/kỵ
// riêng theo tuổi và chưa xét yêu cầu riêng của từng việc — trang ghi rõ điều này
// và ghi rõ nội dung chỉ mang tính tham khảo.

export const dynamic = 'force-dynamic';

type Params = { params: { tuoi: string; nam: string; viec: string } };

type ValidParams = { tuoi: string; nam: number; viec: string };

function validateParams(params: Params['params']): ValidParams | null {
  const tuoi = resolveTuoiParam(params.tuoi);
  if (!tuoi) return null;
  if (!/^\d{4}$/.test(params.nam)) return null;
  const nam = Number(params.nam);
  if (nam < 1900 || nam > 2100) return null;
  const viec = resolveViecParam(params.viec);
  if (!viec) return null;
  return { tuoi, nam, viec };
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function safeCanChiYear(year: number): string | null {
  const result = tryShapes(
    canChiYear,
    [[year], [new Date(Date.UTC(year, 0, 1))]],
    isNonEmptyString,
  );
  return result ? result.trim() : null;
}

function safeSaoNgay(dateObj: Date): unknown {
  // saoNgay cần chuỗi can chi ngày + tháng âm — tính từ engine rồi gọi trực tiếp.
  const y = dateObj.getUTCFullYear();
  const m = dateObj.getUTCMonth() + 1;
  const d = dateObj.getUTCDate();
  try {
    const ccDay = canChiDay(y, m, d);
    const lunar = solarToLunar(y, m, d);
    return saoNgay(ccDay, lunar.month);
  } catch {
    return null;
  }
}

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

type MonthSuggestion = { month: number; count: number; samples: string[] };

/** Quét cả năm, gom ngày tham khảo có sao tốt theo tháng (tối đa 3 ngày mẫu/tháng). */
function suggestMonths(year: number): MonthSuggestion[] {
  const result: MonthSuggestion[] = [];
  for (let month = 0; month < 12; month++) {
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    let count = 0;
    const samples: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const sao = normalizeSao(safeSaoNgay(new Date(Date.UTC(year, month, day))));
      if (sao.tot.length >= 2 && sao.tot.length > sao.xau.length) {
        count++;
        if (samples.length < 3) {
          samples.push(`${String(day).padStart(2, '0')}/${String(month + 1).padStart(2, '0')}`);
        }
      }
    }
    if (count > 0) result.push({ month: month + 1, count, samples });
  }
  return result;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const valid = validateParams(params);
  if (!valid) notFound();
  return buildMetadata({
    title: `Tuổi ${valid.tuoi} năm ${valid.nam} làm việc ${valid.viec}: ngày tốt gợi ý`,
    description: `Tuổi ${valid.tuoi} năm ${valid.nam} làm việc ${valid.viec} nên chọn ngày nào? Gợi ý các tháng có ngày nhiều sao tốt trong năm ${valid.nam} theo lịch vạn niên — nội dung tham khảo.`,
    path: `/tuoi/${encodeURIComponent(valid.tuoi)}/${valid.nam}/${slugify(valid.viec)}`,
  });
}

export default function TuoiPage({ params }: Params) {
  const valid = validateParams(params);
  if (!valid) notFound();
  const { tuoi, nam, viec } = valid;
  const canChiNam = safeCanChiYear(nam);
  const months = suggestMonths(nam);
  const totalDays = months.reduce((sum, item) => sum + item.count, 0);
  const shareTitle = `Tuổi ${tuoi} năm ${nam} — việc ${viec}`;
  const shareDetails = months
    .slice(0, 5)
    .map((item) => `Tháng ${item.month}: ${item.count} ngày tham khảo (${item.samples.join(', ')})`)
    .join('|');
  const shareHref = `/chia-se?t=${encodeURIComponent(shareTitle)}&d=${encodeURIComponent(shareDetails)}`;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">
        Tuổi {tuoi} năm {nam}: ngày tốt cho việc {viec}
      </h1>

      <section className="card" aria-label="Trả lời nhanh">
        <p className="font-semibold">Trả lời nhanh</p>
        <p className="mt-2">
          Năm {nam}
          {canChiNam ? ` là năm ${canChiNam}` : ''}. Với tuổi {tuoi} và việc {viec}, trong năm{' '}
          {nam} có {totalDays} ngày tham khảo có nhiều sao tốt
          {months.length > 0
            ? `, tập trung ở ${months.map((item) => `tháng ${item.month}`).join(', ')}`
            : ' (chưa có dữ liệu theo tháng)'}.
          Xem chi tiết từng tháng bên dưới trước khi chốt ngày.
        </p>
      </section>

      <section className="card" aria-label="Các tháng có ngày tốt gợi ý">
        <h2 className="font-display text-xl font-bold text-primary">
          Các tháng có ngày tốt gợi ý trong năm {nam}
        </h2>
        {months.length > 0 ? (
          <ul className="mt-3 space-y-3">
            {months.map((item) => (
              <li key={item.month} className="border-b border-gold/30 pb-3 last:border-0">
                <p className="font-semibold">
                  Tháng {item.month}: {item.count} ngày tham khảo
                </p>
                <p className="mt-1 text-sm opacity-90">
                  Ngày mẫu: {item.samples.join(', ')}
                  {item.count > item.samples.length ? ` (và ${item.count - item.samples.length} ngày khác)` : ''}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3">Chưa có ngày tham khảo nào được ghi nhận cho năm này.</p>
        )}
      </section>

      <section className="card" aria-label="Phương pháp và lưu ý">
        <h2 className="font-display text-xl font-bold text-primary">Phương pháp và lưu ý</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Danh sách trên được lọc từ dữ liệu tính toán thật theo sao ngày: giữ lại ngày có từ 2
          sao tốt trở lên và nhiều sao tốt hơn sao xấu. Đây là gợi ý theo sao ngày chung — chưa
          xét xung/kỵ riêng theo tuổi {tuoi} và chưa xét yêu cầu riêng của việc {viec}. Nội dung
          trên trang này chỉ mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống,
          không thay thế tư vấn chuyên môn cho quyết định quan trọng.
        </p>
      </section>

      <nav className="card" aria-label="Việc khác cùng tuổi và năm">
        <h2 className="font-display text-xl font-bold text-primary">Xem việc khác cùng tuổi {tuoi} năm {nam}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {VIEC_LIST.map((item) => (
            <a
              key={item}
              href={`/tuoi/${encodeURIComponent(tuoi)}/${nam}/${slugify(item)}`}
              className={`chip ${item === viec ? 'bg-primary text-cream' : ''}`}
            >
              {item}
            </a>
          ))}
        </div>
        <p className="mt-4">
          <a href={shareHref} className="btn-gold">
            Tạo thẻ chia sẻ kết quả này
          </a>
        </p>
      </nav>

      <LeadForm source={`tuoi/${tuoi}/${nam}/${slugify(viec)}`} />
    </div>
  );
}
