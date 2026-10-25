'use client';

import { useMemo, useState } from 'react';
import { thanSoHoc } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import { fmtSolar, parseISODate, todayISO } from './format';

/**
 * Thần số học: số chủ đạo từ ngày sinh dương lịch, dùng đúng công thức
 * engine (cộng tất cả chữ số của ngày + tháng + năm rồi rút gọn, giữ số
 * master 11, 22). Không suy ra thêm điều gì ngoài giải thích engine trả về.
 * Khi tra cứu, ngày sinh được lưu vào localStorage key 'khang-an-birthdate'
 * để các công cụ khác (xem ngày, xem theo việc) tự điền tuổi cho bạn —
 * chỉ lưu trên trình duyệt của bạn, không gửi đi đâu.
 */
export default function ThanSoForm() {
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    if (!d) return null;
    try {
      const r = thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear()) as unknown as {
        soChuDao?: unknown;
        giaiThich?: unknown;
      };
      const so = typeof r.soChuDao === 'number' ? r.soChuDao : Number(r.soChuDao);
      if (Number.isNaN(so)) return { d, error: true as const };
      return { d, soChuDao: so, giaiThich: String(r.giaiThich ?? ''), error: false as const };
    } catch {
      return { d, error: true as const };
    }
  }, [submitted, ngaySinh]);

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            window.localStorage.setItem('khang-an-birthdate', ngaySinh);
          } catch {
            // Không lưu được (chế độ ẩn danh…) thì vẫn hiển thị kết quả.
          }
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="tsh-ngay">
            Ngày sinh dương lịch
          </label>
          <input
            id="tsh-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => {
              setNgaySinh(e.target.value);
              setSubmitted(false);
            }}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Tính số chủ đạo
        </button>
      </form>

      {ketQua ? (
        ketQua.error ? (
          <p className="card">Chưa tính được số chủ đạo cho ngày này. Vui lòng thử lại.</p>
        ) : (
          <div className="space-y-4">
            <div className="card space-y-2">
              <h2 className="font-display text-xl font-bold text-primary">Số chủ đạo của bạn</h2>
              <p>
                Ngày sinh: <strong>{fmtSolar(ketQua.d)}</strong> (dương lịch)
              </p>
              <p className="text-2xl">
                Số chủ đạo: <strong className="text-primary">{ketQua.soChuDao}</strong>
              </p>
              <p>{ketQua.giaiThich}</p>
              <p className="text-sm text-ink/70">
                Cách tính (theo engine): cộng tất cả chữ số của ngày + tháng + năm sinh rồi rút
                gọn về một chữ số, giữ nguyên số master 11 và 22. Kết quả mang tính tham khảo,
                mô tả xu hướng chung — không phải kết luận về tính cách hay vận mệnh của một
                người cụ thể.
              </p>
            </div>
            <Disclaimer />
          </div>
        )
      ) : null}
    </div>
  );
}
