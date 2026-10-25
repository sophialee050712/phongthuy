'use client';

import { useEffect, useMemo, useState } from 'react';
import { canChiYear, canChiMonth, saoNgay, hoangDaoHours } from '@/lib/engine';
import { TUOI_12, VIEC_LIST } from '@/lib/data';
import LeadForm from '@/components/sales/LeadForm';
import ShareLink from './ShareLink';
import ToolShareCard from '@/components/share/ToolShareCard';
import Disclaimer from './Disclaimer';
import { safeSolarToLunar, safeCanChiDay } from './engine-utils';
import {
  fmtLunar,
  fmtSolar,
  normalizeStars,
  parseISODate,
  todayISO,
  zodiacOfLunarYear,
} from './format';

/**
 * 6 cặp xung truyền thống (quy tắc tra cứu dân gian, KHÔNG phải kết quả
 * do engine tính hay kiểm chứng): Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu,
 * Thìn-Tuất, Tỵ-Hợi. Chỉ dùng để ghi chú tham khảo khi người dùng nhập tuổi.
 */
export const XUNG_PAIRS: Record<string, string> = {
  Tý: 'Ngọ',
  Ngọ: 'Tý',
  Sửu: 'Mùi',
  Mùi: 'Sửu',
  Dần: 'Thân',
  Thân: 'Dần',
  Mão: 'Dậu',
  Dậu: 'Mão',
  Thìn: 'Tuất',
  Tuất: 'Thìn',
  Tỵ: 'Hợi',
  Hợi: 'Tỵ',
};

/** Chi xung với một chi cho trước theo 6 cặp xung truyền thống, hoặc null. */
export function chiXung(chi: string): string | null {
  return XUNG_PAIRS[chi] ?? null;
}

/** Lấy chi từ chuỗi can chi dạng "Giáp Dần" (phần tử cuối sau khoảng trắng). */
export function chiOfCanChi(canChi: string): string {
  const parts = canChi.trim().split(/\s+/);
  return parts.length > 0 ? parts[parts.length - 1] : '';
}

/**
 * Suy con giáp từ ngày sinh dương lịch đã lưu (chuỗi 'YYYY-MM-DD'):
 * đổi sang âm lịch rồi lấy con giáp của năm âm lịch. Trả null khi chuỗi
 * không hợp lệ hoặc engine không đổi được — form vẫn chạy, chỉ không prefill.
 */
export function tuoiFromBirthdateISO(iso: string): string | null {
  const d = parseISODate(iso);
  if (!d) return null;
  try {
    const lunar = safeSolarToLunar(d);
    if (!lunar) return null;
    const tuoi = zodiacOfLunarYear(lunar.year);
    return TUOI_12.includes(tuoi) ? tuoi : null;
  } catch {
    return null;
  }
}

/** Đọc tuổi đã suy từ ngày sinh lưu ở localStorage (key 'khang-an-birthdate'). */
export function tuoiFromStoredBirthdate(): string | null {
  try {
    const raw = window.localStorage.getItem('khang-an-birthdate');
    if (!raw) return null;
    return tuoiFromBirthdateISO(raw);
  } catch {
    return null;
  }
}

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

/**
 * Ô tuổi tùy chọn cho mục "Lịch hôm nay" ở trang chủ. Nhận can chi ngày,
 * sao ngày và giờ hoàng đạo đã tính sẵn ở phía server; chỉ tính thêm nhận
 * xét theo tuổi ở phía client (xung theo 6 cặp truyền thống + sao ngày).
 */
