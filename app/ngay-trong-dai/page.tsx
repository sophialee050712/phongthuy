'use client';

// Gói "ngày trọng đại" trọn gói — sản phẩm in.
// Chọn loại sự kiện + khoảng thời gian, xuất các ngày đẹp chính cho sự
// kiện đó. Ngày được xếp hạng CHỈ bằng sao ngày của engine (saoNgay) và
// giờ hoàng đạo: nhiều sao tốt, ít sao xấu thì xếp trên; ngày có sao xấu
// Nguyệt Phá / Dương Nhẫn được gắn cờ cảnh báo; ngày xung tuổi (nếu nhập
// ngày sinh) bị trừ điểm. Không bịa thêm sao hay kiêng kỵ ngoài engine.
// Xem trước miễn phí: 3 ngày đầu. Bản đầy đủ (tối đa 8 ngày) chỉ mở khóa
// in khi mã đơn đã được admin xác nhận (xem cổng mã đơn bên dưới).

import { useEffect, useMemo, useState } from 'react';
import {
  canChiDay,
  saoNgay,
  hoangDaoHours,
  solarToLunar,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import { TUOI_12 } from '@/lib/data';
import Disclaimer from '@/components/site/Disclaimer';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  fmtLunar,
  fmtSolar,
  parseISODate,
  todayISO,
  zodiacOfLunarYear,
} from '@/components/site/format';

type ProductKey = 'the_so_menh' | 'lo_trinh' | 'bao_cao' | 'ngay_trong_dai';

const PRODUCT_LABEL: Record<ProductKey, string> = {
  the_so_menh: 'Thẻ số mệnh',
  lo_trinh: 'Lộ trình 12 tháng âm lịch',
  bao_cao: 'Báo cáo tổng hợp',
  ngay_trong_dai: 'Gói ngày trọng đại',
};

function fmtVND(n: number): string {
  return n.toLocaleString('vi-VN') + 'đ';
}

function parsePrice(raw: string | undefined, fallback: number): number {
  if (!raw) return fallback;
  const digits = raw.replace(/\D/g, '');
  const n = digits ? Number(digits) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function genOrderCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return 'KA-' + s;
}

