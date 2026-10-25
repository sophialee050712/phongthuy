'use client';

import { useEffect, useMemo, useState } from 'react';
import { canChiYear, menhNapAm, nguHanhOfCan, thanSoHoc } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import { getBirthdate, getGender } from '@/lib/personal';
import { safeSolarToLunar, safeCanChiDay } from './engine-utils';
import {
  fmtLunar,
  fmtSolar,
  MAU_HOP_KY,
  nguHanhFromMenh,
  normalizeThanSo,
  parseISODate,
  sinhKhac,
  todayISO,
} from './format';

const NEN_THEO_NGU_HANH: Record<string, string[]> = {
  Kim: ['Ký kết, mua sắm đồ kim khí', 'Sắp xếp, dọn dẹp, hoàn thiện việc cũ', 'Gặp gỡ đối tác, bàn việc hợp tác'],
  Mộc: ['Khởi sự việc mới, học thêm kỹ năng', 'Trồng cây, dọn nhà, làm việc ngoài trời', 'Gặp gỡ bạn bè, mở rộng quan hệ'],
  Thủy: ['Học tập, nghiên cứu, lên kế hoạch', 'Giao dịch, di chuyển đường thủy, đi xa ngắn', 'Nghỉ ngơi, chăm sóc sức khỏe'],
  Hỏa: ['Quảng bá, ra mắt, trình bày ý tưởng', 'Gặp gỡ, giao lưu, tổ chức sự kiện nhỏ', 'Hoàn thiện việc đang dang dở'],
  Thổ: ['Xây dựng, sửa chữa nhà cửa', 'Đầu tư dài hạn, tích lũy', 'Chăm sóc gia đình, việc nhà'],
};

const TRANH_THEO_NGU_HANH: Record<string, string[]> = {
  Kim: ['Tranh cãi, quyết định nóng vội', 'Đầu tư mạo hiểm chưa tìm hiểu kỹ'],
  Mộc: ['Chặt phá, phá bỏ đồ đạc không cần thiết', 'Ký kết khi chưa đọc kỹ điều khoản'],
  Thủy: ['Đi xa dài ngày khi sức khỏe chưa tốt', 'Cho vay tiền khi chưa rõ ràng'],
  Hỏa: ['Nóng giận, nói lời khó nghe', 'Ký hợp đồng lớn khi chưa tỉnh táo'],
  Thổ: ['Động thổ, đào bới khi chưa xem kỹ ngày giờ', 'Thay đổi lớn về chỗ ở, công việc trong một ngày'],
};

