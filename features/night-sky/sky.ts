import {
  Body,
  Ecliptic,
  Equator,
  HelioVector,
  Horizon,
  Observer,
  SiderealTime,
} from "astronomy-engine";

import { CONSTELLATIONS, type Constellation } from "./constellations";

export type Position = { lat: number; lng: number };

export const OBLIQUITY_DEG = 23.4393;
/** 해가 지평선 아래로 내려간 것으로 보는 고도(대기 굴절과 해의 반지름 포함) */
const SUNSET_ALTITUDE_DEG = -0.833;
/** 별자리 중심이 이 고도 이상일 때 찾아볼 수 있다고 본다. */
const MIN_CONSTELLATION_ALTITUDE_DEG = 10;

const RAD = Math.PI / 180;

export type SunPosition = { raHours: number; decDeg: number; gmstHours: number };

export function sunPosition(date: Date): SunPosition {
  const eq = Equator(Body.Sun, date, new Observer(0, 0, 0), true, true);
  return { raHours: eq.ra, decDeg: eq.dec, gmstHours: SiderealTime(date) };
}

/** 지표면 한 점에서 본 태양 고도(도). 지구본의 낮밤 경계와 같은 계산을 쓴다. */
export function sunAltitudeAt(lat: number, lng: number, sun: SunPosition): number {
  const hourAngle = (sun.gmstHours * 15 + lng - sun.raHours * 15) * RAD;
  const dec = sun.decDeg * RAD;
  const phi = lat * RAD;
  const sinAlt =
    Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(hourAngle);
  return Math.asin(Math.min(1, Math.max(-1, sinAlt))) / RAD;
}

export function isNight(date: Date, position: Position): boolean {
  return sunAltitudeAt(position.lat, position.lng, sunPosition(date)) < SUNSET_ALTITUDE_DEG;
}

function altitudeOf(date: Date, position: Position, raHours: number, decDeg: number) {
  const observer = new Observer(position.lat, position.lng, 0);
  return Horizon(date, observer, raHours, decDeg, "normal").altitude;
}

export function visibleConstellations(date: Date, position: Position): Constellation[] {
  if (!isNight(date, position)) return [];
  return CONSTELLATIONS.filter(
    (c) =>
      altitudeOf(date, position, c.center.raHours, c.center.decDeg) >=
      MIN_CONSTELLATION_ALTITUDE_DEG,
  );
}

export type PlanetId =
  | "mercury" | "venus" | "earth" | "mars" | "jupiter" | "saturn" | "uranus" | "neptune";

export const PLANETS: { id: PlanetId; nameKo: string; body: Body; nakedEye: boolean }[] = [
  { id: "mercury", nameKo: "수성", body: Body.Mercury, nakedEye: true },
  { id: "venus", nameKo: "금성", body: Body.Venus, nakedEye: true },
  { id: "earth", nameKo: "지구", body: Body.Earth, nakedEye: true },
  { id: "mars", nameKo: "화성", body: Body.Mars, nakedEye: true },
  { id: "jupiter", nameKo: "목성", body: Body.Jupiter, nakedEye: true },
  { id: "saturn", nameKo: "토성", body: Body.Saturn, nakedEye: true },
  { id: "uranus", nameKo: "천왕성", body: Body.Uranus, nakedEye: false },
  { id: "neptune", nameKo: "해왕성", body: Body.Neptune, nakedEye: false },
];

export type PlanetVisibility = "visible" | "telescope" | "daytime" | "below-horizon";

/** 지구를 뺀 행성들이 관측 순간 관측 지점에서 보이는지. */
export function visiblePlanets(
  date: Date,
  position: Position,
): Record<Exclude<PlanetId, "earth">, PlanetVisibility> {
  const night = isNight(date, position);
  const observer = new Observer(position.lat, position.lng, 0);
  const result = {} as Record<Exclude<PlanetId, "earth">, PlanetVisibility>;
  for (const planet of PLANETS) {
    if (planet.id === "earth") continue;
    if (!night) {
      result[planet.id] = "daytime";
      continue;
    }
    const eq = Equator(planet.body, date, observer, true, true);
    const altitude = Horizon(date, observer, eq.ra, eq.dec, "normal").altitude;
    result[planet.id] =
      altitude <= 0 ? "below-horizon" : planet.nakedEye ? "visible" : "telescope";
  }
  return result;
}

export type PlanetPosition = {
  id: PlanetId;
  /** 태양 중심 황도 경도(도, 0~360) */
  longitude: number;
  distanceAu: number;
};

export function planetPositions(date: Date): PlanetPosition[] {
  return PLANETS.map(({ id, body }) => {
    const helio = HelioVector(body, date);
    const ecl = Ecliptic(helio);
    return {
      id,
      longitude: ((Math.atan2(ecl.vec.y, ecl.vec.x) / RAD) + 360) % 360,
      distanceAu: Math.hypot(ecl.vec.x, ecl.vec.y, ecl.vec.z),
    };
  });
}

/**
 * 지구 자전축이 해 쪽으로 기운 정도. 하지에 약 +0.40(북반구가 해를 향함),
 * 동지에 약 -0.40, 춘분과 추분에는 0에 가깝다.
 */
export function earthAxisLean(date: Date): number {
  const ecl = Ecliptic(HelioVector(Body.Earth, date));
  const toSunY = -ecl.vec.y / Math.hypot(ecl.vec.x, ecl.vec.y);
  return Math.sin(OBLIQUITY_DEG * RAD) * toSunY;
}
