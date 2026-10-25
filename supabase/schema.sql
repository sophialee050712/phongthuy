-- ============================================================================
-- Schema cho website "Khang An Phong Thủy" — chạy toàn bộ file này trong
-- Supabase SQL Editor (theo HUONG-DAN-DEPLOY.md mục 1 bước 2).
-- Sau đó tạo bucket Storage public tên 'media' bằng tay (mục 1 bước 3).
--
-- LƯU Ý QUAN TRỌNG:
-- - Không có cột nào lưu CCCD ở đây. Khu vực admin không liên quan CCCD:
--   leads chỉ có SĐT/Zalo, tuyệt đối không thêm trường CCCD về sau.
-- - Không hard-code secret: file này chỉ chứa cấu trúc + policy, không chứa key.
-- - Tài khoản đăng nhập: CHỈ tài khoản được mời từ Supabase Dashboard
--   (Authentication → Users → Add user). Không bật đăng ký công khai.
--   Khi user mới được tạo, trigger bên dưới tự tạo dòng profiles cho họ
--   với role mặc định 'editor'; đổi thành 'admin' bằng tay trong bảng profiles.
-- ============================================================================

-- ---------- Hàm tiện ích ----------

-- Cập nhật updated_at tự động khi sửa dòng.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------- Bảng profiles: hồ sơ + vai trò của tài khoản đăng nhập ----------
-- id KHỚP auth.users.id (khóa ngoại, xóa user thì xóa profile theo).
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now()
);

-- Cách lấy role của người đang gọi API (dùng trong mọi policy bên dưới):
-- join bảng profiles với auth.uid() — tức id của tài khoản đã đăng nhập.
-- Hàm SECURITY DEFINER để policy đọc được profiles ngay cả khi RLS bật.
create or replace function public.current_role()
returns text
language sql
security definer
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

-- Tự tạo profile khi có user mới (mời từ Dashboard cũng chạy trigger này).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, email, role)
  values (new.id, coalesce(new.email, ''), 'editor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Bảng posts: khớp type Post trong lib/data.ts ----------
-- title/slug/excerpt/content/category/cover_image/seo_title/seo_description/
-- aeo_answer/faq (JSONB)/published_at, cộng thêm status + author_id để quản trị.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null default '',
  content text not null default '',
  category text not null default 'Kiến thức',
  cover_image text,
  seo_title text,
  seo_description text,
  aeo_answer text,
  faq jsonb not null default '[]'::jsonb,  -- [{q, a}] — câu hỏi/trả lời AEO
  status text not null default 'draft' check (status in ('draft', 'published', 'scheduled')),
  published_at timestamptz,
  author_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists posts_status_idx on public.posts (status);
create index if not exists posts_published_at_idx on public.posts (published_at desc);
create index if not exists posts_category_idx on public.posts (category);
drop trigger if exists posts_set_updated_at on public.posts;
create trigger posts_set_updated_at
  before update on public.posts
  for each row execute function public.set_updated_at();

-- ---------- Bảng media: thông tin ảnh trong Thư viện ----------
-- File thật nằm ở Storage bucket 'media'; bảng này chỉ lưu đường dẫn, link
-- công khai và alt text để trang admin duyệt/sửa/copy link.
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null unique,  -- đường dẫn trong bucket 'media'
  url text not null,
  alt_text text,
  uploaded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists media_created_at_idx on public.media (created_at desc);

-- ---------- Bảng leads: khớp form LeadForm (SĐT, Zalo, nguồn, ghi chú) ----------
-- KHÔNG có cột CCCD — không được thêm về sau.
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  phone text not null,
  zalo text,
  source text,
  note text,
  status text not null default 'new' check (status in ('new', 'contacted')),
  created_at timestamptz not null default now()
);
create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ---------- Bảng site_settings: cài đặt dạng key/value ----------
create table if not exists public.site_settings (
  key text primary key,
  value text not null default '',
  updated_at timestamptz not null default now()
);
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at
  before update on public.site_settings
  for each row execute function public.set_updated_at();

-- Giá trị mặc định khớp fallback trong lib/data.ts (chưa điền thì [CHỜ ĐIỀN]).
insert into public.site_settings (key, value) values
  ('site_name', 'Khang An Phong Thủy'),
  ('slogan', 'Khơi Vận May Mắn, Khai Mở Cát Tường'),
  ('zalo_oa', '[CHỜ ĐIỀN]'),
  ('affiliate_link', '[CHỜ ĐIỀN]')
on conflict (key) do nothing;

-- ============================================================================
-- RLS — bật cho mọi bảng. Nguyên tắc chung:
-- - Công khai (chưa đăng nhập): CHỈ đọc được bài đã xuất bản (hoặc hẹn giờ
--   đã tới giờ) và đọc site_settings; riêng bảng leads thì anon CHỈ được
--   INSERT (form công khai gửi qua API route), không đọc/sửa/xóa.
-- - Tài khoản đã đăng nhập: đọc được bài/leads/media (mọi trạng thái).
-- - Admin: toàn quyền mọi bảng.
-- - Editor: CHỈ tạo bài nháp và sửa/xóa bài nháp CỦA CHÍNH MÌNH, KHÔNG được
--   xuất bản hay hẹn giờ. Policy UPDATE của editor chặn ở cả 2 đầu:
--   USING chỉ cho sửa dòng đang là nháp của mình, WITH CHECK bắt dòng mới
--   vẫn phải là nháp và published_at phải NULL (không lén đặt ngày đăng).
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.media enable row level security;
alter table public.leads enable row level security;
alter table public.site_settings enable row level security;

