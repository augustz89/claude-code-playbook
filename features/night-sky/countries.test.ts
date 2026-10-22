import { describe, expect, test } from "vitest";

import { COUNTRIES, detectCountryCode, getCountry } from "./countries";

describe("국가 목록", () => {
  test("한국은 서울 시간대의 북반구 국가다", () => {
    const kr = getCountry("KR");
    expect(kr.nameKo).toBe("한국");
    expect(kr.timeZone).toBe("Asia/Seoul");
    expect(kr.hemisphere).toBe("north");
  });

  test("호주는 남반구, 브라질은 상파울루 계열 시간대를 쓴다", () => {
    expect(getCountry("AU").hemisphere).toBe("south");
    expect(getCountry("BR").timeZone).toMatch(/^America\//);
  });

  test("사람이 사는 국가만 한글 이름으로 가나다순 제공한다", () => {
    expect(COUNTRIES.length).toBeGreaterThan(200);
    expect(COUNTRIES.find((c) => c.code === "AQ")).toBeUndefined();
    const names = COUNTRIES.map((c) => c.nameKo);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, "ko")));
  });
});

describe("국가 이름", () => {
  test("같은 이름이 두 번 나오지 않는다", () => {
    const names = COUNTRIES.map((c) => c.nameKo);
    expect(names.filter((n, i) => names.indexOf(n) !== i)).toEqual([]);
  });

  test("아이들이 부르는 이름을 쓴다", () => {
    expect(getCountry("KP").nameKo).toBe("북한");
    expect(getCountry("MN").nameKo).toBe("몽골");
    expect(getCountry("DM").nameKo).toBe("도미니카 연방");
  });
});

describe("접속한 사용자의 국가 추정", () => {
  test("브라우저 시간대에서 국가를 찾는다", () => {
    expect(detectCountryCode("Asia/Seoul")).toBe("KR");
    expect(detectCountryCode("Australia/Sydney")).toBe("AU");
  });

  test("추정할 수 없으면 한국이다", () => {
    expect(detectCountryCode("Mars/Olympus")).toBe("KR");
    expect(detectCountryCode(undefined)).toBe("KR");
  });
});
