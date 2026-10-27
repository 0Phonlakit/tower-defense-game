// Desktop app (Windows .exe): opens index.html in its own window. The game code is the same as the
// browser version; this file only makes the window, F11 full screen and the Exit button work.
//
// `--smoke[=dir]` loads the game and checks that it started with its font, fits the window without scrolling
// and has no console errors. It writes result.json + screenshot.png to dir if given, and quits with exit code 1
// if anything is wrong. Used by CI.
'use strict';
const { app, BrowserWindow, Menu, screen, shell } = require('electron');
const fs = require('fs');
const path = require('path');

const smokeArg = process.argv.find((a) => a.startsWith('--smoke'));

function createWindow() {
  // 1280x800, or smaller on small screens so the window opens fully on screen.
  const area = screen.getPrimaryDisplay().workAreaSize;
  const win = new BrowserWindow({
    width: Math.min(1280, area.width),
    height: Math.min(800, area.height),
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#15171c', // --bg in styles/base.css, so no white flash on start
    title: 'Rogue Tower Defense',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    show: false,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.once('ready-to-show', () => win.show());

  // F11 toggles full screen (there is no menu bar to do it).
  win.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      win.setFullScreen(!win.isFullScreen());
      event.preventDefault();
    }
  });
  // Links that would open a new window go to the system browser instead.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:/.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });

  if (smokeArg) smokeTest(win);
  win.loadFile(path.join(__dirname, '..', 'index.html'));
}

function smokeTest(win) {
  const errors = [];
  win.webContents.on('console-message', (e) => { if (e.level === 'error') errors.push(e.message); });
  win.webContents.on('did-fail-load', (e, code, desc) => errors.push(`load failed: ${desc}`));
  win.webContents.once('did-finish-load', () => setTimeout(async () => {
    const page = await win.webContents.executeJavaScript(`(async () => {
      const faces = await document.fonts.load('16px Mitr', 'Aกข');
      const de = document.documentElement;
      return {
        started: !!window.app,
        fontLoaded: faces.length > 0,
        window: [innerWidth, innerHeight],
        page: [de.scrollWidth, de.scrollHeight],
        screen: [screen.availWidth, screen.availHeight],
        pixelRatio: devicePixelRatio,
        // Elements that stick out of the window, to see what to fix when it does not fit.
        overflow: [...document.querySelectorAll('body *')].filter((el) => {
          const r = el.getBoundingClientRect();
          return r.width && getComputedStyle(el).display !== 'none' && (r.bottom > innerHeight + 0.5 || r.right > innerWidth + 0.5);
        }).slice(0, 10).map((el) => {
          const r = el.getBoundingClientRect();
          return \`\${el.id || el.className || el.tagName} \${Math.round(r.width)}x\${Math.round(r.height)} bottom=\${Math.round(r.bottom)}\`;
        }),
      };
    })()`);
    // Narrow windows (under 760px) stack the sidebar under the board and scroll on purpose.
    const fits = page.window[0] < 760 || (page.page[0] <= page.window[0] && page.page[1] <= page.window[1]);
    const result = { ...page, fits, bounds: win.getContentBounds(), errors };
    const dir = smokeArg.split('=')[1];
    if (dir) {
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result, null, 2));
      fs.writeFileSync(path.join(dir, 'screenshot.png'), (await win.webContents.capturePage()).toPNG());
    }
    console.log(JSON.stringify(result));
    app.exit(result.started && result.fontLoaded && fits && !errors.length ? 0 : 1);
  }, 3000));
}

// One copy at a time: a second launch focuses the open window (both would share the same save data).
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => {
    const win = BrowserWindow.getAllWindows()[0];
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });
  Menu.setApplicationMenu(null);
  app.whenReady().then(createWindow);
  // The menu's Exit button closes the window (window.close()), which ends the app.
  app.on('window-all-closed', () => app.quit());
}
