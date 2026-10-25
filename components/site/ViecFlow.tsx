'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { canChiYear, canChiMonth, saoNgay, hoangDaoHours } from '@/lib/engine';
import { TUOI_12, VIEC_LIST } from '@/lib/data';
import LeadForm from '@/components/sales/LeadForm';
import ShareLink from './ShareLink';
import Disclaimer from './Disclaimer';
import { safeSolarToLunar, safeCanChiDay } from './engine-utils';
import { chiOfCanChi, chiXung, tuoiFromStoredBirthdate } from './XemNgayForm';
import { fmtLunar, fmtSolar, normalizeStars, parseISODate, todayISO } from './format';

type GioItem = { gio: string; sao: string; hoangDao: boolean };

function asGioList(value: unknown): GioItem[] {
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
 * Luồng hướng dẫn xem ngày theo việc.
 * - viecMacDinh: khi trang chi tiết truyền vào thì việc bị khóa (chỉ đổi
 *   bằng cách quay lại trang chọn việc); khi không truyền thì có ô chọn việc.
 * - Kết quả chỉ dùng những gì engine tính được: can chi, sao ngày (bộ cơ
 *   bản, có tháng âm), giờ hoàng đạo, và ghi chú xung tuổi theo 6 cặp xung
 *   truyền thống. Yêu cầu riêng của từng việc (ngày kiêng riêng, trực,
 *   nhị thập bát tú, Tam Nương, Nguyệt Kỵ) engine chưa có nên ghi rõ
 *   "chưa hỗ trợ", không bịa.
 */
export default function ViecFlow({ viecMacDinh }: { viecMacDinh?: string }) {
  const [viec, setViec] = useState(viecMacDinh ?? VIEC_LIST[0]);
  const [ngay, setNgay] = useState(todayISO());
  const [tuoi, setTuoi] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const prefill = tuoiFromStoredBirthdate();
    if (prefill) setTuoi(prefill);
    // Chỉ prefill một lần khi mount.
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
        ccYear = String(canChiYear(lunar.year) ?? '');
        ccMonth = String(canChiMonth(lunar.year, lunar.month) ?? '');
      }
    } catch {
      // giữ rỗng
    }
    let sao = { tot: [] as string[], xau: [] as string[] };
    let gioList: GioItem[] = [];
    try {
      if (ccDay) {
        sao = normalizeStars(lunar ? saoNgay(ccDay, lunar.month) : saoNgay(ccDay));
        gioList = asGioList(hoangDaoHours(ccDay));
      }
    } catch {
      // giữ rỗng
    }
    const gioHoangDao = gioList.filter((g) => g.hoangDao);
    const chiNgay = chiOfCanChi(ccDay ?? '');
    const xung = tuoi ? chiXung(tuoi) === chiNgay : false;
    const diem = sao.tot.length - sao.xau.length;
    let muc = 'Ngày bình thường';
    if (diem >= 2) muc = 'Ngày tương đối tốt';
    else if (diem <= -1) muc = 'Ngày chưa thuận';
    return { d, lunar, ccDay, ccYear, ccMonth, sao, gioHoangDao, chiNgay, xung, muc };
  }, [submitted, ngay, viec, tuoi]);

  return (
    <div className="space-y-6">
      <ol className="card list-decimal space-y-1 pl-6 text-sm">
        <li>
          <strong>Bước 1 — Chọn việc:</strong> việc bạn định làm trong ngày.
        </li>
        <li>
          <strong>Bước 2 — Chọn ngày dương lịch</strong> và (tùy chọn) tuổi của người đứng
          làm việc.
        </li>
        <li>
          <strong>Bước 3 — Đọc kết quả:</strong> can chi, sao ngày, giờ hoàng đạo và ghi chú
          xung tuổi; đối chiếu thêm mục “chưa hỗ trợ” bên dưới trước khi chốt ngày.
        </li>
      </ol>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        {viecMacDinh ? (
          <p>
            Việc đã chọn: <strong>{viecMacDinh}</strong>{' '}
            <Link href="/viec" className="text-sm font-semibold text-primary underline">
              Đổi việc khác
            </Link>
          </p>
        ) : (
          <div>
            <label className="label" htmlFor="viec-loai">
              Bước 1 — Loại việc
            </label>
            <select
              id="viec-loai"
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
        )}
        <div>
          <label className="label" htmlFor="viec-ngay">
            Bước 2 — Ngày dương lịch dự định làm việc
          </label>
          <input
            id="viec-ngay"
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
          <label className="label" htmlFor="viec-tuoi">
            Tuổi người đứng làm việc (tùy chọn)
          </label>
          <select
            id="viec-tuoi"
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
            Nếu bạn đã lưu ngày sinh trên site, tuổi sẽ tự điền sẵn.
          </p>
        </div>
        <button type="submit" className="btn-primary">
          Xem ngày cho việc này
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
              <p className="font-semibold">Sao tốt trong ngày:</p>
              <p>
                {ketQua.sao.tot.length > 0 ? ketQua.sao.tot.join(', ') : 'Không có sao tốt nổi bật'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Sao xấu trong ngày:</p>
              <p>
                {ketQua.sao.xau.length > 0 ? ketQua.sao.xau.join(', ') : 'Không có sao xấu nổi bật'}
              </p>
            </div>
            <div>
              <p className="font-semibold">Giờ hoàng đạo (nên khởi sự trong các giờ này):</p>
              <p>
                {ketQua.gioHoangDao.length > 0
                  ? ketQua.gioHoangDao.map((g) => `${g.gio} (${g.sao})`).join(', ')
                  : 'Đang cập nhật'}
              </p>
            </div>
            {tuoi && ketQua.chiNgay ? (
              <p className="rounded bg-creamDark px-3 py-2">
                <strong>Đối chiếu tuổi {tuoi}:</strong>{' '}
                {ketQua.xung
                  ? `ngày này xung với tuổi ${tuoi} (chi ngày ${ketQua.chiNgay} xung với ${tuoi} theo 6 cặp xung truyền thống Tý-Ngọ, Sửu-Mùi, Dần-Thân, Mão-Dậu, Thìn-Tuất, Tỵ-Hợi) — ghi chú tham khảo theo bảng tra truyền thống, không phải kết quả do engine kiểm chứng; việc lớn nên cân nhắc dời ngày nếu có thể.`
                  : `ngày này không xung với tuổi ${tuoi} theo 6 cặp xung truyền thống trên.`}
              </p>
            ) : null}
            <div className="rounded border border-gold/40 px-3 py-2">
              <p className="font-semibold">Chưa hỗ trợ — chưa tính trong kết quả này:</p>
              <ul className="mt-1 list-disc pl-5 text-sm">
                <li>
                  Bảng ngày kiêng riêng cho việc {viec.toLowerCase()} (engine chưa có bảng này).
                </li>
                <li>Trực ngày, nhị thập bát tú, ngày Tam Nương, ngày Nguyệt Kỵ.</li>
                <li>
                  Giờ xung riêng với tuổi người đứng làm việc (engine chỉ có giờ hoàng đạo chung
                  của ngày).
                </li>
              </ul>
              <p className="mt-1 text-sm">
                Vì vậy kết quả trên là bước sàng lọc theo sao ngày chung, chưa phải kết luận cuối
                cùng cho việc {viec.toLowerCase()} — việc lớn nên đối chiếu thêm nhiều nguồn
                trước khi quyết định.
              </p>
            </div>
            <ShareLink
              tieuDe={`Xem ngày ${viec.toLowerCase()} ${fmtSolar(ketQua.d)}`}
              chiTiet={[
                `Dương lịch: ${fmtSolar(ketQua.d)}`,
                `Âm lịch: ${fmtLunar(ketQua.lunar)}`,
                `Kết luận: ${ketQua.muc}`,
              ].join(' | ')}
            />
          </div>
          <Disclaimer />
          <LeadForm source="viec" />
        </div>
      ) : null}
    </div>
  );
}
