'use client';

// Khung nhìn 3D thật bằng Three.js cho /bo-tri-3d: sàn đúng dài × rộng,
// tường cao đúng chiều cao trần, mỗi phòng là một khối màu có nhãn, tường
// có khe cửa đúng vị trí người dùng nhập. Xoay + zoom bằng OrbitControls.
// Mượt: renderer và camera chỉ tạo một lần; khi đổi phương án chỉ vẽ lại
// nhóm vật thể (không tạo lại WebGL context nên không chớp); nhãn vẽ thẳng
// lên CanvasTexture nên không chờ tải ảnh; có màn chờ trong lúc tải three.js.
// Nếu WebGL không khởi tạo được thì tự rơi về khung nhìn CSS 3D (preserve-3d,
// kéo để xoay) — không bao giờ dùng ảnh tĩnh thay thế.
import { useEffect, useRef, useState } from 'react';
import type { OptimizedLayout } from '@/lib/boTri3d';
import { doorPosition, roomFootprint } from '@/lib/boTri3d';

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

function drawLabelCanvas(text: string, sub: string): HTMLCanvasElement {
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
  if (sub) {
    ctx.fillStyle = '#2C1810';
    ctx.font = '32px sans-serif';
    ctx.fillText(sub, 256, 118);
  }
  return canvas;
}

function disposeGroup(group: import('three').Group) {
  group.traverse((obj) => {
    const mesh = obj as import('three').Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    const mats = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
    for (const mat of mats) {
      const m = mat as import('three').MeshStandardMaterial & { map?: import('three').Texture };
      if (m.map) m.map.dispose();
      m.dispose();
    }
    const sprite = obj as import('three').Sprite;
    if (sprite.material?.map) sprite.material.map.dispose();
    if (sprite.material) sprite.material.dispose();
  });
}

