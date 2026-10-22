import { describe, expect, test, vi } from "vitest";

import { searchCommonsPhotos } from "./commons";

const orion = { id: "Ori", nameEn: "Orion" };

function respond(body: unknown, ok = true) {
  return vi.fn().mockResolvedValue({ ok, status: ok ? 200 : 503, json: async () => body });
}

const page = (index: number, title: string, mime = "image/jpeg", artist = "<a href='x'>김별</a>") => ({
  title: `File:${title}`,
  index,
  imageinfo: [
    {
      thumburl: `https://upload.wikimedia.org/thumb/${index}.jpg`,
      descriptionurl: `https://commons.wikimedia.org/wiki/File:${index}`,
      mime,
      extmetadata: { LicenseShortName: { value: "CC BY 4.0" }, Artist: { value: artist } },
    },
  ],
});

describe("위키미디어 커먼즈 사진 검색", () => {
  test("대표 천체 이름에 astrophotography를 붙여 파일을 검색한다", async () => {
    const fetcher = respond({ query: { pages: {} } });
    await searchCommonsPhotos(orion, fetcher);
    const url = new URL(fetcher.mock.calls[0][0] as string);
    expect(url.origin + url.pathname).toBe("https://commons.wikimedia.org/w/api.php");
    expect(url.searchParams.get("gsrsearch")).toBe("Orion Nebula astrophotography");
    expect(url.searchParams.get("gsrnamespace")).toBe("6");
    expect(url.searchParams.get("origin")).toBe("*");
  });

  test("제목, 촬영자, 라이선스, 파일 페이지 주소를 뽑고 검색 순위대로 최대 3장만 돌려준다", async () => {
    const pages = Object.fromEntries(
      [4, 2, 1, 3, 5].map((i) => [String(i), page(i, `사진 ${i}.jpg`)]),
    );
    const photos = await searchCommonsPhotos(orion, respond({ query: { pages } }));
    expect(photos).toHaveLength(3);
    expect(photos[0]).toEqual({
      id: "commons:File:사진 1.jpg",
      title: "사진 1",
      imageUrl: "https://upload.wikimedia.org/thumb/1.jpg",
      openUrl: "https://commons.wikimedia.org/wiki/File:1",
      credit: "김별",
      license: "CC BY 4.0",
    });
    expect(photos.map((p) => p.title)).toEqual(["사진 1", "사진 2", "사진 3"]);
  });

  test("사진이 아닌 파일(영상, 지도 등)은 건너뛴다", async () => {
    const pages = { a: page(1, "영상.ogv", "video/ogg"), b: page(2, "사진.jpg") };
    const photos = await searchCommonsPhotos(orion, respond({ query: { pages } }));
    expect(photos.map((p) => p.title)).toEqual(["사진"]);
  });

  test("천체사진이 없으면 별자리 이름으로 다시 찾되, 위치도와 png는 건너뛴다", async () => {
    const pages = {
      a: page(1, "Chamaeleon constellation map.jpg"),
      b: page(2, "Chamaeleon sky.png", "image/png"),
      c: page(3, "Chamaeleon sky.jpg"),
    };
    const fetcher = vi
      .fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({}) })
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ query: { pages } }) });
    const photos = await searchCommonsPhotos({ id: "Cha", nameEn: "Chamaeleon" }, fetcher);
    expect(new URL(fetcher.mock.calls[1][0] as string).searchParams.get("gsrsearch")).toBe(
      "Chamaeleon constellation",
    );
    expect(photos.map((p) => p.title)).toEqual(["Chamaeleon sky"]);
  });

  test("결과가 없으면 빈 목록이다", async () => {
    expect(await searchCommonsPhotos(orion, respond({ batchcomplete: "" }))).toEqual([]);
  });

  test("서버가 실패하면 오류를 던진다", async () => {
    await expect(searchCommonsPhotos(orion, respond({}, false))).rejects.toThrow();
  });
});
