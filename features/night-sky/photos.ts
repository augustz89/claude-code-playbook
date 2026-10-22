import { searchCommonsPhotos } from "./commons";
import { searchConstellationPhotos } from "./nasa";
import type { Fetcher, Photo } from "./photo";

export type PhotoResult = { source: "nasa" | "commons"; photos: Photo[] };

/** NASA 사진을 먼저 찾고, 하나도 없을 때만 커먼즈 사용자 사진으로 대신한다. */
export async function findConstellationPhotos(
  constellation: { id: string; nameEn: string },
  fetcher: Fetcher = fetch,
): Promise<PhotoResult> {
  const nasa = await searchConstellationPhotos(constellation, fetcher);
  if (nasa.length > 0) return { source: "nasa", photos: nasa };
  return { source: "commons", photos: await searchCommonsPhotos(constellation, fetcher) };
}
