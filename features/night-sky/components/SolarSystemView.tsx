"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {
  OBLIQUITY_DEG,
  PLANETS,
  earthAxisLean,
  planetPositions,
  type PlanetId,
  type PlanetVisibility,
} from "../sky";

const SIZE = 600;
const CENTER = SIZE / 2;
// 실제 거리 비율로 그리면 안쪽 행성이 겹쳐서, 행성 순서대로 일정하게 벌려 그린다.
const ORBIT_RADIUS: Record<PlanetId, number> = {
  mercury: 48,
  venus: 80,
  earth: 112,
  mars: 146,
  jupiter: 184,
  saturn: 222,
  uranus: 258,
  neptune: 288,
};
const AXIS_ARROW = 26;
const RAD = Math.PI / 180;

const VISIBILITY_TEXT: Record<PlanetVisibility, string> = {
  visible: "보여요",
  telescope: "망원경이 필요해요",
  daytime: "낮이라 안 보여요",
  "below-horizon": "지평선 아래에 있어요",
};

// 오른쪽 가장자리의 행성은 글자가 그림 밖으로 나가지 않도록 왼쪽에 쓴다.
const labelLeft = (x: number) => x < CENTER || x > SIZE - 80;

function seasonText(lean: number): string {
  if (lean > 0.2) return "북극이 해 쪽으로 기울어 있어요. 북반구는 여름, 남반구는 겨울이에요.";
  if (lean < -0.2) return "북극이 해 반대쪽으로 기울어 있어요. 북반구는 겨울, 남반구는 여름이에요.";
  return "북극이 해와 옆으로 나란해요. 봄이나 가을이에요.";
}

export function SolarSystemView({
  date,
  visibility,
}: {
  date: Date;
  visibility: Record<Exclude<PlanetId, "earth">, PlanetVisibility>;
}) {
  const positions = planetPositions(date);
  const lean = earthAxisLean(date);
  const earth = positions.find((p) => p.id === "earth")!;
  const earthX = CENTER + ORBIT_RADIUS.earth * Math.cos(earth.longitude * RAD);
  const earthY = CENTER - ORBIT_RADIUS.earth * Math.sin(earth.longitude * RAD);

  return (
    <Card>
      <CardHeader>
        <CardTitle>태양계</CardTitle>
        <CardDescription>
          태양계를 위에서 내려다본 모습이에요. 하늘색 테두리는 지금 볼 수 있는 행성이에요.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <svg
          viewBox={`0 0 ${SIZE} ${SIZE}`}
          role="img"
          aria-label="태양계를 위에서 본 그림"
          className="w-full max-w-xl justify-self-center rounded-xl bg-slate-950"
        >
          <defs>
            <marker
              id="axis-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 z" fill="#f2b134" />
            </marker>
          </defs>
          {PLANETS.map((p) => (
            <circle
              key={p.id}
              cx={CENTER}
              cy={CENTER}
              r={ORBIT_RADIUS[p.id]}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
            />
          ))}
          <circle cx={CENTER} cy={CENTER} r={16} fill="#ffcc33" />
          <text x={CENTER} y={CENTER + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#5b3a00">
            태양
          </text>
          {/* 지구에서 태양으로 향하는 점선: 자전축이 해 쪽으로 기울었는지 견주는 기준 */}
          <line
            x1={earthX}
            y1={earthY}
            x2={CENTER}
            y2={CENTER}
            stroke="rgba(255,224,138,0.5)"
            strokeDasharray="4 4"
          />
          {positions.map((p) => {
            const r = ORBIT_RADIUS[p.id];
            const x = CENTER + r * Math.cos(p.longitude * RAD);
            const y = CENTER - r * Math.sin(p.longitude * RAD);
            const planet = PLANETS.find((pl) => pl.id === p.id)!;
            const seen = p.id !== "earth" && visibility[p.id] === "visible";
            return (
              <g key={p.id} data-planet={p.id} data-visible={seen}>
                {seen && <circle cx={x} cy={y} r={13} fill="none" stroke="#7df9ff" strokeWidth={2.5} />}
                <circle
                  cx={x}
                  cy={y}
                  r={p.id === "earth" ? 8 : 6}
                  fill={p.id === "earth" ? "#3b82f6" : "#d4d4d8"}
                />
                <text
                  x={labelLeft(x) ? x - 13 : x + 13}
                  y={y + 4}
                  textAnchor={labelLeft(x) ? "end" : "start"}
                  fontSize={13}
                  fill="white"
                >
                  {planet.nameKo}
                </text>
              </g>
            );
          })}
          {/* 지구 자전축은 우주에서 늘 같은 방향(황도면 위에서 보면 위쪽)을 향한다. */}
          <line
            data-testid="earth-axis"
            x1={earthX}
            y1={earthY}
            x2={earthX}
            y2={earthY - AXIS_ARROW}
            stroke="#f2b134"
            strokeWidth={2.5}
            markerEnd="url(#axis-arrow)"
          />
          <text x={earthX + 6} y={earthY - AXIS_ARROW - 2} fontSize={11} fill="#f2b134">
            북극 방향
          </text>
        </svg>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <p className="font-medium">
              지구의 자전축은 {OBLIQUITY_DEG.toFixed(1)}° 기울어 있어요
            </p>
            <p className="text-sm text-muted-foreground" data-testid="season-text">
              {seasonText(lean)}
            </p>
          </div>
          <ul className="flex flex-col gap-2" aria-label="행성이 보이는지">
            {PLANETS.filter((p) => p.id !== "earth").map((p) => {
              const status = visibility[p.id as Exclude<PlanetId, "earth">];
              return (
                <li key={p.id} className="flex items-center justify-between gap-2">
                  <span>{p.nameKo}</span>
                  <Badge variant={status === "visible" ? "default" : "outline"}>
                    {VISIBILITY_TEXT[status]}
                  </Badge>
                </li>
              );
            })}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