-- ----- profiles -----
-- Mọi tài khoản đã đăng nhập đọc được profiles (để admin/editor xem role nhau
-- và để hàm current_role() hoạt động); chỉ admin được sửa role.
drop policy if exists profiles_read on public.profiles;
create policy profiles_read on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_admin_write on public.profiles;
create policy profiles_admin_write on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----- posts -----
-- Công khai chỉ đọc bài đã xuất bản, hoặc bài hẹn giờ đã tới giờ đăng
-- (bài hẹn giờ tự hiện khi quá published_at, không cần cron riêng).
drop policy if exists posts_public_read on public.posts;
create policy posts_public_read on public.posts
  for select to anon, authenticated using (status = 'published' or (status = 'scheduled' and published_at <= now()));
-- Tài khoản đã đăng nhập đọc mọi bài (kể cả nháp) để quản trị.
drop policy if exists posts_auth_read on public.posts;
create policy posts_auth_read on public.posts
  for select to authenticated using (auth.uid() is not null);
-- Tạo bài: admin tạo trạng thái nào cũng được; editor CHỈ tạo bài nháp
-- của chính mình (author_id phải là mình, status phải là 'draft').
drop policy if exists posts_insert on public.posts;
create policy posts_insert on public.posts
  for insert to authenticated
  with check (
    author_id = auth.uid()
    and (public.is_admin() or status = 'draft')
  );
-- Sửa bài: admin sửa mọi bài; editor chỉ sửa bài nháp của chính mình và
-- dòng mới vẫn phải là nháp, published_at vẫn NULL (chặn xuất bản/hẹn giờ).
drop policy if exists posts_update on public.posts;
create policy posts_update on public.posts
  for update to authenticated
  using (
    public.is_admin()
    or (author_id = auth.uid() and status = 'draft')
  )
  with check (
    public.is_admin()
    or (author_id = auth.uid() and status = 'draft' and published_at is null)
  );
-- Xóa bài: admin xóa mọi bài; editor chỉ xóa bài nháp của chính mình.
drop policy if exists posts_delete on public.posts;
create policy posts_delete on public.posts
  for delete to authenticated
  using (
    public.is_admin()
    or (author_id = auth.uid() and status = 'draft')
  );

-- ----- media -----
-- Tài khoản đã đăng nhập đọc được media (để chọn ảnh đại diện).
drop policy if exists media_read on public.media;
create policy media_read on public.media
  for select to authenticated using (auth.uid() is not null);
-- Upload: tài khoản đã đăng nhập nào cũng được thêm (uploaded_by phải là mình).
drop policy if exists media_insert on public.media;
create policy media_insert on public.media
  for insert to authenticated
  with check (uploaded_by = auth.uid() or uploaded_by is null);
-- Sửa alt text: admin sửa mọi ảnh; người khác chỉ sửa ảnh mình upload.
drop policy if exists media_update on public.media;
create policy media_update on public.media
  for update to authenticated
  using (public.is_admin() or uploaded_by = auth.uid())
  with check (public.is_admin() or uploaded_by = auth.uid());
-- Xóa: admin xóa mọi ảnh; người khác chỉ xóa ảnh mình upload.
drop policy if exists media_delete on public.media;
create policy media_delete on public.media
  for delete to authenticated
  using (public.is_admin() or uploaded_by = auth.uid());

-- ----- leads -----
-- Tài khoản đã đăng nhập đọc được leads (để chăm sóc khách).
drop policy if exists leads_read on public.leads;
create policy leads_read on public.leads
  for select to authenticated using (auth.uid() is not null);
-- Form công khai gửi lead qua API route /api/leads dùng anon key, nên cần
-- policy cho phép anon CHỈ INSERT (không đọc/sửa/xóa) — lead mới vào vẫn
-- chỉ tài khoản đăng nhập đọc được qua leads_read.
drop policy if exists leads_public_insert on public.leads;
create policy leads_public_insert on public.leads
  for insert to anon with check (true);
-- Chỉ admin được đổi trạng thái/xóa lead.
drop policy if exists leads_admin_write on public.leads;
create policy leads_admin_write on public.leads
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ----- site_settings -----
-- Công khai đọc được (tên site/slogan hiển thị trên trang công khai).
drop policy if exists site_settings_public_read on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
-- Chỉ admin được ghi cài đặt.
drop policy if exists site_settings_admin_write on public.site_settings;
create policy site_settings_admin_write on public.site_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ============================================================================
-- Storage policies cho bucket 'media' (áp dụng SAU KHI tạo bucket bằng tay).
-- Ảnh trong bucket là public để trang công khai hiển thị được.
-- ============================================================================
drop policy if exists media_bucket_public_read on storage.objects;
create policy media_bucket_public_read on storage.objects
  for select to anon, authenticated using (bucket_id = 'media');
drop policy if exists media_bucket_upload on storage.objects;
create policy media_bucket_upload on storage.objects
  for insert to authenticated with check (bucket_id = 'media');
drop policy if exists media_bucket_update on storage.objects;
create policy media_bucket_update on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()))
  with check (bucket_id = 'media');
drop policy if exists media_bucket_delete on storage.objects;
create policy media_bucket_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and (owner = auth.uid() or public.is_admin()));
