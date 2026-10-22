import { describe, expect, test, vi } from "vitest";

import { searchConstellationPhotos } from "./nasa";

const orion = { id: "Ori", nameEn: "Orion" };
const lacerta = { id: "Lac", nameEn: "Lizard" };

function respond(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 503, json: async () => body });
}

const item = (id: string, title: string) => ({
  data: [{ nasa_id: id, title, date_created: "2020-01-02T00:00:00Z", media_type: "image" }],
  links: [{ href: `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg`, rel: "preview" }],
});

describe("NASA 별자리 사진 검색", () => {
  test("오리온자리는 대표 천체인 오리온 성운으로 이미지만 검색한다", async () => {
    const fetcher = respond({ collection: { items: [] } });
    await searchConstellationPhotos(orion, fetcher);
    const url = new URL(fetcher.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://images-api.nasa.gov/search");
    expect(url.searchParams.get("q")).toBe("Orion Nebula");
    expect(url.searchParams.get("media_type")).toBe("image");
  });

  test("대표 천체가 없는 별자리는 영문 이름 + constellation으로 검색한다", async () => {
    const fetcher = respond({ collection: { items: [] } });
    await searchConstellationPhotos(lacerta, fetcher);
    const url = new URL(fetcher.mock.calls[0][0] as string);
    expect(url.searchParams.get("q")).toBe("Lizard constellation");
  });

  test("결과에서 제목, 미리보기 이미지, 촬영 연도를 뽑는다", async () => {
    const fetcher = respond({ collection: { items: [item("PIA04227", "Orion Nebula and Bow Shock")] } });
    const photos = await searchConstellationPhotos(orion, fetcher);
    expect(photos).toEqual([
      {
        id: "PIA04227",
        title: "Orion Nebula and Bow Shock",
        imageUrl: "https://images-assets.nasa.gov/image/PIA04227/PIA04227~medium.jpg",
        openUrl: "https://images-assets.nasa.gov/image/PIA04227/PIA04227~orig.jpg",
        year: "2020",
      },
    ]);
  });

  test("사진이 없으면 빈 목록을 돌려준다", async () => {
    expect(await searchConstellationPhotos(orion, respond({ collection: { items: [] } }))).toEqual([]);
  });

  test("미리보기 링크가 없는 항목은 건너뛴다", async () => {
    const noLink = { data: [{ nasa_id: "x", title: "no link" }] };
    const photos = await searchConstellationPhotos(orion, respond({ collection: { items: [noLink] } }));
    expect(photos).toEqual([]);
  });

  test("서버가 실패하면 오류를 던진다", async () => {
    await expect(searchConstellationPhotos(orion, respond({}, false))).rejects.toThrow();
  });
});
