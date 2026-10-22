"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { CONSTELLATIONS, type Constellation } from "../constellations";

const WIDTH = 1000;
const HEIGHT = 500;

// 하늘의 동쪽이 지도의 왼쪽이다. 경도는 적경(도)을 -180~180으로 감은 값이다.
const toX = (lon: number) => ((180 - lon) / 360) * WIDTH;
const toY = (lat: number) => ((90 - lat) / 180) * HEIGHT;

/** 지도의 가장자리(경도 ±180)를 가로지르는 선은 반대편으로 건너뛰지 않도록 나눈다. */
function segments(line: [number, number][]): [number, number][][] {
  const parts: [number, number][][] = [];
  let current: [number, number][] = [];
  line.forEach((point, i) => {
    if (i > 0 && Math.abs(point[0] - line[i - 1][0]) > 180) {
      parts.push(current);
      current = [];
    }
    current.push(point);
  });
  parts.push(current);
  return parts.filter((part) => part.length > 1);
}

const wrapLon = (raHours: number) => {
  const lon = raHours * 15;
  return lon > 180 ? lon - 360 : lon;
};

const POLYLINES = CONSTELLATIONS.map((c) => ({
  id: c.id,
  points: c.lines
    .flatMap(segments)
    .map((part) => part.map(([lon, lat]) => `${toX(lon).toFixed(1)},${toY(lat).toFixed(1)}`).join(" ")),
}));

export function SkyMap({
  night,
  visibleIds,
  onSelect,
}: {
  night: boolean;
  visibleIds: ReadonlySet<string>;
  onSelect: (constellation: Constellation) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          하늘 전체 별자리 지도
          <Badge variant="outline" data-testid="sky-map-count">
            지금 보이는 별자리 {visibleIds.size}개
          </Badge>
        </CardTitle>
        <CardDescription>
          {night
            ? "밝게 빛나는 별자리가 지금 보이는 별자리예요. 별자리를 누르면 사진을 볼 수 있어요."
            : "지금은 낮이라 보이는 별자리가 없어요. 그래도 별자리를 누르면 사진을 볼 수 있어요."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
            role="group"
            aria-label="하늘 전체 별자리 지도"
            className="w-full min-w-[40rem] rounded-xl bg-slate-950"
          >
            {/* 적위 0도(하늘의 적도) */}
            <line x1={0} x2={WIDTH} y1={toY(0)} y2={toY(0)} stroke="rgba(255,255,255,0.12)" strokeDasharray="6 6" />
            {CONSTELLATIONS.map((c, i) => {
              const visible = visibleIds.has(c.id);
              return (
                <g
                  key={c.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${c.nameKo} 사진 보기`}
                  data-constellation={c.id}
                  data-visible={visible}
                  className="cursor-pointer outline-none focus-visible:[&_polyline]:stroke-white"
                  onClick={() => onSelect(c)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(c);
                    }
                  }}
                >
                  {POLYLINES[i].points.map((points, j) => (
                    <g key={j}>
                      <polyline points={points} fill="none" stroke="transparent" strokeWidth={12} />
                      <polyline
                        points={points}
                        fill="none"
                        stroke={visible ? "#ffe9a8" : "rgba(160,180,230,0.35)"}
                        strokeWidth={visible ? 2 : 1}
                      />
                    </g>
                  ))}
                  <text
                    x={toX(wrapLon(c.center.raHours))}
                    y={toY(c.center.decDeg) + 3}
                    textAnchor="middle"
                    fontSize={10}
                    fill={visible ? "#ffffff" : "rgba(200,210,240,0.5)"}
                    fontWeight={visible ? 700 : 400}
                    pointerEvents="none"
                  >
                    {c.nameKo.replace(/자리$/, "")}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </CardContent>
    </Card>
  );
}
