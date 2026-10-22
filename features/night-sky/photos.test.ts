import { describe, expect, test, vi } from "vitest";

import { findConstellationPhotos } from "./photos";

const orion = { id: "Ori", nameEn: "Orion" };

const nasaBody = (ids: string[]) => ({
  collection: {
    items: ids.map((id) => ({
      data: [{ nasa_id: id, title: id }],
      links: [{ href: `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg` }],
    })),
  },
});
const commonsBody = {
  query: {
    pages: {
      "1": {
        title: "File:a.jpg",
        index: 1,
        imageinfo: [
          {
            thumburl: "https://upload.wikimedia.org/a.jpg",
            descriptionurl: "https://commons.wikimedia.org/wiki/File:a.jpg",
            mime: "image/jpeg",
            extmetadata: { LicenseShortName: { value: "CC0" }, Artist: { value: "별지기" } },
          },
        ],
      },
    },
  },
};

function router(nasa: unknown, commons: unknown, nasaOk = true) {
  return vi.fn(async (url: string) => {
    const isNasa = url.startsWith("https://images-api.nasa.gov");
    return {
      ok: isNasa ? nasaOk : true,
      status: 200,
      json: async () => (isNasa ? nasa : commons),
    };
  }) as unknown as typeof fetch & ReturnType<typeof vi.fn>;
}

describe("별자리 사진 찾기", () => {
  test("NASA 사진이 있으면 NASA 사진만 쓰고 커먼즈는 부르지 않는다", async () => {
    const fetcher = router(nasaBody(["A", "B"]), commonsBody);
    const result = await findConstellationPhotos(orion, fetcher);
    expect(result.source).toBe("nasa");
    expect(result.photos.map((p) => p.id)).toEqual(["A", "B"]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  test("NASA 사진이 없으면 커먼즈 사진으로 대신한다", async () => {
    const result = await findConstellationPhotos(orion, router(nasaBody([]), commonsBody));
    expect(result.source).toBe("commons");
    expect(result.photos).toHaveLength(1);
    expect(result.photos[0].license).toBe("CC0");
  });

  test("둘 다 없으면 커먼즈 출처의 빈 목록이다", async () => {
    const result = await findConstellationPhotos(orion, router(nasaBody([]), {}));
    expect(result).toEqual({ source: "commons", photos: [] });
  });

  test("NASA 검색이 실패하면 커먼즈로 넘어가지 않고 오류를 던진다", async () => {
    const fetcher = router({}, commonsBody, false);
    await expect(findConstellationPhotos(orion, fetcher)).rejects.toThrow();
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
