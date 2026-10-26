// LAN co-op: WebSocket room signaling + host canvas frame stream + guest input.
// Runs entirely on the LAN server; no internet relay and no WebRTC dependency.
var lanSocket = null, lanRoom = '', lanRole = '', lanPeerOnline = false;
var lanFrameTimer = null, lanInputTimer = null, lanClientMode = false;
var lanClientKeys = Object.create(null);
var lanClientPending = { primary: false, secondary: false };
var lanPadPrev = { a: false, b: false };
var lanOverlay = null, lanVideo = null, lanStatus = null, lanRoomLabel = null;
var lanStartBtn = null, lanCodeInput = null;

function lanWsUrl() {
  var proto = (location.protocol === 'https:') ? 'wss:' : 'ws:';
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

function lanMakeOverlay(client) {
  if (lanOverlay) return;
  lanOverlay = lanEl('div', 'position:fixed;inset:0;z-index:9999;background:rgba(1,4,10,0.88);display:flex;align-items:center;justify-content:center;font-family:monospace;color:#dff8ff;');
  var box = lanEl('div', 'width:min(420px,88vw);background:#071624;border:1px solid #5d8fa8;padding:22px;box-sizing:border-box;');
  box.appendChild(lanEl('div', 'font:900 19px Arial Black,Arial;color:#eaf8ff;margin-bottom:6px;', client ? 'LAN CLIENT' : 'LAN CO-OP HOST'));
  box.appendChild(lanEl('div', 'font:10px monospace;color:#7f9bb0;margin-bottom:16px;', client ? 'JOIN A HOST ON THIS LAN' : 'HOST ON THIS LAN · P2 IS REMOTE'));
  lanStatus = lanEl('div', 'font:11px monospace;color:#9fe8ff;min-height:18px;margin-bottom:12px;', 'NOT CONNECTED');
  box.appendChild(lanStatus);
  if (client) {
    lanCodeInput = lanEl('input', 'width:100%;box-sizing:border-box;padding:10px;background:#03111e;border:1px solid #31536a;color:#fff;font:16px monospace;letter-spacing:6px;text-align:center;margin-bottom:10px;');
    lanCodeInput.maxLength = 4; lanCodeInput.placeholder = 'ROOM CODE';
    box.appendChild(lanCodeInput);
    lanStartBtn = lanEl('button', 'width:100%;padding:11px;background:#123a4f;border:1px solid #9fe8ff;color:#eaf8ff;font:700 12px monospace;cursor:pointer;', 'JOIN');
    lanStartBtn.onclick = lanJoin;
    box.appendChild(lanStartBtn);
  } else {
    lanRoomLabel = lanEl('div', 'font:900 34px monospace;color:#ffd36b;letter-spacing:8px;text-align:center;margin:8px 0 14px;', '----');
    box.appendChild(lanRoomLabel);
    var create = lanEl('button', 'width:100%;padding:10px;background:#123a4f;border:1px solid #9fe8ff;color:#eaf8ff;font:700 12px monospace;cursor:pointer;margin-bottom:8px;', 'CREATE ROOM');
    create.onclick = lanCreate;
    box.appendChild(create);
    lanStartBtn = lanEl('button', 'width:100%;padding:10px;background:#3b2b0e;border:1px solid #ffd36b;color:#ffe7b0;font:700 12px monospace;cursor:pointer;margin-bottom:8px;', 'WAITING FOR GUEST');
    lanStartBtn.disabled = true; lanStartBtn.onclick = lanStartHost;
    box.appendChild(lanStartBtn);
  }
  var close = lanEl('button', 'width:100%;padding:8px;background:#081824;border:1px solid #31536a;color:#9fb6cf;font:10px monospace;cursor:pointer;', 'CLOSE');
  close.onclick = lanClose;
  box.appendChild(close);
  lanOverlay.appendChild(box);
  document.body.appendChild(lanOverlay);
}

function lanClose() {
  if (lanSocket) { try { lanSocket.send(JSON.stringify({ type: 'leave' })); lanSocket.close(); } catch (e) {} }
  lanSocket = null; lanRoom = ''; lanRole = ''; lanPeerOnline = false; coopRemote = false;
  if (lanFrameTimer) { clearInterval(lanFrameTimer); lanFrameTimer = null; }
  if (lanInputTimer) { clearInterval(lanInputTimer); lanInputTimer = null; }
  if (lanOverlay) { lanOverlay.remove(); lanOverlay = null; }
  if (lanVideo) { lanVideo.remove(); lanVideo = null; }
  if (lanClientMode && typeof cvs !== 'undefined') cvs.style.display = '';
}

function lanSetStatus(t) { if (lanStatus) lanStatus.textContent = t; }

function lanOpenHost() {
  lanClientMode = false;
  lanMakeOverlay(false);
  if (!lanSocket) lanConnectHost();
}

function lanConnectHost() {
  try {
    lanSocket = new WebSocket(lanWsUrl());
    lanSocket.onopen = function () { lanSetStatus('CONNECTED · CREATE A ROOM'); };
    lanSocket.onerror = function () { lanSetStatus('SERVER OFFLINE · RUN tools/lan_server.py'); };
    lanSocket.onclose = function () { lanSetStatus('DISCONNECTED'); lanPeerOnline = false; };
    lanSocket.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'created') {
        lanRoom = m.room; lanRole = 'host'; lanRoomLabel.textContent = m.room;
        lanSetStatus('ROOM ' + m.room + ' · WAITING FOR GUEST');
      } else if (m.type === 'peer-joined') {
        lanPeerOnline = true; lanSetStatus('GUEST CONNECTED · READY TO START');
        if (lanStartBtn) { lanStartBtn.disabled = false; lanStartBtn.textContent = 'START LAN RUN'; }
      } else if (m.type === 'input') {
        if (coopRemote) {
          lanRemoteInput.dx = Number(m.dx) || 0;
          lanRemoteInput.dy = Number(m.dy) || 0;
          if (m.primary) lanRemoteInput.primary = true;
          if (m.secondary) lanRemoteInput.secondary = true;
        }
      } else if (m.type === 'peer-left') {
        lanPeerOnline = false; lanSetStatus('GUEST LEFT');
        if (lanStartBtn) { lanStartBtn.disabled = true; lanStartBtn.textContent = 'WAITING FOR GUEST'; }
      }
    };
  } catch (e) { lanSetStatus('WS ERROR: ' + e.message); }
}

