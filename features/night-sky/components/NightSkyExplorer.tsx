"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import { Skeleton } from "@/components/ui/skeleton";

import type { Constellation } from "../constellations";
import { detectCountryCode, getCountry } from "../countries";
import { isNight, visibleConstellations, visiblePlanets } from "../sky";
import {
  dateBounds,
  instantToLocal,
  isDateInBounds,
  localToInstant,
  nightTenPm,
  type LocalDateTime,
} from "../time";
import { ConstellationList } from "./ConstellationList";
import { GlobeView } from "./GlobeView";
import { ObservationForm } from "./ObservationForm";
import { PhotoDialog } from "./PhotoDialog";
import { SkyMap } from "./SkyMap";
import { SolarSystemView } from "./SolarSystemView";

type Moment = { countryCode: string; instant: Date };

function currentMoment(): Moment {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { countryCode: detectCountryCode(zone), instant: new Date() };
}

const subscribeNothing = () => () => {};

/** 서버 렌더링 결과와 어긋나지 않도록, 접속한 브라우저에서만 사용자의 시간대와 현재 시각을 읽는다. */
export function NightSkyExplorer() {
  const inBrowser = useSyncExternalStore(
    subscribeNothing,
    () => true,
    () => false,
  );
  return inBrowser ? (
    <Explorer />
  ) : (
    <Skeleton className="h-96 w-full" aria-label="불러오는 중" />
  );
}

function Explorer() {
  const [moment, setMoment] = useState<Moment>(currentMoment);
  const [selected, setSelected] = useState<Constellation | null>(null);

  const country = getCountry(moment.countryCode);
  const night = useMemo(() => isNight(moment.instant, country), [moment, country]);
  const constellations = useMemo(
    () => visibleConstellations(moment.instant, country),
    [moment, country],
  );
  const visibleIds = useMemo(() => new Set(constellations.map((c) => c.id)), [constellations]);
  const planets = useMemo(() => visiblePlanets(moment.instant, country), [moment, country]);

  const local = instantToLocal(moment.instant, country.timeZone);
  const bounds = dateBounds(new Date(), country.timeZone);

  const changeLocal = (next: LocalDateTime) => {
    if (!isDateInBounds(next.date, bounds)) return;
    setMoment({ ...moment, instant: localToInstant(next.date, next.time, country.timeZone) });
  };

  return (
    <div className="flex flex-col gap-8">
      <ObservationForm
        country={country}
        local={local}
        bounds={bounds}
        onCountryChange={(code) => setMoment({ ...moment, countryCode: code })}
        onLocalChange={changeLocal}
        onReset={() => setMoment(currentMoment())}
      />
      <GlobeView date={moment.instant} country={country} night={night} />
      <SolarSystemView date={moment.instant} visibility={planets} />
      <SkyMap night={night} visibleIds={visibleIds} onSelect={setSelected} />
      <ConstellationList
        country={country}
        night={night}
        constellations={constellations}
        onSelect={setSelected}
        onSetNightTenPm={() =>
          setMoment({ ...moment, instant: nightTenPm(moment.instant, country.timeZone) })
        }
      />
      <PhotoDialog constellation={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
