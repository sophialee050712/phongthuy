'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import AdminShell from '@/components/admin/AdminShell';
import { formatDate, type LeadRow } from '@/components/admin/helpers';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted'>('all');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError('Không tải được danh sách lead: ' + err.message);
        else setLeads((data ?? []) as LeadRow[]);
      });
  }, []);

  async function markContacted(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('leads').update({ status: 'contacted' }).eq('id', id);
    if (error) setMessage('Không cập nhật được: ' + error.message);
    else {
      setMessage('Đã đánh dấu đã liên hệ.');
      setLeads(leads.map((l) => (l.id === id ? { ...l, status: 'contacted' as const } : l)));
    }
  }

  const shown = filter === 'all' ? leads : leads.filter((l) => l.status === filter);

  return (
    <AdminShell title="Leads">
      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'new', 'contacted'] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={filter === f ? 'btn-primary' : 'btn-gold'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Tất cả' : f === 'new' ? 'Mới' : 'Đã liên hệ'}
          </button>
        ))}
      </div>
      {error ? <p className="mb-4 text-sm text-primary">{error}</p> : null}
      {message ? <p className="mb-4 text-sm text-primary">{message}</p> : null}
      {shown.length === 0 ? (
        <p className="card text-sm">
          {supabase
            ? 'Chưa có lead nào ở mục này.'
            : 'Chưa cấu hình Supabase — xem HUONG-DAN-DEPLOY.md. Khi chưa có Supabase, danh sách lead trống.'}
        </p>
      ) : null}
      <div className="space-y-3">
        {shown.map((lead) => (
          <div key={lead.id} className="card">
            <p className="font-semibold">
              {lead.phone} {lead.zalo && lead.zalo !== lead.phone ? `· Zalo: ${lead.zalo}` : ''}
            </p>
            <p className="mt-1 text-sm text-ink/70">
              <span className="chip">{lead.status === 'new' ? 'Mới' : 'Đã liên hệ'}</span>{' '}
              Nguồn: {lead.source ?? '—'} · {formatDate(lead.created_at)}
            </p>
            {lead.note ? <p className="mt-2 text-sm">{lead.note}</p> : null}
            {lead.status === 'new' ? (
              <button
                type="button"
                className="btn-gold mt-3 text-sm"
                onClick={() => markContacted(lead.id)}
              >
                Đánh dấu đã liên hệ
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </AdminShell>
  );
}
