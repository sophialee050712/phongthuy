# Hướng dẫn deploy — Khang An Phong Thủy

Chưa deploy lúc này. Khi có tài khoản, làm theo các bước sau.

## 1. Supabase (tạo project thật)

1. Tạo project tại supabase.com → lấy 2 key ở Project Settings → API:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. Vào SQL Editor, chạy toàn bộ file `supabase/schema.sql` (tạo bảng + RLS policies).
3. Vào Storage, tạo bucket public tên `media` (cho Thư viện ảnh admin).
4. Vào Authentication → Users → Add user: tạo tài khoản admin đầu tiên (KHÔNG bật
   đăng ký công khai — trang /admin chỉ cho tài khoản được mời).

## 2. Vercel

1. Import repo lên Vercel (framework: Next.js, giữ mặc định).
2. Thêm 3 biến môi trường:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (VD: https://khang-an-phong-thuy.vn)
3. Deploy. Kiểm tra: trang chủ, 1 công cụ, /admin đăng nhập được.

## 3. Domain

Trỏ domain về Vercel theo hướng dẫn trong Vercel → Domains, rồi cập nhật
`NEXT_PUBLIC_SITE_URL` đúng domain thật và deploy lại (sitemap + JSON-LD dùng biến này).

## 4. Trước khi public — bắt buộc

- Đối chiếu engine với nguồn lịch vạn niên thứ 2 (xem `lib/engine/README.md`:
  mục công thức chưa đối chiếu). Riêng 2 điểm cần chuyên gia chốt: bát trạch cung Khảm
  Diên Niên = Nam (bản task gốc ghi Bắc là sai — trùng Phục Vị Bắc) và mô hình
  chấm điểm tên (đơn giản, tự đặt trọng số — phải đổi tên hiển thị thành
  "điểm tham khảo" trước khi public).
- Điền các placeholder `[CHỜ ĐIỀN]`: hotline, link Zalo OA, giá gói Premium.
- Tích hợp thanh toán thật (TODO MoMo/ZaloPay trong trang bảng giá) trước khi bật paywall.
- Bật xác thực 2 lớp cho tài khoản admin Supabase.
- Lưu ý đã xử lý trong code (không cần làm thêm, chỉ kiểm chứng lại trên Supabase thật):
  bài hẹn giờ đăng tự hiện đúng giờ nhờ lọc phía query (không cần cron);
  bảng leads đã có policy anon chỉ-INSERT để API route dùng anon key (không cần service_role key);
  sitemap và JSON-LD Organization chỉ dùng URL tuyệt đối khi đã set `NEXT_PUBLIC_SITE_URL`.
