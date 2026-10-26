// LAN co-op: WebSocket room relay + host canvas stream + guest input.
// Host can either play P1 (hostp1) or be room-only (room, P1/P2 join separately).
var lanSocket = null, lanRoom = '', lanRole = '', lanHostMode = 'hostp1';
var lanSlots = [false, false], lanFrameTimer = null, lanInputTimer = null;
var lanClientMode = false, lanClientKeys = Object.create(null);
var lanClientPending = { primary: false, secondary: false };
var lanPadPrev = { a: false, b: false };
var lanOverlay = null, lanVideo = null, lanStatus = null, lanRoomLabel = null;
var lanStartBtn = null, lanCodeInput = null, lanLinkEl = null, lanSlotStatus = null;

function lanWsUrl() {
  var proto = location.protocol === 'https:' ? 'wss:' : 'ws:';
  var port = '8786';
  try { var q = new URLSearchParams(location.search); if (q.get('wsport')) port = q.get('wsport'); } catch (e) {}
  return proto + '//' + location.hostname + ':' + port;
}

function lanEl(tag, css, text) {
  var e = document.createElement(tag);
  if (css) e.style.cssText = css;
  if (text != null) e.textContent = text;
  return e;
}

function lanInviteLink() {
  if (!lanRoom) return '';
  var q = '?lanclient=1&lanjoin=' + encodeURIComponent(lanRoom);
  try { var p = new URLSearchParams(location.search).get('wsport'); if (p) q += '&wsport=' + encodeURIComponent(p); } catch (e) {}
  return location.origin + location.pathname + q;
}

function lanMakeOverlay(client) {
  if (lanOverlay) return;
  lanOverlay = lanEl('div', 'position:fixed;inset:0;z-index:9999;background:rgba(1,4,10,0.9);display:flex;align-items:center;justify-content:center;font-family:monospace;color:#dff8ff;');
  var box = lanEl('div', 'width:min(460px,90vw);background:#071624;border:1px solid #5d8fa8;padding:20px;box-sizing:border-box;');
  box.appendChild(lanEl('div', 'font:900 19px Arial Black,Arial;color:#eaf8ff;margin-bottom:4px;', client ? 'LAN CLIENT' : 'LAN ROOM'));
  box.appendChild(lanEl('div', 'font:10px monospace;color:#7f9bb0;margin-bottom:14px;', client ? 'JOIN P1 OR P2' : 'HOST ROOM · P1/P2 JOIN SEPARATELY'));
  lanStatus = lanEl('div', 'font:11px monospace;color:#9fe8ff;min-height:18px;margin-bottom:10px;', 'NOT CONNECTED');
  box.appendChild(lanStatus);
  if (client) {
    lanCodeInput = lanEl('input', 'width:100%;box-sizing:border-box;padding:10px;background:#03111e;border:1px solid #31536a;color:#fff;font:16px monospace;letter-spacing:6px;text-align:center;margin-bottom:8px;');
    lanCodeInput.maxLength = 4; lanCodeInput.placeholder = 'ROOM CODE';
    box.appendChild(lanCodeInput);
    lanStartBtn = lanEl('button', 'width:100%;padding:11px;background:#123a4f;border:1px solid #9fe8ff;color:#eaf8ff;font:700 12px monospace;cursor:pointer;', 'JOIN');
    lanStartBtn.onclick = lanJoin; box.appendChild(lanStartBtn);
  } else {
    lanRoomLabel = lanEl('div', 'font:900 34px monospace;color:#ffd36b;letter-spacing:8px;text-align:center;margin:6px 0 10px;', '----');
    box.appendChild(lanRoomLabel);
    lanLinkEl = lanEl('div', 'font:9px monospace;color:#7fb0c6;word-break:break-all;margin-bottom:8px;', '');
    box.appendChild(lanLinkEl);
    var copy = lanEl('button', 'width:100%;padding:7px;background:#081824;border:1px solid #31536a;color:#b8d9e8;font:10px monospace;cursor:pointer;margin-bottom:10px;', 'COPY CLIENT LINK');
    copy.onclick = function () {
      var link = lanInviteLink(); if (!link) return;
      try { navigator.clipboard.writeText(link); } catch (e) {}
      if (lanStatus) lanStatus.textContent = 'LINK COPIED';
    };
    box.appendChild(copy);
    lanSlotStatus = lanEl('div', 'font:11px monospace;color:#9fe8ff;min-height:18px;margin-bottom:8px;', 'P1: —   P2: —');
    box.appendChild(lanSlotStatus);
    var b1 = lanEl('button', 'width:100%;padding:9px;background:#123a4f;border:1px solid #9fe8ff;color:#eaf8ff;font:700 11px monospace;cursor:pointer;margin-bottom:6px;', 'CREATE HOST-AS-P1 ROOM');
    b1.onclick = function () { lanCreate('hostp1'); }; box.appendChild(b1);
    var b2 = lanEl('button', 'width:100%;padding:9px;background:#1a2f24;border:1px solid #8dffb0;color:#c9ffd8;font:700 11px monospace;cursor:pointer;margin-bottom:6px;', 'CREATE 2P ROOM (HOST ONLY)');
    b2.onclick = function () { lanCreate('room'); }; box.appendChild(b2);
    lanStartBtn = lanEl('button', 'width:100%;padding:10px;background:#3b2b0e;border:1px solid #ffd36b;color:#ffe7b0;font:700 12px monospace;cursor:pointer;margin-bottom:6px;', 'WAITING FOR PLAYERS');
    lanStartBtn.disabled = true; lanStartBtn.onclick = lanStartHost; box.appendChild(lanStartBtn);
  }
  var close = lanEl('button', 'width:100%;padding:7px;background:#081824;border:1px solid #31536a;color:#9fb6cf;font:10px monospace;cursor:pointer;', 'CLOSE');
  close.onclick = lanClose; box.appendChild(close);
  lanOverlay.appendChild(box); document.body.appendChild(lanOverlay);
}

