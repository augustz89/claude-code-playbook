import { photoSearchTerm, type Fetcher, type Photo } from "./photo";

const API_URL = "https://commons.wikimedia.org/w/api.php";
const MAX_PHOTOS = 3;
const SEARCH_LIMIT = 15;
const PHOTO_MIME = new Set(["image/jpeg", "image/png"]);
const JPEG_ONLY = new Set(["image/jpeg"]);

type CommonsPage = {
  title: string;
  index?: number;
  imageinfo?: {
    thumburl?: string;
    descriptionurl?: string;
    mime?: string;
    extmetadata?: {
      LicenseShortName?: { value?: string };
      Artist?: { value?: string };
    };
  }[];
};

const stripTags = (html: string) =>
  html.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

// 별자리 위치도, 기호, 깃발처럼 사진이 아닌 그림 파일 이름에 자주 들어가는 낱말
const NOT_A_PHOTO = /(^|[^a-z])(map|chart|iau|diagram|atlas|symbol|logo|stamp|flag|coat|zodiac)([^a-z]|$)/i;

async function search(
  query: string,
  mimes: Set<string>,
  fetcher: Fetcher,
): Promise<Photo[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrnamespace: "6",
    gsrsearch: query,
    gsrlimit: String(SEARCH_LIMIT),
    prop: "imageinfo",
    iiprop: "url|mime|extmetadata",
    iiurlwidth: "600",
  });
  const response = await fetcher(`${API_URL}?${params}`);
  if (!response.ok) throw new Error(`커먼즈 사진 검색 실패: ${response.status}`);
  const body = (await response.json()) as { query?: { pages?: Record<string, CommonsPage> } };

  const pages = Object.values(body.query?.pages ?? {}).sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const photos: Photo[] = [];
  for (const page of pages) {
    const info = page.imageinfo?.[0];
    if (!info?.thumburl || !info.descriptionurl || !mimes.has(info.mime ?? "")) continue;
    if (NOT_A_PHOTO.test(page.title)) continue;
    photos.push({
      id: `commons:${page.title}`,
      title: page.title.replace(/^File:/, "").replace(/\.[a-z0-9]+$/i, ""),
      imageUrl: info.thumburl,
      openUrl: info.descriptionurl,
      credit: info.extmetadata?.Artist?.value && stripTags(info.extmetadata.Artist.value),
      license: info.extmetadata?.LicenseShortName?.value,
    });
    if (photos.length === MAX_PHOTOS) break;
  }
  return photos;
}

/**
 * 위키미디어 커먼즈에서 사용자가 올린 천체 사진을 최대 3장 찾는다.
 * 대표 천체의 천체사진을 먼저 찾고, 없으면 별자리 이름으로 찾은 jpeg 사진(위치도 제외)으로 대신한다.
 */
export async function searchCommonsPhotos(
  constellation: { id: string; nameEn: string },
  fetcher: Fetcher = fetch,
): Promise<Photo[]> {
  const first = await search(`${photoSearchTerm(constellation)} astrophotography`, PHOTO_MIME, fetcher);
  if (first.length > 0) return first;
  return search(`${constellation.nameEn} constellation`, JPEG_ONLY, fetcher);
}
