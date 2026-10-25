import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST /api/leads — nhận lead từ form (components/sales/LeadForm).
// Body JSON: { phone, zalo, note, source }.
// Quy tắc trung thực bắt buộc: chỉ trả stored:true khi insert Supabase thành công.
// Khi chưa cấu hình Supabase thì trả stored:false kèm hướng dẫn, KHÔNG báo thành công giả.
// TUYỆT ĐỐI không log số điện thoại (không console.log body hay giá trị phone/zalo).

type LeadBody = {
  phone?: unknown;
  zalo?: unknown;
  note?: unknown;
  source?: unknown;
};

/** Chuẩn hóa SĐT: bỏ khoảng trắng và dấu phân tách (`.`, `-`, `()`), đổi đầu +84 thành 0. */
function normalizePhone(value: unknown): string | null {
  if (typeof value === 'number' && Number.isInteger(value)) return String(value);
  if (typeof value !== 'string') return null;
  let cleaned = value.replace(/[\s.\-()]/g, '');
  if (cleaned.startsWith('+84')) cleaned = `0${cleaned.slice(3)}`;
  return cleaned;
}

function asText(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

export async function POST(req: Request) {
  let body: LeadBody;
  try {
    const parsed: unknown = await req.json();
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return NextResponse.json(
        { ok: false, stored: false, message: 'Nội dung gửi lên không hợp lệ.' },
        { status: 400 },
      );
    }
    body = parsed as LeadBody;
  } catch {
    return NextResponse.json(
      { ok: false, stored: false, message: 'Nội dung gửi lên không phải JSON hợp lệ.' },
      { status: 400 },
    );
  }

  const rawPhone = normalizePhone(body.phone);
  const phone = rawPhone === null || rawPhone === '' ? null : rawPhone;
  const zalo = asText(body.zalo, 100);
  const note = asText(body.note, 500);
  const source = asText(body.source, 100);

  // phone nếu có phải là chuỗi số 9–11 ký tự sau khi chuẩn hóa.
  if (phone !== null && !/^\d{9,11}$/.test(phone)) {
    return NextResponse.json(
      { ok: false, stored: false, message: 'Số điện thoại phải là 9–11 chữ số.' },
      { status: 400 },
    );
  }
  // Ít nhất phone hoặc zalo phải có.
  if (phone === null && zalo === '') {
    return NextResponse.json(
      { ok: false, stored: false, message: 'Cần ít nhất số điện thoại hoặc Zalo.' },
      { status: 400 },
    );
  }

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        stored: false,
        message: 'Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md',
      },
      { status: 503 },
    );
  }

  const { error } = await supabase.from('leads').insert({
    phone,
    zalo: zalo === '' ? null : zalo,
    note: note === '' ? null : note,
    source: source === '' ? null : source,
  });

  if (error) {
    return NextResponse.json(
      { ok: false, stored: false, message: 'Không lưu được yêu cầu lúc này. Vui lòng thử lại sau.' },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true, stored: true });
}
