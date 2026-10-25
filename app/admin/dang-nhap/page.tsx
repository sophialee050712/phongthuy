'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Trang đăng nhập duy nhất của khu vực admin.
// KHÔNG có trang đăng ký công khai: chỉ tài khoản được mời từ Supabase
// Dashboard (Authentication → Users → Add user) mới đăng nhập được — xem
// HUONG-DAN-DEPLOY.md mục 1 bước 4.
export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!supabase) {
      setError('Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md.');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) {
      setError('Đăng nhập không thành công: ' + err.message);
    } else {
      router.push('/admin');
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="card space-y-3">
        <h1 className="font-display text-2xl font-bold text-primary">Đăng nhập quản trị</h1>
        <p className="text-sm">
          Chỉ tài khoản được mời từ Supabase Dashboard mới vào được. Không có đăng ký công khai.
        </p>
        {!supabase ? (
          <p className="text-sm text-primary">
            Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md để thêm
            NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        ) : null}
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <label className="label" htmlFor="login-password">Mật khẩu</label>
            <input
              id="login-password"
              type="password"
              required
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading || !supabase}>
            {loading ? 'Đang đăng nhập…' : 'Đăng nhập'}
          </button>
          {error ? <p className="text-sm text-primary">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}
