'use client';

// Khung nhìn 3D thật bằng Three.js cho /bo-tri-3d: sàn đúng dài × rộng,
// tường cao đúng chiều cao trần, mỗi phòng là một khối màu có nhãn, tường
// có khe cửa đúng vị trí người dùng nhập. Xoay + zoom bằng OrbitControls.
// Nếu WebGL không khởi tạo được thì tự rơi về khung nhìn CSS 3D (preserve-3d,
// kéo để xoay) — không bao giờ dùng ảnh tĩnh thay thế.
import { useEffect, useRef, useState } from 'react';
import type { OptimizedLayout } from '@/lib/boTri3d';
import { doorPosition } from '@/lib/boTri3d';

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

function labelTexture(text: string, sub: string): string {
  // Vẽ nhãn lên canvas rồi dùng làm texture — chạy phía client nên an toàn.
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(250,246,239,0.95)';
  ctx.fillRect(0, 0, 512, 160);
  ctx.fillStyle = '#7B1E1E';
  ctx.font = 'bold 44px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, 256, 62);
  ctx.fillStyle = '#2C1810';
  ctx.font = '32px sans-serif';
  ctx.fillText(sub, 256, 118);
  return canvas.toDataURL();
}

function Css3DFallback({ layout, length, width, height }: Props) {
  const [rot, setRot] = useState(35);
  const [tilt] = useState(58);
  const drag = useRef<{ x: number; rot: number } | null>(null);
  const cellW = 100 / 3;
  const cellH = 100 / 3;
  return (
    <div
      className="relative overflow-hidden rounded-lg border border-gold/40 bg-creamDark"
      style={{ height: 420, perspective: 900, touchAction: 'none', cursor: 'grab' }}
      onPointerDown={(e) => {
        drag.current = { x: e.clientX, rot };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        if (drag.current) setRot(drag.current.rot + (e.clientX - drag.current.x) * 0.4);
      }}
      onPointerUp={() => {
        drag.current = null;
      }}
    >
      <p className="absolute left-2 top-2 z-10 rounded bg-white/90 px-2 py-1 text-xs font-semibold">
        Chế độ CSS 3D (trình duyệt không hỗ trợ WebGL) — kéo ngang để xoay
      </p>
      <div
        className="absolute left-1/2 top-1/2"
        style={{
          width: 340,
          height: 340 * (width / length),
          transform: `translate(-50%, -50%) rotateX(${tilt}deg) rotateZ(${rot}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {layout.assignments.map((a, i) => (
          <div
            key={a.room}
            className="absolute flex flex-col items-center justify-center border border-white/70 p-1 text-center"
            style={{
              left: `${a.col * cellW}%`,
              top: `${a.row * cellH}%`,
              width: `${cellW}%`,
              height: `${cellH}%`,
              background: ROOM_COLORS[i % ROOM_COLORS.length],
              color: '#fff',
              transform: 'translateZ(18px)',
              transformStyle: 'preserve-3d',
            }}
          >
            <span className="text-[11px] font-bold leading-tight">{a.room}</span>
            <span className="text-[10px] leading-tight">
              {a.direction} · {a.sao}
            </span>
          </div>
        ))}
        <div
          className="absolute z-10 flex items-center justify-center bg-gold text-[11px] font-bold text-primary"
          style={{
            left: `${(doorPosition(layout.door.wall, layout.door.distance, length, width).x / length) * 100 - 4}%`,
            top: `${(doorPosition(layout.door.wall, layout.door.distance, length, width).y / width) * 100 - 4}%`,
            width: '8%',
            height: '8%',
            transform: 'translateZ(22px)',
          }}
        >
          CỬA
        </div>
      </div>
      <p className="absolute bottom-2 left-2 text-xs text-ink/70">
        Dài {length} m × rộng {width} m × cao {height} m · Bắc ở phía trên sơ đồ gốc.
      </p>
    </div>
  );
}

type Props = {
  layout: OptimizedLayout;
  length: number;
  width: number;
  height: number;
};

export default function BoTri3DView({ layout, length, width, height }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || webglFailed) return;
    let cancelled = false;
    let renderer: import('three').WebGLRenderer | null = null;
    let controls: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls | null = null;
    let raf = 0;
    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (cancelled || !mount) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#FAF6EF');
        const camera = new THREE.PerspectiveCamera(
          50,
          mount.clientWidth / 420,
          0.1,
          500,
        );
        camera.position.set(length * 0.9, Math.max(length, width) * 0.9, width * 0.9);
        renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(mount.clientWidth, 420);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);
        controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.minDistance = 3;
        controls.maxDistance = Math.max(length, width) * 4;
        controls.maxPolarAngle = Math.PI / 2 - 0.05;
        controls.update();

        const L = length;
        const W = width;
        const H = height;
        const toX = (mx: number) => mx - L / 2; // mét Đông: 0 = mép Tây
        const toZ = (my: number) => my - W / 2; // mét Nam: 0 = mép Bắc

        // Sàn.
        const floor = new THREE.Mesh(
          new THREE.PlaneGeometry(L, W),
          new THREE.MeshStandardMaterial({ color: '#F3ECE1' }),
        );
        floor.rotation.x = -Math.PI / 2;
        scene.add(floor);

        // Lưới ô 3×3 mờ trên sàn.
        const grid = new THREE.GridHelper(
          Math.max(L, W),
          1,
          '#C9A227',
          '#C9A227',
        );
        grid.visible = false;
        scene.add(grid);
        const cellGeo = new THREE.PlaneGeometry(L / 3 - 0.06, W / 3 - 0.06);
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = new THREE.Mesh(
              cellGeo,
              new THREE.MeshStandardMaterial({
                color: '#E5C158',
                transparent: true,
                opacity: 0.12,
              }),
            );
            cell.rotation.x = -Math.PI / 2;
            cell.position.set(
              toX((c + 0.5) * (L / 3)),
              0.01,
              toZ((r + 0.5) * (W / 3)),
            );
            scene.add(cell);
          }
        }

        // Tường bao, có khe cửa 1 m đúng vị trí người dùng nhập.
        const wallMat = new THREE.MeshStandardMaterial({ color: '#7B1E1E' });
        const wallT = 0.15;
        const gap = 1;
        const door = doorPosition(layout.door.wall, layout.door.distance, L, W);
        function wallRun(
          horizontal: boolean,
          fixed: number,
          from: number,
          to: number,
        ) {
          if (to - from <= 0.01) return;
          const len = to - from;
          const geo = horizontal
            ? new THREE.BoxGeometry(len, H, wallT)
            : new THREE.BoxGeometry(wallT, H, len);
          const mesh = new THREE.Mesh(geo, wallMat);
          if (horizontal) mesh.position.set(toX((from + to) / 2), H / 2, toZ(fixed));
          else mesh.position.set(toX(fixed), H / 2, toZ((from + to) / 2));
          scene.add(mesh);
        }
        const along = (wall: string) => (wall === 'truoc' || wall === 'sau' ? door.x : door.y);
        const span = (wall: string) => (wall === 'truoc' || wall === 'sau' ? L : W);
        const walls: { horizontal: boolean; fixed: number; wall: string }[] = [
          { horizontal: true, fixed: 0, wall: 'sau' },
          { horizontal: true, fixed: W, wall: 'truoc' },
          { horizontal: false, fixed: 0, wall: 'trai' },
          { horizontal: false, fixed: L, wall: 'phai' },
        ];
        for (const w of walls) {
          if (w.wall === layout.door.wall) {
            const c = along(w.wall);
            const s = span(w.wall);
            wallRun(w.horizontal, w.fixed, 0, Math.max(0, c - gap / 2));
            wallRun(w.horizontal, w.fixed, Math.min(s, c + gap / 2), s);
          } else {
            wallRun(w.horizontal, w.fixed, 0, span(w.wall));
          }
        }
        // Đánh dấu cửa bằng một phiến vàng đứng ngay khe cửa.
        const doorMarker = new THREE.Mesh(
          new THREE.BoxGeometry(
            layout.door.wall === 'truoc' || layout.door.wall === 'sau' ? gap : 0.2,
            0.25,
            layout.door.wall === 'truoc' || layout.door.wall === 'sau' ? 0.2 : gap,
          ),
          new THREE.MeshStandardMaterial({ color: '#C9A227' }),
        );
        doorMarker.position.set(toX(door.x), 0.15, toZ(door.y));
        scene.add(doorMarker);

        // Khối từng phòng + nhãn.
        const texLoader = new THREE.TextureLoader();
        layout.assignments.forEach((a, i) => {
          const cw = L / 3 - 0.12;
          const cw2 = W / 3 - 0.12;
          const bh = Math.max(0.6, H * 0.45);
          const box = new THREE.Mesh(
            new THREE.BoxGeometry(cw, bh, cw2),
            new THREE.MeshStandardMaterial({
              color: ROOM_COLORS[i % ROOM_COLORS.length],
              transparent: true,
              opacity: 0.85,
            }),
          );
          box.position.set(
            toX((a.col + 0.5) * (L / 3)),
            bh / 2,
            toZ((a.row + 0.5) * (W / 3)),
          );
          scene.add(box);
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
              map: texLoader.load(labelTexture(a.room, `${a.direction} · ${a.sao}`)),
              transparent: true,
            }),
          );
          sprite.scale.set(Math.min(cw * 1.4, 4.5), Math.min(cw * 1.4, 4.5) * (160 / 512), 1);
          sprite.position.set(box.position.x, bh + 0.5, box.position.z);
          scene.add(sprite);
        });

        scene.add(new THREE.AmbientLight('#ffffff', 0.9));
        const sun = new THREE.DirectionalLight('#ffffff', 0.8);
        sun.position.set(L, H * 3, W);
        scene.add(sun);

        const animate = () => {
          raf = requestAnimationFrame(animate);
          controls?.update();
          renderer?.render(scene, camera);
        };
        animate();

        const onResize = () => {
          if (!mount || !renderer) return;
          camera.aspect = mount.clientWidth / 420;
          camera.updateProjectionMatrix();
          renderer.setSize(mount.clientWidth, 420);
        };
        window.addEventListener('resize', onResize);
        (renderer as unknown as { __cleanup?: () => void }).__cleanup = () =>
          window.removeEventListener('resize', onResize);
      } catch {
        if (!cancelled) setWebglFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      controls?.dispose();
      if (renderer) {
        const cleanup = (renderer as unknown as { __cleanup?: () => void }).__cleanup;
        cleanup?.();
        renderer.dispose();
        renderer.domElement.remove();
      }
    };
  }, [layout, length, width, height, webglFailed]);

  if (webglFailed) {
    return <Css3DFallback layout={layout} length={length} width={width} height={height} />;
  }
  return (
    <div>
      <div ref={mountRef} className="overflow-hidden rounded-lg border border-gold/40" style={{ height: 420 }} />
      <p className="mt-1 text-xs text-ink/70">
        Kéo để xoay, lăn chuột (hoặc chụm tay trên cảm ứng) để zoom. Tường cao {height} m, sàn dài{' '}
        {length} m × rộng {width} m, khe cửa vàng là cửa chính — vị trí cửa giữ nguyên như bạn đã
        nhập, không bị dời.
      </p>
    </div>
  );
}
