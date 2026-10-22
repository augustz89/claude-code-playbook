"use client";

import { useEffect, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";

import type { Constellation } from "../constellations";
import { findConstellationPhotos, type PhotoResult } from "../photos";

type State =
  | { status: "loading" }
  | { status: "error" }
  | ({ status: "done" } & PhotoResult);

export function PhotoDialog({
  constellation,
  onClose,
}: {
  constellation: Constellation | null;
  onClose: () => void;
}) {
  // 검색 결과는 어떤 요청의 것인지 key와 함께 저장해, 다른 별자리를 고르면 자동으로 불러오는 중이 된다.
  const [result, setResult] = useState<{ key: string; state: State } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const key = constellation ? `${constellation.id}:${attempt}` : "";
  const state: State = result?.key === key ? result.state : { status: "loading" };

  useEffect(() => {
    if (!constellation) return;
    let cancelled = false;
    findConstellationPhotos(constellation)
      .then((found) => !cancelled && setResult({ key, state: { status: "done", ...found } }))
      .catch(() => !cancelled && setResult({ key, state: { status: "error" } }));
    return () => {
      cancelled = true;
    };
  }, [constellation, key]);

  return (
    <Dialog open={constellation !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {constellation?.nameKo} ({constellation?.nameEn})
          </DialogTitle>
          <DialogDescription>
            {state.status === "done" && state.source === "commons"
              ? "NASA 사진이 없어서 위키미디어 커먼즈에 올라온 사용자 사진을 보여 줘요."
              : "NASA가 망원경으로 찍은 사진이에요. 사진을 누르면 새 탭에서 크게 볼 수 있어요."}
          </DialogDescription>
        </DialogHeader>
        {state.status === "loading" && (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3" aria-label="사진을 불러오는 중">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="aspect-video w-full" />
            ))}
          </div>
        )}
        {state.status === "error" && (
          <Alert variant="destructive">
            <AlertTitle>사진을 불러오지 못했어요</AlertTitle>
            <AlertDescription className="flex flex-col items-start gap-2">
              인터넷 연결을 확인하고 다시 해 보세요.
              <Button type="button" variant="outline" onClick={() => setAttempt((n) => n + 1)}>
                다시 불러오기
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {state.status === "done" && state.photos.length === 0 && (
          <Empty>
            <EmptyHeader>
              <EmptyTitle>보여 줄 사진이 아직 없어요</EmptyTitle>
              <EmptyDescription>다른 별자리를 골라 보세요.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
        {state.status === "done" && state.photos.length > 0 && (
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {state.photos.map((photo) => (
              <li key={photo.id} className="flex flex-col gap-1">
                <a
                  href={photo.openUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${photo.title} 새 탭에서 열기`}
                >
                  {/* 외부 이미지 서버가 크기를 정해 주므로 next/image 최적화를 쓰지 않는다. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    loading="lazy"
                    className="aspect-video w-full rounded-lg bg-muted object-cover"
                  />
                </a>
                <span className="text-sm font-medium">{photo.title}</span>
                {photo.year && (
                  <span className="text-xs text-muted-foreground">{photo.year}년</span>
                )}
                {photo.credit && (
                  <span className="text-xs text-muted-foreground">
                    촬영 {photo.credit} · {photo.license}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        {state.status === "done" && (
          <p className="text-xs text-muted-foreground">
            {state.source === "nasa" ? "사진 출처: NASA" : "사진 출처: 위키미디어 커먼즈"}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
