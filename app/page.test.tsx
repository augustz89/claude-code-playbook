import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import Home from "@/app/page";

// 지구본은 브라우저의 WebGL이 필요해 이 테스트에서는 불러오지 않는다.
vi.mock("globe.gl", () => ({ default: () => () => ({}) }));

test("홈 화면은 서비스 이름과 입력 영역을 보여준다", () => {
  render(<Home />);

  expect(
    screen.getByRole("heading", { level: 1, name: "나의 오늘 밤 하늘" })
  ).toBeInTheDocument();
});
