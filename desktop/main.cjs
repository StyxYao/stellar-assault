'use strict';

const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const DEFAULT_WIDTH = 720;
const DEFAULT_HEIGHT = 1280;
const MIN_WIDTH = 480;
const MIN_HEIGHT = 854;

app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');
app.commandLine.appendSwitch('disable-features', 'CalculateNativeWinOcclusion');

let win = null;
let statePath = null;
let savePath = null;
let fullscreenState = false;
let lanServer = null;
let lanHost = '127.0.0.1';
const isPackaged = app.isPackaged;
const distRoot = isPackaged ? path.join(process.resourcesPath, 'dist') : path.join(__dirname, '..', 'dist');
const lanModulePath = isPackaged ? path.join(process.resourcesPath, 'tools', 'lan_server.mjs') : path.join(__dirname, '..', 'tools', 'lan_server.mjs');

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return {};
  }
}

function writeState() {
  if (!win || win.isDestroyed()) return;
  try {
    const state = readState();
    if (!isWindowFullscreen()) {
      const b = win.getBounds();
      Object.assign(state, { x: b.x, y: b.y, width: b.width, height: b.height });
    }
    state.fullscreen = isWindowFullscreen();
    fs.mkdirSync(path.dirname(statePath), { recursive: true });
    fs.writeFileSync(statePath, JSON.stringify(state, null, 2));
  } catch (e) {
    console.warn('window state save failed', e.message);
  }
}

function visibleBounds(state) {
  const requested = Math.max(MIN_WIDTH, Math.min(1600, Number(state.width) || DEFAULT_WIDTH));
  const display = screen.getDisplayMatching({ x: state.x || 0, y: state.y || 0, width: requested, height: Math.round(requested * 16 / 9) });
  const area = display.workArea;
  // Fit the 9:16 content inside the current display work area.
  const maxWidth = Math.max(MIN_WIDTH, Math.floor((area.height - 24) * 9 / 16));
  const width = Math.max(MIN_WIDTH, Math.min(requested, maxWidth, 1600));
  const height = Math.max(MIN_HEIGHT, Math.round(width * 16 / 9));
  let x = Number.isFinite(state.x) ? state.x : Math.round(area.x + (area.width - width) / 2);
  let y = Number.isFinite(state.y) ? state.y : Math.round(area.y + (area.height - height) / 2);
  x = Math.max(area.x, Math.min(area.x + area.width - width, x));
  y = Math.max(area.y, Math.min(area.y + area.height - height, y));
  return { x, y, width, height };
}

function isWindowFullscreen() {
  return !!(win && fullscreenState);
}

function setWindowFullscreen(next) {
  if (!win) return false;
  fullscreenState = !!next;
  if (process.platform === 'darwin') win.setSimpleFullScreen(fullscreenState);
  else win.setFullScreen(fullscreenState);
  return fullscreenState;
}

function createWindow() {
  const saved = readState();
  const bounds = visibleBounds(saved);
  win = new BrowserWindow({
    ...bounds,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    useContentSize: true,
    resizable: true,
    backgroundColor: '#03050a',
    title: 'STELLAR ASSAULT',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
      devTools: process.argv.includes('--dev')
    }
  });

  win.setAspectRatio(9 / 16);
  win.setMenuBarVisibility(false);
  if (lanServer) win.loadURL(`http://${lanHost}:${lanServer.httpPort}/index.html`);
  else win.loadFile(path.join(distRoot, 'index.html'));
  win.once('ready-to-show', () => { win.show(); if (saved.fullscreen) setWindowFullscreen(true); });
  win.on('resize', writeState);
  win.on('move', writeState);
  win.on('close', writeState);
  win.on('enter-full-screen', () => { fullscreenState = true; });
  win.on('leave-full-screen', () => { fullscreenState = false; });

  win.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    const key = String(input.key || '');
    if (key === 'F11' || (key === 'Enter' && input.alt)) {
      event.preventDefault();
      setWindowFullscreen(!isWindowFullscreen());
    }
    if (key === 'F12' && process.argv.includes('--dev')) {
      event.preventDefault();
      win.webContents.toggleDevTools();
    }
  });
}

function readSaveFile() {
  try { return JSON.parse(fs.readFileSync(savePath, 'utf8')); } catch { return null; }
}
function writeSaveFile(data) {
  try {
    if (!data || typeof data !== 'object') return false;
    const tmp = savePath + '.tmp';
    fs.mkdirSync(path.dirname(savePath), { recursive: true });
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, savePath);
    return true;
  } catch (e) {
    console.warn('save write failed', e.message);
    return false;
  }
}
ipcMain.handle('save:load', () => readSaveFile());
ipcMain.handle('save:write', (_event, data) => writeSaveFile(data));
ipcMain.handle('window:toggle-fullscreen', () => setWindowFullscreen(!isWindowFullscreen()));
ipcMain.handle('window:is-fullscreen', () => isWindowFullscreen());
ipcMain.handle('app:quit', () => { app.quit(); });

app.whenReady().then(async () => {
  try {
    const lan = await import(lanModulePath);
    lanServer = lan.startLanServer(8785, 8786);
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const n of nets[name] || []) {
        if (n.family === 'IPv4' && !n.internal) { lanHost = n.address; break; }
      }
      if (lanHost !== '127.0.0.1') break;
    }
  } catch (e) {
    console.warn('LAN server unavailable, using file mode:', e.message);
    lanServer = null;
  }
  statePath = path.join(app.getPath('userData'), 'window-state.json');
  savePath = path.join(app.getPath('userData'), 'save.json');
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
