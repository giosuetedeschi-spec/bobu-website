/**
 * BobuOS desktop feature checks. Each receives a Playwright `page` already
 * loaded on `/` and returns `{ checks: [...] }`.
 */

const ok = (name, cond, detail) => ({ name, ok: !!cond, detail: detail ?? null });

const DESKTOP = "[data-testid='bobuos-desktop']";
const WINDOW = "[data-testid='os-window']";

async function waitDesktop(page) {
  await page.waitForSelector(DESKTOP, { timeout: 15000 });
}

/** Opens an app by double-clicking its desktop icon and waits for the window. */
async function openIcon(page, id) {
  await page.locator(`[data-testid='desktop-icon-${id}']`).dblclick();
  await page.waitForSelector(WINDOW, { timeout: 10000 });
}

export const FEATURE_CHECKS = {
  async boot(page) {
    await waitDesktop(page);
    const icons = await page.locator("[data-testid^='desktop-icon-']").count();
    const folders = await page.locator("[data-testid^='desktop-folder-']").count();
    const taskbar = await page.locator("[data-testid='taskbar']").count();
    const clock = await page.locator("[data-testid='taskbar'] >> text=/\\d{1,2}:\\d{2}/").count();
    return {
      checks: [
        ok("desktop root renders", true),
        ok("app icons painted", icons >= 4, String(icons)),
        ok("game folders painted", folders >= 4, String(folders)),
        ok("taskbar present", taskbar === 1),
        ok("clock renders a time", clock > 0),
        ok("no windows open at boot", (await page.locator(WINDOW).count()) === 0),
      ],
    };
  },

  async "open-window"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    const count = await page.locator(WINDOW).count();
    const title = await page.locator(WINDOW).first().getAttribute("data-window-title");
    const taskbarBtn = await page.locator("[data-testid^='taskbar-app-']").count();
    return {
      checks: [
        ok("window opened", count === 1),
        ok("window titled Terminal", title === "Terminal", title),
        ok("taskbar entry created", taskbarBtn === 1),
      ],
    };
  },

  async "window-focus"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    await openIcon(page, "about");
    const zOf = async (title) =>
      Number(
        await page.locator(`${WINDOW}[data-window-title='${title}']`).evaluate((el) => getComputedStyle(el).zIndex),
      );
    const beforeTerminal = await zOf("Terminal");
    const beforeAbout = await zOf("About Bobu");
    await page.locator(`${WINDOW}[data-window-title='Terminal']`).locator("[data-testid='window-titlebar']").click();
    const afterTerminal = await zOf("Terminal");
    return {
      checks: [
        ok("second window opens above the first", beforeAbout > beforeTerminal, `${beforeAbout} > ${beforeTerminal}`),
        ok("clicking raises the background window", afterTerminal > beforeAbout, `${afterTerminal} > ${beforeAbout}`),
      ],
    };
  },

  async "window-move"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    const win = page.locator(WINDOW).first();
    const before = await win.boundingBox();
    const bar = win.locator("[data-testid='window-titlebar']");
    const barBox = await bar.boundingBox();
    await page.mouse.move(barBox.x + barBox.width / 2, barBox.y + barBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(barBox.x + barBox.width / 2 + 120, barBox.y + barBox.height / 2 + 80, { steps: 10 });
    await page.mouse.up();
    const after = await win.boundingBox();
    const dx = Math.round(after.x - before.x);
    const dy = Math.round(after.y - before.y);
    return {
      checks: [
        ok("window moved horizontally", Math.abs(dx - 120) <= 6, `dx=${dx}`),
        ok("window moved vertically", Math.abs(dy - 80) <= 6, `dy=${dy}`),
      ],
    };
  },

  async "window-maximize"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    const win = page.locator(WINDOW).first();
    const before = await win.boundingBox();
    await win.locator("[data-testid='window-maximize']").click();
    const maxed = await win.boundingBox();
    const flag = await win.getAttribute("data-maximized");
    await win.locator("[data-testid='window-maximize']").click();
    const restored = await win.boundingBox();
    return {
      checks: [
        ok("maximize grows the window", maxed.width > before.width, `${before.width} -> ${maxed.width}`),
        ok("maximize flag set", flag === "true"),
        ok("restore returns to original size", Math.abs(restored.width - before.width) < 2, `${restored.width} vs ${before.width}`),
      ],
    };
  },

  async "window-minimize"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    await page.locator(WINDOW).first().locator("[data-testid='window-minimize']").click();
    const hidden = await page.locator(WINDOW).count();
    const btn = page.locator("[data-testid^='taskbar-app-']").first();
    const flag = await btn.getAttribute("data-minimized");
    await btn.click();
    await page.waitForSelector(WINDOW, { timeout: 5000 });
    return {
      checks: [
        ok("minimize hides the window", hidden === 0),
        ok("taskbar entry marked minimized", flag === "true"),
        ok("taskbar click restores it", (await page.locator(WINDOW).count()) === 1),
      ],
    };
  },

  async "window-close"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    await page.locator(WINDOW).first().locator("[data-testid='window-close']").click();
    await page.waitForTimeout(150);
    return {
      checks: [
        ok("window removed", (await page.locator(WINDOW).count()) === 0),
        ok("taskbar entry removed", (await page.locator("[data-testid^='taskbar-app-']").count()) === 0),
      ],
    };
  },

  async "start-menu"(page) {
    await waitDesktop(page);
    await page.locator("[data-testid='start-button']").click();
    await page.waitForSelector("[data-testid='start-panel']", { timeout: 5000 });
    const items = await page.locator("[data-testid^='start-item-']").count();
    await page.locator("[data-testid='start-search']").fill("snake");
    await page.waitForTimeout(120);
    const filtered = await page.locator("[data-testid^='start-item-']").count();
    await page.locator("[data-testid='start-item-snake']").click();
    await page.waitForSelector(WINDOW, { timeout: 10000 });
    const title = await page.locator(WINDOW).first().getAttribute("data-window-title");
    return {
      checks: [
        ok("start panel opens", true),
        ok("lists every installed game", items >= 13, String(items)),
        ok("search filters the list", filtered > 0 && filtered < items, `${filtered} of ${items}`),
        ok("launching from the menu opens the game", title === "Snake", title),
      ],
    };
  },

  async terminal(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    const input = page.locator("[data-testid='terminal-input']");
    const body = page.locator("[data-testid='terminal-body']");
    const run = async (cmd) => {
      await input.fill(cmd);
      await input.press("Enter");
      await page.waitForTimeout(120);
      return body.innerText();
    };
    const help = await run("help");
    const ls = await run("ls");
    await run("cd games");
    const lsGames = await run("ls");
    const games = await run("games");
    const neofetch = await run("neofetch");
    const bogus = await run("definitelynotacommand");
    return {
      checks: [
        ok("help lists commands", /help/i.test(help) && help.length > 40),
        ok("ls shows home contents", /games\//.test(ls)),
        ok("cd changes directory", /snake|pong|abalone/i.test(lsGames)),
        ok("games lists the library", /Snake/.test(games) && /Abalone/.test(games)),
        ok("neofetch prints system info", /BobuOS/.test(neofetch)),
        ok("unknown command reports an error", /not found|unknown|command/i.test(bogus)),
      ],
    };
  },

  async "terminal-open"(page) {
    await waitDesktop(page);
    await openIcon(page, "terminal");
    const input = page.locator("[data-testid='terminal-input']");
    await input.fill("open snake");
    await input.press("Enter");
    await page.waitForTimeout(400);
    const titles = await page.locator(WINDOW).evaluateAll((els) => els.map((e) => e.getAttribute("data-window-title")));
    return {
      checks: [
        ok("`open snake` launched a second window", titles.length === 2, titles.join(", ")),
        ok("the new window is Snake", titles.includes("Snake"), titles.join(", ")),
      ],
    };
  },

  async files(page) {
    await waitDesktop(page);
    await openIcon(page, "files");
    const explorer = page.locator("[data-testid='explorer']");
    const rootText = await explorer.innerText();
    // Folders open on a single click; a double-click navigates in and then
    // lands the second click on whichever game card is now under the cursor.
    await page.locator("[data-testid='explorer-folder-Board Games']").click();
    await page.waitForTimeout(200);
    const games = await page.locator("[data-testid^='explorer-game-']").count();
    await page.locator("[data-testid='explorer-game-tris']").click();
    await page.waitForTimeout(400);
    const titles = await page.locator(WINDOW).evaluateAll((els) => els.map((e) => e.getAttribute("data-window-title")));
    return {
      checks: [
        ok("explorer lists folders", /Board Games/.test(rootText) && /Arcade/.test(rootText)),
        ok("drilling into a folder lists its games", games >= 4, String(games)),
        ok("clicking a game opens it", titles.includes("Tris"), titles.join(", ")),
      ],
    };
  },

  async wallpaper(page) {
    await waitDesktop(page);
    const root = page.locator(DESKTOP);
    const before = await root.getAttribute("data-wallpaper");
    await root.click({ button: "right", position: { x: 600, y: 400 } });
    await page.waitForSelector("[data-testid='context-menu']", { timeout: 5000 });
    const target = before === "kali" ? "debian" : "kali";
    await page.locator(`[data-testid='wallpaper-${target}']`).click();
    await page.waitForTimeout(200);
    const after = await root.getAttribute("data-wallpaper");
    const persisted = await page.evaluate(() => localStorage.getItem("bobuos-wallpaper"));
    return {
      checks: [
        ok("right-click opens the wallpaper menu", true),
        ok("wallpaper changes", after === target, `${before} -> ${after}`),
        ok("choice persisted to localStorage", persisted === target, persisted),
      ],
    };
  },

  async "game-iframe"(page) {
    await waitDesktop(page);
    await page.locator("[data-testid='start-button']").click();
    await page.waitForSelector("[data-testid='start-panel']");
    await page.locator("[data-testid='start-item-snake']").click();
    await page.waitForSelector("[data-testid='window-iframe']", { timeout: 10000 });
    const frameEl = await page.locator("[data-testid='window-iframe']").elementHandle();
    const frame = await frameEl.contentFrame();
    const loaded = await frame
      .waitForFunction(() => window.__GAME__?.ready === true, null, { timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    const src = await page.locator("[data-testid='window-iframe']").getAttribute("src");
    return {
      checks: [
        ok("iframe rendered with the game src", /games\/snake/.test(src), src),
        ok("game inside the iframe reaches ready", loaded),
      ],
    };
  },

  async "mobile-card"(page) {
    // Launched with a phone viewport by SiteHarness.checkFeature.
    await page.waitForSelector("[data-testid='mobile-card']", { timeout: 10000 });
    const text = await page.locator("[data-testid='mobile-card']").innerText();
    const desktop = await page.locator(DESKTOP).count();
    return {
      checks: [
        ok("mobile card renders", true),
        ok("desktop OS not rendered on phone", desktop === 0),
        ok("card links to the site sections", /Portfolio/i.test(text) && /CV/i.test(text)),
      ],
    };
  },
};
