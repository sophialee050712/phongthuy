// Đồ nội thất low-poly cho khung 3D /bo-tri-3d (ý kiến user 27/10: hộp màu trơn "quá kém").
// Mỗi loại phòng có bộ đồ riêng, dựng bằng hộp/trụ cơ bản, tự co theo diện tích phòng
// nên phòng nhỏ không bị tràn. Chỉ dùng import type của three để tránh kéo three vào
// bundle phía server; hàm nhận THREE từ component (đã dynamic-import sẵn).

type T = typeof import('three');

const WOOD = '#8B5A2B';
const WOOD_DARK = '#5C3A1A';
const WHITE = '#FAF6EF';
const GOLD = '#C9A227';
const RED = '#7B1E1E';
const GREY = '#5B5B5B';

function box(
  THREE: T,
  w: number,
  h: number,
  d: number,
  color: string,
  x: number,
  z: number,
  y = 0,
): import('three').Mesh {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
  );
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  m.receiveShadow = true;
  return m;
}

function cyl(
  THREE: T,
  rTop: number,
  rBottom: number,
  h: number,
  color: string,
  x: number,
  z: number,
  y = 0,
): import('three').Mesh {
  const m = new THREE.Mesh(
    new THREE.CylinderGeometry(rTop, rBottom, h, 16),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6 }),
  );
  m.position.set(x, y + h / 2, z);
  m.castShadow = true;
  return m;
}

/** Ghế đơn giản: mặt ngồi + lưng tựa, đặt tại (x, z), xoay theo rotY (radian). */
function chair(THREE: T, s: number, x: number, z: number, rotY = 0): import('three').Group {
  const g = new THREE.Group();
  g.add(box(THREE, s * 0.45, 0.06, s * 0.45, WOOD, 0, 0, 0.42));
  const back = box(THREE, s * 0.45, 0.5, 0.06, WOOD, 0, -s * 0.2, 0.42);
  g.add(back);
  g.position.set(x, 0, z);
  g.rotation.y = rotY;
  return g;
}

/** Bàn: mặt bàn + 4 chân (gộp thành 1 khối chân cho gọn). */
function table(THREE: T, w: number, d: number, x: number, z: number): import('three').Group {
  const g = new THREE.Group();
  g.add(box(THREE, w, 0.07, d, WOOD, 0, 0, 0.68));
  g.add(box(THREE, w * 0.8, 0.68, d * 0.8, WOOD_DARK, 0, 0, 0));
  g.position.set(x, 0, z);
  return g;
}

function sofa(THREE: T, w: number, d: number, x: number, z: number): import('three').Group {
  const g = new THREE.Group();
  g.add(box(THREE, w, 0.4, d, RED, 0, 0, 0.1));
  g.add(box(THREE, w, 0.55, 0.18, RED, 0, -d / 2 + 0.09, 0.5));
  g.add(box(THREE, 0.18, 0.3, d, RED, -w / 2 + 0.09, 0, 0.5));
  g.add(box(THREE, 0.18, 0.3, d, RED, w / 2 - 0.09, 0, 0.5));
  g.add(box(THREE, w * 0.7, 0.12, d * 0.7, GOLD, 0, 0, 0.5));
  g.position.set(x, 0, z);
  return g;
}

function bed(THREE: T, w: number, d: number, x: number, z: number): import('three').Group {
  const g = new THREE.Group();
  g.add(box(THREE, w, 0.28, d, WOOD_DARK, 0, 0, 0.08));
  g.add(box(THREE, w * 0.92, 0.22, d * 0.92, WHITE, 0, 0, 0.36));
  g.add(box(THREE, w * 0.4, 0.12, d * 0.28, WHITE, -w * 0.22, 0, 0.58));
  g.add(box(THREE, w * 0.4, 0.12, d * 0.28, WHITE, w * 0.22, 0, 0.58));
  g.add(box(THREE, w * 0.9, 0.08, d * 0.45, RED, 0, d * 0.22, 0.58));
  g.position.set(x, 0, z);
  return g;
}

/**
 * Trả về nhóm đồ nội thất cho 1 phòng, vừa trong khung w (ngang) × d (sâu) mét,
 * gốc tọa độ ở tâm phòng. Tên phòng khớp với lib/boTri3d (có alias vệ sinh).
 */
