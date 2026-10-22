"use client";

import { Moon02Icon, Sun03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useEffect, useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import type { Country } from "../countries";
import { drawGlobeTexture } from "../globeTexture";

type GlobeInstance = {
  globeImageUrl: (url: string) => GlobeInstance;
  backgroundColor: (color: string) => GlobeInstance;
  showAtmosphere: (on: boolean) => GlobeInstance;
  pointsData: (data: object[]) => GlobeInstance;
  pointColor: (color: string) => GlobeInstance;
  pointAltitude: (alt: number) => GlobeInstance;
  pointRadius: (r: number) => GlobeInstance;
  width: (w: number) => GlobeInstance;
  height: (h: number) => GlobeInstance;
  pointOfView: (pov: { lat: number; lng: number; altitude: number }, ms?: number) => GlobeInstance;
  _destructor?: () => void;
};

const HEIGHT = 420;

export function GlobeView({
  date,
  country,
  night,
}: {
  date: Date;
  country: Country;
  night: boolean;
}) {
  const mountRef = useRef<HTMLDivElement>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let cancelled = false;
    let observer: ResizeObserver | undefined;

    import("globe.gl")
      .then(({ default: Globe }) => {
        if (cancelled) return;
        const globe = (Globe as unknown as () => (el: HTMLElement) => GlobeInstance)()(mount)
          .backgroundColor("rgba(0,0,0,0)")
          .showAtmosphere(true)
          .pointColor("#ffffff")
          .pointAltitude(0.03)
          .pointRadius(0.8)
          .height(HEIGHT)
          .width(mount.clientWidth || 600);
        globeRef.current = globe;
        observer = new ResizeObserver(() => globe.width(mount.clientWidth || 600));
        observer.observe(mount);
        setReady(true);
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      observer?.disconnect();
      globeRef.current?._destructor?.();
      globeRef.current = null;
      mount.replaceChildren();
      setReady(false);
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!ready || !globe) return;
    try {
      canvasRef.current ??= document.createElement("canvas");
      if (drawGlobeTexture(canvasRef.current, date, country.numeric)) {
        globe.globeImageUrl(canvasRef.current.toDataURL("image/png"));
      }
      globe
        .pointsData([{ lat: country.lat, lng: country.lng }])
        .pointOfView({ lat: country.lat, lng: country.lng, altitude: 1.8 }, 1200);
    } catch (error) {
      // 한 번 그림을 못 그려도 이전 지구본이 남아 있으므로 화면 전체를 오류로 바꾸지 않는다.
      console.error("지구본 표면을 갱신하지 못했습니다.", error);
    }
  }, [ready, date, country]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>지구본</CardTitle>
        <CardDescription>
          어두운 곳은 밤, 밝은 곳은 낮이에요. 노란색이 고른 나라예요.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className="font-medium">{country.nameKo}</span>
          <Badge variant={night ? "secondary" : "default"} data-testid="day-night">
            <HugeiconsIcon icon={night ? Moon02Icon : Sun03Icon} data-icon="inline-start" />
            {night ? "지금 밤이에요" : "지금 낮이에요"}
          </Badge>
        </div>
        {failed ? (
          <Alert>
            <AlertTitle>지구본을 그리지 못했어요</AlertTitle>
            <AlertDescription>
              이 브라우저에서는 3D 그림을 쓸 수 없어요. 낮과 밤 표시는 위 글자로 확인할 수 있어요.
            </AlertDescription>
          </Alert>
        ) : (
          <div
            ref={mountRef}
            className="flex w-full justify-center overflow-hidden rounded-xl bg-slate-950"
            style={{ height: HEIGHT }}
            aria-label={`${country.nameKo}로 회전하는 지구본`}
            role="img"
          />
        )}
      </CardContent>
    </Card>
  );
}
