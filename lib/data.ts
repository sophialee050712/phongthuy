// Dữ liệu mẫu local — dùng khi chưa cấu hình Supabase.
// KHÔNG bịa giá, số điện thoại, tiểu sử thầy: các trường đó để [CHỜ ĐIỀN].

export const SITE = {
  name: 'Khang An Phong Thủy',
  slogan: 'Khơi Vận May Mắn, Khai Mở Cát Tường',
  hotline: '[CHỜ ĐIỀN]',
  zaloOa: '[CHỜ ĐIỀN]',
};

export const VIEC_LIST = [
  'Cưới hỏi',
  'Khai trương',
  'Động thổ',
  'Xuất hành',
  'Ký hợp đồng',
  'Nhập trạch',
  'Mua xe',
  'An táng',
];

export const TUOI_12 = [
  'Tý',
  'Sửu',
  'Dần',
  'Mão',
  'Thìn',
  'Tỵ',
  'Ngọ',
  'Mùi',
  'Thân',
  'Dậu',
  'Tuất',
  'Hợi',
];

export type Post = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  cover_image?: string;
  seo_title?: string;
  seo_description?: string;
  aeo_answer?: string;
  faq?: { q: string; a: string }[];
  published_at?: string;
  /** Tên hiển thị của tác giả (bài mẫu demo dùng bút danh Khang An Tiên Sinh). */
  author?: string;
  /** true khi bài này là bài mẫu demo trong code, không phải bài thật trong DB. */
  demo?: boolean;
};

export const SAMPLE_POSTS: Post[] = [
  {
    slug: 'ngay-tot-khai-truong-thang-nay',
    title: 'Cách chọn ngày tốt khai trương: 5 bước kiểm tra trước khi chốt',
    excerpt:
      'Ngày tốt khai trương cần hợp việc, hợp tuổi chủ và có giờ hoàng đạo — kiểm tra theo 5 bước sau trước khi chốt lịch.',
    content: `Ngày tốt khai trương được xét theo thứ tự: tránh ngày đại kỵ của việc, ngày không xung với tuổi chủ, nhiều sao tốt, trực và nhị thập bát tú tốt, rồi mới chọn giờ hoàng đạo để khởi sự.

Câu trả lời nhanh: ngày khai trương tốt là ngày có nhiều sao Đại Cát như Thiên Đức, Nguyệt Đức, Thiên Hỷ, không phạm ngày xung với tuổi chủ, và giờ khởi sự rơi vào giờ hoàng đạo.

Kiểm tra nhanh 5 bước: (1) loại ngày đại kỵ, (2) đối chiếu ngũ hành ngày với mệnh tuổi, (3) đếm sao tốt và sao xấu, (4) xem trực và sao nhị thập bát tú, (5) chốt giờ hoàng đạo.`,
    category: 'Ngày tốt',
    aeo_answer:
      'Ngày khai trương tốt là ngày nhiều sao Đại Cát, không xung tuổi chủ, và giờ khởi sự rơi vào giờ hoàng đạo.',
    faq: [
      {
        q: 'Khai trương nên chọn giờ nào?',
        a: 'Chọn giờ hoàng đạo trong ngày, tránh giờ xung với tuổi chủ.',
      },
    ],
    published_at: '2026-10-24',
    author: 'Khang An Tiên Sinh',
  },
  {
    slug: 'huong-nha-bat-trach-co-ban',
    title: 'Bát trạch hướng nhà: 8 hướng tốt xấu hiểu trong 5 phút',
    excerpt:
      'Mỗi cung mệnh có 4 hướng tốt (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và 4 hướng xấu (Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại).',
    content: `Bát trạch chia người thành Đông tứ mệnh và Tây tứ mệnh theo cung phi. Mỗi cung có 4 hướng tốt và 4 hướng xấu cố định.

Bốn hướng tốt: Sinh Khí (tốt nhất), Thiên Y, Diên Niên, Phục Vị. Bốn hướng xấu: Tuyệt Mệnh (xấu nhất), Ngũ Quỷ, Lục Sát, Họa Hại. Cửa chính, bếp và bàn thờ nên đặt theo hướng tốt; hướng xấu dùng để đặt nhà vệ sinh, kho theo nguyên tắc "lấy độc trị độc" trong trường phái bát trạch.`,
    category: 'Phong thủy nhà',
    aeo_answer:
      'Mỗi cung mệnh có 4 hướng tốt là Sinh Khí, Thiên Y, Diên Niên, Phục Vị và 4 hướng xấu là Tuyệt Mệnh, Ngũ Quỷ, Lục Sát, Họa Hại.',
    faq: [
      {
        q: 'Hướng xấu có hóa giải được không?',
        a: 'Theo bát trạch, hướng xấu thường dùng cho công trình phụ và kết hợp vật phẩm, nhưng quan trọng nhất vẫn là hướng cửa chính, bếp và bàn thờ.',
      },
    ],
    published_at: '2026-10-24',
    author: 'Khang An Tiên Sinh',
  },
  {
    slug: 'ngu-hanh-tuong-sinh-tuong-khac',
    title: 'Ngũ hành tương sinh tương khắc: bảng tra nhanh cho người mới',
    excerpt:
      'Kim, Mộc, Thủy, Hỏa, Thổ sinh khắc lẫn nhau theo vòng tròn — tra nhanh để chọn màu, hướng và vật phẩm hợp mệnh.',
    content: `Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc.

Chọn màu hợp mệnh theo tương sinh: mệnh Kim hợp màu của Thổ (vàng, nâu) và màu của Kim (trắng, xám); mệnh Mộc hợp màu của Thủy (đen, xanh dương) và màu của Mộc (xanh lá); mệnh Thủy hợp màu của Kim và màu của Thủy; mệnh Hỏa hợp màu của Mộc và màu của Hỏa (đỏ, hồng); mệnh Thổ hợp màu của Hỏa và màu của Thổ.`,
    category: 'Kiến thức',
    aeo_answer:
      'Tương sinh: Mộc sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim, Kim sinh Thủy, Thủy sinh Mộc. Tương khắc: Mộc khắc Thổ, Thổ khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim, Kim khắc Mộc.',
    published_at: '2026-10-24',
    author: 'Khang An Tiên Sinh',
  },
];
