import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(msg.text());
});

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle", timeout: 30000 });
await page.waitForTimeout(1200);
await page.getByRole("button", { name: "開始遊戲" }).click();
await page.waitForFunction(() => window.__controlsTest && window.__chaoGang);
await page.waitForTimeout(400);
await page.screenshot({ path: "/workspace/screenshots/playing.png" });

await page.evaluate(() => {
  window.__controlsTest.enterNearestVehicle();
  window.__controlsTest.setVehiclePose(23, 0, 0, 16);
  window.__controlsTest.setKeys([]);
});
await page.waitForTimeout(120);

const yaw0 = await page.evaluate(() => window.__controlsTest.getYaw());
await page.evaluate(() => window.__controlsTest.setSteer(1));
await page.waitForTimeout(450);
const yawA = await page.evaluate(() => window.__controlsTest.getYaw());
const speedA = await page.evaluate(() => window.__controlsTest.getSpeed());

await page.evaluate(() => {
  window.__controlsTest.setSteer(0);
  window.__controlsTest.setVehiclePose(23, 0, 0, 16);
});
await page.waitForTimeout(80);
const yaw1 = await page.evaluate(() => window.__controlsTest.getYaw());
await page.evaluate(() => window.__controlsTest.setSteer(-1));
await page.waitForTimeout(450);
const yawD = await page.evaluate(() => window.__controlsTest.getYaw());
const speedD = await page.evaluate(() => window.__controlsTest.getSpeed());
await page.evaluate(() => {
  window.__controlsTest.setSteer(0);
  window.__controlsTest.setKeys([]);
});

const dA = wrap(yawA - yaw0);
const dD = wrap(yawD - yaw1);

await page.evaluate(() => window.__controlsTest.setWanted(2));
await page.waitForTimeout(500);
await page.screenshot({ path: "/workspace/screenshots/wanted.png" });

const hudText = await page.locator("body").innerText();
const after = await page.evaluate(() => window.__chaoGang.getState());

const result = {
  errors,
  entered: after.inVehicle,
  speedA,
  speedD,
  yaw0,
  yawA,
  yaw1,
  yawD,
  dA,
  dD,
  aTurnsLeft: dA > 0.05,
  dTurnsRight: dD < -0.05,
  after,
  hudHasWanted: /通緝|★/.test(hudText),
  hudHasHealth: hudText.includes("生命值"),
  hudHasSpeed: hudText.includes("時速"),
};

console.log(JSON.stringify(result, null, 2));
await browser.close();

if (errors.length) process.exit(1);
if (!result.aTurnsLeft || !result.dTurnsRight) {
  console.error("CONTROLS FAIL");
  process.exit(2);
}
