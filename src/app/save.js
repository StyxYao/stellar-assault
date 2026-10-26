// Persistent player data: campaign progress, settings, stats and best score.
// The browser uses localStorage; Electron mirrors the same object to an atomic JSON file.
var SAVE_VERSION = 1;
var SAVE_STORAGE_KEY = 'stellar-assault-save-v1';
var DEFAULT_SAVE = {
  version: SAVE_VERSION,
  campaign: { unlockedStage: 4, bestScore: 0, clears: 0, lastStage: 0 },
  ships: { vector: { bestScore: 0, skin: 'void_lance' }, aegis: { bestScore: 0, skin: 'orbital' }, phantom: { bestScore: 0, skin: 'quantum', locked: true }, selected: 'vector' },
  settings: { master: 1, bgm: 1, sfx: 1, fullscreen: false, language: 'zh', difficulty: 'normal', aegisTutorialSeen: false },
  stats: { runs: 0, gameOvers: 0, wins: 0 },
  updatedAt: 0
};
var SaveStore = {
  data: null,
  ready: false,
  adapter: null,
  cloud: null,
  timer: null,
  loadedFromFile: false
};

function cloneSave(obj) { return JSON.parse(JSON.stringify(obj)); }

function normalizeSave(raw) {
  var out = cloneSave(DEFAULT_SAVE);
  if (!raw || typeof raw !== 'object') return out;
  if (raw.campaign && typeof raw.campaign === 'object') {
    out.campaign.unlockedStage = Math.max(0, Math.min(4, Number(raw.campaign.unlockedStage) || 0));
    out.campaign.bestScore = Math.max(0, Number(raw.campaign.bestScore) || 0);
    out.campaign.clears = Math.max(0, Number(raw.campaign.clears) || 0);
    out.campaign.lastStage = Math.max(0, Math.min(4, Number(raw.campaign.lastStage) || 0));
  }
  if (raw.settings && typeof raw.settings === 'object') {
    out.settings.master = Math.max(0, Math.min(1, raw.settings.master == null ? 1 : Number(raw.settings.master)));
    out.settings.bgm = Math.max(0, Math.min(1, raw.settings.bgm == null ? 1 : Number(raw.settings.bgm)));
    out.settings.sfx = Math.max(0, Math.min(1, raw.settings.sfx == null ? 1 : Number(raw.settings.sfx)));
    out.settings.fullscreen = !!raw.settings.fullscreen;
    out.settings.language = raw.settings.language === 'en' ? 'en' : 'zh';
    out.settings.difficulty = raw.settings.difficulty === 'expert' ? 'expert' : 'normal';
    out.settings.aegisTutorialSeen = !!raw.settings.aegisTutorialSeen;
  }
  if (raw.ships && typeof raw.ships === 'object') {
    out.ships.vector.bestScore = Math.max(0, Number(raw.ships.vector && raw.ships.vector.bestScore) || 0);
    out.ships.aegis.bestScore = Math.max(0, Number(raw.ships.aegis && raw.ships.aegis.bestScore) || 0);
    out.ships.vector.skin = raw.ships.vector && raw.ships.vector.skin || 'void_lance';
    out.ships.aegis.skin = raw.ships.aegis && raw.ships.aegis.skin || 'orbital';
    out.ships.phantom = { bestScore: 0, skin: (raw.ships.phantom && raw.ships.phantom.skin) || 'quantum', locked: true };
    out.ships.selected = raw.ships.selected === 'aegis' ? 'aegis' : 'vector';
  } else {
    // v1 migration: the old campaign best belongs to VECTOR.
    out.ships.vector.bestScore = out.campaign.bestScore;
  }
  if (raw.stats && typeof raw.stats === 'object') {
    out.stats.runs = Math.max(0, Number(raw.stats.runs) || 0);
    out.stats.gameOvers = Math.max(0, Number(raw.stats.gameOvers) || 0);
    out.stats.wins = Math.max(0, Number(raw.stats.wins) || 0);
  }
  out.updatedAt = Math.max(0, Number(raw.updatedAt) || 0);
  out.version = SAVE_VERSION;
  return out;
}

