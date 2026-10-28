'use client';

// Luận giải tự động theo câu hỏi — MIỄN PHÍ, KHÔNG có luồng "thầy trả lời".
// Mọi luận giải ở đây đều do mẫu (template) + engine tự động ghép từ ngày
// sinh (nếu có). Đầu trang ghi rõ điều này và không có bất kỳ câu chữ nào
// ngụ ý thầy thật tư vấn hay "thầy sẽ trả lời". Không hiển thị số điện thoại.

import { useMemo, useState } from 'react';
import {
  canChiYear,
  menhNapAm,
  solarToLunar,
  thanSoHoc,
} from '@/lib/engine';
import Disclaimer from '@/components/site/Disclaimer';
import ToolShareCard from '@/components/share/ToolShareCard';
import {
  fmtLunar,
  fmtSolar,
  nguHanhFromMenh,
  parseISODate,
  zodiacOfLunarYear,
} from '@/components/site/format';

type ChuDe = 'tinh-duyen' | 'su-nghiep' | 'tai-chinh' | 'suc-khoe' | 'hoc-tap' | 'nha-cua' | 'chung';

const CHU_DE_LABEL: Record<ChuDe, string> = {
  'tinh-duyen': 'Tình duyên',
  'su-nghiep': 'Sự nghiệp — công việc',
  'tai-chinh': 'Tiền bạc — tài chính',
  'suc-khoe': 'Sức khỏe',
  'hoc-tap': 'Học hành — thi cử',
  'nha-cua': 'Nhà cửa — đất đai',
  chung: 'Chung',
};

function detectChuDe(cauHoi: string): ChuDe {
  const q = cauHoi.toLowerCase();
  if (/(tình|duyên|yêu|cưới|vợ|chồng|người yêu|hôn nhân)/.test(q)) return 'tinh-duyen';
  if (/(việc|sự nghiệp|thăng|đổi việc|sếp|đồng nghiệp|nghề)/.test(q)) return 'su-nghiep';
  if (/(tiền|tài|lộc|đầu tư|kinh doanh|buôn|bán|thu nhập|nợ)/.test(q)) return 'tai-chinh';
  if (/(sức|khỏe|bệnh|ốm|mệt|ngủ)/.test(q)) return 'suc-khoe';
  if (/(học|thi|đỗ|trường|điểm)/.test(q)) return 'hoc-tap';
  if (/(nhà|đất|xây|mua nhà|chung cư|hướng nhà)/.test(q)) return 'nha-cua';
  return 'chung';
}

