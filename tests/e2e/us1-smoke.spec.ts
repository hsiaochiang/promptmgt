import { test, expect } from "@playwright/test";

test.describe("US1 smoke", () => {
  test("workspace tabs can switch without blocking", async ({ page }) => {
    await page.goto("/");

    const tablist = page.getByRole("tablist", { name: "Workspace Tabs" });
    await expect(tablist).toBeVisible();

    const projectsTab = page.getByTestId("workspace-tab-projects");
    const promptsTab = page.getByTestId("workspace-tab-prompts");
    const scratchpadTab = page.getByTestId("workspace-tab-scratchpad");

    // RootPathAlert 可能不一定出現（依環境/rootPath 狀態），但即使出現也不得阻擋操作
    const rootPathAlert = page.getByTestId("rootpath-alert");
    if (await rootPathAlert.count()) {
      // 不強制要求顯示，只要存在就確保不是把互動擋住
      // eslint-disable-next-line playwright/no-conditional-in-test
      await expect(rootPathAlert.first()).toBeVisible();
    }

    // 初始狀態不要求特定 tab，但必須有一個 tab 被選取
    await expect(page.getByRole("tab", { selected: true })).toHaveCount(1);

    await promptsTab.click();
    await expect(promptsTab).toHaveAttribute("aria-selected", "true");

    await scratchpadTab.click();
    await expect(scratchpadTab).toHaveAttribute("aria-selected", "true");

    await projectsTab.click();
    await expect(projectsTab).toHaveAttribute("aria-selected", "true");
  });
});