function readLocalSave() {
  try {
    var raw = localStorage.getItem(SAVE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function applyGameSettings() {
  var st = SaveStore.data && SaveStore.data.settings;
  if (!st) return;
  if (typeof setAudioVolumes === 'function') setAudioVolumes(st.master, st.bgm, st.sfx);
}

function initSaveStore() {
  if (SaveStore.ready) return;
  SaveStore.data = normalizeSave(readLocalSave());
  SaveStore.ready = true;
  if (typeof setSelectedShip === 'function') setSelectedShip('vector', false);
  if (typeof initSelectedSkins === 'function') initSelectedSkins();
  applyGameSettings();
  try {
    if (window.desktopBridge && window.desktopBridge.save && window.desktopBridge.save.load) {
      window.desktopBridge.save.load().then(function(fileData) {
        if (!fileData) return;
        var file = normalizeSave(fileData);
        if (!SaveStore.data.updatedAt || file.updatedAt > SaveStore.data.updatedAt) {
          SaveStore.data = file;
          applyGameSettings();
        }
      }).catch(function() {});
    }
  } catch (e) {}
}

function persistSave(immediate) {
  if (!SaveStore.data) return;
  SaveStore.data.updatedAt = Date.now();
  try { localStorage.setItem(SAVE_STORAGE_KEY, JSON.stringify(SaveStore.data)); } catch (e) {}
  try {
    if (window.desktopBridge && window.desktopBridge.save && window.desktopBridge.save.write) {
      window.desktopBridge.save.write(SaveStore.data).catch(function() {});
    }
  } catch (e) {}
  try { if (CloudSavePort && CloudSavePort.push) CloudSavePort.push(SaveStore.data); } catch (e) {}
  if (immediate) return;
  if (SaveStore.timer) clearTimeout(SaveStore.timer);
  SaveStore.timer = setTimeout(function() { SaveStore.timer = null; }, 200);
}

function updateSetting(key, value) {
  if (!SaveStore.data) return;
  if (key === 'master' || key === 'bgm' || key === 'sfx') {
    SaveStore.data.settings[key] = Math.max(0, Math.min(1, Math.round(value * 10) / 10));
  } else if (key === 'fullscreen') {
    SaveStore.data.settings.fullscreen = !!value;
  } else if (key === 'language') {
    SaveStore.data.settings.language = value === 'en' ? 'en' : 'zh';
  } else if (key === 'difficulty') {
    SaveStore.data.settings.difficulty = value === 'expert' ? 'expert' : 'normal';
  }
  applyGameSettings();
  persistSave();
}

function recordRunEnd(won) {
  if (!SaveStore.data) return;
  var c = SaveStore.data.campaign;
  SaveStore.data.stats.runs++;
  if (won) {
    SaveStore.data.stats.wins++;
    c.clears++;
    c.unlockedStage = 4;
  } else {
    SaveStore.data.stats.gameOvers++;
  }
  c.bestScore = Math.max(c.bestScore, score || 0);
  var sid = (typeof player !== 'undefined' && player.ship) ? player.ship : 'vector';
  if (!SaveStore.data.ships[sid]) SaveStore.data.ships[sid] = { bestScore: 0 };
  SaveStore.data.ships[sid].bestScore = Math.max(SaveStore.data.ships[sid].bestScore || 0, score || 0);
  c.lastStage = stage;
  persistSave(true);
}

function recordScoreSnapshot() {
  if (!SaveStore.data) return;
  SaveStore.data.campaign.bestScore = Math.max(SaveStore.data.campaign.bestScore, score || 0);
  var sid = (typeof player !== 'undefined' && player.ship) ? player.ship : 'vector';
  if (!SaveStore.data.ships[sid]) SaveStore.data.ships[sid] = { bestScore: 0 };
  SaveStore.data.ships[sid].bestScore = Math.max(SaveStore.data.ships[sid].bestScore || 0, score || 0);
  SaveStore.data.campaign.lastStage = stage;
  persistSave();
}
function recordStageClear() {
  if (!SaveStore.data) return;
  SaveStore.data.campaign.unlockedStage = Math.max(SaveStore.data.campaign.unlockedStage, Math.min(4, stage + 1));
  SaveStore.data.campaign.lastStage = stage;
  SaveStore.data.campaign.bestScore = Math.max(SaveStore.data.campaign.bestScore, score || 0);
  persistSave();
}

window.__save = function() { return SaveStore.data; };
