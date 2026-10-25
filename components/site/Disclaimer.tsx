export default function Disclaimer({ text }: { text?: string }) {
  return (
    <p className="rounded border border-gold/40 bg-creamDark px-3 py-2 text-sm text-ink/80">
      {text ??
        'Kết quả tra cứu mang tính tham khảo theo lịch vạn niên và các bảng tra truyền thống, không thay thế tư vấn chuyên môn cho quyết định quan trọng.'}
    </p>
  );
}
