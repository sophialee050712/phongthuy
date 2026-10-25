// Unit test cho engine phong thủy — chạy bằng `npm test` (vitest run).
// Vector 1-3 là vector bắt buộc từ lịch vạn niên đã kiểm chứng; KHÔNG được
// sửa vector cho vừa code. Nếu vector fail thì debug code (offset múi giờ /
// JDN trước, rồi mới xem lại công thức — xem README §6 về giờ hoàng đạo).
import { describe, it, expect } from 'vitest';
import {
  solarToLunar,
  canChiYear,
  canChiMonth,
  canChiDay,
  canChiHour,
  nguHanhOfCan,
  menhNapAm,
  cungPhi,
  batTrach,
  hoangDaoHours,
  saoNgay,
  thanSoHoc,
  chamDiemTen,
  luanSo,
  getTodayInfo,
} from './index';

/** Lấy sao + cờ hoàng đạo của một giờ (nhận diện bằng tiền tố "Tý ", ...). */
function hourOf(day: string, branchPrefix: string) {
  const found = hoangDaoHours(day).find((g) =>
    g.gio.startsWith(`${branchPrefix} `),
  );
  if (!found) throw new Error(`Không tìm thấy giờ ${branchPrefix}`);
  return found;
}

function hoangDaoBranches(day: string): string[] {
  return hoangDaoHours(day)
    .filter((g) => g.hoangDao)
    .map((g) => g.gio.split(' ')[0]);
}

describe('VECTOR BẮT BUỘC 1: dương 10/10/2014', () => {
  it('âm 17/09/2014, năm Giáp Ngọ, tháng Giáp Tuất, ngày Giáp Dần', () => {
    expect(solarToLunar(2014, 10, 10)).toEqual({
      day: 17,
      month: 9,
      year: 2014,
      leap: false,
    });
    expect(canChiYear(2014)).toBe('Giáp Ngọ');
    expect(canChiMonth(2014, 9)).toBe('Giáp Tuất');
    expect(canChiDay(2014, 10, 10)).toBe('Giáp Dần');
  });

  it('hoàng đạo: Tý-Thanh Long, Sửu-Minh Đường, Thìn-Kim Quỹ, Tỵ-Bảo Quang, Mùi-Ngọc Đường, Tuất-Tư Mệnh', () => {
    const day = 'Giáp Dần';
    expect(hoangDaoHours(day)).toHaveLength(12);
    expect(hourOf(day, 'Tý')).toMatchObject({ sao: 'Thanh Long', hoangDao: true });
    expect(hourOf(day, 'Sửu')).toMatchObject({ sao: 'Minh Đường', hoangDao: true });
    expect(hourOf(day, 'Thìn')).toMatchObject({ sao: 'Kim Quỹ', hoangDao: true });
    expect(hourOf(day, 'Tỵ')).toMatchObject({ sao: 'Bảo Quang', hoangDao: true });
    expect(hourOf(day, 'Mùi')).toMatchObject({ sao: 'Ngọc Đường', hoangDao: true });
    expect(hourOf(day, 'Tuất')).toMatchObject({ sao: 'Tư Mệnh', hoangDao: true });
    expect(hoangDaoBranches(day)).toEqual([
      'Tý',
      'Sửu',
      'Thìn',
      'Tỵ',
      'Mùi',
      'Tuất',
    ]);
  });
});

describe('VECTOR BẮT BUỘC 2: dương 17/06/2025', () => {
  it('âm 22/05/2025, tháng Nhâm Ngọ, năm Ất Tỵ', () => {
    expect(solarToLunar(2025, 6, 17)).toEqual({
      day: 22,
      month: 5,
      year: 2025,
      leap: false,
    });
    expect(canChiYear(2025)).toBe('Ất Tỵ');
    expect(canChiMonth(2025, 5)).toBe('Nhâm Ngọ');
    expect(canChiDay(2025, 6, 17)).toBe('Đinh Tỵ');
  });

  it('hoàng đạo: Sửu-Ngọc Đường, Thìn-Tư Mệnh, Ngọ-Thanh Long, Mùi-Minh Đường, Tuất-Kim Quỹ, Hợi-Bảo Quang', () => {
    const day = 'Đinh Tỵ';
    expect(hourOf(day, 'Sửu')).toMatchObject({ sao: 'Ngọc Đường', hoangDao: true });
    expect(hourOf(day, 'Thìn')).toMatchObject({ sao: 'Tư Mệnh', hoangDao: true });
    expect(hourOf(day, 'Ngọ')).toMatchObject({ sao: 'Thanh Long', hoangDao: true });
    expect(hourOf(day, 'Mùi')).toMatchObject({ sao: 'Minh Đường', hoangDao: true });
    expect(hourOf(day, 'Tuất')).toMatchObject({ sao: 'Kim Quỹ', hoangDao: true });
    expect(hourOf(day, 'Hợi')).toMatchObject({ sao: 'Bảo Quang', hoangDao: true });
    expect(hoangDaoBranches(day)).toEqual([
      'Sửu',
      'Thìn',
      'Ngọ',
      'Mùi',
      'Tuất',
      'Hợi',
    ]);
  });
});

