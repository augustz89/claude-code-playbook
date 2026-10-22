"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";

import type { Constellation } from "../constellations";
import type { Country } from "../countries";
import { ConstellationFigure } from "./ConstellationFigure";

const HEMISPHERE_TEXT = { north: "북반구", south: "남반구" } as const;

export function ConstellationList({
  country,
  night,
  constellations,
  onSelect,
  onSetNightTenPm,
}: {
  country: Country;
  night: boolean;
  constellations: Constellation[];
  onSelect: (constellation: Constellation) => void;
  onSetNightTenPm: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2">
          보이는 별자리
          <Badge variant="outline" data-testid="hemisphere">
            {country.nameKo} · {HEMISPHERE_TEXT[country.hemisphere]}
          </Badge>
        </CardTitle>
        <CardDescription>별자리를 누르면 망원경으로 찍은 사진을 볼 수 있어요.</CardDescription>
      </CardHeader>
      <CardContent>
        {!night ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>낮에는 별자리를 못 봐요</EmptyTitle>
              <EmptyDescription>밤 10시로 바꿔 보세요.</EmptyDescription>
            </EmptyHeader>
            <Button type="button" onClick={onSetNightTenPm}>
              밤 10시로 바꾸기
            </Button>
          </Empty>
        ) : constellations.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>지금 찾아볼 별자리가 없어요</EmptyTitle>
              <EmptyDescription>시각을 바꿔 보세요.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground" data-testid="constellation-count">
              {constellations.length}개의 별자리를 볼 수 있어요.
            </p>
            <ul aria-label="보이는 별자리 목록" className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
              {constellations.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(c)}
                    className="flex w-full flex-col gap-2 rounded-xl p-2 text-left outline-none transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <ConstellationFigure constellation={c} />
                    <span className="font-medium">{c.nameKo}</span>
                    <span className="text-xs text-muted-foreground">{c.nameEn}</span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  );
}
