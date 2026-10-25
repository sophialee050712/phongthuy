'use client';

// Thẻ số mệnh — sản phẩm in.
// Xem trước miễn phí: tên + mệnh + cung. Bản đầy đủ (màu hợp/kỵ, số hợp,
// hướng tốt, Phật bản mệnh) chỉ mở khóa in khi khách nhập mã đơn ĐÃ ĐƯỢC
// ADMIN XÁC NHẬN. Chưa xác nhận thì chỉ xem trước + hướng dẫn chuyển khoản
// thủ công. Không hiển thị số điện thoại; không bịa số tài khoản ngân hàng.

import { useEffect, useMemo, useState } from 'react';
import {
  batTrach,
  canChiDay,
  canChiHour,
  canChiYear,
  cungPhi,
  menhNapAm,
  solarToLunar,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import Disclaimer from '@/components/site/Disclaimer';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  MAU_HOP_KY,
  PHAT_BAN_MENH,
  SO_HOP,
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
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

const GIO_OPTIONS = [
  { chi: 'Tý', hour: 0 },
  { chi: 'Sửu', hour: 2 },
  { chi: 'Dần', hour: 4 },
  { chi: 'Mão', hour: 6 },
  { chi: 'Thìn', hour: 8 },
  { chi: 'Tỵ', hour: 10 },
  { chi: 'Ngọ', hour: 12 },
  { chi: 'Mùi', hour: 14 },
  { chi: 'Thân', hour: 16 },
  { chi: 'Dậu', hour: 18 },
  { chi: 'Tuất', hour: 20 },
  { chi: 'Hợi', hour: 22 },
];

export default function TheSoMenhPage() {
  const [hoTen, setHoTen] = useState('');
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [gioSinh, setGioSinh] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    if (!d) return null;
    let lunar;
    try {
      lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
    } catch {
      return null;
    }
    try {
      const ccYear = canChiYear(lunar.year);
      const menh = menhNapAm(ccYear);
      const nguHanh = nguHanhFromMenh(menh);
      const cp = cungPhi(gioiTinh, lunar.year);
      const bt = batTrach(cp.cung);
      const huongTot = Object.entries(bt)
        .filter(([, v]) => v.tot)
        .map(([dir, v]) => `${dir} (${v.sao})`);
      const tuoi = zodiacOfLunarYear(lunar.year);
      let gioCanChi = '';
      if (gioSinh !== '') {
        const ccDay = canChiDay(d.getFullYear(), d.getMonth() + 1, d.getDate());
        gioCanChi = canChiHour(ccDay, Number(gioSinh));
      }
      return {
        d,
        lunar,
        ccYear,
        menh,
        nguHanh,
        cung: cp.cung,
        nhom: cp.nhom,
        huongTot,
        mau: MAU_HOP_KY[nguHanh],
        soHop: SO_HOP[nguHanh],
        tuoi,
        phat: PHAT_BAN_MENH[tuoi] ?? '',
        gioCanChi,
      };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh, gioSinh]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Thẻ số mệnh</h1>
      <p className="text-ink/80">
        Nhập họ tên và ngày sinh để tạo thẻ số mệnh in đẹp: mệnh nạp âm, cung phi, ngũ hành,
        màu hợp/kỵ, số hợp, hướng tốt và Phật bản mệnh. Bạn xem trước miễn phí; bản đầy đủ
        mở khóa in sau khi mã đơn được admin xác nhận.
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
          <label className="label" htmlFor="tsm-ten">Họ tên (in lên thẻ)</label>
          <input
            id="tsm-ten"
            className="input"
            value={hoTen}
            onChange={(e) => setHoTen(e.target.value)}
            placeholder="VD: Nguyễn Văn An"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="tsm-ngay">Ngày sinh dương lịch</label>
          <input
            id="tsm-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
        </div>
        <div>
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tsm-gioi-tinh" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} />
              Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="tsm-gioi-tinh" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} />
              Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="tsm-gio">Giờ sinh (tùy chọn)</label>
          <select
            id="tsm-gio"
            className="input"
            value={gioSinh}
            onChange={(e) => setGioSinh(e.target.value)}
          >
            <option value="">Không rõ giờ sinh</option>
            {GIO_OPTIONS.map((g) => (
              <option key={g.chi} value={g.hour}>Giờ {g.chi}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn-primary">Tạo thẻ xem trước</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Ngày sinh chưa hợp lệ hoặc chưa đổi được sang âm lịch. Vui lòng thử lại.</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">
          <section className="card space-y-2 no-print" aria-label="Bản xem trước">
            <h2 className="font-display text-xl font-bold text-primary">Bản xem trước (miễn phí)</h2>
            <p>Họ tên: <strong>{hoTen}</strong></p>
            <p>Ngày sinh: <strong>{fmtSolar(ketQua.d)}</strong> — âm lịch <strong>{fmtLunar(ketQua.lunar)}</strong></p>
            <p>Mệnh nạp âm: <strong>{ketQua.menh}</strong></p>
            <p>Cung phi: <strong>{ketQua.cung}</strong> ({ketQua.nhom} tứ mệnh)</p>
            <p className="text-sm text-ink/80">
              Màu hợp/kỵ, số hợp, hướng tốt và Phật bản mệnh nằm trong bản đầy đủ — mở khóa
              bằng mã đơn đã xác nhận bên dưới.
            </p>
          </section>

          <div className="no-print">
            <OrderGate
              product="the_so_menh"
              priceKey="price_the_so_menh"
              priceFallback={49000}
              unlocked={unlocked}
              onUnlock={setUnlocked}
            />
          </div>

          {unlocked ? (
            <div className="space-y-4">
              <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
                In / Xuất PDF bản đầy đủ
              </button>
              <section className="print-area mx-auto max-w-[560px] border-4 border-gold bg-primary px-6 py-8 text-center text-cream shadow-xl" aria-label="Thẻ số mệnh bản đầy đủ">
                <p className="text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <h2 className="font-display text-3xl font-bold">{hoTen}</h2>
                <p className="mt-2 text-sm opacity-90">
                  Sinh {fmtSolar(ketQua.d)} — âm lịch {fmtLunar(ketQua.lunar)}
                </p>
                <p className="mt-1 text-sm opacity-90">Can chi năm sinh: {ketQua.ccYear} (tuổi {ketQua.tuoi})</p>
                {ketQua.gioCanChi ? <p className="mt-1 text-sm opacity-90">Can chi giờ sinh: {ketQua.gioCanChi}</p> : null}
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <dl className="space-y-3 text-left text-base">
                  <div className="flex justify-between gap-4"><dt>Mệnh nạp âm</dt><dd className="font-bold">{ketQua.menh}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Ngũ hành</dt><dd className="font-bold">{ketQua.nguHanh}</dd></div>
                  <div className="flex justify-between gap-4"><dt>Cung phi</dt><dd className="font-bold">{ketQua.cung} ({ketQua.nhom} tứ mệnh)</dd></div>
                  {ketQua.mau ? (
                    <>
                      <div className="flex justify-between gap-4"><dt>Màu hợp</dt><dd className="font-bold">{ketQua.mau.hop.join(', ')}</dd></div>
                      <div className="flex justify-between gap-4"><dt>Màu kỵ</dt><dd className="font-bold">{ketQua.mau.ky.join(', ')}</dd></div>
                    </>
                  ) : null}
                  {ketQua.soHop ? <div className="flex justify-between gap-4"><dt>Số hợp (tham khảo)</dt><dd className="font-bold">{ketQua.soHop.join(', ')}</dd></div> : null}
                  <div><dt className="mb-1">Hướng tốt (bát trạch)</dt><dd className="font-bold">{ketQua.huongTot.join(' · ')}</dd></div>
                  <div><dt className="mb-1">Phật bản mệnh theo tuổi {ketQua.tuoi}</dt><dd className="font-bold">{ketQua.phat}</dd></div>
                </dl>
                <div className="mt-6 border-t border-gold/50 pt-4">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống.</p>
                </div>
              </section>
            </div>
          ) : null}

          <div className="no-print">
            <ToolShareCard
              title={`Thẻ số mệnh — ${hoTen}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Cung phi: ${ketQua.cung} (${ketQua.nhom} tứ mệnh)`,
                `Tuổi ${ketQua.tuoi} — Phật bản mệnh: ${ketQua.phat}`,
              ]}
            />
          </div>
          <div className="no-print">
            <FreemiumCTA exclude="/the-so-menh" />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
