'use client';

import { useMemo, useState } from 'react';
import { solarToLunar } from '@/lib/engine';
import Disclaimer from './Disclaimer';

/**
 * Đổi ngày âm lịch sang dương lịch bằng cách QUÉT các ngày dương trong năm
 * và đối chiếu solarToLunar — vì engine chỉ có chiều dương→âm, không có
 * hàm âm→dương. Trả null khi năm đó không có ngày âm cần tìm (ví dụ ngày
 * 30 của một tháng âm chỉ có 29 ngày).
 */
export function findSolarForLunar(
  solarYear: number,
  lunarMonth: number,
  lunarDay: number,
  leap = false,
): { y: number; m: number; d: number } | null {
  if (
    !Number.isInteger(solarYear) ||
    !Number.isInteger(lunarMonth) ||
    lunarMonth < 1 ||
    lunarMonth > 12 ||
    !Number.isInteger(lunarDay) ||
    lunarDay < 1 ||
    lunarDay > 30
  ) {
    return null;
  }
  for (let m = 1; m <= 12; m++) {
    const daysInMonth = new Date(Date.UTC(solarYear, m, 0)).getUTCDate();
    for (let d = 1; d <= daysInMonth; d++) {
      let lunar: { day: number; month: number; year: number; leap?: boolean };
      try {
        lunar = solarToLunar(solarYear, m, d);
      } catch {
        continue;
      }
      if (lunar.month === lunarMonth && lunar.day === lunarDay && !!lunar.leap === leap) {
        return { y: solarYear, m, d };
      }
    }
  }
  return null;
}

function fmtSolarDate(y: number, m: number, d: number): string {
  return `ngày ${d} tháng ${m} năm ${y}`;
}

type VanKhan = { tieuDe: string; moTa: string; noiDung: string };

/**
 * Thư viện văn khấn TRUYỀN THỐNG DẠNG CHUNG (văn bản tham khảo, có chỗ
 * trống trong [ngoặc] để gia đình tự điền). Không khẳng định đây là bản
 * văn khấn chuẩn duy nhất của một địa phương hay dòng họ nào — gia đình
 * điều chỉnh theo phong tục địa phương và hướng dẫn của người lớn trong họ.
 */
