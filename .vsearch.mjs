import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:5173/Movies-App";
const OUT = process.argv[2];
mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--hide-scrollbars"],
  defaultViewport: { width: 1512, height: 950 },
});

const page = await browser.newPage();
await page.evaluateOnNewDocument(() => localStorage.setItem("theme", "dark"));
await page.goto(BASE + "/", { waitUntil: "networkidle2", timeout: 60000 });
await new Promise((r) => setTimeout(r, 3600));

// Open the navbar search and type, exactly as in the reported screenshot
await page.evaluate(() => document.querySelector(".navbar-search-btn")?.click());
await page.waitForSelector(".navbar-search-input", { timeout: 10000 });
await page.click(".navbar-search-input");
await page.type(".navbar-search-input", "home", { delay: 60 });
await new Promise((r) => setTimeout(r, 700));

const styles = await page.evaluate(() => {
  const input = document.querySelector(".navbar-search-input");
  const row = document.querySelector(".navbar-search-input-row");
  const ci = getComputedStyle(input);
  const cr = getComputedStyle(row);
  return {
    inputOutline: `${ci.outlineWidth} ${ci.outlineStyle} ${ci.outlineColor}`,
    rowBorder: `${cr.borderTopWidth} ${cr.borderTopStyle} ${cr.borderTopColor}`,
    focused: document.activeElement?.className?.toString().slice(0, 40),
  };
});
console.log(JSON.stringify(styles, null, 2));

await page.screenshot({ path: `${OUT}/search-focus.png`, clip: { x: 1000, y: 8, width: 512, height: 100 } });

// Keyboard focus on a button must still show the ring
await page.keyboard.press("Escape");
await new Promise((r) => setTimeout(r, 400));
await page.evaluate(() => document.querySelector(".navbar-link")?.focus());
const btn = await page.evaluate(() => {
  const cs = getComputedStyle(document.querySelector(".navbar-link"));
  return `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`;
});
console.log("navbar-link outline (focus-visible via .focus()):", btn);

await browser.close();
