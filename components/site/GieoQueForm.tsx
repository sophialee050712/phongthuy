'use client';

import { useMemo, useState } from 'react';
import Disclaimer from './Disclaimer';
import { parseISODate, todayISO } from './format';

export type QueDon = {
  ten: string;
  tuong: string;
  hanh: string;
  yNghia: string;
};

/**
 * 8 quẻ đơn (bát quái) — tập duy nhất mà trang này dùng. Ý nghĩa chỉ ở
 * mức ngắn gọn, trung tính theo tượng quái phổ biến; KHÔNG bịa ý nghĩa của
 * 64 quẻ kép (quẻ kép chưa được hỗ trợ trên site).
 */
export const QUE_DON: QueDon[] = [
  {
    ten: 'Càn',
    tuong: 'Trời',
    hanh: 'Kim',
    yNghia:
      'Tượng Trời: sáng tạo, chủ động, mạnh mẽ. Ngày này thuận cho việc mở đầu, quyết đoán và đi đầu — nhưng tránh độc đoán, nóng vội.',
  },
  {
    ten: 'Đoài',
    tuong: 'Đầm (hồ)',
    hanh: 'Kim',
    yNghia:
      'Tượng Đầm: vui vẻ, giao tiếp, hòa hợp. Ngày này thuận cho gặp gỡ, trò chuyện, hóa giải hiểu lầm bằng lời lẽ nhẹ nhàng.',
  },
  {
    ten: 'Ly',
    tuong: 'Lửa',
    hanh: 'Hỏa',
    yNghia:
      'Tượng Lửa: sáng tỏ, rõ ràng, rực rỡ. Ngày này thuận cho việc cần làm rõ, phô bày, quyết định công khai — nhưng tránh nóng nảy, vội vàng.',
  },
  {
    ten: 'Chấn',
    tuong: 'Sấm',
    hanh: 'Mộc',
    yNghia:
      'Tượng Sấm: chuyển động, bất ngờ, khởi động. Ngày này có thể có biến động đột ngột — giữ bình tĩnh, ứng biến linh hoạt, tránh hoảng loạn.',
  },
  {
    ten: 'Tốn',
    tuong: 'Gió',
    hanh: 'Mộc',
    yNghia:
      'Tượng Gió: mềm dẻo, thuận theo, len lỏi. Ngày này thuận cho việc cần kiên nhẫn, thuyết phục từ từ, đi đường vòng thay vì đối đầu.',
  },
  {
    ten: 'Khảm',
    tuong: 'Nước',
    hanh: 'Thủy',
    yNghia:
      'Tượng Nước: khó khăn, thử thách, hiểm trở. Ngày này nên thận trọng, giữ vững, tránh mạo hiểm — khó khăn qua đi nếu kiên trì.',
  },
  {
    ten: 'Cấn',
    tuong: 'Núi',
    hanh: 'Thổ',
    yNghia:
      'Tượng Núi: dừng lại, tĩnh lặng, vững chãi. Ngày này thuận cho việc suy xét, nghỉ ngơi, dừng lại trước khi tiến — tránh cố tiến khi chưa rõ.',
  },
  {
    ten: 'Khôn',
    tuong: 'Đất',
    hanh: 'Thổ',
    yNghia:
      'Tượng Đất: bao dung, tiếp nhận, bền bỉ. Ngày này thuận cho việc cần nhẫn nại, lắng nghe, nâng đỡ người khác và làm việc thầm lặng.',
  },
];

/** Băm FNV-1a đơn giản, xác định (deterministic) theo chuỗi đầu vào. */
export function hashChuoi(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

/**
 * Quẻ của một ngày: chỉ phụ thuộc vào chuỗi 'YYYY-MM-DD' của ngày đó nên
 * cùng một ngày luôn ra cùng một quẻ, ai gieo cũng giống nhau. Trả null
 * khi chuỗi ngày không hợp lệ.
 */
export function queCuaNgay(isoNgay: string): QueDon | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoNgay)) return null;
  if (!parseISODate(isoNgay)) return null;
  return QUE_DON[hashChuoi(isoNgay) % QUE_DON.length];
}

/**
 * Gieo quẻ hằng ngày: quẻ tính theo NGÀY, không theo người gieo và không
 * theo giờ gieo. Ô câu hỏi chỉ là ghi chú để bạn tự nhớ mình đang băn khoăn
 * điều gì — nó không làm thay đổi quẻ.
 */
export default function GieoQueForm() {
  const [ngay, setNgay] = useState(todayISO());
  const [cauHoi, setCauHoi] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    return queCuaNgay(ngay);
  }, [submitted, ngay]);

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="gq-ngay">
            Ngày gieo quẻ (mặc định là hôm nay)
          </label>
          <input
            id="gq-ngay"
            type="date"
            className="input"
            value={ngay}
            onChange={(e) => {
              setNgay(e.target.value);
              setSubmitted(false);
            }}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="gq-cauhoi">
            Câu hỏi của bạn (tùy chọn — chỉ để ghi chú, không làm đổi quẻ)
          </label>
          <input
            id="gq-cauhoi"
            type="text"
            className="input"
            placeholder="Ví dụ: Hôm nay có nên bắt đầu việc mới không?"
            value={cauHoi}
            onChange={(e) => {
              setCauHoi(e.target.value);
              setSubmitted(false);
            }}
          />
        </div>
        <button type="submit" className="btn-primary">
          Gieo quẻ
        </button>
      </form>

      {submitted ? (
        ketQua ? (
          <div className="space-y-4">
            <div className="card space-y-2">
              <h2 className="font-display text-xl font-bold text-primary">
                Quẻ ngày {ngay}: {ketQua.ten} — {ketQua.tuong} ({ketQua.hanh})
              </h2>
              {cauHoi.trim() ? (
                <p>
                  Câu hỏi bạn ghi chú: <em>{cauHoi.trim()}</em>
                </p>
              ) : null}
              <p>{ketQua.yNghia}</p>
              <p className="text-sm text-ink/70">
                Quẻ được tính cố định từ ngày {ngay} (cùng ngày luôn ra cùng quẻ, không phụ
                thuộc người gieo hay giờ gieo). Site hiện chỉ dùng 8 quẻ đơn; 64 quẻ kép và hào
                động chưa được hỗ trợ nên không hiển thị ở đây.
              </p>
            </div>
            <Disclaimer text="Quẻ hằng ngày chỉ mang tính tham khảo, giải trí theo tượng quái truyền thống — không phải lời khuyên hay dự đoán chắc chắn cho quyết định quan trọng." />
          </div>
        ) : (
          <p className="card">Ngày chưa hợp lệ. Vui lòng chọn lại ngày.</p>
        )
      ) : null}
    </div>
  );
}
