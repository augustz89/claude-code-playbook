import type { Constellation } from "../constellations";

const RAD = Math.PI / 180;
const BOX = 100;
const PAD = 8;

/** 별자리 중심을 기준으로 하늘을 평면에 옮긴다(입체 투영). 하늘은 동쪽이 왼쪽이다. */
function project(lon: number, lat: number, lon0: number, lat0: number): [number, number] {
  const dl = (lon - lon0) * RAD;
  const phi = lat * RAD;
  const phi0 = lat0 * RAD;
  const k =
    2 / (1 + Math.sin(phi0) * Math.sin(phi) + Math.cos(phi0) * Math.cos(phi) * Math.cos(dl));
  return [
    -k * Math.cos(phi) * Math.sin(dl),
    -k * (Math.cos(phi0) * Math.sin(phi) - Math.sin(phi0) * Math.cos(phi) * Math.cos(dl)),
  ];
}

export function ConstellationFigure({ constellation }: { constellation: Constellation }) {
  const lon0 = constellation.center.raHours * 15;
  const lat0 = constellation.center.decDeg;
  const lines = constellation.lines.map((line) =>
    line.map(([lon, lat]) => project(lon, lat, lon0, lat0)),
  );
  const points = lines.flat();
  const xs = points.map((p) => p[0]);
  const ys = points.map((p) => p[1]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const scale = (BOX - PAD * 2) / Math.max(maxX - minX, maxY - minY, 1e-6);
  const offsetX = (BOX - (maxX - minX) * scale) / 2 - minX * scale;
  const offsetY = (BOX - (maxY - minY) * scale) / 2 - minY * scale;
  const place = ([x, y]: [number, number]): [number, number] => [
    x * scale + offsetX,
    y * scale + offsetY,
  ];

  return (
    <svg
      viewBox={`0 0 ${BOX} ${BOX}`}
      className="aspect-square w-full rounded-lg bg-slate-950"
      aria-hidden="true"
    >
      {lines.map((line, i) => (
        <polyline
          key={i}
          points={line.map((p) => place(p).map((n) => n.toFixed(1)).join(",")).join(" ")}
          fill="none"
          stroke="rgba(180,200,255,0.65)"
          strokeWidth={0.8}
        />
      ))}
      {points.map((p, i) => {
        const [x, y] = place(p);
        return <circle key={i} cx={x} cy={y} r={1.4} fill="#fff6c8" />;
      })}
    </svg>
  );
}
