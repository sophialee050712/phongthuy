'use client';

import { useMemo, useState } from 'react';
import Disclaimer from '@/components/site/Disclaimer';
import { TUOI_12, VIEC_LIST } from '@/lib/data';
import { slugify } from '@/lib/seo';
import { canChiDay, saoNgay, solarToLunar } from '@/lib/engine';

type Parsed = {
  viec: string | null;
  tuoi: string | null;
  /** Tháng dương lịch (1-12) cần tìm, hoặc null. */
  thang: number | null;
  nam: number | null;
  /** true khi câu chỉ một tuần cụ thể thay vì cả tháng. */
  tuan: 'nay' | 'toi' | null;
  /** Phần nào chưa hiểu được, để hiển thị rõ thay vì đoán mò. */
  chuaHieu: string[];
  /** true khi con giáp mơ hồ (vd "tuổi ty" không phân biệt Tý/Tỵ). */
  tuoiMoHo: boolean;
};

function parseQuery(raw: string, today: Date): Parsed {
  const q = raw.toLowerCase();
  const slug = slugify(raw);
  const chuaHieu: string[] = [];

  // Việc: khớp theo slug của VIEC_LIST trong câu đã slug hóa; nếu câu chỉ
  // nêu từ khóa chính (vd "cưới" thay vì "cưới hỏi") thì khớp theo từ khóa.
  const VIEC_KEYWORDS: Record<string, string[]> = {
    'Cưới hỏi': ['cuoi'],
    'Ký hợp đồng': ['ky-hop-dong', 'hop-dong'],
  };
  let viec: string | null = null;
  for (const v of VIEC_LIST) {
    const keys = [slugify(v), ...(VIEC_KEYWORDS[v] ?? [])];
    if (keys.some((k) => slug.includes(k))) {
      viec = v;
      break;
    }
  }
  if (!viec) chuaHieu.push('việc cần xem (ví dụ: cưới hỏi, khai trương, mua xe)');

  // Con giáp: ưu tiên khớp chính xác có dấu trong câu gốc để tránh nhầm
  // Tý/Tỵ (cả hai đều slug thành "ty").
  let tuoi: string | null = null;
  let tuoiMoHo = false;
  for (const t of TUOI_12) {
    if (q.includes(t.toLowerCase())) {
      tuoi = t;
      break;
    }
  }
  if (!tuoi) {
    // Câu viết không dấu: "tuoi ngo", "tuoi ty"...
    if (/(^|[^a-z])tuoi-ty([^a-z]|$)/.test(`-${slug}-`) || slug.includes('tuoi-ty')) {
      tuoiMoHo = true;
      chuaHieu.push('con giáp: "ty" không dấu có thể là Tý hoặc Tỵ — vui lòng viết có dấu');
    } else {
      for (const t of TUOI_12) {
        if (slug.includes(`tuoi-${slugify(t)}`)) {
          tuoi = t;
          break;
        }
      }
    }
  }
  // Tuổi không bắt buộc: không có tuổi vẫn xem được ngày theo sao, chỉ
  // không lọc ngày xung tuổi. Vì vậy không đưa vào chuaHieu khi vắng mặt.

  // Tháng/năm/tuần: khớp trên câu đã slug hóa (không dấu) vì "tháng"/"năm"
  // trong câu gốc có dấu sẽ làm regex không dấu trượt.
  let thang: number | null = null;
  let nam: number | null = null;
  let tuan: 'nay' | 'toi' | null = null;
  const thangSo = /thang-(\d{1,2})/.exec(slug);
  const namSo = /nam-(\d{4})/.exec(slug);
  if (thangSo) {
    const m = Number(thangSo[1]);
    if (m >= 1 && m <= 12) {
      thang = m;
      const curY = today.getFullYear();
      const curM = today.getMonth() + 1;
      if (namSo) {
        nam = Number(namSo[1]);
      } else if (m < curM) {
        // Tháng đã qua trong năm nay -> hiểu là tháng đó của năm sau.
        nam = curY + 1;
      } else {
        nam = curY;
      }
    } else {
      chuaHieu.push(`tháng "${thangSo[1]}" không hợp lệ (chỉ nhận 1–12)`);
    }
  } else if (slug.includes('tuan-toi')) {
    tuan = 'toi';
  } else if (slug.includes('tuan-nay')) {
    tuan = 'nay';
  } else if (slug.includes('thang-nay')) {
    thang = today.getMonth() + 1;
    nam = today.getFullYear();
  } else if (slug.includes('thang-sau')) {
    const d = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    thang = d.getMonth() + 1;
    nam = d.getFullYear();
  } else {
    chuaHieu.push('tháng hoặc tuần cần xem (ví dụ: tháng 11, tuần tới)');
  }

  return { viec, tuoi, thang, nam, tuan, chuaHieu, tuoiMoHo };
}

