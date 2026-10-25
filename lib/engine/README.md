# Engine phong thủy — ghi chú công thức

Điểm xuất: `lib/engine/index.ts`. Các agent khác import đúng tên hàm trong
hợp đồng API từ đó. File này ghi rõ từng công thức: cái nào đã có test đối
chiếu, cái nào còn cần đối chiếu nguồn thứ 2 / chuyên gia duyệt trước khi
public. **Không tự ý đổi công thức ở đây mà không cập nhật test tương ứng.**

## 1. Âm lịch Việt Nam (UTC+7) — ĐÃ CÓ TEST ĐỐI CHIẾU

- Sóc + kinh độ mặt trời theo phương pháp Meeus (công thức trong
  `lunar.ts`: `newMoon`, `sunLongitudeIndex`).
- Tháng không có trung khí là tháng nhuận: kiểm tra bằng cách so sánh chỉ
  số cung 30 độ của mặt trời tại 0h ngày đầu tháng này và tháng sau
  (`isLeapMonth`).
- Đếm tháng bằng cách đi bộ từ Tết (sóc thứ 2 sau tháng 11 năm trước) thay
  vì công thức diff/29 — hai cách tương đương, cách đi bộ tránh sai số làm
  tròn.
- Vector đối chiếu (lịch vạn niên, test trong `engine.test.ts`):
  - 10/10/2014 -> âm 17/09/2014.
  - 17/06/2025 -> âm 22/05/2025.
  - 25/05/2025 -> âm 28/04/2025.
  - Tết: 10/02/2024, 29/01/2025, 17/02/2026 đều là mùng 1 tháng Giêng.
  - Năm 2025 nhuận tháng 6: 25/07/2025 là mùng 1 tháng 6 nhuận,
    23/08/2025 là mùng 1 tháng 7.
- Nên đối chiếu thêm: các năm nhuận khác (2023 nhuận tháng 2, 2028...),
  các ngày giáp Tết và tháng 12 của các năm lẻ trước khi public diện rộng.

## 2. Can chi năm / tháng / ngày / giờ — ĐÃ CÓ TEST ĐỐI CHIẾU

- Năm: index = (năm âm − 1984) mod 60, 0 = Giáp Tý.
- Tháng: tháng 1 âm = Dần; can tháng Giêng theo can năm
  (Giáp/Kỷ -> Bính, Ất/Canh -> Mậu, Bính/Tân -> Canh, Đinh/Nhâm -> Nhâm,
  Mậu/Quý -> Giáp), rồi cộng tiếp. Tháng nhuận cùng can chi với tháng
  thường cùng số.
- Ngày: index = (JDN + 49) mod 60, JDN là số ngày Julius tại giữa trưa UTC
  (`jdFromDate`). Mốc: 10/10/2014 = Giáp Dần.
- Giờ: Tý = 23h–1h ... Hợi = 21h–23h; can giờ Tý theo can ngày
  (Giáp/Kỷ -> Giáp, Ất/Canh -> Bính, Bính/Tân -> Mậu, Đinh/Nhâm -> Canh,
  Mậu/Quý -> Nhâm).
- Đối chiếu: tháng 4/2025 = Tân Tỵ, tháng 5/2025 = Nhâm Ngọ, ngày
  17/06/2025 = Đinh Tỵ, ngày 25/05/2025 = Giáp Ngọ (suy từ mốc vector 1 +
  số ngày cách nhau, đã kiểm tra bằng lịch).

## 3. Ngũ hành của can, mệnh nạp âm — ĐÃ CÓ TEST ĐỐI CHIẾU (MỘT PHẦN)

- Can: Giáp/Ất Mộc, Bính/Đinh Hỏa, Mậu/Kỷ Thổ, Canh/Tân Kim, Nhâm/Quý Thủy.
- Nạp âm: bảng 60 hoa giáp chuẩn, mỗi cặp 2 can chi chung một nạp âm
  (xem `NAP_AM_30` trong `constants.ts`). Đối chiếu: Giáp Ngọ = Sa Trung
  Kim (đúng ví dụ hợp đồng), Ất Tỵ = Phúc Đăng Hỏa, Giáp Tý = Hải Trung
  Kim, Quý Hợi = Đại Hải Thủy.
- Còn cần đối chiếu nguồn thứ 2: toàn bộ 60 ô nạp âm (hiện mới kiểm tra
  5 ô) trước khi public.

## 4. Cung phi — ĐÃ CÓ TEST ĐỐI CHIẾU (THEO ĐÚNG CÔNG THỨC TASK)

