import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { NightSkyExplorer } from "../index";

// WebGL이 없는 테스트 환경에서는 지구본 라이브러리를 대신할 가짜를 쓴다. 외부 경계는 이것과 NASA API뿐이다.
vi.mock("globe.gl", () => {
  const chain: Record<string, unknown> = {};
  const self = new Proxy(chain, {
    get: (_t, prop) => (prop === "_destructor" ? () => {} : () => self),
  });
  return { default: () => () => self };
});

class FakeResizeObserver {
  observe() {}
  disconnect() {}
}

const NOON_SEOUL = new Date("2026-10-22T03:00:00Z");

const nasaResponse = (ids: string[]) => ({
  ok: true,
  status: 200,
  json: async () => ({
    collection: {
      items: ids.map((id) => ({
        data: [{ nasa_id: id, title: `사진 ${id}`, date_created: "2019-05-01T00:00:00Z" }],
        links: [{ href: `https://images-assets.nasa.gov/image/${id}/${id}~medium.jpg` }],
      })),
    },
  }),
});

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOON_SEOUL);
  vi.stubGlobal("ResizeObserver", FakeResizeObserver);
  vi.spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions").mockReturnValue({
    timeZone: "Asia/Seoul",
  } as Intl.ResolvedDateTimeFormatOptions);
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const timeInput = () => screen.findByLabelText(/현지 시각/) as Promise<HTMLInputElement>;

describe("첫 화면", () => {
  test("접속하면 사용자의 시간대 국가와 현재 현지 시각이 채워진다", async () => {
    render(<NightSkyExplorer />);
    expect((await timeInput()).value).toBe("12:00");
    expect((screen.getByLabelText("국가") as HTMLInputElement).value).toBe("한국");
    expect((screen.getByLabelText("날짜") as HTMLInputElement).value).toBe("2026-10-22");
    expect(screen.getByTestId("day-night")).toHaveTextContent("지금 낮이에요");
  });

  test("날짜는 과거 20년부터 미래 1년까지만 고를 수 있다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    const date = screen.getByLabelText("날짜");
    expect(date).toHaveAttribute("min", "2006-10-22");
    expect(date).toHaveAttribute("max", "2027-10-22");
  });

  test("지구 8개 행성의 보임 여부와 자전축 설명을 보여 준다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    const list = screen.getByRole("list", { name: "행성이 보이는지" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(7);
    expect(screen.getByTestId("season-text")).toHaveTextContent("봄이나 가을");
  });
});

describe("낮에 별자리를 보려고 할 때", () => {
  test("낮이라는 안내와 밤 10시로 바꾸는 버튼이 나온다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    expect(screen.getByText("낮에는 별자리를 못 봐요")).toBeInTheDocument();
    expect(screen.queryByTestId("constellation-count")).not.toBeInTheDocument();
  });

  test("밤 10시로 바꾸면 현지 22:00이 되고 별자리 목록이 채워진다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    fireEvent.click(screen.getByRole("button", { name: "밤 10시로 바꾸기" }));
    expect(((await timeInput()).value)).toBe("22:00");
    expect(screen.getByTestId("day-night")).toHaveTextContent("지금 밤이에요");
    expect(screen.getByTestId("constellation-count")).toHaveTextContent(/\d+개의 별자리/);
    // 10월 22일 밤 10시 서울에서는 페가수스자리와 카시오페이아자리가 높이 떠 있다.
    const list = screen.getByRole("list", { name: "보이는 별자리 목록" });
    expect(within(list).getByRole("button", { name: /페가수스자리/ })).toBeInTheDocument();
    expect(within(list).getByRole("button", { name: /카시오페이아자리/ })).toBeInTheDocument();
  });

  test("나의 오늘 밤 하늘 버튼을 누르면 현재 시각으로 돌아온다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    fireEvent.click(screen.getByRole("button", { name: "밤 10시로 바꾸기" }));
    expect((await timeInput()).value).toBe("22:00");
    fireEvent.click(screen.getByRole("button", { name: "나의 오늘 밤 하늘" }));
    await waitFor(async () => expect((await timeInput()).value).toBe("12:00"));
  });
});

