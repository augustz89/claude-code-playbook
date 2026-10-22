import { describe, expect, test } from "vitest";

import {
  earthAxisLean,
  isNight,
  planetPositions,
  visibleConstellations,
  visiblePlanets,
} from "./sky";

const SEOUL = { lat: 37.5665, lng: 126.978 };
const SYDNEY = { lat: -33.8688, lng: 151.2093 };
const kst = (iso: string) => new Date(`${iso}+09:00`);

describe("낮과 밤", () => {
  // 서울 일몰 시각(공개된 일몰표 기준): 춘분 18:40, 하지 19:57, 추분 18:20, 동지 17:17
  test.each([
    ["춘분", "2026-03-20T18:30", "2026-03-20T18:50"],
    ["하지", "2026-06-21T19:45", "2026-06-21T20:10"],
    ["추분", "2026-09-23T18:10", "2026-09-23T18:35"],
    ["동지", "2026-12-22T17:05", "2026-12-22T17:30"],
  ])("%s에는 서울 일몰 시각을 기준으로 낮에서 밤으로 바뀐다", (_, before, after) => {
    expect(isNight(kst(before), SEOUL)).toBe(false);
    expect(isNight(kst(after), SEOUL)).toBe(true);
  });

  test("서울이 정오일 때 같은 순간 브라질 상파울루는 새벽 0시라 밤이다", () => {
    const noonSeoul = kst("2026-10-22T12:00");
    expect(isNight(noonSeoul, SEOUL)).toBe(false);
    expect(isNight(noonSeoul, { lat: -23.55, lng: -46.63 })).toBe(true);
  });
});

describe("보이는 별자리", () => {
  const ids = (date: Date, observer = SEOUL) =>
    visibleConstellations(date, observer).map((c) => c.id);

  test("낮에는 보이는 별자리가 없다", () => {
    expect(ids(kst("2026-10-22T12:00"))).toEqual([]);
  });

  test.each([
    ["봄", "2026-04-15T22:00", ["Leo", "UMa", "Boo"]],
    ["여름", "2026-07-15T22:00", ["Lyr", "Cyg", "Sco", "Aql"]],
    ["가을", "2026-10-15T22:00", ["Peg", "Cas", "And"]],
    ["겨울", "2026-01-15T22:00", ["Ori", "Tau", "Gem", "CMa"]],
  ])("%s 밤 10시 서울에서는 그 계절의 대표 별자리가 보인다", (_, when, expected) => {
    expect(ids(kst(when))).toEqual(expect.arrayContaining(expected));
  });

  test("여름 밤에는 겨울 대표 별자리 오리온이 보이지 않는다", () => {
    expect(ids(kst("2026-07-15T22:00"))).not.toContain("Ori");
  });

  test("같은 순간에 서울에서는 남십자자리가 안 보이고 시드니에서는 보인다", () => {
    const moment = new Date("2026-05-15T10:00:00Z");
    expect(ids(moment, SEOUL)).not.toContain("Cru");
    expect(ids(moment, SYDNEY)).toContain("Cru");
  });
});

describe("보이는 행성", () => {
  test("낮에는 눈으로 볼 수 있는 행성도 보이지 않고 이유가 낮이다", () => {
    const status = visiblePlanets(kst("2026-10-22T12:00"), SEOUL);
    expect(status.jupiter).toBe("daytime");
    expect(status.uranus).toBe("daytime");
  });

  test("2026년 1월 10일 목성 충 때 서울 밤 11시에 목성이 보인다", () => {
    expect(visiblePlanets(kst("2026-01-10T23:00"), SEOUL).jupiter).toBe("visible");
  });

  test("2025년 9월 21일 토성 충 때 서울 밤 11시에 토성이 보인다", () => {
    expect(visiblePlanets(kst("2025-09-21T23:00"), SEOUL).saturn).toBe("visible");
  });

  test("천왕성과 해왕성은 밤에 떠 있어도 망원경이 필요하다고 표시한다", () => {
    // 천왕성 충: 2025-11-21, 쌍둥이자리 근처
    const status = visiblePlanets(kst("2025-11-21T23:00"), SEOUL);
    expect(status.uranus).toBe("telescope");
  });
});

describe("태양계 위치와 자전축", () => {
  test("하지 무렵 지구는 태양 기준 황경 270도 근처에 있다", () => {
    const earth = planetPositions(kst("2026-06-21T12:00")).find((p) => p.id === "earth")!;
    expect(earth.longitude).toBeGreaterThan(268);
    expect(earth.longitude).toBeLessThan(272);
    expect(earth.distanceAu).toBeCloseTo(1.016, 2);
  });

  test("수성부터 해왕성까지 8개 행성과 지구 위치를 모두 준다", () => {
    const ids = planetPositions(new Date("2026-04-10T00:00:00Z")).map((p) => p.id);
    expect(ids).toEqual([
      "mercury", "venus", "earth", "mars", "jupiter", "saturn", "uranus", "neptune",
    ]);
  });

  test("지구 자전축은 하지에 해 쪽, 동지에 해 반대쪽으로 약 23.4도 기운다", () => {
    expect(earthAxisLean(kst("2026-06-21T12:00"))).toBeCloseTo(0.397, 1);
    expect(earthAxisLean(kst("2026-12-22T12:00"))).toBeCloseTo(-0.397, 1);
    expect(Math.abs(earthAxisLean(kst("2026-03-20T12:00")))).toBeLessThan(0.05);
    expect(Math.abs(earthAxisLean(kst("2026-09-23T12:00")))).toBeLessThan(0.05);
  });
});