export function buildRoomFurniture(
  THREE: T,
  room: string,
  w: number,
  d: number,
): import('three').Group {
  const g = new THREE.Group();
  const s = Math.max(Math.min(w, d), 0.8); // thước chung, phòng nhỏ thì đồ nhỏ theo
  const cx = 0;
  const cz = 0;

  if (room === 'Phòng khách') {
    const sw = Math.min(w * 0.7, 2.4);
    const sd = Math.min(d * 0.4, 1.0);
    g.add(sofa(THREE, sw, sd, cx, cz + d * 0.22));
    g.add(table(THREE, Math.min(w * 0.5, 1.2), Math.min(d * 0.3, 0.6), cx, cz - d * 0.15));
    g.add(box(THREE, Math.min(w * 0.6, 1.4), 0.45, 0.35, WOOD_DARK, cx, cz - d * 0.38, 0));
  } else if (room === 'Phòng ngủ') {
    const bw = Math.min(w * 0.6, 1.8);
    const bd = Math.min(d * 0.7, 2.1);
    g.add(bed(THREE, bw, bd, cx - w * 0.12, cz));
    g.add(box(THREE, Math.min(w * 0.25, 0.7), 1.8, Math.min(d * 0.4, 0.6), WOOD, cx + w * 0.32, cz, 0));
    g.add(table(THREE, Math.min(w * 0.35, 0.9), Math.min(d * 0.3, 0.5), cx + w * 0.3, cz + d * 0.32));
  } else if (room === 'Bếp') {
    g.add(box(THREE, w * 0.85, 0.9, Math.min(d * 0.35, 0.65), GREY, cx, cz - d * 0.28, 0));
    g.add(box(THREE, w * 0.3, 0.06, Math.min(d * 0.3, 0.55), '#222222', cx - w * 0.2, cz - d * 0.28, 0.9));
    g.add(table(THREE, Math.min(w * 0.55, 1.2), Math.min(d * 0.4, 0.8), cx, cz + d * 0.2));
    g.add(chair(THREE, s, cx - w * 0.28, cz + d * 0.2, Math.PI / 2));
    g.add(chair(THREE, s, cx + w * 0.28, cz + d * 0.2, -Math.PI / 2));
  } else if (room === 'Phòng ăn') {
    g.add(table(THREE, Math.min(w * 0.6, 1.5), Math.min(d * 0.5, 0.9), cx, cz));
    g.add(chair(THREE, s, cx, cz - d * 0.3, 0));
    g.add(chair(THREE, s, cx, cz + d * 0.3, Math.PI));
    g.add(chair(THREE, s, cx - w * 0.3, cz, Math.PI / 2));
    g.add(chair(THREE, s, cx + w * 0.3, cz, -Math.PI / 2));
  } else if (room === 'Phòng thờ') {
    g.add(table(THREE, Math.min(w * 0.6, 1.3), Math.min(d * 0.35, 0.55), cx, cz - d * 0.25));
    g.add(cyl(THREE, 0.04, 0.04, 0.35, GOLD, cx - w * 0.18, cz - d * 0.25, 0.75));
    g.add(cyl(THREE, 0.04, 0.04, 0.35, GOLD, cx + w * 0.18, cz - d * 0.25, 0.75));
    g.add(box(THREE, Math.min(w * 0.4, 0.9), 0.06, Math.min(d * 0.3, 0.5), RED, cx, cz + d * 0.2, 0.02));
  } else if (room === 'Nhà vệ sinh' || room === 'Phòng vệ sinh') {
    g.add(box(THREE, 0.45, 0.4, 0.65, WHITE, cx - w * 0.2, cz, 0));
    g.add(box(THREE, 0.45, 0.55, 0.18, WHITE, cx - w * 0.2, cz - d * 0.3, 0.4));
    g.add(cyl(THREE, 0.28, 0.22, 0.8, WHITE, cx + w * 0.22, cz - d * 0.25, 0));
    g.add(box(THREE, 0.5, 0.1, 0.5, GREY, cx + w * 0.22, cz - d * 0.25, 0.8));
  } else if (room === 'Phòng làm việc') {
    g.add(table(THREE, Math.min(w * 0.6, 1.3), Math.min(d * 0.4, 0.7), cx, cz - d * 0.2));
    g.add(chair(THREE, s, cx, cz + d * 0.15, Math.PI));
    g.add(box(THREE, Math.min(w * 0.3, 0.8), 1.6, 0.3, WOOD, cx + w * 0.32, cz - d * 0.25, 0));
  } else if (room === 'Kho') {
    g.add(box(THREE, Math.min(w * 0.4, 0.9), 0.9, Math.min(d * 0.4, 0.9), WOOD, cx - w * 0.2, cz, 0));
    g.add(box(THREE, Math.min(w * 0.35, 0.8), 0.6, Math.min(d * 0.35, 0.8), GREY, cx + w * 0.22, cz + d * 0.15, 0));
  } else {
    // Phòng chưa có bộ riêng: bàn + ghế cho đỡ trống.
    g.add(table(THREE, Math.min(w * 0.5, 1.0), Math.min(d * 0.4, 0.6), cx, cz));
    g.add(chair(THREE, s, cx, cz + d * 0.28, Math.PI));
  }
  return g;
}
