import { getCountryForTimezone } from "countries-and-timezones";
import tzLookup from "tz-lookup";
import worldCountries from "world-countries";

export type Hemisphere = "north" | "south";

export type Country = {
  code: string;
  numeric: string;
  nameKo: string;
  /** 관측 지점: 국가의 대표 위치(위도) */
  lat: number;
  /** 관측 지점: 국가의 대표 위치(경도) */
  lng: number;
  timeZone: string;
  hemisphere: Hemisphere;
};

export const DEFAULT_COUNTRY_CODE = "KR";

// 사람이 사는 국가가 아니거나 거주 인구가 없는 영토
const EXCLUDED = new Set(["AQ", "BV", "HM", "GS", "TF", "UM"]);

// 국가 이름 데이터가 중복되거나 아이들에게 낯선 공식 명칭이면 바로잡는다.
const NAME_OVERRIDES: Record<string, string> = {
  KP: "북한",
  MN: "몽골",
  DM: "도미니카 연방",
  IO: "영국령 인도양 지역",
};

function timeZoneOf(lat: number, lng: number): string {
  const zone = tzLookup(lat, lng);
  return zone.startsWith("Etc/") ? "UTC" : zone;
}

export const COUNTRIES: Country[] = worldCountries
  .filter((c) => !EXCLUDED.has(c.cca2) && c.latlng.length === 2)
  .map((c) => {
    const [lat, lng] = c.latlng;
    return {
      code: c.cca2,
      numeric: c.ccn3,
      nameKo: NAME_OVERRIDES[c.cca2] ?? c.translations.kor?.common ?? c.name.common,
      lat,
      lng,
      timeZone: timeZoneOf(lat, lng),
      hemisphere: lat >= 0 ? ("north" as const) : ("south" as const),
    };
  })
  .sort((a, b) => a.nameKo.localeCompare(b.nameKo, "ko"));

const BY_CODE = new Map(COUNTRIES.map((c) => [c.code, c]));

export function getCountry(code: string): Country {
  return BY_CODE.get(code) ?? BY_CODE.get(DEFAULT_COUNTRY_CODE)!;
}

/** 브라우저 시간대(IANA)에서 국가 코드를 추정하고, 추정할 수 없으면 한국을 쓴다. */
export function detectCountryCode(timeZone: string | undefined): string {
  if (!timeZone) return DEFAULT_COUNTRY_CODE;
  const found = getCountryForTimezone(timeZone)?.id;
  return found && BY_CODE.has(found) ? found : DEFAULT_COUNTRY_CODE;
}