// Cổng mã đơn dùng chung cho các trang in (mỗi trang tự chứa một bản sao,
// vì các trang này thuộc các agent khác nhau và không dùng chung file mới).
// Luồng: tạo mã đơn (pending) → khách chuyển khoản thủ công, nội dung = mã
// đơn → admin xác nhận ở /admin/don-hang → nhập lại mã để mở khóa in.
function OrderGate({
  product,
  priceKey,
  priceFallback,
  unlocked,
  onUnlock,
}: {
  product: ProductKey;
  priceKey: string;
  priceFallback: number;
  unlocked: boolean;
  onUnlock: (v: boolean) => void;
}) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<string>('idle');
  const [msg, setMsg] = useState('');
  const [bank, setBank] = useState({ name: '[CHỜ ĐIỀN]', account: '[CHỜ ĐIỀN]', accountName: '[CHỜ ĐIỀN]' });
  const [price, setPrice] = useState(priceFallback);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    supabase
      .from('site_settings')
      .select('key, value')
      .in('key', ['bank_name', 'bank_account', 'bank_account_name', priceKey])
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        for (const row of data as { key: string; value: string }[]) map[row.key] = row.value;
        setBank({
          name: map.bank_name || '[CHỜ ĐIỀN]',
          account: map.bank_account || '[CHỜ ĐIỀN]',
          accountName: map.bank_account_name || '[CHỜ ĐIỀN]',
        });
        setPrice(parsePrice(map[priceKey], priceFallback));
      });
  }, [priceKey, priceFallback]);

  async function checkOrder() {
    const c = code.trim().toUpperCase();
    if (!c) {
      setMsg('Hãy nhập mã đơn trước.');
      return;
    }
    if (!supabase) {
      setState('unconfigured');
      setMsg('Chưa cấu hình Supabase nên chưa kiểm tra được mã đơn — luồng đơn hàng hiển thị trung thực là "chưa cấu hình".');
      return;
    }
    setBusy(true);
    const { data, error } = await supabase
      .from('orders')
      .select('code, product, status')
      .eq('code', c)
      .maybeSingle();
    setBusy(false);
    if (error) {
      setState('unconfigured');
      setMsg('Không kiểm tra được mã đơn — có thể chủ site chưa chạy file supabase/credits.sql trong Supabase SQL Editor.');
      return;
    }
    if (!data) {
      setState('notfound');
      setMsg('Không tìm thấy mã đơn này. Kiểm tra lại mã, hoặc bấm "Tạo mã đơn mới" bên dưới.');
      onUnlock(false);
      return;
    }
    if (data.status === 'cancelled') {
      setState('cancelled');
      setMsg('Mã đơn này đã bị hủy nên không mở khóa được.');
      onUnlock(false);
      return;
    }
    if (data.status === 'pending') {
      setState('pending');
      setMsg('Mã đơn này đang chờ xác nhận — sau khi chuyển khoản, admin sẽ xác nhận rồi bạn nhập lại mã để mở khóa in.');
      onUnlock(false);
      return;
    }
    if (data.product !== product) {
      setState('wrongproduct');
      setMsg(`Mã đơn này thuộc sản phẩm khác, không dùng để mở khóa ${PRODUCT_LABEL[product]} được.`);
      onUnlock(false);
      return;
    }
    setState('confirmed');
    setMsg('Mã đơn đã được xác nhận — bản đầy đủ đã mở khóa bên dưới.');
    onUnlock(true);
  }

  async function createOrder() {
    if (!supabase) {
      setState('unconfigured');
      setMsg('Chưa cấu hình Supabase nên chưa tạo được mã đơn.');
      return;
    }
    const c = genOrderCode();
    setBusy(true);
    const { error } = await supabase
      .from('orders')
      .insert([{ code: c, product, amount: price, status: 'pending' }]);
    setBusy(false);
    if (error) {
      setState('error');
      setMsg('Không tạo được mã đơn (có thể mã bị trùng hoặc bảng orders chưa được tạo — chủ site cần chạy supabase/credits.sql). Bấm lại để thử mã khác.');
      return;
    }
    setCode(c);
    setState('created');
    setMsg('Đã tạo mã đơn. Chuyển khoản theo hướng dẫn bên dưới rồi chờ admin xác nhận.');
  }

  const showTransfer = state === 'created' || state === 'pending';

  return (
    <section className="card space-y-3" aria-label="Mở khóa bản in đầy đủ">
      <h2 className="font-display text-xl font-bold text-primary">Mở khóa bản in đầy đủ</h2>
      {!supabase ? (
        <p className="text-sm">
          Chưa cấu hình Supabase nên luồng đơn hàng chưa hoạt động — trạng thái này được hiển
          thị trung thực là &quot;chưa cấu hình&quot;, không giả vờ thành công. Bạn vẫn xem
          được bản xem trước miễn phí.
        </p>
      ) : unlocked ? (
        <p className="text-sm font-semibold text-primary">{msg || 'Mã đơn đã được xác nhận.'}</p>
      ) : (
        <p className="text-sm text-ink/80">
          Bản đầy đủ chỉ mở khóa in khi mã đơn đã được admin xác nhận. Giá {PRODUCT_LABEL[product]}:{' '}
          <strong>{fmtVND(price)}</strong> (giá demo tham khảo; giá chính thức do chủ site xác
          nhận sau).
        </p>
      )}
      {!unlocked ? (
        <>
          <div>
            <label className="label" htmlFor="order-code">Mã đơn</label>
            <input
              id="order-code"
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="VD: KA-AB12CD"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary" onClick={checkOrder} disabled={busy || !supabase}>
              {busy ? 'Đang kiểm tra…' : 'Kiểm tra mã đơn'}
            </button>
            <button type="button" className="btn-gold" onClick={createOrder} disabled={busy || !supabase}>
              Tạo mã đơn mới
            </button>
          </div>
          {msg ? <p className="text-sm text-primary">{msg}</p> : null}
          {showTransfer ? (
            <div className="rounded border border-gold/40 bg-creamDark p-3 text-sm">
              <p className="font-semibold">Hướng dẫn chuyển khoản thủ công</p>
              <p>Ngân hàng: <strong>{bank.name}</strong></p>
              <p>Số tài khoản: <strong>{bank.account}</strong></p>
              <p>Chủ tài khoản: <strong>{bank.accountName}</strong></p>
              <p>Số tiền: <strong>{fmtVND(price)}</strong></p>
              <p>Nội dung chuyển khoản: <strong>{code}</strong></p>
              <p className="mt-1 text-ink/80">
                Sau khi chuyển khoản, admin sẽ kiểm tra và xác nhận đơn; bạn nhập lại mã đơn ở
                trên để mở khóa in. Thông tin tài khoản đang là [CHỜ ĐIỀN] nghĩa là chủ site
                chưa điền tài khoản thật — không chuyển khoản khi chưa thấy tài khoản thật.
              </p>
            </div>
          ) : null}
          <p className="text-sm text-ink/80">
            Thanh toán tự động qua MoMo/ZaloPay chưa bật — đang chờ tài khoản merchant của chủ
            site. Hiện chỉ có luồng chuyển khoản thủ công ở trên.
          </p>
        </>
      ) : null}
    </section>
  );
}


