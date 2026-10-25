# Khang An Phong Thủy

Website tra cứu phong thủy / tướng số: xem ngày tốt xấu, tra bản mệnh, hướng nhà bát trạch,
đặt tên con, luận số, vận hạn — kèm kho bài viết chuẩn SEO/AEO và trang quản trị kiểu WordPress.

Stack: Next.js 14 (App Router) + Tailwind CSS + TypeScript + Supabase (Auth, Postgres, Storage).
Deploy target: Vercel. Chưa deploy — xem `HUONG-DAN-DEPLOY.md`.

## Chạy local

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # unit test engine tính toán (24 test)
npm run build      # kiểm tra build production
```

Chưa có Supabase key thì web vẫn chạy với dữ liệu mẫu local (trang công khai + bài viết mẫu).
Trang /admin cần Supabase Auth — xem `HUONG-DAN-DEPLOY.md`.

## Cấu trúc

- `lib/engine/` — engine tính toán (âm lịch, can chi, ngũ hành, cung phi, bát trạch,
  giờ hoàng đạo, thần số học, chấm điểm tên, luận số) + unit test + README ghi rõ
  công thức nào đã đối chiếu, công thức nào còn cần đối chiếu nguồn thứ 2.
- `app/` — trang công khai (`page.tsx`, `xem-ngay`, `tra-menh`, `huong-nha`, `dat-ten`,
  `luan-so`, `van-han`, `bang-gia`, `bai-viet`), trang quản trị `/admin`, route SEO tự sinh
  (`tuoi/[tuoi]/[nam]/[viec]`, `ngay/[date]`), trang chia sẻ (`chia-se`), API leads (`api/leads`).
- `components/` — component theo khu vực: `site/` (form các công cụ), `admin/` (sidebar WP,
  PostForm, MediaPicker, nén ảnh), `sales/` (LeadForm), `share/` (thẻ 9:16).
- `supabase/schema.sql` — bảng posts, media, leads, site_settings, profiles + RLS policies.

## Trạng thái kiểm chứng (2026-10-25, tích hợp cuối)

- `npm test`: **24/24 pass** — gồm cả 3 vector bắt buộc (10/10/2014, 17/06/2025, 25/05/2025).
- `npx tsc --noEmit`: **sạch, 0 lỗi**.
- `npm run build`: **pass, 23 route**.
- Smoke test production build (`npm start` + curl): trang chủ, 6 công cụ, bảng giá,
  bài viết, /admin, /chia-se, /sitemap.xml, /robots.txt, POST /api/leads đều 200
  (leads trả 503 trung thực `stored:false` khi chưa cấu hình Supabase). Route `/ngay`
  tái hiện chính xác cả 3 vector trên HTML thật (can chi ngày + 6 giờ hoàng đạo kèm tên sao).
- Route `/tuoi/Tý/2026/Khai trương` quét thật cả năm 2026: 20 ngày tham khảo, 11 tháng có ngày.

## Quy tắc bắt buộc

- Không bịa giá, thời lượng, số điện thoại, tiểu sử thầy — dùng `[CHỜ ĐIỀN]`.
- KHÔNG lưu trữ số CCCD dưới bất kỳ hình thức nào: luận số CCCD chỉ tính phía client,
  không gửi server, không log, không có link chia sẻ (tránh lộ số qua URL).
- Không hard-code secret — mọi key qua biến môi trường (xem `.env.example`).

## Chưa xong / TODO (theo thứ tự ưu tiên trước khi public)

1. **Chuyên gia phong thủy chốt 2 điểm** (xem `lib/engine/README.md` §5–§7):
   đối chiếu toàn bộ 60 ô nạp âm + các năm nhuận khác 2025 + bộ sao ngày mở rộng
   với nguồn lịch vạn niên thứ 2; chốt bát trạch cung Khảm Diên Niên = Nam
   (bản task gốc ghi Bắc là sai — trùng Phục Vị Bắc, phá vỡ song ánh 8 sao/8 hướng);
   duyệt mô hình chấm điểm tên (đơn giản, tự đặt trọng số) và đổi tên hiển thị
   thành "điểm tham khảo" trước khi public.
2. Tích hợp thanh toán thật (TODO MoMo/ZaloPay trong trang bảng giá) trước khi bật paywall.
3. Điền mọi `[CHỜ ĐIỀN]`: hotline, link Zalo OA, giá gói, link affiliate.
4. Bật 2FA cho tài khoản admin Supabase; cân nhắc thêm middleware kiểm tra vai trò
   phía server cho /admin (hiện tại gate phía client + RLS là lớp bảo vệ ghi).
5. Bài hẹn giờ đăng: đã tự hiện đúng giờ nhờ lọc phía query (không cần cron) —
   kiểm chứng lại trên Supabase thật sau khi deploy.
6. Kiểm tra trực quan bằng trình duyệt thật (chưa làm trong đợt này): form các công cụ
   nhập liệu + kết quả, la bàn 8 hướng, thẻ chia sẻ 9:16, trang /admin đầy đủ flow.
7. Mở rộng pool tên mẫu trang đặt tên (hiện 28 tên mẫu), mở rộng bộ sao ngày
   (Tam Nương, Nguyệt Kỵ, trực, nhị thập bát tú), mở sitemap programmatic theo đợt
   100–300 trang kèm đo lường (hiện sitemap chỉ liệt kê tập giới hạn).
