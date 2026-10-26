// Tuổi làm nhà + mượn tuổi + checklist in (ý 4).
// Công thức đã xác minh — xem lib/tuoi-lam-nha.ts và file verification trong hidden_files.
// Quy ước hiển thị rõ trên trang: tuổi mụ = năm làm nhà − năm sinh DƯƠNG LỊCH + 1.
'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { tuoiLamNha, quanHeMenh, cungTamHop } from '@/lib/tuoi-lam-nha';
import { getBirthdate } from '@/lib/personal';
import Disclaimer from './Disclaimer';

export default function TuoiLamNha() {
  const homNay = new Date().getFullYear();
  const [namSinh, setNamSinh] = useState('');
  const [namLamNha, setNamLamNha] = useState(homNay);
  const [namMuon, setNamMuon] = useState('');

  useEffect(() => {
    const saved = getBirthdate();
    if (saved) {
      const y = Number(saved.split('-')[0]);
      if (Number.isInteger(y)) setNamSinh(String(y));
    }
  }, []);

  const ns = Number(namSinh);
  const kq = useMemo(
    () => (Number.isInteger(ns) && ns > 1900 && ns <= namLamNha ? tuoiLamNha(ns, namLamNha) : null),
    [ns, namLamNha],
  );

  const nm = Number(namMuon);
  const muon = useMemo(
    () =>
      kq && Number.isInteger(nm) && nm > 1900 && nm <= namLamNha ? tuoiLamNha(nm, namLamNha) : null,
    [kq, nm, namLamNha],
  );
  const qhMenh = muon && kq ? quanHeMenh(muon.menhElement, kq.menhElement) : 'binh';
  const tamHop = muon && kq ? cungTamHop(muon.chiSinh, kq.chiSinh) : false;

  return (
    <div className="space-y-6">
      <form className="card space-y-4" onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor="tln-sinh">Năm sinh gia chủ (dương lịch)</label>
            <input
              id="tln-sinh"
              type="number"
              className="input"
              value={namSinh}
              onChange={(e) => setNamSinh(e.target.value)}
              placeholder="VD: 1990"
            />
          </div>
          <div>
            <label className="label" htmlFor="tln-nam">Năm dự định làm nhà</label>
            <input
              id="tln-nam"
              type="number"
              className="input"
              value={namLamNha}
              onChange={(e) => setNamLamNha(Number(e.target.value))}
            />
          </div>
        </div>
        <p className="text-sm opacity-80">
          Tuổi mụ = năm làm nhà − năm sinh (dương lịch) + 1. Lưu ý: một số nguồn tính theo
          năm sinh âm lịch, nên người sinh trước Tết Nguyên Đán có thể lệch 1 tuổi nếu theo
          cách tính đó — trang này dùng quy ước dương lịch đã đối chiếu khớp bảng 2023.
          Các trường phái phong thủy có khác nhau nhẹ ở một số tuổi Hoang Ốc và tên loại
          Kim Lâu; trang hiển thị cả cách tính để bạn tự đối chiếu.
        </p>
      </form>

      {kq ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold text-primary">
            Gia chủ sinh {ns} ({kq.canChiSinh}) — tuổi mụ {kq.tuoi} năm {namLamNha} ({kq.canChiNamXay})
          </h2>
          <p className="text-sm">
            Mệnh nạp âm: <strong>{kq.menh || 'Đang cập nhật'}</strong>
            {kq.menhElement ? ` (ngũ hành ${kq.menhElement})` : ''}
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card">
              <p className="font-display font-bold text-primary">Kim Lâu</p>
              {kq.kimLau.pham ? (
                <p className="text-sm">
                  ❌ Phạm Kim Lâu {kq.kimLau.loai} (tuổi {kq.tuoi} chia 9 dư {kq.kimLau.du})
                </p>
              ) : (
                <p className="text-sm">✅ Không phạm (tuổi {kq.tuoi} chia 9 dư {((kq.tuoi % 9) + 9) % 9})</p>
              )}
            </div>
            <div className="card">
              <p className="font-display font-bold text-primary">Hoang Ốc</p>
              {kq.hoangOc.xet ? (
                <p className="text-sm">
                  {kq.hoangOc.tot ? '✅' : '❌'} Cung {kq.hoangOc.cung} — {kq.hoangOc.ten}
                  {kq.hoangOc.tot ? ' (cung tốt)' : ' (cung xấu)'}
                </p>
              ) : (
                <p className="text-sm">Dưới 10 tuổi — chưa xét Hoang Ốc.</p>
              )}
            </div>
            <div className="card">
              <p className="font-display font-bold text-primary">Tam Tai</p>
              {kq.tamTai.pham ? (
                <p className="text-sm">
                  ❌ Phạm Tam Tai năm {kq.tamTai.namThu}/3 (nhóm {kq.tamTai.nhom.join('–')} kỵ năm{' '}
                  {kq.chiNamXay})
                  {kq.tamTai.namThu === 2 ? ' — năm giữa là năm nặng nhất' : ''}
                </p>
              ) : (
                <p className="text-sm">✅ Không phạm (tuổi {kq.chiSinh} không kỵ năm {kq.chiNamXay})</p>
              )}
            </div>
          </div>
          <p className={`card font-display text-lg font-bold ${kq.tot ? 'text-primary' : ''}`}>
            {kq.tot
              ? '✅ Tuổi đẹp — không phạm cả 3 hạn, có thể khởi công (vẫn nên xem ngày động thổ).'
              : '⚠️ Chưa đẹp — phạm ít nhất 1 hạn. Cân nhắc mượn tuổi hoặc chọn năm khác.'}
          </p>
        </section>
      ) : (
        <p className="text-sm">Nhập năm sinh và năm làm nhà để xem 3 hạn.</p>
      )}

      {kq && !kq.tot ? (
        <section className="card space-y-4">
          <h3 className="font-display text-lg font-bold text-primary">Mượn tuổi</h3>
          <div>
            <label className="label" htmlFor="tln-muon">Năm sinh người cho mượn tuổi (dương lịch)</label>
            <input
              id="tln-muon"
              type="number"
              className="input"
              value={namMuon}
              onChange={(e) => setNamMuon(e.target.value)}
              placeholder="VD: 1984"
            />
          </div>
          {muon ? (
            <div className="space-y-2 text-sm">
              <p>
                Người sinh {nm} ({muon.canChiSinh}) — tuổi mụ {muon.tuoi} năm {namLamNha}:{' '}
                {muon.tot ? (
                  <strong>✅ Không phạm cả 3 hạn — đủ điều kiện tối thiểu để mượn tuổi.</strong>
                ) : (
                  <strong>❌ Người này cũng phạm hạn nên không mượn được tuổi này.</strong>
                )}
              </p>
              <p>
                Kim Lâu: {muon.kimLau.pham ? `phạm ${muon.kimLau.loai}` : 'không phạm'}; Hoang Ốc:{' '}
                {muon.hoangOc.xet ? `${muon.hoangOc.ten} (${muon.hoangOc.tot ? 'tốt' : 'xấu'})` : 'chưa xét'};
                Tam Tai: {muon.tamTai.pham ? `phạm năm ${muon.tamTai.namThu}/3` : 'không phạm'}.
              </p>
              <p>
                Gợi ý thêm (không phải điều kiện bắt buộc): mệnh người mượn ({muon.menhElement}){' '}
                {qhMenh === 'sinh'
                  ? 'tương sinh với mệnh gia chủ'
                  : qhMenh === 'khac'
                    ? 'tương khắc với mệnh gia chủ — nên cân nhắc người khác'
                    : qhMenh === 'cung-hanh'
                      ? 'cùng hành với mệnh gia chủ'
                      : 'không sinh khắc với mệnh gia chủ'}
                {tamHop ? '; cùng nhóm Tam Hợp với tuổi gia chủ.' : '.'}
              </p>
              <p className="opacity-80">
                Nhắc nhở (không tính bằng tool): người cho mượn không đang có tang, nên lớn
                tuổi hơn gia chủ, và phải trực tiếp dự lễ động thổ. Sau này, khi tới năm hợp
                tuổi gia chủ thì làm lễ chuộc.
              </p>
            </div>
          ) : (
            <p className="text-sm">Nhập năm sinh người cho mượn để kiểm tra 3 hạn của người đó.</p>
          )}
        </section>
      ) : null}

      {kq ? (
        <section className="space-y-3">
          <div className="print-area card space-y-2">
            <h3 className="font-display text-lg font-bold text-primary">
              Checklist trước động thổ — gia chủ {ns} ({kq.canChiSinh}), năm {namLamNha}
            </h3>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>
                Kết luận tuổi: {kq.tot ? 'không phạm cả 3 hạn' : 'đang phạm hạn — đã mượn tuổi hoặc đổi năm'}.
              </li>
              <li>Xem ngày giờ động thổ hợp tuổi (xem Gói ngày trọng đại / Xem ngày theo việc).</li>
              <li>Chuẩn bị lễ động thổ, bàn thờ tạm, cuốc/xẻng cho nhát đất đầu tiên.</li>
              <li>
                Nếu mượn tuổi: người mượn không phạm 3 hạn, không đang có tang, trực tiếp dự lễ
                động thổ.
              </li>
              <li>Tránh ngày động thổ xung với tuổi người đứng làm (gia chủ hoặc người mượn).</li>
              <li>Sau khi xây xong, khi tới năm hợp tuổi gia chủ thì làm lễ chuộc (nếu đã mượn tuổi).</li>
            </ul>
            <p className="text-sm opacity-80">
              Checklist chỉ mang tính tham khảo — phong thủy xây nhà còn phụ thuộc đất, hướng
              nhà và ngày giờ cụ thể.
            </p>
          </div>
          <button type="button" className="btn-primary no-print" onClick={() => window.print()}>
            In checklist (lưu thành PDF)
          </button>
          <p className="text-sm">
            <Link href="/ngay-trong-dai" className="font-semibold text-primary underline">
              Xem ngày động thổ →
            </Link>
          </p>
        </section>
      ) : null}

      <Disclaimer />
    </div>
  );
}
