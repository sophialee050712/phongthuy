'use client';

// Trang admin quản lý đơn hàng (luồng chuyển khoản thủ công).
// Admin xem danh sách đơn và bấm Xác nhận / Hủy. Quyền ghi thật sự dựa vào
// RLS trong supabase/credits.sql (chỉ admin được sửa đơn).
// Nếu bảng orders chưa tồn tại, trang báo rõ là chủ site cần chạy file
// supabase/credits.sql trong Supabase SQL Editor — không giả vờ có đơn.

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';

type Order = {
  id: string;
  code: string;
  product: string;
  amount: number;
  status: 'pending' | 'confirmed' | 'cancelled';
  note: string;
  created_at: string;
  confirmed_at: string | null;
};

const PRODUCT_LABEL: Record<string, string> = {
  the_so_menh: 'Thẻ số mệnh',
  lo_trinh: 'Lộ trình 12 tháng âm lịch',
  bao_cao: 'Báo cáo tổng hợp',
  ngay_trong_dai: 'Gói ngày trọng đại',
};

const STATUS_LABEL: Record<Order['status'], string> = {
  pending: 'Chờ xác nhận',
  confirmed: 'Đã xác nhận',
  cancelled: 'Đã hủy',
};

function fmtVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<'all' | Order['status']>('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState('');

  async function load() {
    if (!supabase) return;
    const { data, error: err } = await supabase
      .from('orders')
      .select('id, code, product, amount, status, note, created_at, confirmed_at')
      .order('created_at', { ascending: false });
    if (err) {
      setError(
        'Không đọc được danh sách đơn: ' + err.message +
        ' — Nếu bảng orders chưa tồn tại, chủ site cần chạy file supabase/credits.sql trong Supabase SQL Editor (sau schema.sql).',
      );
      return;
    }
    setError('');
    setOrders((data ?? []) as Order[]);
  }

  useEffect(() => {
    load();
  }, []);

  async function setStatus(order: Order, status: 'confirmed' | 'cancelled') {
    if (!supabase) return;
    setBusyId(order.id);
    setMessage('');
    const patch: Record<string, unknown> = { status };
    if (status === 'confirmed') patch.confirmed_at = new Date().toISOString();
    const { error: err } = await supabase.from('orders').update(patch).eq('id', order.id);
    setBusyId('');
    if (err) {
      setMessage('Không cập nhật được đơn ' + order.code + ': ' + err.message + ' (chỉ tài khoản admin mới xác nhận/hủy được, theo RLS trong credits.sql).');
      return;
    }
    setMessage(`Đã ${status === 'confirmed' ? 'xác nhận' : 'hủy'} đơn ${order.code}.`);
    load();
  }

  const shown = filter === 'all' ? orders : orders.filter((o) => o.status === filter);

  return (
    <AdminShell title="Đơn hàng">
      {error ? (
        <p className="card mb-4 text-sm">{error}</p>
      ) : null}
      {message ? <p className="card mb-4 text-sm text-primary">{message}</p> : null}
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((s) => (
          <button
            key={s}
            type="button"
            className={filter === s ? 'btn-primary text-sm' : 'btn-gold text-sm'}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Tất cả' : STATUS_LABEL[s]}
          </button>
        ))}
        <button type="button" className="btn-gold text-sm" onClick={load}>
          Tải lại
        </button>
      </div>
      {shown.length === 0 && !error ? (
        <p className="card text-sm">Chưa có đơn hàng nào.</p>
      ) : null}
      <div className="space-y-3">
        {shown.map((o) => (
          <div key={o.id} className="card space-y-1 text-sm">
            <p>
              <strong className="font-display text-base text-primary">{o.code}</strong>{' '}
              <span className="chip">{STATUS_LABEL[o.status]}</span>
            </p>
            <p>Sản phẩm: {PRODUCT_LABEL[o.product] ?? o.product}</p>
            <p>Số tiền: <strong>{fmtVND(o.amount)}</strong></p>
            <p>Tạo lúc: {fmtDate(o.created_at)}</p>
            {o.confirmed_at ? <p>Xác nhận lúc: {fmtDate(o.confirmed_at)}</p> : null}
            {o.note ? <p>Ghi chú: {o.note}</p> : null}
            {o.status === 'pending' ? (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  type="button"
                  className="btn-primary text-sm"
                  disabled={busyId === o.id}
                  onClick={() => setStatus(o, 'confirmed')}
                >
                  Xác nhận (đã nhận tiền)
                </button>
                <button
                  type="button"
                  className="btn-gold text-sm"
                  disabled={busyId === o.id}
                  onClick={() => setStatus(o, 'cancelled')}
                >
                  Hủy đơn
                </button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-ink/80">
        Lưu ý: bảng đơn hàng không lưu thông tin cá nhân của khách (không tên, SĐT, email).
        Khách chuyển khoản với nội dung là mã đơn; admin đối chiếu tiền về theo mã đơn rồi
        bấm xác nhận. Thanh toán tự động MoMo/ZaloPay chưa bật — đang chờ tài khoản merchant
        của chủ site.
      </p>
    </AdminShell>
  );
}
