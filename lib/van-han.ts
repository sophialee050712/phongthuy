// Điểm vận rút gọn dùng chung cho /van-han (ngày) và /tu-vi-tuan (tuần).
// Công thức gốc từ VanHanForm — đừng đổi một phía mà không đổi phía còn lại:
//   nền 55, cộng (ngày trong tháng % 10) − 4, rồi: tương sinh +20, tương khắc −20,
//   cùng hành +5; kẹp 20–95. Mức: >= 75 "Vận tốt", >= 50 "Vận bình ổn",
//   còn lại "Vận trầm — nên chậm lại". Chỉ là rút gọn tham khảo, không phải dự báo.

export type QuanHeNguHanh = 'sinh' | 'khac' | 'binh';

export function diemVanHan(
  ngayTrongThang: number,
  quanHe: QuanHeNguHanh,
  cungHanh: boolean,
): number {
  let diem = 55 + (ngayTrongThang % 10) - 4;
  if (quanHe === 'sinh') diem += 20;
  else if (quanHe === 'khac') diem -= 20;
  else if (cungHanh) diem += 5;
  return Math.max(20, Math.min(95, diem));
}

export function mucVanHan(diem: number): string {
  if (diem >= 75) return 'Vận tốt';
  if (diem >= 50) return 'Vận bình ổn';
  return 'Vận trầm — nên chậm lại';
}