describe("별자리 사진 팝업", () => {
  async function openCassiopeia() {
    render(<NightSkyExplorer />);
    await timeInput();
    fireEvent.click(screen.getByRole("button", { name: "밤 10시로 바꾸기" }));
    const list = await screen.findByRole("list", { name: "보이는 별자리 목록" });
    fireEvent.click(within(list).getByRole("button", { name: /카시오페이아자리/ }));
  }

  test("NASA 사진과 출처를 팝업으로 보여 준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nasaResponse(["A1", "B2"])));
    await openCassiopeia();
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByAltText("사진 A1")).toBeInTheDocument();
    expect(within(dialog).getByAltText("사진 B2")).toBeInTheDocument();
    expect(within(dialog).getByText("사진 출처: NASA")).toBeInTheDocument();
  });

  test("사진을 누르면 새 탭에서 원본 이미지가 열린다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nasaResponse(["A1"])));
    await openCassiopeia();
    const link = await screen.findByRole("link", { name: "사진 A1 새 탭에서 열기" });
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("href", "https://images-assets.nasa.gov/image/A1/A1~orig.jpg");
  });

  test("NASA 사진이 없으면 커먼즈 사진 3장과 촬영자, 라이선스를 보여 준다", async () => {
    const commons = {
      query: {
        pages: Object.fromEntries(
          [1, 2, 3, 4].map((i) => [
            String(i),
            {
              title: `File:별 ${i}.jpg`,
              index: i,
              imageinfo: [
                {
                  thumburl: `https://upload.wikimedia.org/${i}.jpg`,
                  descriptionurl: `https://commons.wikimedia.org/wiki/File:${i}`,
                  mime: "image/jpeg",
                  extmetadata: { LicenseShortName: { value: "CC BY 4.0" }, Artist: { value: "별지기" } },
                },
              ],
            },
          ]),
        ),
      },
    };
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string) => ({
        ok: true,
        status: 200,
        json: async () => (url.startsWith("https://images-api.nasa.gov") ? { collection: { items: [] } } : commons),
      })),
    );
    await openCassiopeia();
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByAltText("별 1")).toBeInTheDocument();
    expect(within(dialog).queryByAltText("별 4")).not.toBeInTheDocument();
    expect(within(dialog).getAllByText("촬영 별지기 · CC BY 4.0")).toHaveLength(3);
    expect(within(dialog).getByText("사진 출처: 위키미디어 커먼즈")).toBeInTheDocument();
    expect(within(dialog).getByRole("link", { name: "별 1 새 탭에서 열기" })).toHaveAttribute(
      "href",
      "https://commons.wikimedia.org/wiki/File:1",
    );
  });

  test("사진이 없으면 빈 화면 대신 안내를 보여 준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nasaResponse([])));
    await openCassiopeia();
    expect(await screen.findByText("보여 줄 사진이 아직 없어요")).toBeInTheDocument();
  });

  test("불러오기에 실패하면 안내와 다시 불러오기 버튼을 보여 준다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await openCassiopeia();
    expect(await screen.findByText("사진을 불러오지 못했어요")).toBeInTheDocument();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nasaResponse(["C3"])));
    fireEvent.click(screen.getByRole("button", { name: "다시 불러오기" }));
    expect(await screen.findByAltText("사진 C3")).toBeInTheDocument();
  });
});

describe("하늘 전체 별자리 지도", () => {
  const map = () => screen.getByRole("group", { name: "하늘 전체 별자리 지도" });
  const mapItem = (id: string) => map().querySelector(`[data-constellation="${id}"]`)!;

  test("88개 별자리가 모두 있고, 낮에는 모두 흐리게 표시된다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    expect(map().querySelectorAll("[data-constellation]")).toHaveLength(88);
    expect(map().querySelectorAll('[data-visible="true"]')).toHaveLength(0);
    expect(screen.getByText(/낮이라 보이는 별자리가 없어요/)).toBeInTheDocument();
  });

  test("서울 겨울 밤 10시에는 오리온자리가 밝게, 여름 별자리 거문고자리는 흐리게 표시된다", async () => {
    render(<NightSkyExplorer />);
    await timeInput();
    fireEvent.change(screen.getByLabelText("날짜"), { target: { value: "2026-01-15" } });
    fireEvent.click(await screen.findByRole("button", { name: "밤 10시로 바꾸기" }));
    await waitFor(() => expect(mapItem("Ori")).toHaveAttribute("data-visible", "true"));
    expect(mapItem("Lyr")).toHaveAttribute("data-visible", "false");
    const count = map().querySelectorAll('[data-visible="true"]').length;
    expect(screen.getByTestId("sky-map-count")).toHaveTextContent(`${count}개`);
  });

  test("낮에도 지도의 별자리를 누르면 사진 팝업이 열린다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(nasaResponse(["O1"])));
    render(<NightSkyExplorer />);
    await timeInput();
    fireEvent.click(within(map()).getByRole("button", { name: "오리온자리 사진 보기" }));
    const dialog = await screen.findByRole("dialog");
    expect(await within(dialog).findByAltText("사진 O1")).toBeInTheDocument();
  });
});