function lanClose() {
  if (lanSocket) { try { lanSocket.send(JSON.stringify({ type: 'leave' })); lanSocket.close(); } catch (e) {} }
  lanSocket = null; lanRoom = ''; lanRole = ''; lanSlots = [false, false];
  coopRemote = false; coopRemoteP1 = false;
  if (lanFrameTimer) { clearInterval(lanFrameTimer); lanFrameTimer = null; }
  if (lanInputTimer) { clearInterval(lanInputTimer); lanInputTimer = null; }
  if (lanOverlay) { lanOverlay.remove(); lanOverlay = null; }
  if (lanVideo) { lanVideo.remove(); lanVideo = null; }
  if (lanClientMode && typeof cvs !== 'undefined') cvs.style.display = '';
}

function lanSetStatus(t) { if (lanStatus) lanStatus.textContent = t; }
function lanUpdateSlots() {
  if (lanSlotStatus) lanSlotStatus.textContent = 'P1: ' + (lanSlots[0] ? 'CONNECTED' : '—') + '   P2: ' + (lanSlots[1] ? 'CONNECTED' : '—');
  var need = lanHostMode === 'room' ? (lanSlots[0] && lanSlots[1]) : lanSlots[1];
  if (lanStartBtn) {
    lanStartBtn.disabled = !need;
    lanStartBtn.textContent = need ? 'START LAN RUN' : 'WAITING FOR ' + (lanHostMode === 'room' ? 'P1 + P2' : 'P2');
  }
}

function lanOpenHost() {
  lanClientMode = false; lanMakeOverlay(false);
  if (!lanSocket) lanConnectHost();
}

