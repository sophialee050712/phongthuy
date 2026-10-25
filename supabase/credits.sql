-- ============================================================================
-- HỆ NẠP TIỀN / ĐƠN HÀNG — LUỒNG CHUYỂN KHOẢN THỦ CÔNG (PHASE NÀY)
-- ============================================================================
-- TRẠNG THÁI: FILE NÀY CHƯA ĐƯỢC ÁP DỤNG. Chủ site phải chạy TOÀN BỘ file
-- này bằng tay trong Supabase SQL Editor (Dashboard → SQL Editor → New
-- query → dán → Run). Chạy SAU supabase/schema.sql vì các policy dưới đây
-- dùng hàm public.is_admin() đã tạo trong schema.sql.
--
-- LUỒNG HOẠT ĐỘNG (chuyển khoản thủ công, KHÔNG có cổng tự động):
--   1. Khách ở trang in (Thẻ số mệnh / Lộ trình / Báo cáo / Ngày trọng đại)
--      bấm "Tạo mã đơn" → site INSERT một đơn pending (policy anon bên dưới
--      chỉ cho tạo đơn pending, không cho tự xác nhận).
--   2. Khách chuyển khoản thủ công, ghi NỘI DUNG = MÃ ĐƠN (VD: KA-AB12CD).
--      Thông tin tài khoản nhận hiển thị từ bảng site_settings (các key
--      bank_name / bank_account / bank_account_name, mặc định [CHỜ ĐIỀN]
--      cho tới khi chủ site điền thật trong trang /admin/cai-dat).
--   3. Admin vào /admin/don-hang kiểm tra tiền về rồi bấm "Xác nhận".
--   4. Khách nhập lại mã đơn ở trang in → bản đầy đủ được mở khóa để in.
--
-- CHƯA BẬT — CẦN TÀI KHOẢN MERCHANT CỦA CHỦ SITE:
--   Tích hợp thanh toán tự động qua MoMo / ZaloPay HIỆN CHƯA BẬT và KHÔNG
--   có trong file này. Chỉ khi chủ site cung cấp tài khoản merchant thì mới
--   triển khai thêm; tuyệt đối không hard-code merchant, số tài khoản hay
--   secret nào vào code/SQL.
--
-- BẢO MẬT — ĐỌC KỸ TRƯỚC KHI CHẠY:
--   - Bảng orders KHÔNG lưu bất kỳ thông tin cá nhân nào (không tên, không
--     SĐT, không email, không CCCD). Vì vậy policy anon SELECT bên dưới chỉ
--     lộ mã đơn + sản phẩm + số tiền + trạng thái — mã đơn đóng vai trò như
--     "mã tra cứu" mà khách giữ. Nếu về sau bảng này có thêm thông tin cá
--     nhân thì PHẢI thu hồi policy anon SELECT và chuyển việc kiểm tra mã
--     đơn sang một API route phía server.
--   - Anon CHỈ được INSERT đơn pending (WITH CHECK bắt status = 'pending'
--     và chặn tự đặt confirmed). Mọi thao tác xác nhận/hủy CHỈ admin làm
--     được (policy is_admin).
--   - Nếu RLS hiện tại của schema.sql chưa có bảng này thì file này tự tạo
--     đủ policy cần thiết — không cần sửa schema.sql.
-- ============================================================================

-- ---------- Bảng orders ----------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  -- Mã đơn khách dùng để chuyển khoản và mở khóa in, VD: KA-AB12CD.
  -- Site tự sinh ở phía client khi khách bấm "Tạo mã đơn".
  code text not null unique,
  -- Sản phẩm: the_so_menh | lo_trinh | bao_cao | ngay_trong_dai
  product text not null check (product in ('the_so_menh', 'lo_trinh', 'bao_cao', 'ngay_trong_dai')),
  -- Số tiền (VND, số nguyên). Lấy từ site_settings (price_*) lúc tạo đơn;
  -- giá hiện tại là giá demo cho tới khi chủ site xác nhận giá thật.
  amount integer not null check (amount > 0),
  -- pending: chờ chuyển khoản / chờ admin xác nhận
  -- confirmed: admin đã thấy tiền về, mã này mở khóa in bản đầy đủ
  -- cancelled: admin hủy (mã này không mở khóa được nữa)
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'cancelled')),
  -- Ghi chú nội bộ của admin (không chứa thông tin cá nhân của khách).
  note text not null default '',
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);
create index if not exists orders_code_idx on public.orders (code);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

-- ---------- RLS cho orders ----------
alter table public.orders enable row level security;

-- Khách (chưa đăng nhập) tạo đơn: CHỈ được tạo đơn pending.
drop policy if exists orders_anon_insert on public.orders;
create policy orders_anon_insert on public.orders
  for insert to anon
  with check (status = 'pending');

-- Khách kiểm tra mã đơn của mình ở trang in: cho anon SELECT.
-- Xem cảnh báo bảo mật ở đầu file: bảng này không chứa thông tin cá nhân.
drop policy if exists orders_anon_select on public.orders;
create policy orders_anon_select on public.orders
  for select to anon using (true);

-- Tài khoản đã đăng nhập đọc được đơn (để trang /admin/don-hang liệt kê).
drop policy if exists orders_auth_read on public.orders;
create policy orders_auth_read on public.orders
  for select to authenticated using (auth.uid() is not null);

-- CHỈ admin được xác nhận / hủy / sửa / xóa đơn.
drop policy if exists orders_admin_write on public.orders;
create policy orders_admin_write on public.orders
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------- Seed site_settings: tài khoản nhận + giá demo ----------
-- Giá dưới đây là GIÁ DEMO tham khảo; chủ site sửa giá thật trong trang
-- /admin/cai-dat (các field price_*). Tài khoản nhận để [CHỜ ĐIỀN] cho tới
-- khi chủ site điền thật — không bịa số tài khoản nào ở đây.
insert into public.site_settings (key, value) values
  ('bank_name', '[CHỜ ĐIỀN]'),
  ('bank_account', '[CHỜ ĐIỀN]'),
  ('bank_account_name', '[CHỜ ĐIỀN]'),
  ('price_the_so_menh', '49000'),
  ('price_lo_trinh', '99000'),
  ('price_bao_cao_min', '99000'),
  ('price_bao_cao_max', '299000'),
  ('price_ngay_trong_dai', '99000')
on conflict (key) do nothing;
