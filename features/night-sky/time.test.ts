import { describe, expect, test } from "vitest";

import {
  dateBounds,
  instantToLocal,
  isDateInBounds,
  localToInstant,
  nightTenPm,
} from "./time";

describe("현지 시각과 관측 순간 변환", () => {
  test("서울 현지 오후 6시는 UTC 09:00이다", () => {
    const instant = localToInstant("2026-10-22", "18:00", "Asia/Seoul");
    expect(instant.toISOString()).toBe("2026-10-22T09:00:00.000Z");
  });

  test("서머타임 기간의 뉴욕 정오는 UTC 16:00이다", () => {
    const instant = localToInstant("2026-07-01", "12:00", "America/New_York");
    expect(instant.toISOString()).toBe("2026-07-01T16:00:00.000Z");
  });

  test("같은 순간을 다른 국가의 현지 시각으로 바꿔 보여준다", () => {
    const instant = new Date("2026-10-22T09:00:00Z");
    expect(instantToLocal(instant, "Asia/Seoul")).toEqual({
      date: "2026-10-22",
      time: "18:00",
    });
    expect(instantToLocal(instant, "America/Sao_Paulo")).toEqual({
      date: "2026-10-22",
      time: "06:00",
    });
  });

  test("현지 22:00으로 바꾸면 선택한 국가의 같은 날짜 밤 10시가 된다", () => {
    const instant = new Date("2026-10-22T03:00:00Z"); // 서울 12:00
    const next = nightTenPm(instant, "Asia/Seoul");
    expect(instantToLocal(next, "Asia/Seoul")).toEqual({
      date: "2026-10-22",
      time: "22:00",
    });
  });
});

describe("선택 가능한 날짜 범위", () => {
  const now = new Date("2026-10-22T03:00:00Z");

  test("오늘 기준 과거 20년부터 미래 1년까지다", () => {
    expect(dateBounds(now, "Asia/Seoul")).toEqual({
      min: "2006-10-22",
      max: "2027-10-22",
    });
  });

  test("범위 하루 밖의 날짜는 고를 수 없다", () => {
    const bounds = dateBounds(now, "Asia/Seoul");
    expect(isDateInBounds("2006-10-21", bounds)).toBe(false);
    expect(isDateInBounds("2006-10-22", bounds)).toBe(true);
    expect(isDateInBounds("2027-10-22", bounds)).toBe(true);
    expect(isDateInBounds("2027-10-23", bounds)).toBe(false);
  });
});
