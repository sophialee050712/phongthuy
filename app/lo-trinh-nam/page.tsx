'use client';

// Lộ trình 12 tháng âm lịch — sản phẩm in.
// Xem trước miễn phí: các tháng cần chú ý. Bản đầy đủ 12 tháng chỉ mở
// khóa in khi mã đơn đã được admin xác nhận (xem cổng mã đơn bên dưới).
// Đánh dấu tháng theo những gì engine tính được: can chi tháng, ngũ hành
// can tháng so với mệnh người xem, và tháng xung tuổi. Engine chỉ có sao
// theo NGÀY (saoNgay), không có "sao tháng" — trang này không bịa sao tháng,
// mà ghi rõ: chi tiết từng ngày xem thêm ở công cụ xem ngày.

import { useEffect, useMemo, useState } from 'react';
import {
  canChiMonth,
  canChiYear,
  menhNapAm,
  nguHanhOfCan,
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


const SINH: Record<string, string> = { Mộc: 'Hỏa', Hỏa: 'Thổ', Thổ: 'Kim', Kim: 'Thủy', Thủy: 'Mộc' };
const KHAC: Record<string, string> = { Mộc: 'Thổ', Thổ: 'Thủy', Thủy: 'Hỏa', Hỏa: 'Kim', Kim: 'Mộc' };

export default function LoTrinhNamPage() {
  const [ngaySinh, setNgaySinh] = useState(todayISO());
  const [namXem, setNamXem] = useState(String(new Date().getFullYear()));
  const [submitted, setSubmitted] = useState(false);
  const [unlocked, setUnlocked] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted) return null;
    const d = parseISODate(ngaySinh);
    const nam = Number(namXem);
    if (!d || !Number.isInteger(nam) || nam < 1900 || nam > 2100) return null;
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
      const tuoi = zodiacOfLunarYear(lunar.year);
      const tuoiIdx = TUOI_12.indexOf(tuoi);
      const ccNamXem = canChiYear(nam);
      const thang = [];
      for (let m = 1; m <= 12; m++) {
        const cc = canChiMonth(nam, m);
        const [can, chi] = cc.split(' ');
        const hanhThang = nguHanhOfCan(can);
        const chiIdx = TUOI_12.indexOf(chi);
        const xung = Math.abs(chiIdx - tuoiIdx) === 6;
        let trangThai: 'thuận lợi' | 'cần chú ý' | 'bình thường' = 'bình thường';
        let ghiChu = '';
        if (xung) {
          trangThai = 'cần chú ý';
          ghiChu = `Tháng xung tuổi ${tuoi} — nên cân nhắc kỹ việc lớn.`;
        } else if (KHAC[hanhThang] === nguHanh) {
          trangThai = 'cần chú ý';
          ghiChu = `Ngũ hành tháng (${hanhThang}) khắc mệnh ${nguHanh} — nên thận trọng.`;
        } else if (SINH[hanhThang] === nguHanh) {
          trangThai = 'thuận lợi';
          ghiChu = `Ngũ hành tháng (${hanhThang}) sinh cho mệnh ${nguHanh}.`;
        } else if (SINH[nguHanh] === hanhThang) {
          ghiChu = `Mệnh ${nguHanh} sinh cho ngũ hành tháng (${hanhThang}) — nên giữ sức.`;
        } else {
          ghiChu = 'Không sinh không khắc trực tiếp với mệnh.';
        }
        thang.push({ m, cc, hanhThang, xung, trangThai, ghiChu });
      }
      return { d, lunar, ccYear, menh, nguHanh, tuoi, ccNamXem, thang };
    } catch {
      return null;
    }
  }, [submitted, ngaySinh, namXem]);

  const canChuY = ketQua?.thang.filter((t) => t.trangThai === 'cần chú ý') ?? [];
  const thuanLoi = ketQua?.thang.filter((t) => t.trangThai === 'thuận lợi') ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Lộ trình 12 tháng âm lịch</h1>
      <p className="text-ink/80">
        Nhập ngày sinh và năm âm lịch cần xem để có lộ trình 12 tháng: can chi từng tháng,
        tháng nào thuận lợi, tháng nào cần chú ý (tháng xung tuổi hoặc ngũ hành tháng khắc
        mệnh). Bạn xem trước miễn phí các tháng cần chú ý; bản đầy đủ 12 tháng mở khóa in
        sau khi mã đơn được admin xác nhận.
      </p>
      <p className="text-sm text-ink/80">
        Lưu ý trung thực: engine của site chỉ tính sao theo từng ngày, không có bảng
        &quot;sao tháng&quot; riêng — vì vậy lộ trình này không bịa sao tháng. Muốn chọn ngày
        cụ thể trong tháng, hãy dùng thêm công cụ xem ngày.
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
          <label className="label" htmlFor="lt-ngay">Ngày sinh dương lịch</label>
          <input
            id="lt-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="lt-nam">Năm âm lịch cần xem</label>
          <input
            id="lt-nam"
            className="input"
            inputMode="numeric"
            value={namXem}
            onChange={(e) => setNamXem(e.target.value)}
            placeholder="VD: 2026"
            required
          />
        </div>
        <button type="submit" className="btn-primary">Xem lộ trình</button>
      </form>

      {submitted && !ketQua ? (
        <p className="card">Thông tin chưa hợp lệ. Kiểm tra lại ngày sinh và năm xem (1900–2100).</p>
      ) : null}

      {ketQua ? (
        <div className="space-y-6">
          <section className="card space-y-2 no-print" aria-label="Bản xem trước">
            <h2 className="font-display text-xl font-bold text-primary">Bản xem trước (miễn phí)</h2>
            <p>Người xem: sinh <strong>{fmtSolar(ketQua.d)}</strong> (âm lịch <strong>{fmtLunar(ketQua.lunar)}</strong>), mệnh <strong>{ketQua.menh}</strong>, tuổi <strong>{ketQua.tuoi}</strong>.</p>
            <p>Năm xem: <strong>{namXem} âm lịch ({ketQua.ccNamXem})</strong>.</p>
            <p>Tháng cần chú ý: <strong>{canChuY.length > 0 ? canChuY.map((t) => `tháng ${t.m} (${t.cc})`).join(', ') : 'không có tháng nào bị đánh dấu cần chú ý'}</strong>.</p>
            <p>Tháng thuận lợi: <strong>{thuanLoi.length > 0 ? thuanLoi.map((t) => `tháng ${t.m}`).join(', ') : 'không có'}</strong>.</p>
            <p className="text-sm text-ink/80">Bảng đầy đủ 12 tháng nằm trong bản in — mở khóa bằng mã đơn đã xác nhận bên dưới.</p>
          </section>

          <div className="no-print">
            <OrderGate
              product="lo_trinh"
              priceKey="price_lo_trinh"
              priceFallback={99000}
              unlocked={unlocked}
              onUnlock={setUnlocked}
            />
          </div>

          {unlocked ? (
            <div className="space-y-4">
              <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
                In / Xuất PDF bản đầy đủ
              </button>
              <section className="print-area border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl" aria-label="Lộ trình 12 tháng bản đầy đủ">
                <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">KHANG AN PHONG THỦY</p>
                <h2 className="mt-4 text-center font-display text-2xl font-bold">Lộ trình 12 tháng âm lịch năm {namXem} ({ketQua.ccNamXem})</h2>
                <p className="mt-2 text-center text-sm opacity-90">
                  Người xem: sinh {fmtSolar(ketQua.d)} — mệnh {ketQua.menh}, tuổi {ketQua.tuoi}
                </p>
                <p className="mt-1 text-center text-xs opacity-75">
                  Tháng nhuận (nếu có trong năm) mang cùng can chi với tháng thường cùng số.
                </p>
                <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gold/50">
                      <th className="py-2 pr-2">Tháng âm</th>
                      <th className="py-2 pr-2">Can chi</th>
                      <th className="py-2 pr-2">Ngũ hành tháng</th>
                      <th className="py-2">Nhận xét</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ketQua.thang.map((t) => (
                      <tr key={t.m} className="border-b border-gold/20 align-top">
                        <td className="py-2 pr-2 font-bold">{t.m}</td>
                        <td className="py-2 pr-2">{t.cc}</td>
                        <td className="py-2 pr-2">{t.hanhThang}</td>
                        <td className="py-2">
                          <span className="font-semibold">{t.trangThai}</span> — {t.ghiChu}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-6 border-t border-gold/50 pt-4 text-center">
                  <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
                  <p className="mt-1 text-xs opacity-75">Kết quả mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống.</p>
                </div>
              </section>
            </div>
          ) : null}

          <div className="no-print">
            <ToolShareCard
              title={`Lộ trình năm ${namXem} — tuổi ${ketQua.tuoi}`}
              lines={[
                `Mệnh: ${ketQua.menh}`,
                `Tháng cần chú ý: ${canChuY.length > 0 ? canChuY.map((t) => t.m).join(', ') : 'không có'}`,
                `Tháng thuận lợi: ${thuanLoi.length > 0 ? thuanLoi.map((t) => t.m).join(', ') : 'không có'}`,
              ]}
            />
          </div>
          <div className="no-print">
            <FreemiumCTA exclude="/lo-trinh-nam" />
          </div>
        </div>
      ) : null}

      <Disclaimer />
    </div>
  );
}
