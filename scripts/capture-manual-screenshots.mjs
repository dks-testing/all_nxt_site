import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";

const root = process.cwd();
const output = join(root, "docs", "user-manual-images");
await mkdir(output, { recursive: true });

const envText = await readFile(join(root, ".env"), "utf8");
const env = Object.fromEntries(envText.split(/\r?\n/).map((line) => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (!match) return [];
  return [match[1].trim(), match[2].trim().replace(/^['"]|['"]$/g, "")];
}).filter((entry) => entry.length));
const email = env.SUPER_ADMIN_EMAIL || env.ADMIN_EMAIL;
const password = env.SUPER_ADMIN_PASSWORD || env.ADMIN_PASSWORD;
if (!email || !password) throw new Error("Admin credentials are missing from .env");

const browserPath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const profile = join(tmpdir(), `shop-platform-manual-${Date.now()}`);
const browser = spawn(browserPath, [
  "--headless=new",
  "--remote-debugging-pipe",
  `--user-data-dir=${profile}`,
  "--disable-gpu",
  "--disable-gpu-compositing",
  "--disable-gpu-sandbox",
  "--use-gl=swiftshader",
  "--enable-unsafe-swiftshader",
  "--no-sandbox",
  "--no-first-run",
  "--no-default-browser-check",
  "--window-size=1440,1000",
  "http://localhost:3001/login",
], { stdio: ["ignore", "ignore", "inherit", "pipe", "pipe"] });

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
let sequence = 0;
const pending = new Map();
let readBuffer = Buffer.alloc(0);
browser.stdio[4].on("data", (chunk) => {
  readBuffer = Buffer.concat([readBuffer, chunk]);
  let boundary;
  while ((boundary = readBuffer.indexOf(0)) >= 0) {
    const raw = readBuffer.subarray(0, boundary).toString("utf8");
    readBuffer = readBuffer.subarray(boundary + 1);
    if (!raw) continue;
    const message = JSON.parse(raw);
    if (!message.id) continue;
    const handler = pending.get(message.id);
    if (!handler) continue;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
  }
});
let sessionId;
function command(method, params = {}, browserCommand = false) {
  const id = ++sequence;
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
    browser.stdio[3].write(`${JSON.stringify({ id, method, params, ...(!browserCommand && sessionId ? { sessionId } : {}) })}\0`);
  });
}
async function evaluate(expression) {
  const result = await command("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  return result.result.value;
}
async function navigate(path) {
  await command("Page.navigate", { url: `http://localhost:3001${path}` });
  await sleep(1400);
}
async function capture(name, preserveScroll = false) {
  if (!preserveScroll) await evaluate("window.scrollTo(0, 0)");
  const result = await command("Page.captureScreenshot", { format: "png", captureBeyondViewport: false, fromSurface: true });
  await writeFile(join(output, `${name}.png`), Buffer.from(result.data, "base64"));
}

try {
  await sleep(500);
  const targetList = await command("Target.getTargets", {}, true);
  const pageTarget = targetList.targetInfos.find((target) => target.type === "page");
  if (!pageTarget) throw new Error("Could not find the browser page");
  sessionId = (await command("Target.attachToTarget", { targetId: pageTarget.targetId, flatten: true }, true)).sessionId;
  await command("Page.enable");
  await command("Runtime.enable");
  await command("Emulation.setDeviceMetricsOverride", { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await navigate("/login");
  await evaluate(`(() => {
    const email = document.querySelector('input[name="email"]');
    const password = document.querySelector('input[name="password"]');
    email.value = ${JSON.stringify(email)};
    password.value = ${JSON.stringify(password)};
    email.dispatchEvent(new Event('input', { bubbles: true }));
    password.dispatchEvent(new Event('input', { bubbles: true }));
    document.querySelector('form').requestSubmit();
  })()`);
  await sleep(2200);
  const currentUrl = await evaluate("location.href");
  if (currentUrl.includes("/login")) throw new Error("The admin login did not succeed");

  await capture("01-sites-dashboard");
  const sitePath = await evaluate(`Array.from(document.querySelectorAll('a[href^="/sites/"]')).map((link) => link.getAttribute('href')).find((href) => /^\\/sites\\/[a-f0-9-]{36}$/.test(href))`);
  if (!sitePath) throw new Error("No site was available for the manual screenshots");
  const siteId = sitePath.split("/")[2];
  const pages = [
    ["02-site-overview", `/sites/${siteId}`],
    ["03-global-settings", `/sites/${siteId}/global`],
    ["04-business-info", `/sites/${siteId}/business`],
    ["05-branding", `/sites/${siteId}/branding`],
    ["06-media-library", `/sites/${siteId}/media`],
    ["07-pages", `/sites/${siteId}/pages`],
    ["09-header-footer", `/sites/${siteId}/navigation`],
    ["10-services", `/sites/${siteId}/c/services`],
    ["11-booking", `/sites/${siteId}/booking`],
    ["12-integrations", `/sites/${siteId}/integrations`],
  ];
  for (const [name, path] of pages) {
    await navigate(path);
    await capture(name);
    if (name === "05-branding") {
      await evaluate(`window.scrollTo(0, 1250)`);
      await sleep(500);
      await capture("05b-branding-svg-controls", true);
      await evaluate(`window.scrollTo(0, 2400)`);
      await sleep(500);
      await capture("05c-branding-trust-icons", true);
    }
    if (name === "07-pages") {
      const pagePath = await evaluate(`document.querySelector('a[href^="/sites/${siteId}/pages/"]')?.getAttribute('href')`);
      if (pagePath) {
        await navigate(pagePath);
        await evaluate(`(() => { const section = document.querySelectorAll('details')[1]; if (section) section.open = true; })()`);
        await sleep(4500);
        await capture("08-section-editor-live-preview");
      }
    }
  }
  process.stdout.write(`Captured ${pages.length + 2} screenshots.\n`);
} finally {
  browser.kill();
}