describe('VECTOR BẮT BUỘC 3: dương 25/05/2025', () => {
  it('âm 28/04/2025, tháng Tân Tỵ (task viết "Tân Tị", cùng một chi), năm Ất Tỵ', () => {
    expect(solarToLunar(2025, 5, 25)).toEqual({
      day: 28,
      month: 4,
      year: 2025,
      leap: false,
    });
    expect(canChiYear(2025)).toBe('Ất Tỵ');
    expect(canChiMonth(2025, 4)).toBe('Tân Tỵ');
    expect(canChiDay(2025, 5, 25)).toBe('Giáp Ngọ');
  });

  it('hoàng đạo: Tý-Kim Quỹ, Sửu-Bảo Quang, Mão-Ngọc Đường, Ngọ-Tư Mệnh, Thân-Thanh Long, Dậu-Minh Đường', () => {
    const day = 'Giáp Ngọ';
    expect(hourOf(day, 'Tý')).toMatchObject({ sao: 'Kim Quỹ', hoangDao: true });
    expect(hourOf(day, 'Sửu')).toMatchObject({ sao: 'Bảo Quang', hoangDao: true });
    expect(hourOf(day, 'Mão')).toMatchObject({ sao: 'Ngọc Đường', hoangDao: true });
    expect(hourOf(day, 'Ngọ')).toMatchObject({ sao: 'Tư Mệnh', hoangDao: true });
    expect(hourOf(day, 'Thân')).toMatchObject({ sao: 'Thanh Long', hoangDao: true });
    expect(hourOf(day, 'Dậu')).toMatchObject({ sao: 'Minh Đường', hoangDao: true });
    expect(hoangDaoBranches(day)).toEqual([
      'Tý',
      'Sửu',
      'Mão',
      'Ngọ',
      'Thân',
      'Dậu',
    ]);
  });
});

describe('Âm lịch: Tết, tháng nhuận, ngày giáp Tết', () => {
  it('Tết các năm 2024-2026', () => {
    expect(solarToLunar(2024, 2, 10)).toEqual({ day: 1, month: 1, year: 2024, leap: false });
    expect(solarToLunar(2025, 1, 29)).toEqual({ day: 1, month: 1, year: 2025, leap: false });
    expect(solarToLunar(2026, 2, 17)).toEqual({ day: 1, month: 1, year: 2026, leap: false });
  });

  it('ngày trước Tết vẫn thuộc năm âm cũ', () => {
    expect(solarToLunar(2025, 1, 28)).toEqual({ day: 29, month: 12, year: 2024, leap: false });
    expect(solarToLunar(2024, 2, 9)).toEqual({ day: 30, month: 12, year: 2023, leap: false });
    expect(solarToLunar(2025, 1, 15)).toEqual({ day: 16, month: 12, year: 2024, leap: false });
  });

  it('năm 2025 nhuận tháng 6 (tháng 6 nhuận bắt đầu 25/07/2025)', () => {
    expect(solarToLunar(2025, 7, 24)).toEqual({ day: 30, month: 6, year: 2025, leap: false });
    expect(solarToLunar(2025, 7, 25)).toEqual({ day: 1, month: 6, year: 2025, leap: true });
    expect(solarToLunar(2025, 8, 22)).toEqual({ day: 29, month: 6, year: 2025, leap: true });
    expect(solarToLunar(2025, 8, 23)).toEqual({ day: 1, month: 7, year: 2025, leap: false });
  });

  it('ngày không hợp lệ thì báo lỗi thay vì trả kết quả sai', () => {
    expect(() => solarToLunar(2025, 2, 30)).toThrow();
    expect(() => solarToLunar(2025, 13, 1)).toThrow();
  });
});

