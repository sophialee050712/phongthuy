// Vị trí đặt quảng cáo — KHUNG GIỮ CHỖ, không phải quảng cáo thật.
// Cố tình KHÔNG nhúng code của bất kỳ mạng quảng cáo nào và không dùng ID
// tài khoản hay ID vị trí quảng cáo thật nào: khi chủ site ký hợp đồng với
// một mạng quảng cáo, coordinator thay nội dung khung này bằng code nhúng
// chính thức của mạng đó (kèm chính sách riêng tư/cookie nếu mạng yêu cầu).
// Chủ site không phải thầy phong thủy và không có tư vấn 1-1 — khung này
// chỉ là vị trí quảng cáo, không ngụ ý nội dung quảng cáo được thầy nào xác thực.
//
// Từ đợt nâng cấp giao diện 26/10: component trả về null để KHÔNG hiện khung
// trống "Quảng cáo sẽ hiển thị tại đây" ra mặt công khai — khung giữ chỗ trông
// như web chưa làm xong. Khi có code quảng cáo thật, thay return null bằng
// code nhúng chính thức.

export default function AdSlot({
  label = 'Vị trí quảng cáo',
  className = '',
}: {
  /** Nhãn hiển thị trong khung (mặc định "Vị trí quảng cáo"). */
  label?: string;
  /** Class bổ sung cho wrapper, vd để căn lề khi đặt trong trang cụ thể. */
  className?: string;
}) {
  void label;
  void className;
  return null;
}
