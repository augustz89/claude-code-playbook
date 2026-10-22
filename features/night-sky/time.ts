export type LocalDateTime = { date: string; time: string };
export type DateBounds = { min: string; max: string };

function zoneParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour: get("hour"),
    minute: get("minute"),
    second: get("second"),
  };
}

const pad = (n: number, width = 2) => String(n).padStart(width, "0");

export function instantToLocal(instant: Date, timeZone: string): LocalDateTime {
  const p = zoneParts(instant, timeZone);
  return {
    date: `${pad(p.year, 4)}-${pad(p.month)}-${pad(p.day)}`,
    time: `${pad(p.hour)}:${pad(p.minute)}`,
  };
}

/** 해당 시간대의 현지 날짜·시각을 UTC 순간으로 바꾼다. */
export function localToInstant(date: string, time: string, timeZone: string): Date {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // 오프셋을 두 번 보정하면 서머타임 경계 근처에서도 수렴한다.
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const p = zoneParts(new Date(guess), timeZone);
    const shown = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    guess += asUtc - shown;
  }
  return new Date(guess);
}

/** 같은 현지 날짜의 22:00. */
export function nightTenPm(instant: Date, timeZone: string): Date {
  const { date } = instantToLocal(instant, timeZone);
  return localToInstant(date, "22:00", timeZone);
}

/** 오늘 기준 과거 20년부터 미래 1년까지의 현지 날짜 범위. */
export function dateBounds(now: Date, timeZone: string): DateBounds {
  const { date } = instantToLocal(now, timeZone);
  const [y, m, d] = date.split("-").map(Number);
  return {
    min: `${pad(y - 20, 4)}-${pad(m)}-${pad(d)}`,
    max: `${pad(y + 1, 4)}-${pad(m)}-${pad(d)}`,
  };
}

export function isDateInBounds(date: string, bounds: DateBounds): boolean {
  return date >= bounds.min && date <= bounds.max;
}
