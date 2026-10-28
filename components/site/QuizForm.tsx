// Quiz khám phá bản thân (ý 9): PHỄU DẪN DẮT, không phải logic phong thủy mới.
// Toàn bộ kết quả lấy từ engine đã có, cùng công thức các công cụ gốc:
// ngày sinh → mệnh nạp âm (canChiYear + menhNapAm), cung phi + hướng tốt nhất
// (cungPhi + batTrach, xếp hạng Sinh Khí > Thiên Y > Diên Niên > Phục Vị như
// /huong-nha), số chủ đạo (thanSoHoc như /than-so-hoc). Bước "quan tâm nhất"
// chỉ chọn công cụ gợi ý ở cuối, không đổi kết quả. Trang ghi rõ quiz chỉ là
// cách trình bày lại kết quả tra cứu cho vui và dễ chia sẻ.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { canChiYear, menhNapAm, cungPhi, batTrach, thanSoHoc } from '@/lib/engine';
import Disclaimer from './Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import { getBirthdate, getGender, profileFromBirthdate, type GioiTinh } from '@/lib/personal';
import { DIRECTIONS, fmtLunar, fmtSolar, nguHanhFromMenh, normalizeThanSo, parseISODate } from './format';
import type { HuongInfo } from '@/lib/engine';

const THU_TU_UU_TIEN = ['Sinh Khí', 'Thiên Y', 'Diên Niên', 'Phục Vị'];

type Interest = 'nha' | 'ten' | 'so' | 'van-han';
const INTERESTS: { id: Interest; label: string; tool: string; toolHref: string; toolDesc: string }[] = [
  { id: 'nha', label: 'Nhà ở', tool: 'Hướng nhà bát trạch', toolHref: '/huong-nha', toolDesc: 'Xem la bàn 8 hướng và gợi ý cửa chính, bếp, bàn thờ theo cung của bạn.' },
  { id: 'ten', label: 'Đặt tên con', tool: 'Đặt tên con', toolHref: '/dat-ten', toolDesc: 'Gợi ý tên theo ngũ hành năm sinh bé, chấm điểm tên, in giấy tên.' },
  { id: 'so', label: 'Số điện thoại', tool: 'Luận số phong thủy', toolHref: '/luan-so', toolDesc: 'Luận SĐT, biển số xe, số tài khoản theo ngũ hành và tổng nút.' },
  { id: 'van-han', label: 'Vận hạn tuần', tool: 'Tử vi tuần', toolHref: '/tu-vi-tuan', toolDesc: 'Vận hạn từng ngày trong tuần theo tuổi, kèm ngày đẹp nhất tuần.' },
];