export const VAN_KHAN_LIST: VanKhan[] = [
  {
    tieuDe: 'Văn khấn giỗ thường (ngày giỗ hằng năm)',
    moTa: 'Dùng vào ngày giỗ hằng năm của người đã khuất.',
    noiDung: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy Đức Đương cảnh Thành Hoàng chư vị Đại Vương.
Con kính lạy ngài Đông Trù Tư Mệnh Táo Phủ Thần Quân.
Con kính lạy các ngài Thần Linh, Thổ Địa cai quản trong xứ này.
Con kính lạy chư gia tiên Cao Tằng Tổ Khảo, Cao Tằng Tổ Tỷ, Bá thúc huynh đệ, cô di tỷ muội, nội ngoại họ [họ của gia đình].

Hôm nay là ngày [ngày] tháng [tháng] năm [năm âm lịch].
Tại [địa chỉ]: gia đình chúng con là [tên người đứng cúng] cùng toàn thể con cháu, thành tâm sắm sửa lễ vật, hương hoa, trà quả, thắp nén tâm hương, dâng lên trước án, kính mời hương linh [tên người đã khuất] về hưởng lễ vật.

Chúng con kính xin hương linh phù hộ độ trì cho con cháu mạnh khỏe, bình an, gia đạo thuận hòa, công việc hanh thông. Chúng con lễ bạc tâm thành, cúi xin chứng giám.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    tieuDe: 'Văn khấn giỗ đầu',
    moTa: 'Dùng vào giỗ đầu (ngày giỗ đầu tiên sau khi người thân qua đời).',
    noiDung: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy các ngài Thần Linh, Thổ Địa cai quản trong xứ này.
Con kính lạy chư gia tiên nội ngoại họ [họ của gia đình].

Hôm nay là ngày [ngày] tháng [tháng] năm [năm âm lịch], là ngày giỗ đầu của [tên người đã khuất].
Tại [địa chỉ]: gia đình chúng con thành tâm sắm sửa lễ vật, hương hoa, trà quả, dâng lên trước án, kính mời hương linh về hưởng lễ vật, chứng giám lòng thành của con cháu.

Từ ngày người khuất núi, con cháu vẫn luôn tưởng nhớ. Chúng con kính xin hương linh phù hộ cho gia đạo bình an, con cháu thuận hòa, tưởng nhớ không quên công ơn dưỡng dục, sinh thành.

Nam mô A Di Đà Phật! (3 lần)`,
  },
  {
    tieuDe: 'Văn khấn giỗ hết (mãn tang)',
    moTa: 'Dùng khi hết thời gian để tang theo phong tục gia đình (thường sau 2–3 năm, tùy phong tục địa phương).',
    noiDung: `Nam mô A Di Đà Phật! (3 lần)

Con lạy chín phương Trời, mười phương Chư Phật, Chư Phật mười phương.
Con kính lạy các ngài Thần Linh, Thổ Địa cai quản trong xứ này.
Con kính lạy chư gia tiên nội ngoại họ [họ của gia đình].

Hôm nay là ngày [ngày] tháng [tháng] năm [năm âm lịch], gia đình chúng con làm lễ giỗ hết cho [tên người đã khuất].
Tại [địa chỉ]: chúng con thành tâm sắm sửa lễ vật, hương hoa, trà quả, dâng lên trước án, kính mời hương linh về hưởng lễ vật.

Từ nay, tang phục xin được mãn, nhưng lòng tưởng nhớ vẫn không nguôi. Chúng con kính xin hương linh phù hộ cho con cháu mạnh khỏe, bình an, gia đạo hưng thịnh.

Nam mô A Di Đà Phật! (3 lần)`,
  },
];

/**
 * Nhắc giỗ: chỉ LIỆT KÊ ngày giỗ các năm tới trong site. KHÔNG gửi thông
 * báo đẩy, không gửi email — người dùng tự ghi nhớ hoặc tự đặt nhắc trên
 * điện thoại từ bảng ngày đã tra được.
 */
export default function GioForm() {
  const namHienTai = new Date().getFullYear();
  const [thangAm, setThangAm] = useState(1);
  const [ngayAm, setNgayAm] = useState(1);
  const [thangNhuan, setThangNhuan] = useState(false);
  const [namBatDau, setNamBatDau] = useState(namHienTai);
  const [soNam, setSoNam] = useState(5);
  const [submitted, setSubmitted] = useState(false);
  const [vanKhanChon, setVanKhanChon] = useState(0);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const rows: { nam: number; solar: string | null }[] = [];
    for (let i = 0; i < soNam; i++) {
      const nam = namBatDau + i;
      const found = findSolarForLunar(nam, thangAm, ngayAm, thangNhuan);
      rows.push({ nam, solar: found ? fmtSolarDate(found.y, found.m, found.d) : null });
    }
    return rows;
  }, [submitted, thangAm, ngayAm, thangNhuan, namBatDau, soNam]);

  const vanKhan = VAN_KHAN_LIST[vanKhanChon] ?? VAN_KHAN_LIST[0];

  return (
    <div className="space-y-6">
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="gio-thang">
              Tháng âm lịch của ngày giỗ
            </label>
            <input
              id="gio-thang"
              type="number"
              min={1}
              max={12}
              className="input"
              value={thangAm}
              onChange={(e) => {
                setThangAm(Number(e.target.value));
                setSubmitted(false);
              }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="gio-ngay">
              Ngày âm lịch của ngày giỗ
            </label>
            <input
              id="gio-ngay"
              type="number"
              min={1}
              max={30}
              className="input"
              value={ngayAm}
              onChange={(e) => {
                setNgayAm(Number(e.target.value));
                setSubmitted(false);
              }}
              required
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={thangNhuan}
            onChange={(e) => {
              setThangNhuan(e.target.checked);
              setSubmitted(false);
            }}
          />
          Ngày giỗ rơi vào tháng nhuận (chỉ tích khi giỗ đúng tháng nhuận; nếu năm đó không có
          tháng nhuận thì bảng sẽ báo không có ngày)
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="gio-nam">
              Xem từ năm dương lịch
            </label>
            <input
              id="gio-nam"
              type="number"
              min={1900}
              max={2100}
              className="input"
              value={namBatDau}
              onChange={(e) => {
                setNamBatDau(Number(e.target.value));
                setSubmitted(false);
              }}
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="gio-sonam">
              Số năm cần xem (1–10)
            </label>
            <input
              id="gio-sonam"
              type="number"
              min={1}
              max={10}
              className="input"
              value={soNam}
              onChange={(e) => {
                setSoNam(Math.min(10, Math.max(1, Number(e.target.value) || 1)));
                setSubmitted(false);
              }}
              required
            />
          </div>
        </div>
        <button type="submit" className="btn-primary">
          Tra ngày giỗ các năm tới
        </button>
      </form>

      {ketQua ? (
        <div className="card space-y-2">
          <h2 className="font-display text-xl font-bold text-primary">
            Ngày giỗ: {ngayAm}/{thangAm}
            {thangNhuan ? ' nhuận' : ''} âm lịch
          </h2>
          <ul className="space-y-1">
            {ketQua.map((row) => (
              <li key={row.nam}>
                Năm {row.nam}:{' '}
                {row.solar ? (
                  <strong>{row.solar}</strong>
                ) : (
                  <span>
                    không có ngày {ngayAm}/{thangAm}
                    {thangNhuan ? ' nhuận' : ''} âm lịch trong năm này (tháng âm thiếu ngày hoặc
                    năm đó không có tháng nhuận)
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="text-sm text-ink/70">
            Cách tính: engine chỉ đổi được dương→âm nên site quét từng ngày dương trong năm và
            đối chiếu sang âm lịch để tìm ngày khớp. Site chỉ liệt kê ngày giỗ — không gửi nhắc
            qua thông báo đẩy hay email; bạn có thể lưu bảng này hoặc tự đặt nhắc trên điện
            thoại.
          </p>
        </div>
      ) : null}

      <section className="card space-y-3">
        <h2 className="font-display text-xl font-bold text-primary">Thư viện văn khấn</h2>
        <p className="text-sm text-ink/70">
          Văn bản chung mang tính tham khảo, có chỗ trống trong [ngoặc] để gia đình tự điền
          tên, ngày và địa chỉ. Gia đình điều chỉnh theo phong tục địa phương và hướng dẫn của
          người lớn trong họ — đây không phải văn khấn chuẩn duy nhất của một địa phương hay
          dòng họ nào.
        </p>
        <div className="flex flex-wrap gap-2">
          {VAN_KHAN_LIST.map((v, i) => (
            <button
              key={v.tieuDe}
              type="button"
              className={i === vanKhanChon ? 'btn-primary' : 'btn-gold'}
              onClick={() => setVanKhanChon(i)}
            >
              {v.tieuDe}
            </button>
          ))}
        </div>
        <h3 className="font-semibold text-primary">{vanKhan.tieuDe}</h3>
        <p className="text-sm text-ink/70">{vanKhan.moTa}</p>
        <div className="print-area">
          <p className="hidden font-display text-lg font-bold text-primary print:block">{vanKhan.tieuDe}</p>
          <p className="whitespace-pre-line rounded bg-creamDark px-3 py-2 text-sm leading-relaxed">
            {vanKhan.noiDung}
          </p>
          <p className="mt-2 text-xs text-ink/60">
            Văn bản chung mang tính tham khảo — gia đình điền tên, ngày và địa chỉ vào
            chỗ trống trong [ngoặc] và điều chỉnh theo phong tục địa phương.
          </p>
        </div>
        <button type="button" className="btn-gold" onClick={() => window.print()}>
          In văn khấn này (lưu thành PDF)
        </button>
      </section>

      <Disclaimer text="Ngày giỗ tra theo lịch vạn niên; văn khấn là văn bản chung mang tính tham khảo, gia đình điều chỉnh theo phong tục địa phương." />
    </div>
  );
}