// Mẫu luận giải theo chủ đề — chỉ là khung diễn giải tham khảo, mọi số liệu
// cụ thể đều lấy từ engine (mệnh, cung, số chủ đạo) khi có ngày sinh.
const TEMPLATE: Record<ChuDe, { moDau: string; diem: string[]; ket: string }> = {
  'tinh-duyen': {
    moDau: 'Về tình duyên, mẫu luận giải tự động này nhìn vào mệnh và cung của bạn để gợi ý xu hướng chung, chứ không đoán định một người hay một mối quan hệ cụ thể.',
    diem: [
      'Hợp — khắc theo ngũ hành chỉ là một góc tham khảo: quan trọng hơn vẫn là cách hai người đối xử với nhau hằng ngày.',
      'Nếu đang cân nhắc việc lớn (cưới hỏi), nên chọn ngày bằng công cụ xem ngày và đối chiếu thêm với tuổi của cả hai người.',
      'Tránh quyết định vội trong những thời điểm tâm trạng đang xáo trộn; ghi lại câu hỏi và xem lại sau vài ngày thường giúp nhìn rõ hơn.',
    ],
    ket: 'Tóm lại: đây là gợi ý tham khảo để bạn suy ngẫm, không phải kết luận về tình duyên của bạn.',
  },
  'su-nghiep': {
    moDau: 'Về sự nghiệp, mẫu luận giải tự động này gợi ý xu hướng theo mệnh và số chủ đạo của bạn — điểm mạnh tham khảo để bạn tự đối chiếu với công việc thực tế.',
    diem: [
      'Việc lớn (đổi việc, nhận dự án mới) nên chuẩn bị kỹ năng và phương án dự phòng trước, thay vì chỉ trông vào ngày giờ.',
      'Nếu cảm thấy bế tắc, hãy chia nhỏ mục tiêu: một việc cụ thể làm được trong tuần này thường mở ra bước tiếp theo.',
      'Đối chiếu với người đi trước trong nghề (đồng nghiệp, quản lý) sẽ cho thông tin thực tế hơn bất kỳ bảng tra nào.',
    ],
    ket: 'Tóm lại: dùng gợi ý này như một góc nhìn thêm, quyết định vẫn dựa vào năng lực và hoàn cảnh thật của bạn.',
  },
  'tai-chinh': {
    moDau: 'Về tiền bạc, mẫu luận giải tự động này chỉ gợi ý xu hướng chung theo mệnh — không phải lời khuyên đầu tư và không dự đoán lợi nhuận.',
    diem: [
      'Mọi quyết định tiền bạc cần có con số cụ thể: thu nhập, chi phí, khoản dự phòng — bảng tra không thay được bảng tính.',
      'Tránh vay mượn hoặc đầu tư theo cảm hứng trong lúc đang nóng vội; ghi ra rủi ro lớn nhất có thể xảy ra trước khi xuống tiền.',
      'Nếu khoản tiền là lớn với bạn, hãy hỏi thêm người có chuyên môn tài chính thay vì chỉ dựa vào luận giải tham khảo.',
    ],
    ket: 'Tóm lại: đây là gợi ý tham khảo, không phải tư vấn tài chính và không hứa hẹn kết quả tiền bạc nào.',
  },
  'suc-khoe': {
    moDau: 'Về sức khỏe, mẫu luận giải tự động này chỉ gợi ý chung về việc giữ nhịp sinh hoạt — không chẩn đoán, không kê đơn, không thay thế bác sĩ.',
    diem: [
      'Ngủ đủ, ăn uống đều và vận động nhẹ hằng ngày là nền tảng; mọi dấu hiệu bất thường kéo dài nên đi khám thay vì tra cứu.',
      'Nếu câu hỏi liên quan đến bệnh lý cụ thể, hãy hỏi bác sĩ hoặc cơ sở y tế — luận giải này không có giá trị y khoa.',
      'Ghi lại triệu chứng (khi nào, bao lâu, mức độ) sẽ giúp buổi khám hiệu quả hơn nhiều.',
    ],
    ket: 'Tóm lại: giữ sức khỏe bằng sinh hoạt đều đặn và khám chuyên môn khi cần; luận giải này chỉ mang tính tham khảo.',
  },
  'hoc-tap': {
    moDau: 'Về học hành, mẫu luận giải tự động này gợi ý xu hướng theo số chủ đạo của bạn — điểm mạnh tham khảo để chọn cách học phù hợp.',
    diem: [
      'Kế hoạch ôn tập cụ thể (mỗi ngày học gì, luyện bao nhiêu) quyết định kết quả nhiều hơn ngày giờ.',
      'Nếu hay mất tập trung, thử chia nhỏ thời gian học (25–40 phút/lần) và ghi lại tiến độ mỗi ngày.',
      'Thi cử nên chuẩn bị cả sức khỏe (ngủ đủ trước ngày thi) lẫn kiến thức — đừng thức khuya dồn vào phút cuối.',
    ],
    ket: 'Tóm lại: gợi ý này chỉ là góc nhìn thêm; kết quả học tập đến từ quá trình ôn luyện thật của bạn.',
  },
  'nha-cua': {
    moDau: 'Về nhà cửa, mẫu luận giải tự động này gợi ý theo cung phi và bát trạch của bạn — hướng tốt/xấu chỉ là một góc tham khảo trong nhiều yếu tố chọn nhà.',
    diem: [
      'Khi chọn nhà, ngoài hướng còn cần xem pháp lý, chất lượng xây dựng, giao thông, môi trường xung quanh và ngân sách.',
      'Hướng xấu theo bát trạch không có nghĩa là nhà không ở được — nhiều gia đình vẫn bố trí lại công năng (cửa, bếp, bàn thờ) cho hợp lý.',
      'Việc lớn như động thổ, nhập trạch nên chốt ngày bằng công cụ xem ngày sau khi đã chắc về pháp lý và tài chính.',
    ],
    ket: 'Tóm lại: dùng bát trạch như một lớp tham khảo, quyết định nhà cửa vẫn dựa vào yếu tố thực tế là chính.',
  },
  chung: {
    moDau: 'Câu hỏi của bạn chưa rơi vào một chủ đề cụ thể nào, nên mẫu luận giải tự động này đưa ra khung chung để bạn tự suy ngẫm.',
    diem: [
      'Viết rõ điều bạn thực sự muốn: kết quả mong muốn là gì, trong bao lâu, và điều gì đang khiến bạn băn khoăn nhất.',
      'Chia vấn đề thành phần nhỏ: phần nào bạn kiểm soát được ngay, phần nào cần thêm thông tin, phần nào cần người khác giúp.',
      'Thử đặt lại câu hỏi cụ thể hơn (về tình duyên, công việc, tiền bạc, sức khỏe, học hành hoặc nhà cửa) để nhận luận giải theo đúng chủ đề.',
    ],
    ket: 'Tóm lại: khung chung này chỉ giúp bạn sắp xếp suy nghĩ; câu hỏi càng cụ thể thì luận giải càng sát.',
  },
};