function lanConnectHost() {
  try {
    lanSocket = new WebSocket(lanWsUrl());
    lanSocket.onopen = function () { lanSetStatus('CONNECTED · CREATE A ROOM'); };
    lanSocket.onerror = function () { lanSetStatus('SERVER OFFLINE · RUN tools/lan_server.py'); };
    lanSocket.onclose = function () { lanSetStatus('DISCONNECTED'); };
    lanSocket.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'created') {
        lanRoom = m.room; lanRole = 'host'; lanHostMode = m.mode || 'hostp1'; lanSlots = [false, false];
        lanRoomLabel.textContent = m.room;
        lanLinkEl.textContent = lanInviteLink();
        lanSetStatus(lanHostMode === 'room' ? 'ROOM ONLY · SEND LINK TO P1 AND P2' : 'HOST IS P1 · SEND LINK TO P2');
        lanUpdateSlots();
      } else if (m.type === 'player-joined') {
        lanSlots[m.slot] = true; lanSetStatus('PLAYER JOINED · SLOT ' + (m.slot + 1)); lanUpdateSlots();
      } else if (m.type === 'player-left') {
        lanSlots[m.slot] = false; lanSetStatus('PLAYER LEFT · SLOT ' + (m.slot + 1)); lanUpdateSlots();
      } else if (m.type === 'input') {
        var inp = m.slot === 0 ? lanRemoteInput1 : lanRemoteInput;
        inp.dx = Number(m.dx) || 0; inp.dy = Number(m.dy) || 0;
        if (m.primary) inp.primary = true;
        if (m.secondary) inp.secondary = true;
      }
    };
  } catch (e) { lanSetStatus('WS ERROR: ' + e.message); }
}

function lanCreate(mode) {
  if (!lanSocket || lanSocket.readyState !== 1) { lanConnectHost(); setTimeout(function () { lanCreate(mode); }, 350); return; }
  lanHostMode = mode || 'hostp1';
  lanSocket.send(JSON.stringify({ type: 'create', mode: lanHostMode }));
}

function lanStartHost() {
  if (lanStartBtn && lanStartBtn.disabled) return;
  coopEnabled = true; coopInputMode = 'remote'; coopRemote = true;
  coopRemoteP1 = lanHostMode === 'room';
  coopShip2 = 'vector'; coopSkin2 = coopPickSkin2('vector', '');
  if (lanOverlay) lanOverlay.style.display = 'none';
  startAtStage(selectedStage);
  if (!lanFrameTimer) {
    lanFrameTimer = setInterval(function () {
      if (!lanSocket || lanSocket.readyState !== 1) return;
      try { lanSocket.send(JSON.stringify({ type: 'frame', data: cvs.toDataURL('image/jpeg', 0.55) })); } catch (e) {}
    }, 55);
  }
}

function lanJoin() {
  if (!lanCodeInput) return;
  var code = String(lanCodeInput.value || '').trim();
  if (!/^\d{4}$/.test(code)) { lanSetStatus('ENTER A 4-DIGIT ROOM CODE'); return; }
  lanStartBtn.disabled = true; lanSetStatus('CONNECTING...');
  try {
    lanSocket = new WebSocket(lanWsUrl());
    lanSocket.onopen = function () { lanSocket.send(JSON.stringify({ type: 'join', room: code })); };
    lanSocket.onerror = function () { lanSetStatus('SERVER OFFLINE'); lanStartBtn.disabled = false; };
    lanSocket.onclose = function () { lanSetStatus('DISCONNECTED'); };
    lanSocket.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'error') { lanSetStatus(m.message || 'JOIN FAILED'); lanStartBtn.disabled = false; }
      else if (m.type === 'joined') {
        lanRoom = m.room; lanRole = 'guest';
        lanSetStatus('CONNECTED AS P' + (Number(m.slot) + 1) + ' · WAITING FOR HOST');
        if (lanOverlay) lanOverlay.style.display = 'none';
        if (!lanVideo) {
          lanVideo = document.createElement('img');
          lanVideo.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:9998;';
          document.body.appendChild(lanVideo);
        }
        if (typeof cvs !== 'undefined') cvs.style.display = 'none';
        lanStartClientInput();
      } else if (m.type === 'frame') {
        if (lanVideo) lanVideo.src = m.data;
      } else if (m.type === 'host-left') {
        lanSetStatus('HOST LEFT'); if (lanVideo) lanVideo.remove(); lanVideo = null;
      }
    };
  } catch (e) { lanSetStatus('WS ERROR: ' + e.message); lanStartBtn.disabled = false; }
}

