'use client';

import { useEffect, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import {
  clearBirthdate,
  getBirthdate,
  getGender,
  profileFromBirthdate,
  setBirthdate,
  setGender,
  type GioiTinh,
} from '@/lib/personal';

export default function HoSoPage() {
  const [ngaySinh, setNgaySinh] = useState('');
  const [gioiTinh, setGioiTinh] = useState<GioiTinh>('nam');
  const [saved, setSaved] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const stored = getBirthdate();
    if (stored) {
      setNgaySinh(stored);
      setSaved(stored);
    }
    const g = getGender();
    if (g) setGioiTinh(g);
  }, []);

  const profile = saved ? profileFromBirthdate(saved) : null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Hồ sơ của tôi</h1>
      <p className="text-ink/80">
        Lưu ngày sinh của bạn để các công cụ (vận hạn cá nhân, so sánh, la bàn, nhật ký) tự điền
        sẵn. Ngày sinh chỉ lưu trong trình duyệt của bạn (localStorage) — không cần tài khoản và
        không gửi lên máy chủ.
      </p>
      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          if (setBirthdate(ngaySinh)) {
            setGender(gioiTinh);
            setSaved(ngaySinh);
            setMessage('Đã lưu vào trình duyệt của bạn.');
          } else {
            setMessage('Ngày sinh chưa hợp lệ. Vui lòng chọn lại ngày theo định dạng năm-tháng-ngày.');
          }
        }}
      >
        <div>
          <label className="label" htmlFor="hs-ngay">
            Ngày sinh (dương lịch)
          </label>
          <input
            id="hs-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
        </div>
        <div>
          <span className="label">Giới tính (dùng để tính cung phi)</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hs-gioi-tinh"
                checked={gioiTinh === 'nam'}
                onChange={() => setGioiTinh('nam')}
              />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="hs-gioi-tinh"
                checked={gioiTinh === 'nu'}
                onChange={() => setGioiTinh('nu')}
              />
              Nữ
            </label>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary">
            Lưu hồ sơ
          </button>
          <button
            type="button"
            className="btn-gold"
            onClick={() => {
              clearBirthdate();
              setSaved(null);
              setNgaySinh('');
              setMessage('Đã xóa ngày sinh khỏi trình duyệt của bạn.');
            }}
          >
            Xóa hồ sơ
          </button>
        </div>
        {message ? <p className="text-sm text-ink/80">{message}</p> : null}
      </form>

      {profile ? (
        <div className="card space-y-2">
          <h2 className="font-display text-xl font-bold text-primary">Thông tin từ ngày sinh đã lưu</h2>
          <p>
            Âm lịch: <strong>ngày {profile.lunar.day} tháng {profile.lunar.month}
            {profile.lunar.leap ? ' nhuận' : ''} năm {profile.lunar.year}</strong>
          </p>
          <p>
            Tuổi (dương lịch): <strong>{profile.tuoi}</strong> — Tuổi con giáp (theo năm âm lịch):{' '}
            <strong>{profile.conGiap}</strong>
          </p>
          <p>
            Năm âm lịch: <strong>{profile.canChiNam}</strong> — Mệnh nạp âm:{' '}
            <strong>{profile.menh}</strong>
          </p>
          <p className="text-sm text-ink/80">
            Các trang công cụ khác sẽ tự điền ngày sinh này; bạn vẫn có thể sửa tay tại từng trang
            mà không làm thay đổi hồ sơ đã lưu.
          </p>
        </div>
      ) : (
        <p className="text-sm text-ink/80">
          Chưa có hồ sơ. Nhập ngày sinh ở trên và bấm “Lưu hồ sơ” để các công cụ tự điền sẵn.
        </p>
      )}
      <Disclaimer />
    </div>
  );
}
