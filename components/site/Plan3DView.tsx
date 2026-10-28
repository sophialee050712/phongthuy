// Render 3D v2 cho mặt bằng vẽ tay: tường bao chia đoạn theo khe cửa chính +
// cửa sổ, vách ngăn giữa phòng kề nhau, kính cửa sổ, đồ nội thất theo hình
// phòng thật (không còn lưới 3×3). Tái dùng khung renderer của BoTri3DView:
// renderer/camera tạo một lần, đổi phương án chỉ vẽ lại nhóm vật thể.
'use client';

import { useEffect, useRef, useState } from 'react';
import {
  perimeterWalls,
  partitionWalls,
  windowGaps,
  type RoomRect,
} from '@/lib/plan3d';
import { doorPosition, type DoorWall } from '@/lib/boTri3d';
import { buildRoomFurniture } from './boTri3dFurniture';

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

type Props = {
  rooms: RoomRect[];
  facade: number;
  depth: number;
  height: number;
  doorWall: DoorWall;
  doorDistance: number;
};

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

export default function Plan3DView({ rooms, facade, depth, height, doorWall, doorDistance }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [webglFailed, setWebglFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const propsRef = useRef({ rooms, facade, depth, height, doorWall, doorDistance });
  propsRef.current = { rooms, facade, depth, height, doorWall, doorDistance };
  const syncRef = useRef<(() => void) | null>(null);
  const zoomRef = useRef<((f: number) => void) | null>(null);
  const resetViewRef = useRef<(() => void) | null>(null);

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
        scene.background = new THREE.Color('#EDE4D0');
        const camera = new THREE.PerspectiveCamera(50, mount.clientWidth / 420, 0.1, 500);
        const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
        renderer.setSize(mount.clientWidth, 420);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        mount.appendChild(renderer.domElement);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.enableDamping = true;
        controls.dampingFactor = 0.08;
        controls.minDistance = 3;
        controls.maxPolarAngle = 1.15;
        scene.add(new THREE.AmbientLight('#ffffff', 0.9));
        const sun = new THREE.DirectionalLight('#ffffff', 0.8);
        sun.castShadow = true;
        scene.add(sun);

        let dynamic: import('three').Group | null = null;
        const makeSprite = (text: string, sub: string, scaleW: number) => {
          const tex = new THREE.CanvasTexture(drawLabelCanvas(text, sub));
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.anisotropy = 4;
          const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
          sprite.scale.set(scaleW, scaleW * (160 / 512), 1);
          return sprite;
        };

        const sync = () => {
          const { rooms: R, facade: F, depth: D, height: H, doorWall: DW, doorDistance: DD } = propsRef.current;
          if (dynamic) {
            scene.remove(dynamic);
            dynamic.traverse((obj) => {
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
          const g = new THREE.Group();
          const toX = (mx: number) => mx - F / 2;
          const toZ = (my: number) => my - D / 2;
          const spanMax = Math.max(F, D);

          const floor = new THREE.Mesh(
            new THREE.PlaneGeometry(F, D),
            new THREE.MeshStandardMaterial({ color: '#F3ECE1' }),
          );
          floor.rotation.x = -Math.PI / 2;
          floor.receiveShadow = true;
          g.add(floor);
          const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(spanMax * 4, spanMax * 4),
            new THREE.MeshStandardMaterial({ color: '#D9D2BE' }),
          );
          ground.rotation.x = -Math.PI / 2;
          ground.position.y = -0.02;
          ground.receiveShadow = true;
          g.add(ground);

          sun.position.set(spanMax, spanMax * 1.4, spanMax);
          sun.shadow.camera.left = -spanMax;
          sun.shadow.camera.right = spanMax;
          sun.shadow.camera.top = spanMax;
          sun.shadow.camera.bottom = -spanMax;
          sun.shadow.camera.updateProjectionMatrix();

          const windows = windowGaps(R, F, D);
          const wallMat = new THREE.MeshStandardMaterial({ color: '#7B1E1E' });
          const partMat = new THREE.MeshStandardMaterial({ color: '#A67C52' });
          const wallT = 0.15;
          function wallMesh(
            orient: 'h' | 'v',
            fixed: number,
            from: number,
            to: number,
            h: number,
            mat: import('three').Material,
            thick: number,
          ) {
            if (to - from <= 0.01) return;
            const len = to - from;
            const geo =
              orient === 'h' ? new THREE.BoxGeometry(len, h, thick) : new THREE.BoxGeometry(thick, h, len);
            const mesh = new THREE.Mesh(geo, mat);
            if (orient === 'h') mesh.position.set(toX((from + to) / 2), h / 2, toZ(fixed));
            else mesh.position.set(toX(fixed), h / 2, toZ((from + to) / 2));
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            g.add(mesh);
          }
          // Tường bao chia đoạn theo cửa chính + cửa sổ.
          for (const w of perimeterWalls({ facade: F, depth: D, doorWall: DW, doorDistance: DD, windows })) {
            wallMesh(w.orient, w.fixed, w.from, w.to, H, wallMat, wallT);
          }
          // Vách ngăn giữa phòng kề nhau (đã chừa lối đi trong lib).
          for (const w of partitionWalls(R)) {
            wallMesh(w.orient, w.fixed, w.from, w.to, H, partMat, 0.1);
          }
          // Kính cửa sổ: tấm xanh nhạt trong khe cửa sổ.
          const glassMat = new THREE.MeshStandardMaterial({ color: '#BFE3F0', transparent: true, opacity: 0.6 });
          for (const win of windows) {
            const len = win.to - win.from;
            const mid = (win.from + win.to) / 2;
            if (win.wall === 'sau' || win.wall === 'truoc') {
              const pane = new THREE.Mesh(new THREE.BoxGeometry(len, 1.2, 0.06), glassMat);
              pane.position.set(toX(mid), 1.5, toZ(win.wall === 'sau' ? 0 : D));
              g.add(pane);
            } else {
              const pane = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.2, len), glassMat);
              pane.position.set(toX(win.wall === 'trai' ? 0 : F), 1.5, toZ(mid));
              g.add(pane);
            }
          }
          // Cửa chính: phiến vàng + nhãn.
          const door = doorPosition(DW, DD, D, F);
          const doorMarker = new THREE.Mesh(
            new THREE.BoxGeometry(DW === 'truoc' || DW === 'sau' ? 1 : 0.2, 0.25, DW === 'truoc' || DW === 'sau' ? 0.2 : 1),
            new THREE.MeshStandardMaterial({ color: '#C9A227' }),
          );
          doorMarker.position.set(toX(door.x), 0.15, toZ(door.y));
          g.add(doorMarker);
          const doorLabel = makeSprite('CỬA', '', 1.6);
          doorLabel.position.set(toX(door.x), H + 0.7, toZ(door.y));
          g.add(doorLabel);
          const northLabel = makeSprite('BẮC ↑', '', 2.4);
          northLabel.position.set(0, H + 0.9, toZ(0) - 0.6);
          g.add(northLabel);

          // Từng phòng: thảm sàn màu riêng + đồ nội thất theo hình thật + nhãn trên đỉnh tường.
          R.forEach((r, i) => {
            const cx = toX(r.x + r.w / 2);
            const cz = toZ(r.y + r.d / 2);
            const pad = new THREE.Mesh(
              new THREE.BoxGeometry(Math.max(r.w - 0.12, 0.3), 0.1, Math.max(r.d - 0.12, 0.3)),
              new THREE.MeshStandardMaterial({ color: ROOM_COLORS[i % ROOM_COLORS.length], transparent: true, opacity: 0.35 }),
            );
            pad.position.set(cx, 0.05, cz);
            pad.receiveShadow = true;
            g.add(pad);
            const furniture = buildRoomFurniture(THREE, r.room, Math.max(r.w - 0.12, 0.3), Math.max(r.d - 0.12, 0.3));
            furniture.position.set(cx, 0.1, cz);
            g.add(furniture);
            const sprite = makeSprite(r.room, `${r.w} × ${r.d} m`, Math.min(Math.max(r.w * 1.2, 2.6), 4.5));
            sprite.position.set(cx, H + 0.7 + (i % 2) * 0.8, cz);
            g.add(sprite);
          });

          scene.add(g);
          dynamic = g;

          const aspect = mount.clientWidth / 420;
          const pullback = aspect < 1 ? Math.min(1.8, 1 / Math.sqrt(aspect)) : 1;
          const dd = Math.max(F, D);
          camera.aspect = aspect;
          camera.position.set(dd * 0.6 * pullback, dd * 1.3 * pullback, dd * 0.6 * pullback);
          controls.maxDistance = Math.max(F, D) * 4 * pullback;
          camera.updateProjectionMatrix();
          controls.update();
        };
        syncRef.current = sync;
        sync();
        zoomRef.current = (f: number) => {
          camera.position.multiplyScalar(f);
          controls.update();
        };
        resetViewRef.current = () => {
          const { facade: F2, depth: D2 } = propsRef.current;
          const aspect2 = mount.clientWidth / 420;
          const pullback2 = aspect2 < 1 ? Math.min(1.8, 1 / Math.sqrt(aspect2)) : 1;
          const dd2 = Math.max(F2, D2);
          camera.position.set(dd2 * 0.6 * pullback2, dd2 * 1.3 * pullback2, dd2 * 0.6 * pullback2);
          controls.update();
        };

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
      syncRef.current = null;
    };
  }, [webglFailed]);

  useEffect(() => {
    syncRef.current?.();
  }, [rooms, facade, depth, height, doorWall, doorDistance]);

  if (webglFailed) {
    return (
      <p className="card text-sm">
        Trình duyệt không hỗ trợ WebGL nên không hiển thị được khung 3D. Hãy xem sơ đồ 2D ở trên hoặc
        thử trình duyệt khác.
      </p>
    );
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
        <div className="absolute right-2 top-2 z-10 flex gap-1">
          <button type="button" aria-label="Phóng to" className="rounded bg-white/90 px-2 py-1 text-base font-bold text-primary shadow" onClick={() => zoomRef.current?.(0.85)}>
            ＋
          </button>
          <button type="button" aria-label="Thu nhỏ" className="rounded bg-white/90 px-2 py-1 text-base font-bold text-primary shadow" onClick={() => zoomRef.current?.(1.18)}>
            －
          </button>
          <button type="button" aria-label="Về góc nhìn mặc định" className="rounded bg-white/90 px-2 py-1 text-base font-bold text-primary shadow" onClick={() => resetViewRef.current?.()}>
            ⟲
          </button>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink/70">
        Kéo để xoay, bấm ＋ ／ － để zoom. Tường đỏ sẫm là tường bao (có khe cửa chính vàng và kính
        cửa sổ xanh), tường nâu nhạt là vách ngăn giữa các phòng (có chừa lối đi). Nhãn phòng đặt
        trên đỉnh tường để không bị che.
      </p>
    </div>
  );
}
