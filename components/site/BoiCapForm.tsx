'use client';

import { useMemo, useState } from 'react';
import { canChiYear, menhNapAm, cungPhi, thanSoHoc } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import { safeSolarToLunar } from './engine-utils';
import { chiXung } from './XemNgayForm';
import {
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
  parseISODate,
  sinhKhac,
  todayISO,
  zodiacOfLunarYear,
} from './format';

type GioiTinh = '' | 'nam' | 'nu';

type Nguoi = {
  ten: string;
  ngaySinh: string;
  gioiTinh: GioiTinh;
};

type KetQuaNguoi = {
  d: Date;
  lunar: ReturnType<typeof safeSolarToLunar>;
  ccYear: string;
  menh: string;
  nguHanh: string;
  tuoi: string;
  cung: string;
  nhom: string;
  soChuDao: number | null;
  giaiThich: string;
};

function tinhNguoi(n: Nguoi): KetQuaNguoi | null {
  const d = parseISODate(n.ngaySinh);
  if (!d) return null;
  const lunar = safeSolarToLunar(d);
  if (!lunar) return null;
  let ccYear = '';
  let menh = '';
  try {
    ccYear = String(canChiYear(lunar.year) ?? '');
    menh = String(menhNapAm(ccYear) ?? '');
  } catch {
    // giữ rỗng
  }
  let cung = '';
  let nhom = '';
  if (n.gioiTinh === 'nam' || n.gioiTinh === 'nu') {
    try {
      // cungPhi bắt buộc dùng NĂM ÂM LỊCH — lunar.year đã là năm âm.
      const cp = cungPhi(n.gioiTinh, lunar.year) as { cung?: unknown; nhom?: unknown };
      cung = String(cp?.cung ?? '');
      nhom = String(cp?.nhom ?? '');
    } catch {
      // giữ rỗng
    }
  }
  let soChuDao: number | null = null;
  let giaiThich = '';
  try {
    const r = thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear()) as unknown as {
      soChuDao?: unknown;
      giaiThich?: unknown;
    };
    const so = typeof r.soChuDao === 'number' ? r.soChuDao : Number(r.soChuDao);
    if (!Number.isNaN(so)) {
      soChuDao = so;
      giaiThich = String(r.giaiThich ?? '');
    }
  } catch {
    // giữ null
  }
  return {
    d,
    lunar,
    ccYear,
    menh,
    nguHanh: nguHanhFromMenh(menh),
    tuoi: zodiacOfLunarYear(lunar.year),
    cung,
    nhom,
    soChuDao,
    giaiThich,
  };
}

