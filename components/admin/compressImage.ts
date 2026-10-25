// Nén ảnh phía client bằng canvas TRƯỚC KHI upload lên Supabase Storage:
// resize tối đa 1600px (giữ tỉ lệ), xuất JPEG chất lượng 0.82. Không thêm dependency.
// Nếu canvas lỗi (ảnh hỏng, trình duyệt lạ), trả về file gốc để upload vẫn chạy.

export async function compressImageFile(file: File): Promise<Blob> {
  try {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('Không đọc được ảnh'));
        img.src = url;
      });
      const MAX = 1600;
      const scale = Math.min(1, MAX / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return file;
      ctx.drawImage(img, 0, 0, w, h);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.82),
      );
      return blob ?? file;
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return file;
  }
}