describe('Can chi giờ, ngũ hành, nạp âm', () => {
  it('can giờ theo can ngày (ví dụ hợp đồng: ngày Đinh -> giờ Sửu là Tân Sửu)', () => {
    expect(canChiHour('Đinh Tỵ', 1)).toBe('Tân Sửu');
    expect(canChiHour('Giáp Dần', 0)).toBe('Giáp Tý');
    expect(canChiHour('Giáp Dần', 23)).toBe('Giáp Tý');
    expect(canChiHour('Giáp Dần', 1)).toBe('Ất Sửu');
    expect(canChiHour('Giáp Dần', 22)).toBe('Ất Hợi');
    expect(() => canChiHour('Giáp Dần', 24)).toThrow();
  });

  it('ngũ hành của can', () => {
    expect(nguHanhOfCan('Giáp')).toBe('Mộc');
    expect(nguHanhOfCan('Ất')).toBe('Mộc');
    expect(nguHanhOfCan('Bính')).toBe('Hỏa');
    expect(nguHanhOfCan('Mậu')).toBe('Thổ');
    expect(nguHanhOfCan('Canh')).toBe('Kim');
    expect(nguHanhOfCan('Nhâm')).toBe('Thủy');
    expect(nguHanhOfCan('Quý')).toBe('Thủy');
  });

  it('mệnh nạp âm', () => {
    expect(menhNapAm('Giáp Ngọ')).toBe('Sa Trung Kim');
    expect(menhNapAm('Ất Tỵ')).toBe('Phúc Đăng Hỏa');
    expect(menhNapAm('Giáp Tý')).toBe('Hải Trung Kim');
    expect(menhNapAm('Quý Hợi')).toBe('Đại Hải Thủy');
    expect(menhNapAm('Giáp Dần')).toBe('Đại Khê Thủy');
  });

  it('can chi tháng: tháng 10 = Đinh Hợi, tháng 11 = Mậu Tý, tháng 12 = Kỷ Sửu', () => {
    // Năm Ất: can tháng Giêng là Mậu (Mậu Dần); đếm tiếp mỗi tháng tăng
    // 1 can và 1 chi: tháng 4 = Tân Tỵ, tháng 5 = Nhâm Ngọ (đã khớp 2
    // vector bắt buộc), tháng 10 = Đinh Hợi, tháng 11 = Mậu Tý,
    // tháng 12 = Kỷ Sửu.
    expect(canChiMonth(2025, 10)).toBe('Đinh Hợi');
    expect(canChiMonth(2025, 11)).toBe('Mậu Tý');
    expect(canChiMonth(2025, 12)).toBe('Kỷ Sửu');
    expect(canChiMonth(2025, 1)).toBe('Mậu Dần');
  });
});

describe('Cung phi và bát trạch', () => {
  it('cung phi theo năm âm', () => {
    expect(cungPhi('nam', 2025)).toEqual({ cung: 'Khôn', nhom: 'Tây' });
    expect(cungPhi('nu', 2025)).toEqual({ cung: 'Tốn', nhom: 'Đông' });
    expect(cungPhi('nam', 2014)).toEqual({ cung: 'Tốn', nhom: 'Đông' });
    expect(cungPhi('nu', 2014)).toEqual({ cung: 'Khôn', nhom: 'Tây' });
    // Quy tắc số 5: nam ra 5 -> Khôn (2), nữ ra 5 -> Cấn (8).
    expect(cungPhi('nam', 2004)).toEqual({ cung: 'Khôn', nhom: 'Tây' });
    expect(cungPhi('nu', 1000)).toEqual({ cung: 'Cấn', nhom: 'Tây' });
  });

  it('bát trạch Khảm: đủ 8 hướng, 4 tốt 4 xấu, Sinh Khí Đông Nam', () => {
    const kham = batTrach('Khảm');
    expect(Object.keys(kham).sort()).toEqual(
      ['Bắc', 'Đông', 'Đông Bắc', 'Đông Nam', 'Nam', 'Tây', 'Tây Bắc', 'Tây Nam'].sort(),
    );
    expect(kham['Đông Nam']).toEqual({ sao: 'Sinh Khí', tot: true });
    expect(kham['Đông']).toEqual({ sao: 'Thiên Y', tot: true });
    expect(kham['Nam']).toEqual({ sao: 'Diên Niên', tot: true });
    expect(kham['Bắc']).toEqual({ sao: 'Phục Vị', tot: true });
    expect(Object.values(kham).filter((h) => h.tot)).toHaveLength(4);
    expect(Object.values(kham).filter((h) => !h.tot)).toHaveLength(4);
  });

  it('mọi cung đều song ánh 8 sao / 8 hướng, 4 tốt 4 xấu', () => {
    const allStars = [
      'Sinh Khí',
      'Thiên Y',
      'Diên Niên',
      'Phục Vị',
      'Tuyệt Mệnh',
      'Ngũ Quỷ',
      'Lục Sát',
      'Họa Hại',
    ];
    for (const cung of ['Càn', 'Khảm', 'Cấn', 'Chấn', 'Tốn', 'Ly', 'Khôn', 'Đoài']) {
      const t = batTrach(cung);
      expect(Object.keys(t)).toHaveLength(8);
      expect(Object.values(t).map((h) => h.sao).sort()).toEqual([...allStars].sort());
      expect(Object.values(t).filter((h) => h.tot)).toHaveLength(4);
    }
    expect(batTrach('Càn')['Tây']).toEqual({ sao: 'Sinh Khí', tot: true });
    expect(batTrach('Ly')['Đông']).toEqual({ sao: 'Sinh Khí', tot: true });
    expect(() => batTrach('Không có')).toThrow();
  });
});

