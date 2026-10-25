'use client';

import { useMemo, useState } from 'react';
import { canChiYear, canChiMonth, saoNgay, hoangDaoHours } from '@/lib/engine';
import { VIEC_LIST } from '@/lib/data';
import LeadForm from '@/components/sales/LeadForm';
import ShareLink from './ShareLink';
import Disclaimer from './Disclaimer';
import { safeSolarToLunar, safeCanChiDay } from './engine-utils';
import { fmtLunar, fmtSolar, normalizeStars, parseISODate, todayISO } from './format';

type GioHoangDao = { gio: string; sao: string; hoangDao: boolean };

function asGioList(value: unknown): GioHoangDao[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((v): v is Record<string, unknown> => !!v && typeof v === 'object')
    .map((v) => ({
      gio: String(v.gio ?? ''),
      sao: String(v.sao ?? ''),
      hoangDao: v.hoangDao === true || v.hoang_dao === true,
    }))
    .filter((g) => g.gio);
}

export default function XemNgayForm() {
  const [ngay, setNgay] = useState(todayISO());
  const [viec, setViec] = useState(VIEC_LIST[0]);
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngay);
    if (!d) return null;
    const lunar = safeSolarToLunar(d);
    const ccDay = safeCanChiDay(d);
    let ccYear = '';
    let ccMonth = '';
    try {
      if (lunar) {
        const y = canChiYear(lunar.year) as unknown;
        ccYear = typeof y === 'string' ? y : String(y ?? '');
        const m = canChiMonth(lunar.year, lunar.month) as unknown;
        ccMonth = typeof m === 'string' ? m : String(m ?? '');
      }
    } catch {
      // giữ rỗng, vẫn hiển thị phần còn lại
    }
    let sao = { tot: [] as string[], xau: [] as string[] };
    let gioList: GioHoangDao[] = [];
    try {
      if (ccDay) {
        sao = normalizeStars(lunar ? saoNgay(ccDay, lunar.month) : saoNgay(ccDay));
        gioList = asGioList(hoangDaoHours(ccDay));
      }
    } catch {
      // giữ rỗng
    }
    const gioHoangDao = gioList.filter((g) => g.hoangDao);
    const diem = sao.tot.length - sao.xau.length;
    let ketLuan = '';
    let muc = '';
    if (diem >= 2) {
      muc = 'Ngày tương đối tốt';
      ketLuan = `Ngày này có nhiều sao tốt hơn sao xấu (${sao.tot.length} sao tốt, ${sao.xau.length} sao xấu), tương đối thuận cho việc ${viec.toLowerCase()}. Ưu tiên khởi sự vào giờ hoàng đạo bên dưới.`;
    } else if (diem <= -1) {
      muc = 'Ngày chưa thuận';
      ketLuan = `Ngày này có nhiều sao xấu hơn sao tốt (${sao.tot.length} sao tốt, ${sao.xau.length} sao xấu), nên cân nhắc dời việc ${viec.toLowerCase()} sang ngày khác nếu có thể.`;
    } else {
      muc = 'Ngày bình thường';
      ketLuan = `Ngày này sao tốt và sao xấu tương đương (${sao.tot.length} sao tốt, ${sao.xau.length} sao xấu) cho việc ${viec.toLowerCase()}. Nếu bắt buộc làm, chọn giờ hoàng đạo và chuẩn bị kỹ.`;
    }
    return { d, lunar, ccDay, ccYear, ccMonth, sao, gioHoangDao, muc, ketLuan };
  }, [submitted, ngay, viec]);

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
          <label className="label" htmlFor="xn-ngay">
            Chọn ngày dương lịch
          </label>
          <input
            id="xn-ngay"
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
          <label className="label" htmlFor="xn-viec">
            Loại việc
          </label>
          <select
            id="xn-viec"
            className="input"
            value={viec}
            onChange={(e) => {
              setViec(e.target.value);
              setSubmitted(false);
            }}
          >
            {VIEC_LIST.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">
          Xem ngày
        </button>
      </form>

      {ketQua ? (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">
              Kết quả: {ketQua.muc} cho việc {viec.toLowerCase()}
            </h2>
            <p>
              Dương lịch: <strong>{fmtSolar(ketQua.d)}</strong>
            </p>
            <p>
              Âm lịch: <strong>{fmtLunar(ketQua.lunar)}</strong>
            </p>
            <p>
              Can chi: <strong>{[ketQua.ccDay, ketQua.ccMonth, ketQua.ccYear].filter(Boolean).join(' — ') || 'Đang cập nhật'}</strong>
            </p>
            <div>
              <p className="font-semibold">Sao tốt:</p>
              <p>{ketQua.sao.tot.length > 0 ? ketQua.sao.tot.join(', ') : 'Không có sao tốt nổi bật'}</p>
            </div>
            <div>
              <p className="font-semibold">Sao xấu:</p>
              <p>{ketQua.sao.xau.length > 0 ? ketQua.sao.xau.join(', ') : 'Không có sao xấu nổi bật'}</p>
            </div>
            <div>
              <p className="font-semibold">Giờ hoàng đạo:</p>
              <p>
                {ketQua.gioHoangDao.length > 0
                  ? ketQua.gioHoangDao.map((g) => `${g.gio} (${g.sao})`).join(', ')
                  : 'Đang cập nhật'}
              </p>
            </div>
            <p className="rounded bg-creamDark px-3 py-2">
              <strong>Kết luận tham khảo:</strong> {ketQua.ketLuan}
            </p>
            <ShareLink
              tieuDe={`Xem ngày ${viec.toLowerCase()} ${fmtSolar(ketQua.d)}`}
              chiTiet={[
                `Dương lịch: ${fmtSolar(ketQua.d)}`,
                `Âm lịch: ${fmtLunar(ketQua.lunar)}`,
                `Kết luận: ${ketQua.muc}`,
                ketQua.ketLuan,
              ].join(' | ')}
            />
          </div>
          <Disclaimer />
          <LeadForm source="xem-ngay" />
        </div>
      ) : null}
    </div>
  );
}
