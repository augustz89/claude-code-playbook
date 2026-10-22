import raw from "./data/constellations.json";

export type Constellation = {
  id: string;
  nameKo: string;
  nameEn: string;
  /** 연결선. 점은 [경도(적경 도), 위도(적위 도)] */
  lines: [number, number][][];
  /** 모든 점의 평균 방향 */
  center: { raHours: number; decDeg: number };
};

type Raw = { id: string; ko: string; en: string; lines: [number, number][][] };

const RAD = Math.PI / 180;

function centerOf(lines: [number, number][][]) {
  let x = 0, y = 0, z = 0;
  for (const line of lines) {
    for (const [lon, lat] of line) {
      x += Math.cos(lat * RAD) * Math.cos(lon * RAD);
      y += Math.cos(lat * RAD) * Math.sin(lon * RAD);
      z += Math.sin(lat * RAD);
    }
  }
  const lon = ((Math.atan2(y, x) / RAD) + 360) % 360;
  const lat = Math.atan2(z, Math.hypot(x, y)) / RAD;
  return { raHours: lon / 15, decDeg: lat };
}

// 뱀자리는 데이터에서 머리와 꼬리 두 조각으로 나뉘어 있어 하나로 합친다.
const merged = new Map<string, Raw>();
for (const item of raw as Raw[]) {
  const prev = merged.get(item.id);
  merged.set(
    item.id,
    prev ? { ...prev, lines: [...prev.lines, ...item.lines] } : item,
  );
}

export const CONSTELLATIONS: Constellation[] = [...merged.values()].map((c) => ({
  id: c.id,
  nameKo: c.ko,
  nameEn: c.en,
  lines: c.lines,
  center: centerOf(c.lines),
}));