const SU_KIEN = ['Cưới hỏi', 'Động thổ', 'Khai trương'] as const;

function addDaysISO(iso: string, days: number): string {
  const d = parseISODate(iso);
  if (!d) return iso;
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function NgayTrongDaiPage() {
  const [suKien, setSuKien] = useState<(typeof SU_KIEN)[number]>('Cưới hỏi');
  const [tuNgay, setTuNgay] = useState(todayISO());
  const [denNgay, setDenNgay] = useState(addDaysISO(todayISO(), 60));
  const [ngaySinh, setNgaySinh] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const tu = parseISODate(tuNgay);
    const den = parseISODate(denNgay);
    if (!tu || !den || den < tu) return { error: 'Khoảng thời gian chưa hợp lệ: ngày kết thúc phải sau ngày bắt đầu.' };
    const soNgay = Math.round((den.getTime() - tu.getTime()) / 86400000) + 1;
    if (soNgay > 90) return { error: 'Khoảng thời gian tối đa 90 ngày. Hãy thu hẹp lại rồi thử lại.' };
    let tuoi: string | null = null;
    if (ngaySinh) {
      const ds = parseISODate(ngaySinh);
      if (!ds) return { error: 'Ngày sinh chưa hợp lệ.' };
      try {
        const lunarDs = solarToLunar(ds.getFullYear(), ds.getMonth() + 1, ds.getDate());
        tuoi = zodiacOfLunarYear(lunarDs.year);
      } catch {
        return { error: 'Chưa đổi được ngày sinh sang âm lịch.' };
      }
    }
    const tuoiIdx = tuoi ? TUOI_12.indexOf(tuoi) : -1;
    const danhSach: {
      d: Date;
      lunar: { day: number; month: number; year: number; leap: boolean };
      cc: string;
      tot: string[];
      xau: string[];
      hoang: string[];
      xung: boolean;
      diem: number;
    }[] = [];
    const cur = new Date(tu.getFullYear(), tu.getMonth(), tu.getDate());
    const end = new Date(den.getFullYear(), den.getMonth(), den.getDate());
    while (cur <= end) {
      try {
        const lunar = solarToLunar(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
        const cc = canChiDay(cur.getFullYear(), cur.getMonth() + 1, cur.getDate());
        const sao = saoNgay(cc, lunar.month);
        const hoang = hoangDaoHours(cc).filter((g) => g.hoangDao).map((g) => g.gio);
        const chiNgay = cc.split(' ')[1] ?? '';
        const xung = tuoiIdx >= 0 && Math.abs(TUOI_12.indexOf(chiNgay) - tuoiIdx) === 6;
        let diem = sao.tot.length - sao.xau.length;
        if (xung) diem -= 2;
        danhSach.push({
          d: new Date(cur.getFullYear(), cur.getMonth(), cur.getDate()),
          lunar, cc, tot: sao.tot, xau: sao.xau, hoang, xung, diem,
        });
      } catch {
        // bỏ qua ngày tính lỗi, không dừng cả danh sách
      }
      cur.setDate(cur.getDate() + 1);
    }
    danhSach.sort((a, b) => b.diem - a.diem || b.tot.length - a.tot.length || a.d.getTime() - b.d.getTime());
    return { error: null, tuoi, top: danhSach.slice(0, 8), tong: danhSach.length };
  }, [submitted, tuNgay, denNgay, ngaySinh, suKien]);

  const top3 = ketQua && !ketQua.error ? (ketQua.top ?? []).slice(0, 3) : [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Gói ngày trọng đại</h1>
      <p className="text-ink/80">
        Chọn loại sự kiện và khoảng thời gian (tối đa 90 ngày), site sẽ xếp hạng các ngày
        trong khoảng đó bằng sao ngày và giờ hoàng đạo của engine, rồi xuất gói in gồm các
        ngày đẹp chính cho sự kiện. Nhập thêm ngày sinh để loại trừ ưu tiên các ngày xung
        tuổi. Xem trước miễn phí 3 ngày đầu; bản đầy đủ (tối đa 8 ngày) mở khóa in sau khi
        mã đơn được admin xác nhận.
      </p>

      <form
        className="card space-y-4 no-print"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
          setUnlocked(false);
        }}
      >
        <div>
          <label className="label" htmlFor="ntd-su-kien">Loại sự kiện</label>
          <select id="ntd-su-kien" className="input" value={suKien} onChange={(e) => setSuKien(e.target.value as (typeof SU_KIEN)[number])}>
            {SU_KIEN.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="ntd-tu">Từ ngày</label>
          <input id="ntd-tu" type="date" className="input" value={tuNgay} onChange={(e) => setTuNgay(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="ntd-den">Đến ngày (tối đa 90 ngày sau ngày bắt đầu)</label>
          <input id="ntd-den" type="date" className="input" value={denNgay} onChange={(e) => setDenNgay(e.target.value)} required />
        </div>
        <div>
          <label className="label" htmlFor="ntd-sinh">Ngày sinh của người làm sự kiện (tùy chọn, để trừ ngày xung tuổi)</label>
          <input id="ntd-sinh" type="date" className="input" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">Tìm ngày đẹp chính</button>
      </form>

      {ketQua?.error ? <p className="card">{ketQua.error}</p> : null}

      {ketQua && !ketQua.error ? (
        <div className="space-y-6">
          <section className="card space-y-2 no-print" aria-label="Bản xem trước">
            <h2 className="font-display text-xl font-bold text-primary">Bản xem trước (miễn phí) — {suKien}</h2>
            <p>Đã xét <strong>{ketQua.tong}</strong> ngày từ {fmtSolar(parseISODate(tuNgay)!)} đến {fmtSolar(parseISODate(denNgay)!)} {ketQua.tuoi ? `(tuổi ${ketQua.tuoi})` : ''}.</p>
            {top3.length === 0 ? (
              <p>Không tính được ngày nào trong khoảng này. Thử khoảng khác.</p>
            ) : (
              <ul className="list-disc space-y-1 pl-5">
                {top3.map((n, i) => (
                  <li key={i}>
                    <strong>{fmtSolar(n.d)}</strong> ({n.cc}) — sao tốt: {n.tot.length > 0 ? n.tot.join(', ') : 'không có trong bộ sao cơ bản'}
                    {n.xau.length > 0 ? `; sao xấu: ${n.xau.join(', ')}` : ''}
                    {n.xung ? ' — ngày xung tuổi, đã bị trừ điểm.' : ''}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-ink/80">Bản đầy đủ (tối đa 8 ngày, kèm giờ hoàng đạo) nằm trong bản in — mở khóa bằng mã đơn đã xác nhận bên dưới.</p>
          </section>

          <div className="no-print">
            <OrderGate
              product="ngay_trong_dai"
              priceKey="price_ngay_trong_dai"
              priceFallback={99000}
              unlocked={unlocked}
              onUnlock={setUnlocked}
            />
          </div>
          <p className="text-sm text-ink/80 no-print">
            Giá gói ngày trọng đại chưa có trong bảng giá admin 4 mức hiện tại — tạm tính
            99.000đ demo (key site_settings price_ngay_trong_dai); chủ site xác nhận giá thật sau.
          </p>

          {unlocked ? (
            <div className="space-y-4">
              <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
                In / Xuất PDF bản đầy đủ
              </button>
              <section className="print-area border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Gói ngày trọng đại bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Gói ngày trọng đại — {suKien}</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Xét {ketQua.tong} ngày từ {fmtSolar(parseISODate(tuNgay)!)} đến {fmtSolar(parseISODate(denNgay)!)}
                  {ketQua.tuoi ? ` — người làm sự kiện tuổi ${ketQua.tuoi}` : ''}
                </p>
                <p className="mt-1 text-center text-xs opacity-75">
                  Xếp hạng chỉ bằng sao ngày và giờ hoàng đạo của engine; ngày có sao xấu Nguyệt Phá / Dương Nhẫn được gắn cờ để cân nhắc kỹ.
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <ol className="space-y-4 text-sm leading-relaxed">
                  {(ketQua.top ?? []).map((n, i) => (
                    <li key={i} className="border-b border-gold/20 pb-3">
                      <p className="font-display text-base font-bold text-brass">
                        {i + 1}. {fmtSolar(n.d)} — {n.cc}
                      </p>
                      <p>Âm lịch: {fmtLunar(n.lunar)}.</p>
                      <p>Sao tốt: <strong>{n.tot.length > 0 ? n.tot.join(', ') : 'không có trong bộ sao cơ bản'}</strong>.</p>
                      <p>Sao xấu: <strong>{n.xau.length > 0 ? n.xau.join(', ') : 'không có trong bộ sao cơ bản'}</strong>.</p>
                      <p>Giờ hoàng đạo: <strong>{n.hoang.join(', ')}</strong>.</p>
                      {n.xung ? <p className="font-semibold">Lưu ý: ngày xung tuổi {ketQua.tuoi} — đã bị trừ điểm khi xếp hạng.</p> : null}
                      {n.xau.includes('Nguyệt Phá') || n.xau.includes('Dương Nhẫn') ? (
                        <p className="font-semibold">Cờ cảnh báo: ngày có sao xấu Nguyệt Phá / Dương Nhẫn — cân nhắc kỹ trước khi chốt.</p>
                      ) : null}
                    </li>
                  ))}
                </ol>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.</p>
                </div>
              </section>
            </div>
          ) : null}

          <div className="no-print">
            <ToolShareCard
              title={`Ngày trọng đại — ${suKien}`}
              lines={
                top3.length > 0
                  ? [
                      `Ngày đẹp chính: ${fmtSolar(top3[0].d)} (${top3[0].cc})`,
                      `Sao tốt: ${top3[0].tot.length > 0 ? top3[0].tot.join(', ') : 'không có trong bộ sao cơ bản'}`,
                      `Đã xét ${ketQua.tong} ngày trong khoảng đã chọn`,
                    ]
                  : ['Chưa có ngày đẹp chính trong khoảng đã chọn']
              }
            />
          </div>
          <div className="no-print">
            <FreemiumCTA exclude="/ngay-trong-dai" />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