export default function VanHanForm() {
  const [ngaySinh, setNgaySinh] = useState('1990-01-01');
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [ngayXem, setNgayXem] = useState(todayISO());
  const [submitted, setSubmitted] = useState(false);

  // Prefill ngày sinh + giới tính từ hồ sơ đã lưu trên trình duyệt (nếu có).
  useEffect(() => {
    const saved = getBirthdate();
    if (saved) setNgaySinh(saved);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const birth = parseISODate(ngaySinh);
    const view = parseISODate(ngayXem);
    if (!birth || !view) return null;
    const lunarBirth = safeSolarToLunar(birth);
    const ccDay = safeCanChiDay(view);
    let menh = '';
    try {
      if (lunarBirth) {
        const y = canChiYear(lunarBirth.year) as unknown;
        const ccYear = typeof y === 'string' ? y : String(y ?? '');
        const mm = menhNapAm(ccYear) as unknown;
        menh = typeof mm === 'string' ? mm : String(mm ?? '');
      }
    } catch {
      // giữ rỗng
    }
    const menhElement = nguHanhFromMenh(menh);
    let ngayElement = '';
    try {
      if (ccDay) {
        const can = ccDay.split(' ')[0] ?? '';
        if (can) {
          const nh = nguHanhOfCan(can) as unknown;
          ngayElement = typeof nh === 'string' ? nh : String(nh ?? '');
        }
      }
    } catch {
      // giữ rỗng
    }
    const quanHe = menhElement && ngayElement ? sinhKhac(ngayElement, menhElement) : 'binh';
    // Điểm vận rút gọn: nền 55, cộng/trừ theo tương sinh/khắc giữa
    // ngũ hành ngày xem và ngũ hành mệnh, cộng dao động theo ngày.
    let diem = 55 + (view.getDate() % 10) - 4;
    if (quanHe === 'sinh') diem += 20;
    else if (quanHe === 'khac') diem -= 20;
    else if (menhElement && ngayElement === menhElement) diem += 5;
    diem = Math.max(20, Math.min(95, diem));
    let muc = '';
    if (diem >= 75) muc = 'Vận tốt';
    else if (diem >= 50) muc = 'Vận bình ổn';
    else muc = 'Vận trầm — nên chậm lại';
    let soChuDao: number | null = null;
    try {
      // Hợp đồng engine: thanSoHoc(ngày, tháng, năm) — số nguyên dương lịch.
      soChuDao = normalizeThanSo(
        thanSoHoc(birth.getDate(), birth.getMonth() + 1, birth.getFullYear()),
      );
    } catch {
      soChuDao = null;
    }
    const mauMayMan = menhElement ? MAU_HOP_KY[menhElement]?.hop[0] ?? '' : '';
    const nen = menhElement ? NEN_THEO_NGU_HANH[menhElement] ?? [] : [];
    const tranh = menhElement ? TRANH_THEO_NGU_HANH[menhElement] ?? [] : [];
    return {
      birth, view, lunarBirth, ccDay, menh, menhElement, ngayElement, quanHe, diem, muc,
      soChuDao, mauMayMan, nen, tranh,
    };
  }, [submitted, ngaySinh, gioiTinh, ngayXem]);

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
          <label className="label" htmlFor="vh-sinh">
            Ngày sinh dương lịch
          </label>
          <input
            id="vh-sinh"
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
        <div>
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="vh-gioi-tinh" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="vh-gioi-tinh" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
              Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="vh-xem">
            Ngày cần xem vận hạn
          </label>
          <input
            id="vh-xem"
            type="date"
            className="input"
            value={ngayXem}
            onChange={(e) => {
              setNgayXem(e.target.value);
              setSubmitted(false);
            }}
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Xem vận hạn
        </button>
      </form>

      {ketQua ? (
        <div className="card space-y-2">
          <h2 className="font-display text-xl font-bold text-primary">
            Vận hạn {fmtSolar(ketQua.view)}: {ketQua.muc} ({ketQua.diem}/100)
          </h2>
          <p className="text-sm text-ink/80">
            Đây là bản rút gọn tham khảo, tính từ can chi ngày xem và mệnh nạp âm theo năm sinh —
            không phải lá số tử vi đầy đủ.
          </p>
          <p>
            Ngày sinh: <strong>{fmtSolar(ketQua.birth)}</strong> — âm lịch{' '}
            <strong>{fmtLunar(ketQua.lunarBirth)}</strong>
          </p>
          <p>
            Mệnh nạp âm: <strong>{ketQua.menh || 'Đang cập nhật'}</strong>
          </p>
          <p>
            Can chi ngày xem: <strong>{ketQua.ccDay || 'Đang cập nhật'}</strong>
            {ketQua.ngayElement ? ` (ngũ hành ngày: ${ketQua.ngayElement})` : ''}
            {ketQua.quanHe === 'sinh'
              ? ' — ngày tương sinh với mệnh'
              : ketQua.quanHe === 'khac'
                ? ' — ngày tương khắc với mệnh, nên thận trọng'
                : ''}
          </p>
          {ketQua.mauMayMan ? (
            <p>
              Màu may mắn trong ngày: <strong>{ketQua.mauMayMan}</strong>
            </p>
          ) : null}
          {ketQua.soChuDao !== null ? (
            <p>
              Số chủ đạo (thần số học, tham khảo): <strong>{ketQua.soChuDao}</strong>
            </p>
          ) : null}
          <div>
            <p className="font-semibold">Việc nên làm:</p>
            <ul className="list-disc pl-5 text-sm">
              {ketQua.nen.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-semibold">Việc nên tránh:</p>
            <ul className="list-disc pl-5 text-sm">
              {ketQua.tranh.map((v) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
          <ToolShareCard
            title={`Vận hạn ${fmtSolar(ketQua.view)}`}
            lines={[
              `${ketQua.muc} (${ketQua.diem}/100)`,
              `Mệnh: ${ketQua.menh || 'Đang cập nhật'}`,
              ...(ketQua.mauMayMan ? [`Màu may mắn: ${ketQua.mauMayMan}`] : []),
            ]}
          />
          <Disclaimer />
        </div>
      ) : null}
    </div>
  );
}