export default function LuanGiaiPage() {
  const [cauHoi, setCauHoi] = useState('');
  const [ngaySinh, setNgaySinh] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const ketQua = useMemo(() => {
    if (!submitted || !cauHoi.trim()) return null;
    const chuDe = detectChuDe(cauHoi);
    const tpl = TEMPLATE[chuDe];
    let engineLine = '';
    if (ngaySinh) {
      const d = parseISODate(ngaySinh);
      if (d) {
        try {
          const lunar = solarToLunar(d.getFullYear(), d.getMonth() + 1, d.getDate());
          const ccYear = canChiYear(lunar.year);
          const menh = menhNapAm(ccYear);
          const nguHanh = nguHanhFromMenh(menh);
          const tuoi = zodiacOfLunarYear(lunar.year);
          // Cung phi cần giới tính; không hỏi giới tính ở trang này nên chỉ
          // nêu mệnh + tuổi, không nêu cung (tránh tính sai khi thiếu dữ liệu).
          const t = thanSoHoc(d.getDate(), d.getMonth() + 1, d.getFullYear());
          engineLine = `Theo ngày sinh bạn nhập (${fmtSolar(d)}, âm lịch ${fmtLunar(lunar)}): can chi năm ${ccYear} (tuổi ${tuoi}), mệnh ${menh} (ngũ hành ${nguHanh}), số chủ đạo ${t.soChuDao} — ${t.giaiThich}`;
        } catch {
          engineLine = 'Ngày sinh chưa đổi được sang âm lịch nên phần luận theo tuổi tạm bỏ trống.';
        }
      }
    }
    return { chuDe, tpl, engineLine };
  }, [submitted, cauHoi, ngaySinh]);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold text-primary">Luận giải tự động theo câu hỏi</h1>
      <p className="rounded border-2 border-gold bg-creamDark px-4 py-3 font-semibold text-primary">
        Đây là luận giải tự động, không phải tư vấn của thầy. Trang này không có thầy thật
        tư vấn và không có luồng &quot;thầy sẽ trả lời&quot; — mọi nội dung bên dưới đều do
        mẫu có sẵn kết hợp với bảng tra tự động tạo ra.
      </p>
      <p className="text-ink/80">
        Nhập câu hỏi của bạn (và ngày sinh nếu muốn luận gắn với tuổi). Site sẽ nhận diện
        chủ đề — tình duyên, sự nghiệp, tiền bạc, sức khỏe, học hành, nhà cửa — rồi trả
        luận giải theo mẫu của chủ đề đó.
      </p>

      <form
        className="card space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          setSubmitted(true);
        }}
      >
        <div>
          <label className="label" htmlFor="lg-cau-hoi">Câu hỏi của bạn</label>
          <textarea
            id="lg-cau-hoi"
            className="input"
            rows={4}
            value={cauHoi}
            onChange={(e) => setCauHoi(e.target.value)}
            placeholder="VD: Năm nay tôi có nên đổi việc không?"
            required
          />
        </div>
        <div>
          <label className="label" htmlFor="lg-ngay">Ngày sinh dương lịch (tùy chọn)</label>
          <input
            id="lg-ngay"
            type="date"
            className="input"
            value={ngaySinh}
            onChange={(e) => setNgaySinh(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary">Nhận luận giải tự động</button>
      </form>

      {ketQua ? (
        <div className="space-y-6">
          <section className="card space-y-3">
            <p className="chip">Luận giải tự động — chủ đề: {CHU_DE_LABEL[ketQua.chuDe]}</p>
            <h2 className="font-display text-xl font-bold text-primary">Luận giải cho câu hỏi của bạn</h2>
            <p className="italic text-ink/80">&quot;{cauHoi.trim()}&quot;</p>
            <p>{ketQua.tpl.moDau}</p>
            {ketQua.engineLine ? <p>{ketQua.engineLine}</p> : null}
            <ul className="list-disc space-y-2 pl-5">
              {ketQua.tpl.diem.map((d, i) => (
                <li key={i}>{d}</li>
              ))}
            </ul>
            <p className="font-semibold">{ketQua.tpl.ket}</p>
            <p className="text-sm text-ink/80">
              Lưu ý: cung phi không được nêu ở trang này vì trang không hỏi giới tính —
              tính cung phi cần giới tính và năm âm lịch chính xác, nên nếu bạn cần, hãy
              dùng công cụ tra bản mệnh để xem cung phi đầy đủ.
            </p>
          </section>

          <ToolShareCard
            title="Luận giải tự động"
            lines={[
              `Chủ đề: ${CHU_DE_LABEL[ketQua.chuDe]}`,
              ketQua.engineLine ? ketQua.engineLine.split('—')[0].replace('Theo ngày sinh bạn nhập ', 'Tuổi theo ngày sinh: ') : 'Luận giải theo mẫu chủ đề',
              'Đây là luận giải tự động, không phải tư vấn của thầy.',
            ]}
          />
        </div>
      ) : null}

      <Disclaimer text="Luận giải ở trang này được tạo tự động từ mẫu có sẵn và bảng tra truyền thống, mang tính tham khảo, không phải tư vấn của thầy và không thay thế tư vấn chuyên môn cho quyết định quan trọng." />
    </div>
  );
}