- Rút gọn tổng chữ số năm ÂM LỊCH về 1–9; nam = 11 − số đó; nữ = số đó + 4;
  nếu > 9 trừ 9; nam ra 5 -> 2 (Khôn), nữ ra 5 -> 8 (Cấn).
- Map: 1 Khảm, 2 Khôn, 3 Chấn, 4 Tốn, 6 Càn, 7 Đoài, 8 Cấn, 9 Ly.
  Đông tứ: 1, 3, 4, 9. Tây tứ: 2, 6, 7, 8.
- **Cảnh báo cho caller:** phải truyền năm ÂM LỊCH. Người sinh tháng 1–2
  dương trước Tết thì tính theo năm âm trước (dùng `solarToLunar` rồi mới
  gọi `cungPhi`).
- Chưa đối chiếu nguồn thứ 2 cho quy tắc số 5 và trường hợp năm có tổng
  chữ số rút gọn đặc biệt — test hiện chỉ kiểm tra công thức task cho.

## 5. Bát trạch — CÓ MỘT ĐỘ LỆCH SO VỚI BẢN TASK, CẦN CHUYÊN GIA CHỐT

- Bảng 7/8 cung khớp hoàn toàn với bảng trong task.
- **Độ lệch duy nhất — cung Khảm:** task ghi "Diên Niên Bắc", nhưng như
  vậy Khảm có 2 sao ở Bắc (Diên Niên + Phục Vị) và không có sao nào ở
  Nam, phá vỡ tính song ánh 8 sao / 8 hướng vốn là tính chất bắt buộc
  của bát trạch. Engine dùng bảng chuẩn phổ biến: Khảm Diên Niên = Nam
  (Sinh Khí Đông Nam, Thiên Y Đông, Diên Niên Nam, Phục Vị Bắc).
  Test `mọi cung đều song ánh` sẽ fail nếu đổi Khảm về Diên Niên Bắc.
- **Hành động trước khi public:** chuyên gia phong thủy chốt Khảm Diên
  Niên là Nam hay Bắc. Nếu chốt là Bắc thì phải quyết định hướng Nam của
  Khảm mang sao gì (bảng task bỏ trống) và sửa cả test song ánh.

## 6. Giờ hoàng đạo — ĐÃ CÓ TEST ĐỐI CHIẾU (3 vector + 2 ví dụ)

- 12 thần theo đúng thứ tự: Thanh Long, Minh Đường, Thiên Hình, Chu Tước,
  Kim Quỹ, Bảo Quang, Bạch Hổ, Ngọc Đường, Thiên Lao, Câu Trận, Tư Mệnh,
  Nguyên Vũ. Hoàng đạo = Thanh Long, Minh Đường, Kim Quỹ, Bảo Quang,
  Ngọc Đường, Tư Mệnh.
- **Quy ước trong code:** code lưu `tl = (4 − 2 × branchIndex) mod 12` là
  CHỈ SỐ THẦN tại giờ Tý (không phải chi của giờ Thanh Long). Chi của giờ
  Thanh Long = (−tl) mod 12 = (2 × branchIndex − 4) mod 12 — tức đúng công
  thức task. Hai cách viết là một quy luật, chỉ khác đại lượng mô tả
  (ghi chú cũ nói "công thức task bị ngược dấu" là sai: nó đã so sánh
  chỉ số thần với chi giờ như thể chúng là một).
- **Đã kiểm chứng:** code cho ra đúng cả 3 vector bắt buộc và 2 ví dụ độc
  lập tra từ lịch vạn niên công khai (Tân Mão -> hoàng đạo Tý, Dần, Mão,
  Ngọ, Mùi, Dậu; Mậu Tý -> hoàng đạo Tý, Sửu, Mão, Ngọ, Thân, Dậu).
- **Hành động trước khi public:** chuyên gia xác nhận lại bảng giờ hoàng đạo
  bằng một nguồn lịch vạn niên in ấn.

## 7. Sao ngày — BỘ CƠ BẢN, CẦN MỞ RỘNG VÀ ĐỐI CHIẾU TRƯỚC KHI PUBLIC

- `saoNgay(canChiDay, lunarMonth?)`. Tham số `lunarMonth` là optional để
  không phá hợp đồng 1 tham số, nhưng Thiên Đức / Nguyệt Đức / Nguyệt Phá
  chỉ tính được khi có tháng âm — caller nên truyền tháng âm từ
  `solarToLunar` (ví dụ: `saoNgay(ngay, lunar.month)`; các màn hình
  "xem ngày" phải truyền tháng âm vào, `getTodayInfo` hiện không gọi
  `saoNgay`).
