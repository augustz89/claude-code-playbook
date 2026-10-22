import { photoSearchTerm, type Fetcher, type Photo } from "./photo";

const SEARCH_URL = "https://images-api.nasa.gov/search";
const MAX_PHOTOS = 12;

type SearchItem = {
  data?: { nasa_id?: string; title?: string; date_created?: string }[];
  links?: { href?: string; rel?: string }[];
};

/** 미리보기 주소(`~medium.jpg` 등)에서 같은 사진의 원본 주소를 만든다. */
function originalUrl(previewUrl: string): string {
  return previewUrl.replace(/~[a-z]+\.jpg$/i, "~orig.jpg");
}

export async function searchConstellationPhotos(
  constellation: { id: string; nameEn: string },
  fetcher: Fetcher = fetch,
): Promise<Photo[]> {
  const query = photoSearchTerm(constellation);
  const url = `${SEARCH_URL}?${new URLSearchParams({ q: query, media_type: "image" })}`;
  const response = await fetcher(url);
  if (!response.ok) throw new Error(`NASA 이미지 검색 실패: ${response.status}`);
  const body = (await response.json()) as { collection?: { items?: SearchItem[] } };

  const photos: Photo[] = [];
  for (const item of body.collection?.items ?? []) {
    const meta = item.data?.[0];
    const imageUrl = item.links?.find((l) => l.href)?.href;
    if (!meta?.nasa_id || !imageUrl) continue;
    photos.push({
      id: meta.nasa_id,
      title: meta.title ?? meta.nasa_id,
      imageUrl,
      openUrl: originalUrl(imageUrl),
      year: meta.date_created?.slice(0, 4),
    });
    if (photos.length === MAX_PHOTOS) break;
  }
  return photos;
}
