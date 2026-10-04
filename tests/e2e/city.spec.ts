import { test, expect } from "@playwright/test";
import { mkdir } from "node:fs/promises";
test("start, vehicle steering, pause and resume", async ({ page, isMobile }, info) => {
  const errors: string[] = []; page.on("pageerror", e => errors.push(e.message));
  await page.goto("/?qa=1", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(() => !!window.__controlsTest);
  await page.getByRole("button", { name: "開始遊戲", exact: true }).click();
  await expect(page.getByRole("button", { name: "暫停", exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.__controlsTest!.enterNearestVehicle!())).toBe(true);
  for (const [key, sign] of [["KeyA", 1], ["KeyD", -1]] as const) {
    await page.evaluate(() => window.__controlsTest!.setVehiclePose!(23, -115, 0, 12));
    await page.evaluate(k => window.__controlsTest!.setKeys!(["KeyW", k]), key);
    // Wait for a simulated turn, not a fixed wall-clock delay on software GPUs.
    await expect.poll(async () => (await page.evaluate(() => window.__controlsTest!.getYaw())) * sign).toBeGreaterThan(0.03);
    await page.evaluate(() => window.__controlsTest!.setKeys!([]));
  }
  // Park away from traffic so pause/touch assertions cannot pass through a respawn.
  await page.evaluate(() => {
    window.__controlsTest!.setWanted!(0);
    window.__controlsTest!.setVehiclePose!(23, -115, 0, 0);
  });
  await page.evaluate(() => document.exitPointerLock?.());
  await page.waitForFunction(() => !document.pointerLockElement);
  await page.getByRole("button", { name: "暫停", exact: true }).click();
  await expect(page.getByRole("heading", { name: "遊戲暫停" })).toBeVisible();
  await page.getByRole("button", { name: "繼續遊戲", exact: true }).click();
  await expect(page.getByRole("heading", { name: "遊戲暫停" })).toBeHidden();
  if (isMobile) {
    const messages = await page.getByTestId("game-messages").boundingBox();
    const controls = await page.getByTestId("touch-actions").boundingBox();
    expect(messages && controls && messages.y + messages.height <= controls.y).toBe(true);
    expect(await page.evaluate(() => window.__controlsTest!.getMode!())).toBe("vehicle");
    await page.getByRole("button", { name: "E", exact: true }).tap();
    await expect.poll(() => page.evaluate(() => window.__controlsTest!.getMode!())).toBe("foot");
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await mkdir("screenshots", { recursive: true }); await page.screenshot({ path: `screenshots/${info.project.name}.png` });
});