function lanCreate() {
  if (!lanSocket || lanSocket.readyState !== 1) { lanConnectHost(); return; }
  lanSocket.send(JSON.stringify({ type: 'create' }));
}

function lanStartHost() {
  if (!lanPeerOnline) return;
  coopEnabled = true; coopInputMode = 'remote'; coopRemote = true;
  coopShip2 = 'vector'; coopSkin2 = coopPickSkin2('vector', '');
  if (lanOverlay) lanOverlay.style.display = 'none';
  startAtStage(selectedStage);
  if (!lanFrameTimer) {
    lanFrameTimer = setInterval(function () {
      if (!lanSocket || lanSocket.readyState !== 1 || !lanPeerOnline) return;
      if (typeof cvs === 'undefined' || !cvs.toDataURL) return;
      try {
        var data = cvs.toDataURL('image/jpeg', 0.55);
        lanSocket.send(JSON.stringify({ type: 'frame', data: data }));
      } catch (e) {}
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
        lanRoom = m.room; lanRole = 'guest'; lanSetStatus('CONNECTED · WAITING FOR HOST');
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
      } else if (m.type === 'peer-left') {
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

function lanStartClientInput() {
  if (lanInputTimer) return;
  lanInputTimer = setInterval(lanSendClientInput, 40);
}

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
    document.addEventListener('DOMContentLoaded', function () { lanMakeOverlay(true); });
    if (document.readyState !== 'loading') lanMakeOverlay(true);
    window.addEventListener('keydown', function (e) { lanClientKey(e, true); });
    window.addEventListener('keyup', function (e) { lanClientKey(e, false); });
    if (typeof cvs !== 'undefined') cvs.style.display = 'none';
  } else {
    // Small LAN button on the menu; hidden during play.
    var lanBtn = document.createElement('button');
    lanBtn.textContent = 'LAN';
    lanBtn.style.cssText = 'position:fixed;right:12px;top:12px;z-index:9997;background:rgba(6,18,30,.9);border:1px solid #5d8fa8;color:#b8e8ff;font:700 10px monospace;padding:6px 10px;cursor:pointer;border-radius:2px;';
    lanBtn.onclick = function () { if (typeof state !== 'undefined' && state === 'menu') lanOpenHost(); };
    document.body.appendChild(lanBtn);
    setInterval(function () { lanBtn.style.display = (typeof state !== 'undefined' && state === 'menu') ? 'block' : 'none'; }, 500);
    window.addEventListener('keydown', function (e) {
      if (String(e.key || '').toLowerCase() === 'l' && typeof state !== 'undefined' && state === 'menu') {
        if (e.preventDefault) e.preventDefault();
        lanOpenHost();
      }
    });
  }
} catch (e) {}