- Bộ hiện có:
  - Chỉ cần can chi ngày: Lộc (chi ngày là Lộc của can ngày), Thiên Ất
    Quý Nhân, Dương Nhẫn (xấu).
  - Cần tháng âm: Thiên Đức (tháng 1 Đinh, 2 Thân, 3 Nhâm, 4 Tân, 5 Hợi,
    6 Giáp, 7 Quý, 8 Dần, 9 Bính, 10 Ất, 11 Tỵ, 12 Canh), Nguyệt Đức
    (1/5/9 Bính, 2/6/10 Giáp, 3/7/11 Nhâm, 4/8/12 Canh), Nguyệt Phá
    (chi ngày xung chi tháng).
- Chưa có (cần bổ sung sau, khi có tháng + ngày âm đầy đủ): Tam Nương
  (ngày âm 3, 7, 13, 18, 22, 27), Nguyệt Kỵ (5, 14, 23), trực, nhị thập bát
  tú, và các sao theo năm/tuổi. **Không bịa thêm sao lạ ngoài danh sách này.**
- Bảng Thiên Đức / Nguyệt Đức trên chưa đối chiếu nguồn thứ 2 — cần đối
  chiếu trước khi public.

## 8. Thần số học — ĐÃ CÓ TEST, CÔNG THỨC THEO ĐÚNG TASK

- Cộng tất cả chữ số của ngày + tháng + năm sinh (dương lịch), rút gọn,
  giữ số master 11, 22. Giải thích ngắn gọn cho 1–9, 11, 22.
- Lưu ý: phương pháp "cộng từng thành phần rồi cộng lại" có thể cho kết
  quả khác ở một số ngày (khi thành phần rút gọn ra master giữa chừng).
  Engine dùng đúng phương pháp task ghi (cộng tất cả chữ số rồi mới rút
  gọn); nếu chuyên gia yêu cầu phương pháp thành phần thì phải sửa cả test.

## 9. Chấm điểm tên — MÔ HÌNH ĐƠN GIẢN, BẮT BUỘC CHUYÊN GIA DUYỆT TRƯỚC KHI PUBLIC

- Số tên: bảng Pythagoras (A/J/S = 1 ... I/R = 9), bỏ dấu tiếng Việt,
  cộng rồi rút gọn (giữ 11, 22). Số tên -> hành theo bảng chữ số
  (1 Thủy; 2/5/8 Thổ; 3/4 Mộc; 6/7 Kim; 9 Hỏa; master 11 -> 2, 22 -> 4).
- Điểm (0–100) = điểm hành + điểm số: tên sinh mệnh 70, đồng hành 50,
  mệnh sinh tên 35, mệnh khắc tên 25, tên khắc mệnh 10; số master +30,
  số 6/8/9 +20, số còn lại +10.
- **Các trọng số này là quy ước tạm do engine tự đặt, không phải chuẩn
  cổ truyền.** Không được public dưới dạng "chấm điểm chính xác" khi
  chưa có chuyên gia duyệt và đặt tên lại cho đúng bản chất (ví dụ "điểm
  tham khảo").

## 10. Luận số — ĐÃ CÓ TEST, THEO ĐÚNG QUY ƯỚC TASK

- Tổng nút: cộng các chữ số rồi rút gọn về 1 chữ số theo quy ước digital
  root — tổng 10 -> 1, 19 -> 1, 18 -> 9. (Chuỗi toàn số 0 cho tổng nút 0.)
- Ngũ hành chủ đạo: hành có nhiều chữ số nhất, theo bảng 0/9 Hỏa, 1 Thủy,
  2/5/8 Thổ, 3/4 Mộc, 6/7 Kim. Hòa: ưu tiên hành của tổng nút nếu đồng
  hạng, sau đó theo thứ tự Kim, Mộc, Thủy, Hỏa, Thổ.
- Chuỗi không có chữ số nào thì throw (không trả 0 giả).

## 11. getTodayInfo — ĐÃ CÓ TEST

- Quy mọi mốc Date về wall-clock giờ Việt Nam (UTC+7) rồi mới tính, để
  máy chủ ở múi giờ khác vẫn ra đúng ngày Việt Nam.
- Trả đủ 12 khung giờ hoàng đạo (mỗi giờ kèm cờ `hoangDao`); caller tự
  lọc nếu chỉ muốn hiển thị giờ hoàng đạo.

## Chính tả

- Chi thứ 6 viết "Tỵ" thống nhất toàn engine (theo bảng can chi trong hợp
  đồng). Vector 3 của task viết "Tân Tị" — cùng một chi, chỉ khác chính tả.
  Nếu hệ thống khác của site dùng "Tị" thì cần chuẩn hóa ở tầng hiển thị,
  không sửa engine.
