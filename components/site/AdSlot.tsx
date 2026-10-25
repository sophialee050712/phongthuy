// Vị trí đặt quảng cáo — KHUNG GIỮ CHỖ, không phải quảng cáo thật.
// Cố tình KHÔNG nhúng code của bất kỳ mạng quảng cáo nào và không dùng ID
// tài khoản hay ID vị trí quảng cáo thật nào: khi chủ site ký hợp đồng với
// một mạng quảng cáo, coordinator thay nội dung khung này bằng code nhúng
// chính thức của mạng đó (kèm chính sách riêng tư/cookie nếu mạng yêu cầu).
// Chủ site không phải thầy phong thủy và không có tư vấn 1-1 — khung này
// chỉ là vị trí quảng cáo, không ngụ ý nội dung quảng cáo được thầy nào xác thực.

export default function AdSlot({
  label = 'Vị trí quảng cáo',
  className = '',
}: {
  /** Nhãn hiển thị trong khung (mặc định "Vị trí quảng cáo"). */
  label?: string;
  /** Class bổ sung cho wrapper, vd để căn lề khi đặt trong trang cụ thể. */
  className?: string;
}) {
  return (
    <aside
      aria-label={label}
      className={`flex min-h-[90px] flex-col items-center justify-center rounded-lg border border-dashed border-gold/60 bg-creamDark px-4 py-6 text-center ${className}`}
    >
      <p className="text-sm font-semibold text-primary">{label}</p>
      <p className="mt-1 text-xs text-ink/60">Quảng cáo sẽ hiển thị tại đây.</p>
    </aside>
  );
}