export default function QuizForm() {
  const [step, setStep] = useState(0);
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [interest, setInterest] = useState<Interest | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = getBirthdate();
    if (saved) setNgaySinh(saved);
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const ketQua = useMemo(() => {
    if (step < 2 || !interest) return null;
    const profile = profileFromBirthdate(ngaySinh);
    if (!profile) return null;
    let menh = '';
    let ccYear = '';
    let cung = '';
    let nhom = '';
    const huong: Record<string, HuongInfo> = {};
    try {
      const y = canChiYear(profile.lunar.year) as unknown;
      ccYear = typeof y === 'string' ? y : String(y ?? '');
      const mm = menhNapAm(ccYear) as unknown;
      menh = typeof mm === 'string' ? mm : String(mm ?? '');
      const cp = cungPhi(gioiTinh, profile.lunar.year) as unknown as { cung?: unknown; nhom?: unknown };
      cung = String(cp?.cung ?? '');
      nhom = String(cp?.nhom ?? '');
      const bt = batTrach(cung) as unknown as Record<string, unknown>;
      for (const dir of DIRECTIONS) {
        const v = bt?.[dir];
        if (v && typeof v === 'object') {
          const rec = v as Record<string, unknown>;
          huong[dir] = { sao: String(rec.sao ?? ''), tot: rec.tot === true };
        }
      }
    } catch {
      // giữ rỗng
    }
    if (!cung) return null;
    const huongTheoSao = (sao: string) => DIRECTIONS.filter((d) => huong[d]?.sao === sao);
    const best = THU_TU_UU_TIEN.flatMap((sao) => huongTheoSao(sao));
    let soChuDao: number | null = null;
    try {
      const d = parseISODate(ngaySinh);
      if (d) soChuDao = normalizeThanSo(thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear()));
    } catch {
      soChuDao = null;
    }
    return {
      profile,
      solarDate: parseISODate(ngaySinh),
      menh,
      ccYear,
      menhElement: nguHanhFromMenh(menh),
      cung,
      nhom,
      bestDir: best[0] ?? '',
      bestSao: best[0] ? huong[best[0]]?.sao ?? '' : '',
      soChuDao,
    };
  }, [step, interest, ngaySinh, gioiTinh]);

  const interestMeta = INTERESTS.find((i) => i.id === interest);

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink/80">
        3 bước ngắn, mỗi bước 1 câu hỏi. Quiz chỉ trình bày lại kết quả tra cứu đã có
        (mệnh, cung phi, số chủ đạo) cho vui và dễ chia sẻ — không đoán tính cách tuyệt đối,
        không có độ chính xác nào được cam kết.
      </p>

      {step === 0 && (
        <div className="card space-y-4">
          <p className="font-display text-xl font-bold text-primary">Bước 1/3 — Ngày sinh của bạn?</p>
          <div>
            <label className="label" htmlFor="quiz-ngay">
              Ngày sinh dương lịch
            </label>
            <input
              id="quiz-ngay"
              type="date"
              className="input"
              value={ngaySinh}
              onChange={(e) => setNgaySinh(e.target.value)}
              required
            />
            <p className="mt-1 text-xs text-ink/70">
              Đã tự điền từ <a href="/ho-so" className="underline">hồ sơ của bạn</a> nếu đã lưu.
            </p>
          </div>
          <div>
            <span className="label">Giới tính (cung phi cần giới tính)</span>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="quiz-gt" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
                Nam
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="quiz-gt" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
                Nữ
              </label>
            </div>
          </div>
          {error && <p className="text-sm font-semibold text-red-700">{error}</p>}
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              if (!profileFromBirthdate(ngaySinh)) {
                setError('Ngày sinh chưa hợp lệ, vui lòng kiểm tra lại.');
                return;
              }
              setError('');
              setStep(1);
            }}
          >
            Tiếp theo →
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="card space-y-4">
          <p className="font-display text-xl font-bold text-primary">Bước 2/3 — Bạn quan tâm nhất điều gì?</p>
          <p className="text-sm text-ink/80">
            Câu này chỉ để chọn công cụ gợi ý ở cuối — không làm thay đổi mệnh, cung hay số của bạn.
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {INTERESTS.map((i) => (
              <button
                key={i.id}
                type="button"
                className="btn-gold py-3 text-base"
                onClick={() => {
                  setInterest(i.id);
                  setStep(2);
                }}
              >
                {i.label}
              </button>
            ))}
          </div>
          <button type="button" className="text-sm underline" onClick={() => setStep(0)}>
            ← Quay lại bước 1
          </button>
        </div>
      )}

      {step === 2 && ketQua && interestMeta ? (
        <div className="space-y-4">
          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Kết quả của bạn</h2>
            <p>
              Ngày sinh: <strong>{ketQua.solarDate ? fmtSolar(ketQua.solarDate) : ngaySinh}</strong> — âm lịch{' '}
              <strong>{fmtLunar(ketQua.profile.lunar)}</strong>
            </p>
            <p>
              Mệnh nạp âm: <strong>{ketQua.menh || 'Đang cập nhật'}</strong>
              {ketQua.menhElement ? ` (ngũ hành ${ketQua.menhElement})` : ''}
              {ketQua.ccYear ? ` — năm ${ketQua.ccYear}` : ''}
            </p>
            <p>
              Cung phi: <strong>{ketQua.cung}</strong> (nhóm {ketQua.nhom} tứ mệnh) — hướng tốt
              nhất: <strong>{ketQua.bestDir} ({ketQua.bestSao})</strong>
            </p>
            <p>
              Số chủ đạo: <strong>{ketQua.soChuDao ?? 'Đang cập nhật'}</strong>
            </p>
            <p className="text-sm text-ink/80">
              Các số trên lấy đúng công thức của công cụ gốc (/tra-menh, /huong-nha, /than-so-hoc)
              — bạn có thể đối chiếu lại ở các trang đó với cùng ngày sinh.
            </p>
          </div>

          <div className="card space-y-2">
            <h2 className="font-display text-xl font-bold text-primary">Gợi ý tiếp theo cho bạn</h2>
            <p className="text-sm">
              Vì bạn quan tâm <strong>{interestMeta.label}</strong>, thử công cụ{' '}
              <a href={interestMeta.toolHref} className="font-bold text-primary underline">
                {interestMeta.tool}
              </a>
              : {interestMeta.toolDesc}
            </p>
            <div className="flex flex-wrap gap-2">
              <a href={interestMeta.toolHref} className="btn-primary">
                Mở {interestMeta.tool} →
              </a>
              <a href="/tra-menh" className="btn-gold">
                Xem chi tiết mệnh &amp; cung
              </a>
            </div>
          </div>

          <ToolShareCard
            title="Kết quả quiz khám phá bản thân"
            lines={[
              `Mệnh: ${ketQua.menh || 'Đang cập nhật'}${ketQua.menhElement ? ` (${ketQua.menhElement})` : ''}`,
              `Hướng tốt nhất: ${ketQua.bestDir} (${ketQua.bestSao})`,
              `Số chủ đạo: ${ketQua.soChuDao ?? 'Đang cập nhật'}`,
            ]}
          />

          <button
            type="button"
            className="text-sm underline"
            onClick={() => {
              setStep(0);
              setInterest(null);
            }}
          >
            ↺ Làm lại quiz
          </button>
          <Disclaimer />
        </div>
      ) : step === 2 ? (
        <p className="text-sm font-semibold text-red-700">
          Không tính được kết quả — vui lòng kiểm tra lại ngày sinh và thử lại.
        </p>
      ) : null}
    </div>
  );
}