type NgayKetQua = {
  solar: string;
  canChi: string;
  saoTot: string[];
  saoXau: string[];
  xungTuoi: boolean;
  goiY: boolean;
};

function rangeDays(start: Date, end: Date): Date[] {
  const out: Date[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  while (cur <= end) {
    out.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function mondayOf(d: Date): Date {
  const day = d.getDay(); // 0 = Chủ nhật
  const diff = day === 0 ? -6 : 1 - day;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff);
}

/** Tính các ngày trong khoảng cho trước; xung tuổi = chi ngày đối xung chi tuổi (cách 6 cung). */
function tinhNgay(
  from: Date,
  to: Date,
  tuoi: string | null,
): NgayKetQua[] {
  const tuoiIdx = tuoi ? TUOI_12.indexOf(tuoi) : -1;
  const out: NgayKetQua[] = [];
  for (const d of rangeDays(from, to)) {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    try {
      const lunar = solarToLunar(y, m, day);
      const cc = canChiDay(y, m, day);
      const sao = saoNgay(cc, lunar.month);
      const chiNgay = cc.split(' ').pop() ?? '';
      const chiIdx = TUOI_12.indexOf(chiNgay);
      const xungTuoi = tuoiIdx >= 0 && chiIdx >= 0 && Math.abs(chiIdx - tuoiIdx) === 6;
      out.push({
        solar: `ngày ${day} tháng ${m} năm ${y}`,
        canChi: cc,
        saoTot: sao.tot,
        saoXau: sao.xau,
        xungTuoi,
        goiY: sao.tot.length > 0 && sao.xau.length === 0 && !xungTuoi,
      });
    } catch {
      // bỏ qua ngày tính lỗi, không bịa kết quả
    }
  }
  return out;
}

export default function HoiNgayPage() {
  const [cauHoi, setCauHoi] = useState('');
  const [parsed, setParsed] = useState<Parsed | null>(null);
  // Form nhập tay: khởi tạo từ kết quả parse (nếu có), người dùng sửa tay.
  const [viecTay, setViecTay] = useState('');
  const [tuoiTay, setTuoiTay] = useState('');
  const [thangTay, setThangTay] = useState('');
  const [namTay, setNamTay] = useState('');
  const [ketQuaTay, setKetQuaTay] = useState<NgayKetQua[] | null>(null);

  const today = useMemo(() => new Date(), []);

  const ketQuaTuDong = useMemo(() => {
    if (!parsed) return null;
    if (!parsed.thang || !parsed.nam) return null;
    const from = new Date(parsed.nam, parsed.thang - 1, 1);
    const to = new Date(parsed.nam, parsed.thang, 0);
    return tinhNgay(from, to, parsed.tuoi);
  }, [parsed]);

  const ketQuaTuan = useMemo(() => {
    if (!parsed || !parsed.tuan) return null;
    const base = parsed.tuan === 'toi' ? new Date(today.getTime() + 7 * 86400000) : today;
    const mon = mondayOf(base);
    const sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
    return tinhNgay(mon, sun, parsed.tuoi);
  }, [parsed, today]);

  const ketQua = ketQuaTuDong ?? ketQuaTuan ?? ketQuaTay;

  const goiY = (ketQua ?? []).filter((k) => k.goiY);

  function handleParse(e: React.FormEvent) {
    e.preventDefault();
    const p = parseQuery(cauHoi, today);
    setParsed(p);
    setKetQuaTay(null);
    setViecTay(p.viec ?? '');
    setTuoiTay(p.tuoi ?? '');
    setThangTay(p.thang ? String(p.thang) : '');
    setNamTay(p.nam ? String(p.nam) : '');
  }

  function handleManual(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(thangTay);
    const y = Number(namTay);
    if (!m || m < 1 || m > 12 || !y) return;
    setKetQuaTay(tinhNgay(new Date(y, m - 1, 1), new Date(y, m, 0), tuoiTay || null));
  }

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold text-primary">Hỏi ngày bằng câu tự nhiên</h1>
      <p className="text-ink/80">
        Gõ câu như “ngày tốt cưới tháng 11 cho tuổi Ngọ”, “ngày tốt khai trương tuần tới” hay
        “ngày tốt mua xe tháng 12” — hệ thống tách việc, tháng và tuổi rồi tính ngày tham khảo
        bằng engine lịch vạn niên. Câu nào chưa hiểu rõ sẽ được báo rõ phần chưa hiểu, không đoán
        mò.
      </p>
      <form className="card space-y-4" onSubmit={handleParse}>
        <div>
          <label className="label" htmlFor="hn-cau">
            Câu hỏi của bạn
          </label>
          <input
            id="hn-cau"
            className="input"
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            placeholder="VD: ngày tốt cưới tháng 11 cho tuổi Ngọ"
            required
          />
        </div>
        <button type="submit" className="btn-primary">
          Hỏi ngày
        </button>
      </form>

      {parsed ? (
        <div className="card space-y-2">
          <h2 className="font-display text-xl font-bold text-primary">Hệ thống hiểu được</h2>
          <p className="text-sm">
            Việc: <strong>{parsed.viec ?? '— chưa rõ —'}</strong> | Tuổi:{' '}
            <strong>{parsed.tuoi ?? 'không nêu (xem chung, không lọc xung tuổi)'}</strong> | Thời
            gian:{' '}
            <strong>
              {parsed.tuan
                ? parsed.tuan === 'toi'
                  ? 'tuần tới'
                  : 'tuần này'
                : parsed.thang && parsed.nam
                  ? `tháng ${parsed.thang} năm ${parsed.nam}`
                  : '— chưa rõ —'}
            </strong>
          </p>
          {parsed.chuaHieu.length > 0 ? (
            <p className="rounded border border-gold/40 bg-creamDark px-3 py-2 text-sm">
              Chưa hiểu phần nào: <strong>{parsed.chuaHieu.join('; ')}</strong>. Vui lòng điền
              tay vào form dưới đây để xem kết quả.
            </p>
          ) : null}
        </div>
      ) : null}

      {(parsed && (parsed.chuaHieu.length > 0 || !ketQuaTuDong && !ketQuaTuan)) || ketQuaTay ? (
        <form className="card space-y-4" onSubmit={handleManual}>
          <h2 className="font-display text-xl font-bold text-primary">Nhập tay thay thế</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="label" htmlFor="hn-viec">
                Việc
              </label>
              <select
                id="hn-viec"
                className="input"
                value={viecTay}
                onChange={(e) => setViecTay(e.target.value)}
              >
                <option value="">— Chọn việc —</option>
                {VIEC_LIST.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="hn-tuoi">
                Tuổi (không bắt buộc)
              </label>
              <select
                id="hn-tuoi"
                className="input"
                value={tuoiTay}
                onChange={(e) => setTuoiTay(e.target.value)}
              >
                <option value="">— Không chọn —</option>
                {TUOI_12.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="hn-thang">
                Tháng
              </label>
              <input
                id="hn-thang"
                type="number"
                min={1}
                max={12}
                className="input"
                value={thangTay}
                onChange={(e) => setThangTay(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label" htmlFor="hn-nam">
                Năm
              </label>
              <input
                id="hn-nam"
                type="number"
                className="input"
                value={namTay}
                onChange={(e) => setNamTay(e.target.value)}
                required
              />
            </div>
          </div>
          <button type="submit" className="btn-primary">
            Xem ngày theo form tay
          </button>
        </form>
      ) : null}

      {ketQua ? (
        <div className="space-y-4">
          <div className="card space-y-1">
            <h2 className="font-display text-xl font-bold text-primary">Kết quả tham khảo</h2>
            {viecTay || parsed?.viec ? (
              <p className="text-sm">
                Việc: <strong>{viecTay || parsed?.viec}</strong>
              </p>
            ) : null}
            {goiY.length > 0 ? (
              <p className="text-sm">
                Ngày gợi ý (có sao tốt, không có sao xấu trong bộ sao cơ bản của engine, không
                xung tuổi): <strong>{goiY.map((g) => g.solar).join('; ')}</strong>
              </p>
            ) : (
              <p className="text-sm">
                Trong khoảng này không có ngày nào đồng thời có sao tốt, không sao xấu và không
                xung tuổi theo bộ sao cơ bản của engine — bạn có thể xem bảng dưới để tự cân nhắc.
              </p>
            )}
            <p className="text-sm text-ink/80">
              “Gợi ý” ở đây chỉ là lọc theo sao ngày của engine, không phải khẳng định ngày tốt
              tuyệt đối cho mọi người.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ketQua.map((k) => (
              <div key={k.solar} className="card">
                <p className="font-display font-bold text-primary">
                  {k.solar} — {k.canChi}
                  {k.goiY ? <span className="chip ml-2">Gợi ý</span> : null}
                </p>
                <p className="text-sm">
                  Sao tốt: {k.saoTot.length ? k.saoTot.join(', ') : '—'}
                </p>
                <p className="text-sm">Sao xấu: {k.saoXau.length ? k.saoXau.join(', ') : '—'}</p>
                {k.xungTuoi ? (
                  <p className="text-sm">Lưu ý: ngày xung với tuổi đã chọn.</p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <Disclaimer />
    </div>
  );
}
