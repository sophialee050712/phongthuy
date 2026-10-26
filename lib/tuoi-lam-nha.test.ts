// Unit test cho tuổi làm nhà (ý 4): công thức đã đối chiếu bảng 2023 đầy đủ.
import { describe, it, expect } from 'vitest';
import {
  tuoiMu,
  kimLau,
  hoangOc,
  tamTai,
  tuoiLamNha,
  quanHeMenh,
  cungTamHop,
} from './tuoi-lam-nha';

describe('tuoiMu: ví dụ AVACO', () => {
  it('năm xây − năm sinh dương lịch + 1', () => {
    expect(tuoiMu(1985, 2026)).toBe(42);
    expect(tuoiMu(1990, 2026)).toBe(37);
    expect(tuoiMu(1975, 2026)).toBe(52);
  });
});

describe('kimLau', () => {
  it('dư 1 Thân, 3 Thê, 6 Tử, 8 Lục Súc; còn lại không phạm', () => {
    expect(kimLau(37)).toEqual({ pham: true, loai: 'Thân', du: 1 });
    expect(kimLau(42)).toEqual({ pham: true, loai: 'Tử', du: 6 });
    expect(kimLau(40)).toEqual({ pham: false });
    expect(kimLau(52)).toEqual({ pham: false });
    // Bảng mytour 2023: 1953 → tuổi 71, dư 8 Lục Súc.
    expect(kimLau(tuoiMu(1953, 2023))).toEqual({ pham: true, loai: 'Lục Súc', du: 8 });
  });
});

describe('hoangOc', () => {
  it('mốc chục 10→1, 20→2, 30→3, 40→4, 50→5, 60→6, 70→1', () => {
    expect(hoangOc(10)).toEqual({ xet: true, cung: 1, ten: 'Nhất Cát', tot: true });
    expect(hoangOc(20)).toEqual({ xet: true, cung: 2, ten: 'Nhị Nghi', tot: true });
    expect(hoangOc(30)).toEqual({ xet: true, cung: 3, ten: 'Tam Địa Sát', tot: false });
    expect(hoangOc(40)).toEqual({ xet: true, cung: 4, ten: 'Tứ Tấn Tài', tot: true });
    expect(hoangOc(50)).toEqual({ xet: true, cung: 5, ten: 'Ngũ Thọ Tử', tot: false });
    expect(hoangOc(60)).toEqual({ xet: true, cung: 6, ten: 'Lục Hoang Ốc', tot: false });
    expect(hoangOc(70)).toEqual({ xet: true, cung: 1, ten: 'Nhất Cát', tot: true });
  });

  it('ví dụ khamphalichsu: 32 tuổi → Ngũ Thọ Tử (xấu)', () => {
    expect(hoangOc(32)).toEqual({ xet: true, cung: 5, ten: 'Ngũ Thọ Tử', tot: false });
  });

  it('dưới 10 tuổi không xét', () => {
    expect(hoangOc(9)).toEqual({ xet: false });
  });

  it('bảng mytour 2023: các tuổi Hoang Ốc đều rơi cung xấu', () => {
    for (const ns of [1955, 1958, 1959, 1961, 1964, 1967, 1968, 1970, 1973, 1974, 1976, 1977, 1979, 1982, 1983, 1985, 1986, 1988, 1991, 1992, 1994, 1995, 1997, 2000, 2001, 2003, 2006]) {
      const ho = hoangOc(tuoiMu(ns, 2023));
      expect(ho.xet).toBe(true);
      if (ho.xet) expect(ho.tot).toBe(false);
    }
  });
});

describe('tamTai', () => {
  it('4 nhóm Tam Hợp và năm thứ trong chu kỳ', () => {
    expect(tamTai('Thân', 'Mão')).toEqual({ pham: true, nhom: ['Thân', 'Tý', 'Thìn'], namThu: 2 });
    expect(tamTai('Hợi', 'Ngọ')).toEqual({ pham: true, nhom: ['Hợi', 'Mão', 'Mùi'], namThu: 2 });
    expect(tamTai('Hợi', 'Tỵ')).toEqual({ pham: true, nhom: ['Hợi', 'Mão', 'Mùi'], namThu: 1 });
    expect(tamTai('Hợi', 'Mùi')).toEqual({ pham: true, nhom: ['Hợi', 'Mão', 'Mùi'], namThu: 3 });
    expect(tamTai('Ngọ', 'Mão')).toEqual({ pham: false });
    expect(tamTai('Dậu', 'Tý')).toEqual({ pham: true, nhom: ['Tỵ', 'Dậu', 'Sửu'], namThu: 2 });
  });
});

describe('tuoiLamNha: bảng mytour 2023 — tuổi thuận phải tốt cả 3 hạn', () => {
  it('1954, 1957, 1963, 1965, 1966, 1975, 1981, 1990, 1993, 1999 đều tốt năm 2023', () => {
    for (const ns of [1954, 1957, 1963, 1965, 1966, 1975, 1981, 1990, 1993, 1999]) {
      expect(tuoiLamNha(ns, 2023).tot).toBe(true);
    }
  });

  it('1985 làm nhà 2026: tuổi 42, Kim Lâu Tử nên kết luận chung là không tốt', () => {
    const kq = tuoiLamNha(1985, 2026);
    expect(kq.tuoi).toBe(42);
    expect(kq.kimLau).toEqual({ pham: true, loai: 'Tử', du: 6 });
    expect(kq.tot).toBe(false);
  });
});

describe('quanHeMenh và cungTamHop (gợi ý mượn tuổi)', () => {
  it('Kim sinh Thủy, Thổ khắc Thủy, Kim khắc Mộc, cùng hành, rỗng thì bình', () => {
    expect(quanHeMenh('Kim', 'Thủy')).toBe('sinh');
    expect(quanHeMenh('Thổ', 'Thủy')).toBe('khac');
    expect(quanHeMenh('Kim', 'Mộc')).toBe('khac');
    expect(quanHeMenh('Thủy', 'Thủy')).toBe('cung-hanh');
    expect(quanHeMenh('', 'Thủy')).toBe('binh');
  });

  it('cùng nhóm Tam Hợp', () => {
    expect(cungTamHop('Thân', 'Tý')).toBe(true);
    expect(cungTamHop('Thân', 'Mão')).toBe(false);
  });
});