function NguoiInput({
  nhan,
  value,
  onChange,
}: {
  nhan: string;
  value: Nguoi;
  onChange: (v: Nguoi) => void;
}) {
  const id = nhan === 'Người 1' ? 'bc1' : 'bc2';
  return (
    <fieldset className="card space-y-4">
      <legend className="font-display text-lg font-bold text-primary">{nhan}</legend>
      <div>
        <label className="label" htmlFor={`${id}-ten`}>
          Tên gọi (tùy chọn, chỉ để hiển thị)
        </label>
        <input
          id={`${id}-ten`}
          type="text"
          className="input"
          placeholder="Ví dụ: An"
          value={value.ten}
          onChange={(e) => onChange({ ...value, ten: e.target.value })}
        />
      </div>
      <div>
        <label className="label" htmlFor={`${id}-ngay`}>
          Ngày sinh dương lịch
        </label>
        <input
          id={`${id}-ngay`}
          type="date"
          className="input"
          value={value.ngaySinh}
          onChange={(e) => onChange({ ...value, ngaySinh: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="label" htmlFor={`${id}-gt`}>
          Giới tính (tùy chọn — chỉ dùng để tính cung phi)
        </label>
        <select
          id={`${id}-gt`}
          className="input"
          value={value.gioiTinh}
          onChange={(e) => onChange({ ...value, gioiTinh: e.target.value as GioiTinh })}
        >
          <option value="">Không chọn — không tính cung phi</option>
          <option value="nam">Nam</option>
          <option value="nu">Nữ</option>
        </select>
      </div>
    </fieldset>
  );
}

/**
 * Bói cặp: so sánh 2 ngày sinh theo mệnh nạp âm, cung phi và thần số học
 * từ engine. Mọi nhận xét tương hợp chỉ ở mức tham khảo, diễn đạt bằng
 * quan hệ ngũ hành/nhóm cung/số chủ đạo — không khẳng định tuyệt đối về
 * hợp hay khắc, không đưa ra lời khuyên hôn nhân. Không hiển thị số điện
 * thoại (form này không thu thập số điện thoại).
 */
export default function BoiCapForm() {
  const [nguoi1, setNguoi1] = useState<Nguoi>({ ten: '', ngaySinh: todayISO(), gioiTinh: '' });
  const [nguoi2, setNguoi2] = useState<Nguoi>({ ten: '', ngaySinh: todayISO(), gioiTinh: '' });
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const k1 = tinhNguoi(nguoi1);
    const k2 = tinhNguoi(nguoi2);
    if (!k1 || !k2) return null;
    return { k1, k2 };
  }, [submitted, nguoi1, nguoi2]);

  const ten1 = nguoi1.ten.trim() || 'Người 1';
  const ten2 = nguoi2.ten.trim() || 'Người 2';

  let nhanXet: string[] = [];
  if (ketQua) {
    const { k1, k2 } = ketQua;
    if (k1.nguHanh && k2.nguHanh) {
      const qh = sinhKhac(k1.nguHanh, k2.nguHanh);
      if (k1.nguHanh === k2.nguHanh) {
        nhanXet.push(
          `Mệnh: cả hai cùng hành ${k1.nguHanh} (${k1.menh} và ${k2.menh}) — đồng hành, dễ đồng điệu về nhịp sống (tham khảo).`,
        );
      } else if (qh === 'sinh') {
        nhanXet.push(
          `Mệnh: hành ${k1.nguHanh} (${ten1}) và hành ${k2.nguHanh} (${ten2}) có quan hệ tương sinh theo vòng ngũ hành — ở mức tham khảo, đây là chiều hướng bổ trợ cho nhau.`,
        );
      } else if (qh === 'khac') {
        nhanXet.push(
          `Mệnh: hành ${k1.nguHanh} (${ten1}) và hành ${k2.nguHanh} (${ten2}) có quan hệ tương khắc theo vòng ngũ hành — ở mức tham khảo, hai người có thể khác nhau nhiều về cách nghĩ, cần lắng nghe và nhường nhịn nhau hơn. Đây không phải kết luận tuyệt đối về hợp hay khắc.`,
        );
      } else {
        nhanXet.push(
          `Mệnh: hành ${k1.nguHanh} (${ten1}) và hành ${k2.nguHanh} (${ten2}) không sinh không khắc trực tiếp theo vòng ngũ hành.`,
        );
      }
    }
    if (k1.cung && k2.cung && k1.nhom && k2.nhom) {
      nhanXet.push(
        k1.nhom === k2.nhom
          ? `Cung phi: cả hai cùng nhóm ${k1.nhom} tứ mệnh (${k1.cung} và ${k2.cung}) — cùng nhóm hướng hợp theo bát trạch (tham khảo).`
          : `Cung phi: ${ten1} thuộc ${k1.nhom} tứ mệnh (${k1.cung}), ${ten2} thuộc ${k2.nhom} tứ mệnh (${k2.cung}) — khác nhóm, hướng hợp theo bát trạch của hai người khác nhau (tham khảo).`,
      );
    } else {
      nhanXet.push(
        'Cung phi: chưa so sánh được vì ít nhất một người chưa chọn giới tính — cung phi cần giới tính và năm âm lịch mới tính được.',
      );
    }
    if (k1.soChuDao !== null && k2.soChuDao !== null) {
      nhanXet.push(
        k1.soChuDao === k2.soChuDao
          ? `Thần số học: cả hai cùng số chủ đạo ${k1.soChuDao} — theo mô tả của engine, hai người có xu hướng tương đồng.`
          : `Thần số học: ${ten1} số chủ đạo ${k1.soChuDao}, ${ten2} số chủ đạo ${k2.soChuDao} — hai xu hướng khác nhau theo mô tả của engine, có thể bổ sung cho nhau.`,
      );
    }
    const xung = chiXung(k1.tuoi) === k2.tuoi;
    nhanXet.push(
      xung
        ? `Tuổi: tuổi ${k1.tuoi} và tuổi ${k2.tuoi} xung nhau theo 6 cặp xung truyền thống — ghi chú tham khảo theo bảng tra truyền thống, không phải kết quả do engine kiểm chứng, và không phải kết luận tuyệt đối.`
        : `Tuổi: tuổi ${k1.tuoi} và tuổi ${k2.tuoi} không xung nhau theo 6 cặp xung truyền thống.`,
    );
  }

  return (
    <div className="space-y-6">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          try {
            // Chỉ lưu ngày sinh người 1 nếu trước đó chưa lưu gì, để không
            // ghi đè ngày sinh người dùng đã lưu từ công cụ khác.
            if (!window.localStorage.getItem('khang-an-birthdate')) {
              window.localStorage.setItem('khang-an-birthdate', nguoi1.ngaySinh);
            }
          } catch {
            // Không lưu được thì vẫn hiển thị kết quả.
          }
          setSubmitted(true);
        }}
      >
        <NguoiInput
          nhan="Người 1"
          value={nguoi1}
          onChange={(v) => {
            setNguoi1(v);
            setSubmitted(false);
          }}
        />
        <NguoiInput
          nhan="Người 2"
          value={nguoi2}
          onChange={(v) => {
            setNguoi2(v);
            setSubmitted(false);
          }}
        />
        <button type="submit" className="btn-primary">
          So sánh hai người
        </button>
      </form>

      {ketQua ? (
        <div className="space-y-4">
          {[
            { ten: ten1, k: ketQua.k1 },
            { ten: ten2, k: ketQua.k2 },
          ].map(({ ten, k }) => (
            <div key={ten} className="card space-y-1">
              <h2 className="font-display text-xl font-bold text-primary">{ten}</h2>
              <p>
                Ngày sinh: <strong>{fmtSolar(k.d)}</strong> — âm lịch{' '}
                <strong>{fmtLunar(k.lunar)}</strong>
              </p>
              <p>
                Can chi năm sinh: <strong>{k.ccYear || 'Đang cập nhật'}</strong> (tuổi {k.tuoi})
              </p>
              <p>
                Mệnh nạp âm: <strong>{k.menh || 'Đang cập nhật'}</strong>
                {k.nguHanh ? ` — ngũ hành ${k.nguHanh}` : ''}
              </p>
              <p>
                Cung phi:{' '}
                <strong>
                  {k.cung ? `${k.cung} (${k.nhom} tứ mệnh)` : 'Chưa tính (chưa chọn giới tính)'}
                </strong>
              </p>
              <p>
                Số chủ đạo (thần số học):{' '}
                <strong>{k.soChuDao !== null ? k.soChuDao : 'Chưa tính được'}</strong>
                {k.giaiThich ? ` — ${k.giaiThich}` : ''}
              </p>
            </div>
          ))}
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">
              Nhận xét tương hợp (mức tham khảo)
            </h2>
            <ul className="list-disc space-y-1 pl-5">
              {nhanXet.map((nx, i) => (
                <li key={i}>{nx}</li>
              ))}
            </ul>
            <p className="text-sm text-ink/70">
              Tất cả nhận xét trên chỉ là đối chiếu theo bảng tra truyền thống và công thức
              engine, ở mức tham khảo — không khẳng định tuyệt đối hai người hợp hay khắc, và
              không thay thế sự tìm hiểu, tôn trọng lẫn nhau trong thực tế.
            </p>
          </div>
          <Disclaimer text="Kết quả bói cặp chỉ mang tính tham khảo, giải trí theo lịch vạn niên và các bảng tra truyền thống, không phải tư vấn tình cảm hay hôn nhân." />
        </div>
      ) : null}
    </div>
  );
}
