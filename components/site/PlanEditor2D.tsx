// Trình vẽ mặt bằng 2D cho 3D v2: phòng là hình chữ nhật tự do trên lưới SVG.
// Kéo để dời phòng, ô số để đổi vị trí/kích thước, xem lưới 9 cung mờ để biết
// tâm phòng rơi vào hướng nào. Không dùng thư viện kéo-thả ngoài — pointer
// events thuần để khỏi nặng bundle.
'use client';

import { useRef, useState } from 'react';
import { ZONE_GRID, ALL_ROOMS, doorPosition, type DoorWall } from '@/lib/boTri3d';
import { type RoomRect } from '@/lib/plan3d';

const ROOM_COLORS = [
  '#7B1E1E', '#C9A227', '#2E6B34', '#1F5C8B',
  '#7A4A8C', '#B65A1B', '#5B5B5B', '#0F766E',
];

const SCALE = 40; // px trên mỗi mét trong viewBox (chỉ để chữ đủ lớn)

type Props = {
  facade: number;
  depth: number;
  rooms: RoomRect[];
  onChange: (rooms: RoomRect[]) => void;
  doorWall: DoorWall;
  doorDistance: number;
};

export default function PlanEditor2D({ facade, depth, rooms, onChange, doorWall, doorDistance }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newRoom, setNewRoom] = useState<string>(ALL_ROOMS[0]);
  const dragRef = useRef<{ id: string; startX: number; startY: number; origX: number; origY: number } | null>(null);

  const selected = rooms.find((r) => r.id === selectedId) ?? null;

  function toMeters(e: React.PointerEvent): { mx: number; my: number } {
    const svg = svgRef.current;
    if (!svg) return { mx: 0, my: 0 };
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * facade;
    const my = ((e.clientY - rect.top) / rect.height) * depth;
    return { mx, my };
  }

  function onPointerDown(e: React.PointerEvent, room: RoomRect) {
    const { mx, my } = toMeters(e);
    dragRef.current = { id: room.id, startX: mx, startY: my, origX: room.x, origY: room.y };
    setSelectedId(room.id);
    (e.target as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    const drag = dragRef.current;
    if (!drag) return;
    const { mx, my } = toMeters(e);
    const dx = Math.round((mx - drag.startX) * 10) / 10;
    const dy = Math.round((my - drag.startY) * 10) / 10;
    onChange(
      rooms.map((r) =>
        r.id === drag.id ? { ...r, x: Math.round((drag.origX + dx) * 10) / 10, y: Math.round((drag.origY + dy) * 10) / 10 } : r,
      ),
    );
  }

  function onPointerUp() {
    dragRef.current = null;
  }

  function updateSelected(patch: Partial<RoomRect>) {
    if (!selected) return;
    onChange(rooms.map((r) => (r.id === selected.id ? { ...r, ...patch } : r)));
  }

  function addRoom() {
    // Tìm chỗ trống đầu tiên quét theo bước 0,5 m (ưu tiên góc Tây-Bắc).
    const existingNames = new Set(rooms.map((r) => r.room));
    const name = ALL_ROOMS.find((n) => !existingNames.has(n)) ?? newRoom;
    const w = 3;
    const d = 3;
    let spot: { x: number; y: number } | null = null;
    for (let y = 0; y + d <= depth && !spot; y += 0.5) {
      for (let x = 0; x + w <= facade && !spot; x += 0.5) {
        const clash = rooms.some(
          (r) => Math.min(x + w, r.x + r.w) - Math.max(x, r.x) > 0.01 && Math.min(y + d, r.y + r.d) - Math.max(y, r.y) > 0.01,
        );
        if (!clash) spot = { x, y };
      }
    }
    const id = `room-${Date.now()}`;
    const room: RoomRect = { id, room: name, x: spot ? spot.x : 0, y: spot ? spot.y : 0, w, d };
    onChange([...rooms, room]);
    setSelectedId(id);
  }

  const door = doorPosition(doorWall, doorDistance, depth, facade);
  const doorOnWall = doorWall === 'truoc' || doorWall === 'sau' ? door.x : door.y;

  return (
    <div className="space-y-3">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${facade * SCALE} ${depth * SCALE}`}
        className="w-full rounded-lg border border-gold/40 bg-cream"
        style={{ touchAction: 'none', maxHeight: 480 }}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        {/* Lưới 9 cung mờ + tên hướng (để biết tâm phòng rơi vào cung nào). */}
        {[1, 2].map((i) => (
          <g key={i} stroke="#C9A227" strokeOpacity={0.35} strokeDasharray="6 4">
            <line x1={(facade * SCALE * i) / 3} y1={0} x2={(facade * SCALE * i) / 3} y2={depth * SCALE} />
            <line x1={0} y1={(depth * SCALE * i) / 3} x2={facade * SCALE} y2={(depth * SCALE * i) / 3} />
          </g>
        ))}
        {ZONE_GRID.map((z) => (
          <text
            key={z.direction}
            x={((z.col + 0.5) * facade * SCALE) / 3}
            y={((z.row + 0.5) * depth * SCALE) / 3}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={13}
            fill="#7B1E1E"
            fillOpacity={0.45}
          >
            {z.direction}
          </text>
        ))}
        {/* Tường bao + cửa chính. */}
        <rect x={0} y={0} width={facade * SCALE} height={depth * SCALE} fill="none" stroke="#7B1E1E" strokeWidth={3} />
        {doorWall === 'truoc' || doorWall === 'sau' ? (
          <rect
            x={(doorOnWall - 0.5) * SCALE}
            y={doorWall === 'truoc' ? depth * SCALE - 6 : 0}
            width={SCALE}
            height={12}
            fill="#C9A227"
          />
        ) : (
          <rect
            x={doorWall === 'trai' ? 0 : facade * SCALE - 6}
            y={(doorOnWall - 0.5) * SCALE}
            width={12}
            height={SCALE}
            fill="#C9A227"
          />
        )}
        {rooms.map((r, i) => (
          <g
            key={r.id}
            onPointerDown={(e) => onPointerDown(e, r)}
            style={{ cursor: 'grab' }}
          >
            <rect
              x={r.x * SCALE}
              y={r.y * SCALE}
              width={r.w * SCALE}
              height={r.d * SCALE}
              fill={ROOM_COLORS[i % ROOM_COLORS.length]}
              fillOpacity={0.75}
              stroke={selectedId === r.id ? '#2C1810' : '#FAF6EF'}
              strokeWidth={selectedId === r.id ? 3 : 1.5}
            />
            <text
              x={(r.x + r.w / 2) * SCALE}
              y={(r.y + r.d / 2) * SCALE - 6}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={14}
              fontWeight={700}
              fill="#fff"
              pointerEvents="none"
            >
              {r.room}
            </text>
            <text
              x={(r.x + r.w / 2) * SCALE}
              y={(r.y + r.d / 2) * SCALE + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={12}
              fill="#fff"
              pointerEvents="none"
            >
              {r.w} × {r.d} m
            </text>
          </g>
        ))}
      </svg>
      <p className="text-xs text-ink/70">
        Kéo phòng để dời (lưới 0,1 m). Đường đứt là 9 cung bát trạch — tâm phòng rơi vào cung nào thì
        tính hướng cung đó. Vạch vàng là cửa chính.
      </p>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label" htmlFor="pe-new">Thêm phòng</label>
          <select id="pe-new" className="input" value={newRoom} onChange={(e) => setNewRoom(e.target.value)}>
            {ALL_ROOMS.map((n) => (
              <option key={n} value={n} disabled={rooms.some((r) => r.room === n)}>
                {n}
              </option>
            ))}
          </select>
        </div>
        <button type="button" className="btn-gold" onClick={addRoom}>
          + Thêm phòng
        </button>
        {selected ? (
          <button
            type="button"
            className="btn-gold"
            onClick={() => {
              onChange(rooms.filter((r) => r.id !== selected.id));
              setSelectedId(null);
            }}
          >
            Xóa phòng đã chọn
          </button>
        ) : null}
      </div>

      {selected ? (
        <div className="card grid grid-cols-2 gap-3 sm:grid-cols-4">
          <p className="col-span-2 font-display font-bold text-primary sm:col-span-4">
            {selected.room} — sửa số đo (mét)
          </p>
          {(
            [
              ['x', 'Mép Tây (x)'],
              ['y', 'Mép Bắc (y)'],
              ['w', 'Rộng (Đông–Tây)'],
              ['d', 'Sâu (Bắc–Nam)'],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label className="label" htmlFor={`pe-${key}`}>
                {label}
              </label>
              <input
                id={`pe-${key}`}
                type="number"
                step={0.1}
                className="input"
                value={selected[key]}
                onChange={(e) => updateSelected({ [key]: Number(e.target.value) } as Partial<RoomRect>)}
              />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm">Bấm vào một phòng để sửa số đo hoặc xóa.</p>
      )}
    </div>
  );
}