function lanSendClientInput() {
  if (!lanSocket || lanSocket.readyState !== 1) return;
  var dx = 0, dy = 0;
  if (lanClientKeys.j) dx -= 1;
  if (lanClientKeys.l) dx += 1;
  if (lanClientKeys.i) dy -= 1;
  if (lanClientKeys.k) dy += 1;
  var primary = !!lanClientPending.primary, secondary = !!lanClientPending.secondary;
  lanClientPending.primary = false; lanClientPending.secondary = false;
  var pads = navigator.getGamepads ? navigator.getGamepads() : [];
  var pad = pads[0];
  if (pad) {
    var ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
    if (Math.abs(ax) > 0.22) dx += ax;
    if (Math.abs(ay) > 0.22) dy += ay;
    if (pad.buttons[14] && pad.buttons[14].pressed) dx -= 1;
    if (pad.buttons[15] && pad.buttons[15].pressed) dx += 1;
    if (pad.buttons[12] && pad.buttons[12].pressed) dy -= 1;
    if (pad.buttons[13] && pad.buttons[13].pressed) dy += 1;
    var ba = !!(pad.buttons[1] && pad.buttons[1].pressed), bb = !!(pad.buttons[5] && pad.buttons[5].pressed);
    if (ba && !lanPadPrev.a) primary = true;
    if (bb && !lanPadPrev.b) secondary = true;
    lanPadPrev.a = ba; lanPadPrev.b = bb;
  }
  lanSocket.send(JSON.stringify({ type: 'input', dx: dx, dy: dy, primary: primary, secondary: secondary }));
}

function lanStartClientInput() { if (!lanInputTimer) lanInputTimer = setInterval(lanSendClientInput, 40); }

function lanClientKey(e, down) {
  var k = String(e.key || '').toLowerCase();
  if (['i','j','k','l','u','o'].indexOf(k) < 0) return;
  lanClientKeys[k] = !!down;
  if (down && !e.repeat) {
    if (k === 'u') lanClientPending.primary = true;
    if (k === 'o') lanClientPending.secondary = true;
  }
  if (e.preventDefault) e.preventDefault();
}

try {
  var q = new URLSearchParams(location.search || '');
  lanClientMode = q.get('lanclient') === '1';
  if (lanClientMode) {
    function bootClient() {
      lanMakeOverlay(true);
      var joinCode = q.get('lanjoin');
      if (joinCode && lanCodeInput) {
        lanCodeInput.value = String(joinCode).slice(0, 4);
        setTimeout(function () { if (!lanSocket) lanJoin(); }, 250);
      }
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootClient); else bootClient();
    window.addEventListener('keydown', function (e) { lanClientKey(e, true); });
    window.addEventListener('keyup', function (e) { lanClientKey(e, false); });
    if (typeof cvs !== 'undefined') cvs.style.display = 'none';
  } else {
    var lanBtn = document.createElement('button');
    lanBtn.textContent = 'LAN';
    lanBtn.style.cssText = 'position:fixed;right:12px;top:12px;z-index:9997;background:rgba(6,18,30,.9);border:1px solid #5d8fa8;color:#b8e8ff;font:700 10px monospace;padding:6px 10px;cursor:pointer;border-radius:2px;';
    lanBtn.onclick = function () { if (typeof state !== 'undefined' && state === 'menu') lanOpenHost(); };
    document.body.appendChild(lanBtn);
    setInterval(function () { lanBtn.style.display = (typeof state !== 'undefined' && state === 'menu') ? 'block' : 'none'; }, 500);
    window.addEventListener('keydown', function (e) {
      if (String(e.key || '').toLowerCase() === 'l' && typeof state !== 'undefined' && state === 'menu') {
        if (e.preventDefault) e.preventDefault(); lanOpenHost();
      }
    });
  }
} catch (e) {}
