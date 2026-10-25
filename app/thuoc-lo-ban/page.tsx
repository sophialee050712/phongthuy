'use client';

import { useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import {
  LOBAN_CYCLE_MM,
  LOBAN_MAJORS,
  LOBAN_MAJOR_MM,
  formatCm,
  formatMm,
  lookupLoBan,
  nearestAuspicious,
  parseLoBanInput,
} from '@/lib/engine/loban';

const VAT_DUNG = [
  'Cửa đi / cửa chính (lọt lòng)',
  'Cửa sổ (lọt lòng)',
  'Cổng (lọt lòng)',
  'Giếng trời / ô thoáng',
  'Bàn thờ',
  'Giường, tủ, bàn ghế',
  'Khác',
];

export default function ThuocLoBanPage() {
  const [raw, setRaw] = useState('');
  const [unit, setUnit] = useState<'cm' | 'mm'>('cm');
  const [vatDung, setVatDung] = useState(VAT_DUNG[0]);
  const [submitted, setSubmitted] = useState(false);

  const parsed = useMemo(() => parseLoBanInput(raw, unit), [raw, unit]);
  const error = submitted && 'error' in parsed ? parsed.error : null;
  const result = useMemo(() => {
    if (!submitted || !('mm' in parsed)) return null;
    const lookup = lookupLoBan(parsed.mm);
    const near = nearestAuspicious(parsed.mm);
    const cycles = Math.floor(parsed.mm / LOBAN_CYCLE_MM);
    return { lookup, near, cycles };
  }, [submitted, parsed]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">
        Thước Lỗ Ban 52,2 cm (thông thủy)
      </h1>
      <p className="text-ink/80">
        Nhập chiều dài cần tra — ví dụ chiều rộng hoặc chiều cao lọt lòng của cửa, cửa sổ.
        Thước này dài 52,2 cm, chia thành 8 cung lớn; số đo dài hơn 52,2 cm sẽ{' '}
        <strong>quấn theo chu kỳ 522 mm</strong> (lấy phần dư sau khi chia cho 522), vì vậy
        một cánh cửa cao 210 cm và một đoạn 12 mm có cùng vị trí trên thước.
      </p>
      <p className="text-sm text-ink/80">
        Lưu ý: thước 52,2 cm theo truyền thống dùng cho khoảng{' '}
        <strong>thông thủy</strong> (khoảng trống lọt lòng, lọt sáng). Đo khối đặc như bếp,
        bệ, bậc theo truyền thống dùng thước 42,9 cm — không phải thước này — nên kết quả
        ở đây chỉ có nghĩa khi bạn đo khoảng thông thủy.
      </p>

      <form className="card space-y-4" onSubmit={submit}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="lb-so-do">
              Số đo
            </label>
            <input
              id="lb-so-do"
              className="input"
              inputMode="decimal"
              placeholder="Ví dụ: 81,5"
              value={raw}
              onChange={(e) => {
                setRaw(e.target.value);
                setSubmitted(false);
              }}
            />
            {error ? (
              <p role="alert" className="mt-1 text-sm text-red-700">
                {error}
              </p>
            ) : (
              <p className="mt-1 text-xs text-ink/70">
                Số dương, tối đa 100 m. Có thể dùng dấu phẩy thập phân, ví dụ 81,5.
              </p>
            )}
          </div>
          <div>
            <span className="label">Đơn vị</span>
            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lb-dv"
                  checked={unit === 'cm'}
                  onChange={() => {
                    setUnit('cm');
                    setSubmitted(false);
                  }}
                />
                cm
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="lb-dv"
                  checked={unit === 'mm'}
                  onChange={() => {
                    setUnit('mm');
                    setSubmitted(false);
                  }}
                />
                mm
              </label>
            </div>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="lb-vat">
            Đo cho vật dụng nào? (chỉ để ghi chú, không làm đổi kết quả)
          </label>
          <select
            id="lb-vat"
            className="input"
            value={vatDung}
            onChange={(e) => setVatDung(e.target.value)}
          >
            {VAT_DUNG.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Tra thước
        </button>
      </form>

      {result && (
        <div className="space-y-4">
          <div className="card space-y-2">
            <p className="text-sm text-ink/80">
              Số đo {formatCm(result.lookup.inputMm)} cm ({formatMm(result.lookup.inputMm)}{' '}
              mm) — {vatDung.toLowerCase()}
              {result.cycles > 0 && (
                <>
                  {' '}
                  = {result.cycles} chu kỳ 52,2 cm + phần dư{' '}
                  {formatCm(result.lookup.remainderMm)} cm
                </>
              )}
              .
            </p>
            <p className="text-lg">
              Cung lớn: <strong>{result.lookup.major.name}</strong>
              {result.lookup.major.alias && (
                <span className="text-sm text-ink/70"> (còn gọi là {result.lookup.major.alias})</span>
              )}{' '}
              —{' '}
              <span
                className={`font-bold ${
                  result.lookup.major.tot ? 'text-green-700' : 'text-red-700'
                }`}
              >
                {result.lookup.major.tot ? 'cung tốt' : 'cung xấu'}
              </span>
            </p>
            <p className="text-lg">
              Tiểu cung: <strong>{result.lookup.minor.name}</strong>
              {!result.lookup.minor.verified && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  chưa xác minh
                </span>
              )}
              <span className="text-sm text-ink/70">
                {' '}
                ({formatCm(result.lookup.minorStartMm)} – {formatCm(result.lookup.minorEndMm)}{' '}
                cm trong chu kỳ)
              </span>
            </p>
            <p className="text-sm text-ink/80">{result.lookup.major.meaning}</p>
            {!result.lookup.minor.verified && (
              <p className="text-sm text-amber-800">
                Tên tiểu cung này chưa đối chiếu được với từ hai nguồn trở lên nên chỉ ghi
                để tham khảo, không dùng làm căn cứ chắc chắn.
              </p>
            )}
            {/* Dải thước: 8 cung lớn, vạch đánh dấu vị trí phần dư. */}
            <div>
              <div className="relative flex overflow-hidden rounded border border-gold/40">
                {LOBAN_MAJORS.map((m, i) => (
                  <div
                    key={m.name}
                    className={`flex-1 px-1 py-2 text-center text-[11px] font-semibold leading-tight ${
                      m.tot ? 'bg-green-100 text-green-900' : 'bg-red-100 text-red-900'
                    }`}
                    title={`${m.name} (${formatCm(i * LOBAN_MAJOR_MM)} – ${formatCm((i + 1) * LOBAN_MAJOR_MM)} cm)`}
                  >
                    {m.name}
                  </div>
                ))}
                <div
                  className="absolute top-0 h-full w-0.5 bg-primary"
                  style={{
                    left: `${(result.lookup.remainderMm / LOBAN_CYCLE_MM) * 100}%`,
                  }}
                  aria-hidden
                />
              </div>
              <p className="mt-1 text-xs text-ink/70">
                Vạch đậm là vị trí phần dư {formatCm(result.lookup.remainderMm)} cm của bạn
                trên một chu kỳ thước. Cung lớn dài 6,525 cm; tiểu cung dài 1,305 cm.
              </p>
            </div>
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">
              Điều chỉnh để vào cung tốt
            </h2>
            {result.lookup.major.tot ? (
              <p className="text-sm">
                Số đo đã rơi vào cung tốt ({result.lookup.major.name}), không cần bớt đi.
              </p>
            ) : (
              <p className="text-sm">
                Bớt <strong>{formatCm(result.near.below.deltaMm)} cm</strong> (xuống còn{' '}
                {formatCm(result.near.below.targetMm)} cm) để vào cung{' '}
                <strong>{result.near.below.majorName}</strong>.
              </p>
            )}
            <p className="text-sm">
              Thêm <strong>{formatCm(result.near.above.deltaMm)} cm</strong> (lên thành{' '}
              {formatCm(result.near.above.targetMm)} cm) để vào cung{' '}
              <strong>{result.near.above.majorName}</strong>.
            </p>
            <p className="text-xs text-ink/70">
              “Cung tốt gần nhất” tính theo cung lớn: cung tốt là Quý Nhân, Thiên Tài, Nhân
              Lộc và Tể Tướng. Tiểu cung kế thừa tốt/xấu của cung lớn chứa nó.
            </p>
          </div>
        </div>
      )}

      <div className="card space-y-2">
        <h2 className="font-display text-xl font-bold text-primary">
          Bảng 8 cung lớn (một chu kỳ 52,2 cm)
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-gold/40 text-left">
                <th className="py-1 pr-2">Cung lớn</th>
                <th className="py-1 pr-2">Khoảng trong chu kỳ</th>
                <th className="py-1 pr-2">Tốt / xấu</th>
                <th className="py-1">Tiểu cung</th>
              </tr>
            </thead>
            <tbody>
              {LOBAN_MAJORS.map((m, i) => (
                <tr key={m.name} className="border-b border-gold/20 align-top">
                  <td className="py-1 pr-2 font-semibold">
                    {m.name}
                    {m.alias && (
                      <span className="block text-xs font-normal text-ink/70">
                        còn gọi: {m.alias}
                      </span>
                    )}
                  </td>
                  <td className="py-1 pr-2">
                    {formatCm(i * LOBAN_MAJOR_MM)} – {formatCm((i + 1) * LOBAN_MAJOR_MM)} cm
                  </td>
                  <td className="py-1 pr-2">
                    <span className={m.tot ? 'font-semibold text-green-700' : 'font-semibold text-red-700'}>
                      {m.tot ? 'Tốt' : 'Xấu'}
                    </span>
                  </td>
                  <td className="py-1">
                    {m.minors.map((s) => s.name).join(' · ')}
                    {m.minors.some((s) => !s.verified) && (
                      <span className="ml-1 text-xs font-semibold text-amber-800">
                        (chưa xác minh)
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink/70">
          Ghi chú về số liệu: nhiều nguồn phổ biến ghi mỗi cung lớn 65 mm và mỗi tiểu
          cung 13 mm (8 × 65 = 520 mm); công cụ dùng 65,25 mm/cung và 13,05 mm/tiểu
          cung (= 522 ÷ 8 ÷ 5) để các khoảng khép đúng chu kỳ 522 mm — chênh lệch tối
          đa 2 mm ở cuối chu kỳ so với cách ghi 65 mm. Một số nguồn khác chia mỗi cung
          lớn thành 4 tiểu cung thay vì 5; công cụ theo phương án 5 tiểu cung vì đa số
          nguồn đối chiếu ghi như vậy.
        </p>
      </div>

      <div className="card space-y-1 text-sm text-ink/80">
        <h2 className="font-display text-xl font-bold text-primary">Nguồn đối chiếu</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Mê Nội Thất — “Cách sử dụng thước Lỗ Ban”: menoithat.vn/cach-su-dung-thuoc-lo-ban
            (đọc toàn văn; tên và tốt/xấu của 8 cung lớn, tên tiểu cung của 7 cung lớn).
          </li>
          <li>
            Phong Thủy Anh Vũ — “Cách tra kích thước Lỗ Ban”: daquyanhvu.com
            (8 cung lớn, thứ tự, tốt/xấu, chu kỳ 522 mm, 5 tiểu cung/cung lớn).
          </li>
          <li>
            Kiến Trúc An Hưng — “Cách xem thước Lỗ Ban”: kientrucanhung.com (cùng 8 cung
            lớn, thứ tự và tốt/xấu; 65 mm/cung, 5 tiểu cung 13 mm).
          </li>
        </ul>
        <p>
          Tiểu cung của cung Thiên Tai chỉ gặp ở một nguồn tóm tắt và nguồn chính không
          liệt kê, nên toàn bộ tiểu cung Thiên Tai được đánh dấu “chưa xác minh” trong
          công cụ này.
        </p>
      </div>

      <Disclaimer text="Kết quả tra cứu mang tính tham khảo theo bảng tra truyền thống của thước Lỗ Ban 52,2 cm, không thay thế đo đạc thực tế hay tư vấn chuyên môn cho quyết định xây dựng quan trọng. Công cụ này chỉ tra cứu tự động, không có thầy tư vấn." />
    </div>
  );
}
