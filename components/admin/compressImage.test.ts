import { describe, expect, it } from 'vitest';
import { seoFriendlyFileName } from './compressImage';

// Chỉ test hàm thuần seoFriendlyFileName (không động tới canvas/browser API).
describe('seoFriendlyFileName', () => {
  it('bỏ dấu tiếng Việt và đổi đuôi thành .jpg', () => {
    expect(seoFriendlyFileName('Mâm Cúng Khai Trương!.PNG')).toBe('mam-cung-khai-truong.jpg');
  });

  it('xử lý chữ Đ và khoảng trắng thừa', () => {
    expect(seoFriendlyFileName('  Đặt Tên Con 2026 .jpeg')).toBe('dat-ten-con-2026.jpg');
  });

  it('tên chỉ toàn ký tự lạ thì rơi về anh.jpg', () => {
    expect(seoFriendlyFileName('!!!.png')).toBe('anh.jpg');
  });

  it('giữ nguyên tên đã là slug', () => {
    expect(seoFriendlyFileName('ngay-tot-khai-truong.jpg')).toBe('ngay-tot-khai-truong.jpg');
  });
});
