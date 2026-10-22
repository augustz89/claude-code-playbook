import { expect, test } from "@playwright/test";

test("홈 화면이 열리고 서비스 이름과 입력 영역이 보인다", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveTitle("나의 오늘 밤 하늘");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "나의 오늘 밤 하늘"
  );
  await expect(
    page.getByRole("button", { name: "나의 오늘 밤 하늘" })
  ).toBeVisible();
});
