import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Chạy được ở chế độ dev mà không cần key thật: khi thiếu biến môi trường,
// client là null và các trang dùng dữ liệu mẫu local trong lib/data.ts.
// KHÔNG hard-code secret ở đây — key chỉ lấy từ biến môi trường.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const hasSupabase = supabase !== null;
