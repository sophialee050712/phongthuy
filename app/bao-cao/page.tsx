'use client';

// Báo cáo tổng hợp — sản phẩm in.
// Tổng hợp từ nhiều công cụ cho một người: mệnh + cung, hướng nhà (bát
// trạch), ngày dự định (sao ngày + giờ hoàng đạo), luận số và thần số học.
// Xem trước miễn phí: mệnh + cung. Bản đầy đủ chỉ mở khóa in khi mã đơn
// đã được admin xác nhận (xem cổng mã đơn bên dưới).

import { useEffect, useMemo, useState } from 'react';
import {
  batTrach,
  canChiDay,
  canChiYear,
  cungPhi,
  hoangDaoHours,
  luanSo,
  menhNapAm,
  saoNgay,
  solarToLunar,
  thanSoHoc,
} from '@/lib/engine';
import { supabase } from '@/lib/supabase';
import Disclaimer from '@/components/site/Disclaimer';
import FreemiumCTA from '@/components/site/FreemiumCTA';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  DIRECTIONS,
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


export default function BaoCaoPage() {
  const [hoTen, setHoTen] = useState('');
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [gioiTinh, setGioiTinh] = useState<'nam' | 'nu'>('nam');
  const [daySo, setDaySo] = useState('');
  const [huongNha, setHuongNha] = useState('');
  const [ngayDuDinh, setNgayDuDinh] = useState('');
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
      const tuoi = zodiacOfLunarYear(lunar.year);
      let soChuDao: number | null = null;
      let giaiThichSo = '';
      try {
        const t = thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear());
        soChuDao = t.soChuDao;
        giaiThichSo = t.giaiThich;
      } catch {
        soChuDao = null;
      }
      const huongInfo = huongNha ? bt[huongNha] ?? null : null;
      let ngayInfo = null;
      if (ngayDuDinh) {
        const dd = parseISODate(ngayDuDinh);
        if (dd) {
          try {
            const lunarDd = solarToLunar(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
            const ccDd = canChiDay(dd.getFullYear(), dd.getMonth() + 1, dd.getDate());
            const sao = saoNgay(ccDd, lunarDd.month);
            const hoang = hoangDaoHours(ccDd).filter((g) => g.hoangDao).map((g) => g.gio);
            ngayInfo = { d: dd, lunar: lunarDd, cc: ccDd, sao, hoang };
          } catch {
            ngayInfo = null;
          }
        }
      }
      let luan = null;
      if (daySo.replace(/\D/g, '')) {
        try {
          luan = luanSo(daySo);
        } catch {
          luan = null;
        }
      }
      return {
        d, lunar, ccYear, menh, nguHanh,
        cung: cp.cung, nhom: cp.nhom,
        mau: MAU_HOP_KY[nguHanh],
        soHop: SO_HOP[nguHanh],
        tuoi, phat: PHAT_BAN_MENH[tuoi] ?? '',
        soChuDao, giaiThichSo, huongInfo, ngayInfo, luan,
      };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, gioiTinh, daySo, huongNha, ngayDuDinh]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Báo cáo tổng hợp</h1>
      <p className="text-ink/80">
        Một bản tổng hợp cho một người từ nhiều công cụ: mệnh, cung phi, hướng nhà, ngày dự
        định và luận số. Các mục tùy chọn (dãy số, hướng nhà, ngày dự định) cứ để trống nếu
        bạn không cần — báo cáo chỉ gồm những mục bạn đã nhập. Xem trước miễn phí mệnh và
        cung; bản đầy đủ mở khóa in sau khi mã đơn được admin xác nhận.
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
          <label className="label" htmlFor="bc-ten">Họ tên</label>
          <input id="bc-ten" className="input" value={hoTen} onChange={(e) => setHoTen(e.target.value)} placeholder="VD: Nguyễn Văn An" required />
        </div>
        <div>
          <label className="label" htmlFor="bc-ngay">Ngày sinh dương lịch</label>
          <input id="bc-ngay" type="date" className="input" value={ngaySinh} onChange={(e) => setNgaySinh(e.target.value)} required />
        </div>
        <div>
          <span className="label">Giới tính</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="bc-gioi-tinh" checked={gioiTinh === 'nam'} onChange={() => setGioiTinh('nam')} /> Nam
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="bc-gioi-tinh" checked={gioiTinh === 'nu'} onChange={() => setGioiTinh('nu')} /> Nữ
            </label>
          </div>
        </div>
        <div>
          <label className="label" htmlFor="bc-so">Dãy số cần luận (tùy chọn — số điện thoại, biển số, số tài khoản)</label>
          <input id="bc-so" className="input" value={daySo} onChange={(e) => setDaySo(e.target.value)} placeholder="Chỉ dùng các chữ số trong dãy để luận" />
        </div>
        <div>
          <label className="label" htmlFor="bc-huong">Hướng nhà hiện tại (tùy chọn)</label>
          <select id="bc-huong" className="input" value={huongNha} onChange={(e) => setHuongNha(e.target.value)}>
            <option value="">Không chọn hướng nhà</option>
            {DIRECTIONS.map((h) => (
              <option key={h} value={h}>{h}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="bc-dinh">Ngày dự định làm việc quan trọng (tùy chọn)</label>
          <input id="bc-dinh" type="date" className="input" value={ngayDuDinh} onChange={(e) => setNgayDuDinh(e.target.value)} />
        </div>
        <button type="submit" className="btn-primary">Tạo báo cáo xem trước</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Ngày sinh chưa hợp lệ hoặc chưa đổi được sang âm lịch. Vui lòng thử lại.</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">
          <section className="card space-y-2 no-print" aria-label="Bản xem trước">
            <h2 className="font-display text-xl font-bold text-primary">Bản xem trước (miễn phí)</h2>
            <p>Họ tên: <strong>{hoTen}</strong> — sinh <strong>{fmtSolar(ketQua.d)}</strong> (âm lịch <strong>{fmtLunar(ketQua.lunar)}</strong>).</p>
            <p>Mệnh nạp âm: <strong>{ketQua.menh}</strong> — cung phi: <strong>{ketQua.cung}</strong> ({ketQua.nhom} tứ mệnh).</p>
            <p className="text-sm text-ink/80">Màu hợp/kỵ, số hợp, hướng nhà, ngày dự định và luận số nằm trong bản đầy đủ — mở khóa bằng mã đơn đã xác nhận bên dưới.</p>
          </section>

          <div className="no-print">
            <OrderGate
              product="bao_cao"
              priceKey="price_bao_cao_min"
              priceFallback={99000}
              unlocked={unlocked}
              onUnlock={setUnlocked}
            />
          </div>
          <p className="text-sm text-ink/80 no-print">
            Giá báo cáo theo bảng giá là 99.000–299.000đ tùy độ dài; đơn ở đây tạm tính theo
            mức thấp nhất (99.000đ) — mức cuối do admin xác nhận khi duyệt đơn.
          </p>

          {unlocked ? (
            <div className="space-y-4">
              <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
                In / Xuất PDF bản đầy đủ
              </button>
              <section className="print-area border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Báo cáo tổng hợp bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Báo cáo tổng hợp — {hoTen}</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Sinh {fmtSolar(ketQua.d)} — âm lịch {fmtLunar(ketQua.lunar)} — can chi năm {ketQua.ccYear} (tuổi {ketQua.tuoi})
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <div className="space-y-5 text-sm leading-relaxed">
                  <section>
                    <h3 className="font-display text-lg font-bold text-brass">1. Bản mệnh &amp; cung phi</h3>
                    <p>Mệnh nạp âm: <strong>{ketQua.menh}</strong> (ngũ hành {ketQua.nguHanh}). Cung phi: <strong>{ketQua.cung}</strong> ({ketQua.nhom} tứ mệnh).</p>
                    {ketQua.mau ? <p>Màu hợp: <strong>{ketQua.mau.hop.join(', ')}</strong> — màu kỵ: <strong>{ketQua.mau.ky.join(', ')}</strong>.</p> : null}
                    {ketQua.soHop ? <p>Số hợp (tham khảo): <strong>{ketQua.soHop.join(', ')}</strong>.</p> : null}
                    <p>Phật bản mệnh theo tuổi {ketQua.tuoi}: <strong>{ketQua.phat}</strong>.</p>
                    {ketQua.soChuDao !== null ? <p>Số chủ đạo (thần số học, tham khảo): <strong>{ketQua.soChuDao}</strong> — {ketQua.giaiThichSo}</p> : null}
                  </section>
                  {huongNha && ketQua.huongInfo ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">2. Hướng nhà</h3>
                      <p>Hướng {huongNha} với cung {ketQua.cung} mang sao <strong>{ketQua.huongInfo.sao}</strong> — {ketQua.huongInfo.tot ? 'hướng tốt theo bát trạch.' : 'hướng xấu theo bát trạch, nên cân nhắc khi bố trí cửa chính, bếp và bàn thờ.'}</p>
                    </section>
                  ) : null}
                  {ketQua.ngayInfo ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">3. Ngày dự định</h3>
                      <p>Ngày {fmtSolar(ketQua.ngayInfo.d)} (âm lịch {fmtLunar(ketQua.ngayInfo.lunar)}) — can chi ngày {ketQua.ngayInfo.cc}.</p>
                      <p>Sao tốt: <strong>{ketQua.ngayInfo.sao.tot.length > 0 ? ketQua.ngayInfo.sao.tot.join(', ') : 'không có sao tốt trong bộ sao cơ bản của engine'}</strong>.</p>
                      <p>Sao xấu: <strong>{ketQua.ngayInfo.sao.xau.length > 0 ? ketQua.ngayInfo.sao.xau.join(', ') : 'không có sao xấu trong bộ sao cơ bản của engine'}</strong>.</p>
                      <p>Giờ hoàng đạo: <strong>{ketQua.ngayInfo.hoang.join(', ')}</strong>.</p>
                    </section>
                  ) : null}
                  {ketQua.luan ? (
                    <section>
                      <h3 className="font-display text-lg font-bold text-brass">4. Luận dãy số</h3>
                      <p>Tổng nút: <strong>{ketQua.luan.tongNut}</strong> — ngũ hành chủ đạo: <strong>{ketQua.luan.nguHanhChuDao}</strong>.</p>
                      <p>{ketQua.luan.phanTich}</p>
                    </section>
                  ) : null}
                </div>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.</p>
                </div>
              </section>
            </div>
          ) : null}

          <div className="no-print">
            <ToolShareCard
              title={`Báo cáo tổng hợp — ${hoTen}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Cung phi: ${ketQua.cung} (${ketQua.nhom} tứ mệnh)`,
                huongNha && ketQua.huongInfo ? `Hướng ${huongNha}: sao ${ketQua.huongInfo.sao}` : `Tuổi ${ketQua.tuoi} — Phật bản mệnh: ${ketQua.phat}`,
              ]}
            />
          </div>
          <div className="no-print">
            <FreemiumCTA exclude="/bao-cao" />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
