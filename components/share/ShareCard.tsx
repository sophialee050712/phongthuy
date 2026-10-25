// Thẻ kết quả dọc tỉ lệ 9:16 để người dùng chụp màn hình chia sẻ.
// KHÔNG vẽ mã QR giả: không có QR thật thì không hiển thị QR.
// Màu đúng hệ màu site: nền đỏ thẫm #7B1E1E (primary), viền vàng (gold), chữ kem (cream).

export default function ShareCard({ title, details }: { title: string; details: string[] }) {
  return (
    <section
      aria-label="Thẻ kết quả chia sẻ"
      className="mx-auto flex aspect-[9/16] w-full max-w-[420px] flex-col overflow-hidden border-4 border-gold bg-primary px-6 py-8 text-cream shadow-xl"
    >
      <p className="text-center text-xs font-semibold tracking-[0.3em] text-brass">
        KHANG AN PHONG THỦY
      </p>
      <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
      <h1 className="text-center font-display text-2xl font-bold leading-snug">{title}</h1>
      <div className="mx-auto my-4 h-px w-16 bg-gold" aria-hidden="true" />
      {details.length > 0 ? (
        <ul className="mt-2 space-y-3 text-base leading-relaxed">
          {details.map((line, index) => (
            <li key={index} className="flex gap-2">
              <span className="text-gold" aria-hidden="true">
                ✦
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-center text-sm opacity-90">
          Chưa có chi tiết — thêm tham số ?d=... vào đường link để tạo thẻ.
        </p>
      )}
      <div className="mt-auto pt-6 text-center">
        <div className="mb-4 h-px w-full bg-gold/50" aria-hidden="true" />
        <p className="font-display text-lg font-bold">Khang An Phong Thủy</p>
        <p className="mt-1 text-sm opacity-90">Chụp màn hình để chia sẻ</p>
      </div>
    </section>
  );
}
