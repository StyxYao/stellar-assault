// Pause-menu settings. Values live in SaveStore.settings and persist immediately.
var settingsOpen = false;
var settingsIndex = 0;
var SETTINGS_ITEMS = [
  { key: 'master', label: 'MASTER', type: 'volume' },
  { key: 'bgm', label: 'BGM', type: 'volume' },
  { key: 'sfx', label: 'SFX', type: 'volume' },
  { key: 'fullscreen', label: 'FULLSCREEN', type: 'toggle' },
  { key: 'back', label: 'BACK', type: 'back' }
];

function settingsData() {
  return (SaveStore && SaveStore.data && SaveStore.data.settings) || { master: 1, bgm: 1, sfx: 1, fullscreen: false };
}

function openSettings() {
  if (!desktopPaused) return;
  settingsOpen = true;
  settingsIndex = 0;
}

function closeSettings() {
  settingsOpen = false;
}

function settingsMove(delta) {
  settingsIndex = Math.max(0, Math.min(SETTINGS_ITEMS.length - 1, settingsIndex + delta));
}

function settingsAdjust(delta) {
  var item = SETTINGS_ITEMS[settingsIndex];
  var st = settingsData();
  if (item.type === 'volume') {
    var next = Math.max(0, Math.min(1, (Number(st[item.key]) || 0) + delta * 0.1));
    updateSetting(item.key, next);
  }
}

function settingsActivate() {
  var item = SETTINGS_ITEMS[settingsIndex];
  if (item.type === 'back') { closeSettings(); return; }
  if (item.type === 'toggle' && item.key === 'fullscreen') {
    if (window.desktopBridge && window.desktopBridge.toggleFullscreen) {
      window.desktopBridge.toggleFullscreen().then(function(v) {
        updateSetting('fullscreen', !!v);
      }).catch(function() {});
    }
  }
}

function settingsAt(p) {
  if (!settingsOpen) return '';
  var startY = H * 0.32, gap = 48;
  for (var i = 0; i < SETTINGS_ITEMS.length; i++) {
    var y = startY + i * gap;
    if (p.y >= y - 24 && p.y <= y + 14) {
      var item = SETTINGS_ITEMS[i];
      if (item.type === 'volume') return { i: i, zone: p.x < W / 2 ? -1 : 1 };
      return { i: i, zone: 0 };
    }
  }
  return '';
}
function settingsTap(p) {
  var hit = settingsAt(p);
  if (!hit) return false;
  settingsIndex = hit.i;
  var item = SETTINGS_ITEMS[hit.i];
  if (item.type === 'volume') settingsAdjust(hit.zone);
  else settingsActivate();
  return true;
}

function drawSettingsPanel() {
  if (!settingsOpen) return;
  var st = settingsData();
  ctx.save();
  ctx.fillStyle = 'rgba(2,6,14,0.82)';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(159,232,255,0.55)';
  ctx.lineWidth = 1;
  ctx.strokeRect(18, H * 0.16, W - 36, H * 0.58);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffffff';
  ctx.font = '600 28px Orbitron, Arial, sans-serif';
  ctx.fillText('SETTINGS', W / 2, H * 0.23);
  var startY = H * 0.32, gap = 48;
  for (var i = 0; i < SETTINGS_ITEMS.length; i++) {
    var item = SETTINGS_ITEMS[i];
    var y = startY + i * gap;
    var sel = i === settingsIndex;
    if (sel) {
      ctx.fillStyle = 'rgba(90,160,220,0.18)';
      ctx.fillRect(40, y - 24, W - 80, 34);
    }
    ctx.fillStyle = sel ? '#ffffff' : '#9fb6cf';
    ctx.font = '600 14px Orbitron, Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(item.label, 54, y);
    ctx.textAlign = 'right';
    if (item.type === 'volume') {
      var v = Math.round((Number(st[item.key]) || 0) * 100);
      ctx.fillStyle = sel ? '#9fe8ff' : '#8fb8ca';
      ctx.fillText('−  ' + v + '%  +', W - 54, y);
    } else if (item.key === 'fullscreen') {
      ctx.fillStyle = sel ? '#9fe8ff' : '#8fb8ca';
      ctx.fillText(st.fullscreen ? 'ON' : 'OFF', W - 54, y);
    } else {
      ctx.fillStyle = sel ? '#ffd27a' : '#8fb8ca';
      ctx.fillText('ENTER', W - 54, y);
    }
  }
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8fb8ca';
  ctx.font = '13px Rajdhani, Arial, sans-serif';
  ctx.fillText('TAP −/+ ADJUST · TAP BACK · ESC', W / 2, H * 0.70);
  ctx.textAlign = 'left';
  ctx.restore();
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}