function Css3DFallback({ layout, facade, depth, height }: Props) {
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
          height: 340 * (depth / facade),
          transform: `translate(-50%, -50%) rotateX(${tilt}deg) rotateZ(${rot}deg)`,
          transformStyle: 'preserve-3d',
        }}
      >
        {layout.assignments.map((a, i) => {
          const fp = roomFootprint(a.area, facade / 3, depth / 3);
          return (
            <div
              key={a.room}
              className="absolute"
              style={{
                left: `${a.col * cellW}%`,
                top: `${a.row * cellH}%`,
                width: `${cellW}%`,
                height: `${cellH}%`,
                transform: 'translateZ(18px)',
                transformStyle: 'preserve-3d',
              }}
            >
              <div
                className="absolute flex flex-col items-center justify-center border border-white/70 text-center"
                style={{
                  left: '50%',
                  top: '50%',
                  width: `${fp.scale * 100}%`,
                  height: `${fp.scale * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  background: ROOM_COLORS[i % ROOM_COLORS.length],
                  color: '#fff',
                }}
              >
                <span className="text-[11px] font-bold leading-tight">{a.room}</span>
                <span className="text-[10px] leading-tight">
                  {a.direction} · {a.sao}
                </span>
                <span className="text-[10px] leading-tight">{a.area} m²</span>
              </div>
            </div>
          );
        })}
        <div
          className="absolute z-10 flex items-center justify-center bg-gold text-[11px] font-bold text-primary"
          style={{
            left: `${(doorPosition(layout.door.wall, layout.door.distance, depth, facade).x / facade) * 100 - 4}%`,
            top: `${(doorPosition(layout.door.wall, layout.door.distance, depth, facade).y / depth) * 100 - 4}%`,
            width: '8%',
            height: '8%',
            transform: 'translateZ(22px)',
          }}
        >
          CỬA
        </div>
      </div>
      <p className="absolute bottom-2 left-2 text-xs text-ink/70">
        Rộng {facade} m (mặt tiền) × dài {depth} m (chiều sâu) × cao {height} m · Bắc ở phía trên sơ đồ gốc. Khối phòng co
        theo đúng diện tích hiển thị.
      </p>
    </div>
  );
}

type Props = {
  layout: OptimizedLayout;
  facade: number;
  depth: number;
  height: number;
};

type Ctx = {
  THREE: typeof import('three');
  scene: import('three').Scene;
  camera: import('three').PerspectiveCamera;
  renderer: import('three').WebGLRenderer;
  controls: import('three/examples/jsm/controls/OrbitControls.js').OrbitControls;
  dynamic: import('three').Group | null;
};

export default function BoTri3DView({ layout, facade, depth, height }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const ctxRef = useRef<Ctx | null>(null);
  const propsRef = useRef({ layout, facade, depth, height });
  propsRef.current = { layout, facade, depth, height };
  const syncRef = useRef<(() => void) | null>(null);

  // Tạo renderer/camera một lần duy nhất; đổi phương án chỉ vẽ lại nhóm vật thể.
  useEffect(() => {
    const mount = mountRef.current;
    if (!mount || webglFailed) return;
    let cancelled = false;
    let cleanup: (() => void) | null = null;
    (async () => {
      try {
        const THREE = await import('three');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        if (cancelled || !mount) return;
        const scene = new THREE.Scene();
        scene.background = new THREE.Color('#FAF6EF');
        const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / 420, 0.1, 500);
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(mount.clientWidth, 420);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        mount.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 3;
        // Giới hạn góc nhìn từ trên xuống để tường bao không che mất phòng bên trong.
        controls.maxPolarAngle = 1.15;
        scene.add(new THREE.AmbientLight('#ffffff', 0.9));
        const sun = new THREE.DirectionalLight('#ffffff', 0.8);
        sun.position.set(30, 40, 30);
        scene.add(sun);

        const ctx: Ctx = { THREE, scene, camera, renderer, controls, dynamic: null };
        ctxRef.current = ctx;

        const makeSprite = (text: string, sub: string, scaleW: number) => {
          const tex = new THREE.CanvasTexture(drawLabelCanvas(text, sub));
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({ map: tex, transparent: true }),
          );
          sprite.scale.set(scaleW, scaleW * (160 / 512), 1);
          return sprite;
        };

        const sync = () => {
          const { layout: L0, facade: F, depth: D, height: H } = propsRef.current;
          if (ctx.dynamic) {
            scene.remove(ctx.dynamic);
            disposeGroup(ctx.dynamic);
          }
          const g = new THREE.Group();
          const toX = (mx: number) => mx - F / 2; // mét Đông: 0 = mép Tây
          const toZ = (my: number) => my - D / 2; // mét Nam: 0 = mép Bắc

          // Sàn đúng mặt tiền × chiều sâu.
          const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(F, D),
            new THREE.MeshStandardMaterial({ color: '#F3ECE1' }),
          );
          floor.rotation.x = -Math.PI / 2;
          g.add(floor);

          // Ô 3×3 mờ trên sàn.
          const cellGeo = new THREE.PlaneGeometry(F / 3 - 0.06, D / 3 - 0.06);
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
              cell.position.set(toX((c + 0.5) * (F / 3)), 0.01, toZ((r + 0.5) * (D / 3)));
              g.add(cell);
            }
          }

          // Tường bao, có khe cửa 1 m đúng vị trí người dùng nhập.
          const wallMat = new THREE.MeshStandardMaterial({ color: '#7B1E1E' });
          const wallT = 0.15;
          const gap = 1;
          const door = doorPosition(L0.door.wall, L0.door.distance, D, F);
          function wallRun(horizontal: boolean, fixed: number, from: number, to: number) {
            if (to - from <= 0.01) return;
            const len = to - from;
            const geo = horizontal
              ? new THREE.BoxGeometry(len, H, wallT)
              : new THREE.BoxGeometry(wallT, H, len);
            const mesh = new THREE.Mesh(geo, wallMat);
            if (horizontal) mesh.position.set(toX((from + to) / 2), H / 2, toZ(fixed));
            else mesh.position.set(toX(fixed), H / 2, toZ((from + to) / 2));
            g.add(mesh);
          }
          const along = (wall: string) => (wall === 'truoc' || wall === 'sau' ? door.x : door.y);
          const span = (wall: string) => (wall === 'truoc' || wall === 'sau' ? F : D);
          const walls: { horizontal: boolean; fixed: number; wall: string }[] = [
            { horizontal: true, fixed: 0, wall: 'sau' },
            { horizontal: true, fixed: D, wall: 'truoc' },
            { horizontal: false, fixed: 0, wall: 'trai' },
            { horizontal: false, fixed: F, wall: 'phai' },
          ];
          for (const w of walls) {
            if (w.wall === L0.door.wall) {
              const c = along(w.wall);
              const s = span(w.wall);
              wallRun(w.horizontal, w.fixed, 0, Math.max(0, c - gap / 2));
              wallRun(w.horizontal, w.fixed, Math.min(s, c + gap / 2), s);
            } else {
              wallRun(w.horizontal, w.fixed, 0, span(w.wall));
            }
          }
          // Đánh dấu cửa bằng phiến vàng đứng ngay khe cửa + nhãn CỬA.
          const doorMarker = new THREE.Mesh(
            new THREE.BoxGeometry(
              L0.door.wall === 'truoc' || L0.door.wall === 'sau' ? gap : 0.2,
              0.25,
              L0.door.wall === 'truoc' || L0.door.wall === 'sau' ? 0.2 : gap,
            ),
            new THREE.MeshStandardMaterial({ color: '#C9A227' }),
          );
          doorMarker.position.set(toX(door.x), 0.15, toZ(door.y));
          g.add(doorMarker);
          const doorLabel = makeSprite('CỬA', L0.door.direction, 1.6);
          doorLabel.position.set(toX(door.x), 0.85, toZ(door.y));
          g.add(doorLabel);

          // Chỉ hướng Bắc để đọc được hướng trong khung 3D.
          const northLabel = makeSprite('BẮC ↑', '', 2.4);
          northLabel.position.set(0, H + 0.9, toZ(0) - 0.6);
          g.add(northLabel);

          // Khối từng phòng: chân đế co đúng theo diện tích hiển thị (giữ tỷ
          // lệ khung ô), đặt giữa ô hướng của nó; nhãn vẽ trực tiếp, không chờ tải.
          L0.assignments.forEach((a, i) => {
            const fp = roomFootprint(a.area, F / 3, D / 3);
            const bw = Math.max(fp.w - 0.12, 0.3);
            const bd = Math.max(fp.h - 0.12, 0.3);
            const bh = Math.max(0.6, H * 0.45);
            const box = new THREE.Mesh(
              new THREE.BoxGeometry(bw, bh, bd),
              new THREE.MeshStandardMaterial({
                color: ROOM_COLORS[i % ROOM_COLORS.length],
                transparent: true,
                opacity: 0.85,
              }),
            );
            box.position.set(toX((a.col + 0.5) * (F / 3)), bh / 2, toZ((a.row + 0.5) * (D / 3)));
            g.add(box);
            const sprite = makeSprite(
              a.room,
              `${a.direction} · ${a.sao}`,
              // Nhãn không bao giờ vượt chiều rộng ô của nó: nhà nhỏ + nhiều
              // phòng thì nhãn chỉ co lại chứ không chồng lên nhau che mất khối.
              Math.min(fp.w, 4.5),
            );
            sprite.position.set(box.position.x, bh + 0.5, box.position.z);
            g.add(sprite);
          });

          scene.add(g);
          ctx.dynamic = g;

          // Camera: màn hẹp thì lùi ra để không bị cắt nhà.
          const aspect = mount.clientWidth / 420;
          const pullback = aspect < 1 ? Math.min(1.8, 1 / Math.sqrt(aspect)) : 1;
          camera.aspect = aspect;
          camera.position.set(F * 0.9 * pullback, Math.max(F, D) * 0.9 * pullback, D * 0.9 * pullback);
          controls.maxDistance = Math.max(F, D) * 4 * pullback;
          camera.updateProjectionMatrix();
          controls.update();
        };
        syncRef.current = sync;
        sync();

        const onResize = () => {
          camera.aspect = mount.clientWidth / 420;
          camera.updateProjectionMatrix();
          renderer.setSize(mount.clientWidth, 420);
        };
        window.addEventListener('resize', onResize);
        let raf = 0;
        let firstFrame = false;
        const animate = () => {
          raf = requestAnimationFrame(animate);
          controls.update();
          renderer.render(scene, camera);
          if (!firstFrame) {
            firstFrame = true;
            setLoading(false);
          }
        };
        animate();
        cleanup = () => {
          window.removeEventListener('resize', onResize);
          cancelAnimationFrame(raf);
          controls.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch {
        if (!cancelled) setWebglFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      cleanup?.();
      cleanup = null;
      ctxRef.current = null;
      syncRef.current = null;
    };
  }, [webglFailed]);

  // Đổi phương án chỉ vẽ lại nhóm vật thể, renderer giữ nguyên nên không chớp.
  useEffect(() => {
    syncRef.current?.();
  }, [layout, facade, depth, height]);

  if (webglFailed) {
    return <Css3DFallback layout={layout} facade={facade} depth={depth} height={height} />;
  }
  return (
    <div>
      <div className="relative">
        <div ref={mountRef} className="overflow-hidden rounded-lg border border-gold/40" style={{ height: 420 }} />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center rounded-lg border border-gold/40 bg-cream/80 text-sm font-semibold text-primary">
            Đang tải khung 3D…
          </div>
        )}
      </div>
      <p className="mt-1 text-xs text-ink/70">
        Kéo để xoay, lăn chuột (hoặc chụm tay trên cảm ứng) để zoom. Tường cao {height} m, sàn rộng {facade} m (mặt tiền) × dài {depth} m (chiều sâu), khe cửa vàng là cửa chính — vị trí cửa giữ nguyên như bạn đã
        nhập, không bị dời. Nhãn “BẮC ↑” chỉ hướng Bắc; khối phòng co đúng theo diện tích hiển thị
        nên phòng lớn nhìn lớn hơn phòng nhỏ.
      </p>
    </div>
  );
}
