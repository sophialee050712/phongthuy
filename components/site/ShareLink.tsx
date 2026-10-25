// Link chia sẻ kết quả theo đúng định dạng đã chốt:
// /chia-se?t=<tiêu đề>&d=<chi tiết nối bằng ký tự |>.
export default function ShareLink({ tieuDe, chiTiet }: { tieuDe: string; chiTiet: string }) {
  const href = `/chia-se?t=${encodeURIComponent(tieuDe)}&d=${encodeURIComponent(chiTiet)}`;
  return (
    <p className="text-sm">
      <a href={href} className="font-semibold text-primary underline">
        Chia sẻ kết quả này
      </a>
    </p>
  );
}