describe('Sao ngày (bộ cơ bản)', () => {
  it('sao chỉ cần can chi ngày: Lộc, Quý Nhân, Dương Nhẫn', () => {
    expect(saoNgay('Giáp Dần').tot).toContain('Lộc'); // Giáp lộc tại Dần
    expect(saoNgay('Giáp Mùi').tot).toContain('Thiên Ất Quý Nhân');
    expect(saoNgay('Giáp Mão').xau).toContain('Dương Nhẫn');
    expect(saoNgay('Giáp Dần').xau).not.toContain('Dương Nhẫn');
  });

  it('sao cần tháng âm: Thiên Đức, Nguyệt Đức, Nguyệt Phá', () => {
    expect(saoNgay('Đinh Mão', 1).tot).toContain('Thiên Đức'); // tháng 1 Thiên Đức tại Đinh
    expect(saoNgay('Bính Dần', 1).tot).toContain('Nguyệt Đức'); // tháng 1 Nguyệt Đức tại Bính
    expect(saoNgay('Giáp Thân', 1).xau).toContain('Nguyệt Phá'); // tháng 1 chi Dần, Thân xung Dần
    expect(saoNgay('Giáp Thân').xau).not.toContain('Nguyệt Phá'); // không truyền tháng thì không tính
  });
});

describe('Thần số học, chấm điểm tên, luận số', () => {
  it('số chủ đạo: cộng rút gọn, giữ master 11, 22', () => {
    expect(thanSoHoc(25, 5, 2025).soChuDao).toBe(3); // 2+5+0+5+2+0+2+5=21 -> 3
    expect(thanSoHoc(2, 2, 2005).soChuDao).toBe(11); // tổng chữ số = 11
    expect(thanSoHoc(9, 9, 2002).soChuDao).toBe(22); // tổng chữ số = 22
    expect(thanSoHoc(25, 5, 2025).giaiThich).toMatch(/Số 3/);
  });

  it('chấm điểm tên: xác định, trong thang 0-100', () => {
    // "Nguyễn Văn An": số tên 48 -> 3 (Mộc); mệnh Kim khắc Mộc -> 25 + 10 = 35.
    expect(chamDiemTen('Nguyễn', 'Văn An', 'Kim')).toMatchObject({
      diem: 35,
      nguHanh: 'Mộc',
    });
    // "Lê An": số tên 14 -> 5 (Thổ); Thổ sinh Kim -> 70 + 10 = 80.
    expect(chamDiemTen('Lê', 'An', 'Kim')).toMatchObject({
      diem: 80,
      nguHanh: 'Thổ',
    });
    expect(chamDiemTen('Lê', 'An', 'Kim').giaiThich).toMatch(/mô hình đơn giản/);
    expect(() => chamDiemTen('Lê', 'An', 'Không rõ')).toThrow();
  });

  it('luận số: tổng nút theo quy ước 10 -> 1, hành chủ đạo theo số lượng', () => {
    expect(luanSo('0987654321').tongNut).toBe(9); // tổng 45 -> 9
    expect(luanSo('0987654321').nguHanhChuDao).toBe('Thổ'); // 2,5,8 = 3 chữ số
    expect(luanSo('19').tongNut).toBe(1); // tổng 10 -> 1 (quy ước)
    expect(luanSo('111').tongNut).toBe(3);
    expect(luanSo('111').nguHanhChuDao).toBe('Thủy');
    expect(() => luanSo('abc')).toThrow();
  });
});

describe('getTodayInfo', () => {
  it('quy đúng về giờ Việt Nam và trả đủ trường (mốc 17/06/2025)', () => {
    const info = getTodayInfo(new Date('2025-06-17T12:00:00+07:00'));
    expect(info.solar).toEqual({ y: 2025, m: 6, d: 17 });
    expect(info.lunar).toEqual({ day: 22, month: 5, year: 2025, leap: false });
    expect(info.canChi).toEqual({
      nam: 'Ất Tỵ',
      thang: 'Nhâm Ngọ',
      ngay: 'Đinh Tỵ',
    });
    expect(info.hoangDao).toHaveLength(12);
    expect(info.hoangDao.filter((g) => g.hoangDao)).toHaveLength(6);
  });

  it('mốc UTC nửa đêm vẫn ra đúng ngày Việt Nam', () => {
    // 2025-06-16T18:00:00Z = 2025-06-17 01:00 giờ Việt Nam.
    const info = getTodayInfo(new Date('2025-06-16T18:00:00Z'));
    expect(info.solar).toEqual({ y: 2025, m: 6, d: 17 });
  });
});