export function LichHomNayTheoTuoi({
  canChiNgay,
  saoTot,
  saoXau,
}: {
  canChiNgay: string;
  saoTot: string[];
  saoXau: string[];
}) {
  const [tuoi, setTuoi] = useState('');

  useEffect(() => {
    const prefill = tuoiFromStoredBirthdate();
    if (prefill) setTuoi(prefill);
    // Chỉ prefill một lần khi mount (tuổi ban đầu luôn rỗng).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chiNgay = chiOfCanChi(canChiNgay);
  const xung = tuoi ? chiXung(tuoi) === chiNgay : false;

  return (
    <div className="mt-3 space-y-2 border-t border-gold/30 pt-3">
      <div>
        <label className="label" htmlFor="lich-tuoi">
          Tuổi của bạn (tùy chọn — để xem ngày hôm nay có hợp/khắc với tuổi không)
        </label>
        <select
          id="lich-tuoi"
          className="input"
          value={tuoi}
          onChange={(e) => setTuoi(e.target.value)}
        >
          <option value="">Không chọn — chỉ xem lịch chung</option>
          {TUOI_12.map((t) => (
            <option key={t} value={t}>
              Tuổi {t}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-ink/60">
          Nếu bạn đã lưu ngày sinh trên site (ô tra mệnh/thần số học), tuổi sẽ tự điền sẵn;
          bạn vẫn có thể đổi sang tuổi khác.
        </p>
      </div>
      {tuoi && chiNgay ? (
        <div className="space-y-1 text-sm">
          <p>
            Ngày hôm nay là ngày <strong>{canChiNgay}</strong> (chi ngày {chiNgay}).
          </p>
          {xung ? (
            <p className="rounded bg-creamDark px-3 py-2">
              <strong>Ngày xung với tuổi {tuoi}:</strong> theo quy tắc truyền thống (6 cặp xung
              Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi), chi ngày {chiNgay} xung
              với tuổi {tuoi}. Đây là ghi chú tham khảo theo bảng tra truyền thống, không phải
              kết quả do engine kiểm chứng — việc lớn trong ngày này nên cân nhắc kỹ.
            </p>
          ) : (
            <p>
              Ngày hôm nay <strong>không xung</strong> với tuổi {tuoi} theo 6 cặp xung truyền
              thống trên.
            </p>
          )}
          <p>
            Sao ngày hôm nay — tốt:{' '}
            <strong>{saoTot.length > 0 ? saoTot.join(', ') : 'không có sao tốt nổi bật'}</strong>;
            xấu:{' '}
            <strong>{saoXau.length > 0 ? saoXau.join(', ') : 'không có sao xấu nổi bật'}</strong>.
          </p>
        </div>
      ) : null}
    </div>
  );
}

export default function XemNgayForm() {
  const [ngay, setNgay] = useState(todayISO());
  const [viec, setViec] = useState(VIEC_LIST[0]);
  const [tuoi, setTuoi] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const prefill = tuoiFromStoredBirthdate();
    if (prefill) setTuoi(prefill);
    // Chỉ prefill một lần khi mount (tuổi ban đầu luôn rỗng).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const chiNgay = chiOfCanChi(ccDay ?? '');
    const xung = tuoi ? chiXung(tuoi) === chiNgay : false;
    return { d, lunar, ccDay, ccYear, ccMonth, sao, gioHoangDao, muc, ketLuan, chiNgay, xung };
  }, [submitted, ngay, viec, tuoi]);

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
        <div>
          <label className="label" htmlFor="xn-tuoi">
            Tuổi của bạn (tùy chọn — để xem ngày có xung với tuổi không)
          </label>
          <select
            id="xn-tuoi"
            className="input"
            value={tuoi}
            onChange={(e) => {
              setTuoi(e.target.value);
              setSubmitted(false);
            }}
          >
            <option value="">Không chọn — chỉ xem ngày chung</option>
            {TUOI_12.map((t) => (
              <option key={t} value={t}>
                Tuổi {t}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-ink/60">
            Nếu bạn đã lưu ngày sinh trên site, tuổi sẽ tự điền sẵn; bạn vẫn có thể đổi sang
            tuổi khác.
          </p>
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
              Can chi:{' '}
              <strong>
                {[ketQua.ccDay, ketQua.ccMonth, ketQua.ccYear].filter(Boolean).join(' — ') ||
                  'Đang cập nhật'}
              </strong>
            </p>
            <div>
              <p className="font-semibold">Sao tốt:</p>
              <p>
                {ketQua.sao.tot.length > 0 ? ketQua.sao.tot.join(', ') : 'Không có sao tốt nổi bật'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Sao xấu:</p>
              <p>
                {ketQua.sao.xau.length > 0 ? ketQua.sao.xau.join(', ') : 'Không có sao xấu nổi bật'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Giờ hoàng đạo:</p>
              <p>
                {ketQua.gioHoangDao.length > 0
                  ? ketQua.gioHoangDao.map((g) => `${g.gio} (${g.sao})`).join(', ')
                  : 'Đang cập nhật'}
              </p>
            </div>
            {tuoi && ketQua.chiNgay ? (
              <div className="rounded bg-creamDark px-3 py-2">
                <p className="font-semibold">Đối chiếu với tuổi {tuoi}:</p>
                {ketQua.xung ? (
                  <p>
                    Ngày này <strong>xung với tuổi {tuoi}</strong> (chi ngày {ketQua.chiNgay} xung
                    với {tuoi} theo 6 cặp xung truyền thống Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu,
                    Thìn-Tuất, Tỵ-Hợi). Đây là ghi chú tham khảo theo bảng tra truyền thống,
                    không phải kết quả do engine kiểm chứng. Dù sao ngày có tốt, việc lớn trong
                    ngày xung tuổi vẫn nên cân nhắc kỹ.
                  </p>
                ) : (
                  <p>
                    Ngày này <strong>không xung</strong> với tuổi {tuoi} theo 6 cặp xung truyền
                    thống trên. Đánh giá sao ngày: {ketQua.sao.tot.length} sao tốt,{' '}
                    {ketQua.sao.xau.length} sao xấu.
                  </p>
                )}
              </div>
            ) : null}
            <p className="rounded bg-creamDark px-3 py-2">
              <strong>Kết luận tham khảo:</strong> {ketQua.ketLuan}
            </p>
            <p className="text-sm text-ink/70">
              Phạm vi tính toán: engine hiện chỉ có bộ sao ngày cơ bản (Lộc, Thiên Ất Quý Nhân,
              Dương Nhẫn, Thiên Đức, Nguyệt Đức, Nguyệt Phá) — chưa tính trực, nhị thập bát tú,
              Tam Nương hay Nguyệt Kỵ, và chưa có bảng ngày kiêng riêng cho từng việc. Kết quả
              trên chỉ dựa trên những gì engine tính được.
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
            <ToolShareCard
              title={`Xem ngày ${viec.toLowerCase()} ${fmtSolar(ketQua.d)}`}
              lines={[
                `Kết luận: ${ketQua.muc}`,
                `Can chi: ${[ketQua.ccDay, ketQua.ccMonth, ketQua.ccYear].filter(Boolean).join(' — ')}`,
                `Giờ hoàng đạo: ${ketQua.gioHoangDao.slice(0, 4).map((g) => g.gio).join(', ')}`,
              ]}
            />
          </div>
          <Disclaimer />
          <LeadForm source="xem-ngay" />
        </div>
      ) : null}
    </div>
  );
}
