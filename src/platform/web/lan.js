// LAN co-op: WebSocket room relay + host canvas stream + guest input.
// Host can either play P1 (hostp1) or be room-only (room, P1/P2 join separately).
var lanSocket = null, lanRoom = '', lanRole = '', lanHostMode = 'hostp1';
var lanSlots = [false, false], lanFrameTimer = null, lanInputTimer = null;
var lanMySlot = -1, lanJoined = false, lanLoadouts = [null, null];
var lanLoadoutShip = 'vector', lanLoadoutSkin = 'void_lance';
var lanShipBtn = null, lanSkinBtn = null;
var lanClientMode = false, lanClientKeys = Object.create(null);
var lanClientPending = { primary: false, secondary: false };
var lanTouch = { dx: 0, dy: 0, tx: 0, ty: 0, active: false };
var lanTouchLayer = null;
var lanPadPrev = { a: false, b: false };
var lanOverlay = null, lanVideo = null, lanStatus = null, lanRoomLabel = null;
var lanAudioBytes = 0, lanAudioRecv = 0;
var lanAudioScript = null, lanAudioSink = null;
var lanClientAC = null, lanNextAudio = 0;
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

function lanLoadoutSkinDef(ship, skin) {
  if (typeof skinList !== 'function') return null;
  var list = skinList(ship);
  for (var i = 0; i < list.length; i++) if (list[i].id === skin) return list[i];
  return list[0] || null;
}
function lanLoadoutLabel(ship, skin) {
  var sd = (typeof SHIP_DEFS !== 'undefined' && SHIP_DEFS[ship]) ? SHIP_DEFS[ship] : { label: String(ship || 'VECTOR').toUpperCase() };
  var kd = lanLoadoutSkinDef(ship, skin);
  return sd.label + ' · ' + (kd ? kd.label : String(skin || '').toUpperCase());
}
function lanClientShipCycle() {
  var ships = ['vector', 'aegis', 'phantom'];
  var i = ships.indexOf(lanLoadoutShip);
  lanLoadoutShip = ships[(i + 1) % ships.length];
  var list = (typeof skinList === 'function') ? skinList(lanLoadoutShip) : [];
  lanLoadoutSkin = list.length ? list[0].id : 'void_lance';
  lanRefreshLoadoutButtons(); lanSendLoadout();
}
function lanClientSkinCycle() {
  var list = (typeof skinList === 'function') ? skinList(lanLoadoutShip) : [];
  if (!list.length) return;
  var i = 0; for (var k = 0; k < list.length; k++) if (list[k].id === lanLoadoutSkin) i = k;
  lanLoadoutSkin = list[(i + 1) % list.length].id;
  lanRefreshLoadoutButtons(); lanSendLoadout();
}
function lanRefreshLoadoutButtons() {
  if (lanShipBtn) lanShipBtn.textContent = 'SHIP · ' + lanLoadoutLabel(lanLoadoutShip, lanLoadoutSkin).split(' · ')[0];
  if (lanSkinBtn) lanSkinBtn.textContent = 'VAR · ' + (lanLoadoutLabel(lanLoadoutShip, lanLoadoutSkin).split(' · ')[1] || '');
}
function lanSendLoadout() {
  if (!lanSocket || lanSocket.readyState !== 1 || !lanJoined) return;
  lanSocket.send(JSON.stringify({ type: 'loadout', ship: lanLoadoutShip, skin: lanLoadoutSkin }));
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
    lanShipBtn = lanEl('button', 'width:100%;padding:8px;background:#081824;border:1px solid #31536a;color:#b8d9e8;font:10px monospace;cursor:pointer;margin-bottom:5px;', 'SHIP · VECTOR');
    lanShipBtn.onclick = lanClientShipCycle; box.appendChild(lanShipBtn);
    lanSkinBtn = lanEl('button', 'width:100%;padding:8px;background:#081824;border:1px solid #31536a;color:#b8d9e8;font:10px monospace;cursor:pointer;margin-bottom:8px;', 'VAR · VOID LANCE');
    lanSkinBtn.onclick = lanClientSkinCycle; box.appendChild(lanSkinBtn);
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
  lanStopHostAudio();
  if (lanFrameTimer) { clearInterval(lanFrameTimer); lanFrameTimer = null; }
  if (lanInputTimer) { clearInterval(lanInputTimer); lanInputTimer = null; }
  if (lanOverlay) { lanOverlay.remove(); lanOverlay = null; }
  if (lanVideo) { lanVideo.remove(); lanVideo = null; }
  if (lanTouchLayer) { lanTouchLayer.style.display = 'none'; }
  if (lanClientMode && typeof cvs !== 'undefined') cvs.style.display = '';
}

function lanSetStatus(t) { if (lanStatus) lanStatus.textContent = t; }
function lanUpdateSlots() {
  if (lanSlotStatus) {
    var l0 = lanLoadouts[0] ? lanLoadoutLabel(lanLoadouts[0].ship, lanLoadouts[0].skin) : '—';
    var l1 = lanLoadouts[1] ? lanLoadoutLabel(lanLoadouts[1].ship, lanLoadouts[1].skin) : '—';
    lanSlotStatus.textContent = 'P1: ' + (lanSlots[0] ? l0 : '—') + '   P2: ' + (lanSlots[1] ? l1 : '—');
  }
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
      if (typeof ev.data !== 'string') { lanHandleAudio(ev.data); return; }
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
      } else if (m.type === 'loadout') {
        lanLoadouts[m.slot] = { ship: m.ship, skin: m.skin };
        lanUpdateSlots();
      } else if (m.type === 'input') {
        var inp = m.slot === 0 ? lanRemoteInput1 : lanRemoteInput;
        inp.dx = Number(m.dx) || 0; inp.dy = Number(m.dy) || 0;
        inp.tx = (m.tx == null) ? null : Number(m.tx); inp.ty = (m.ty == null) ? null : Number(m.ty);
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

function lanEnsureClientAudio() {
  if (!lanClientAC) {
    try {
      lanClientAC = new (window.AudioContext || window.webkitAudioContext)();
      lanNextAudio = 0;
    } catch (e) { return null; }
  }
  try { if (lanClientAC.state === 'suspended') lanClientAC.resume(); } catch (e) {}
  return lanClientAC;
}

function lanHandleAudio(ab) {
  lanAudioRecv += (ab.byteLength || 0);
  var ac = lanEnsureClientAudio(); if (!ac) return;
  var pcm = new Int16Array(ab); if (!pcm.length) return;
  var buf = ac.createBuffer(1, pcm.length, 22050);
  var ch = buf.getChannelData(0);
  for (var i = 0; i < pcm.length; i++) ch[i] = pcm[i] / 32768;
  var src = ac.createBufferSource(); src.buffer = buf; src.connect(ac.destination);
  var now = ac.currentTime;
  if (lanNextAudio < now + 0.02) lanNextAudio = now + 0.05;
  if (lanNextAudio - now > 0.5) lanNextAudio = now + 0.05;
  try { src.start(lanNextAudio); } catch (e) { return; }
  lanNextAudio += buf.duration;
}

function lanStartHostAudio() {
  if (typeof AC === 'undefined' || !AC || typeof master === 'undefined' || !master || typeof ScriptProcessorNode === 'undefined') return;
  try {
    if (lanAudioScript) return;
    lanAudioScript = AC.createScriptProcessor(1024, 1, 1);
    lanAudioSink = AC.createGain(); lanAudioSink.gain.value = 0;
    master.connect(lanAudioScript);
    lanAudioScript.connect(lanAudioSink);
    lanAudioSink.connect(AC.destination);
    var ratio = AC.sampleRate / 22050;
    lanAudioScript.onaudioprocess = function (ev) {
      if (!lanSocket || lanSocket.readyState !== 1) return;
      var input = ev.inputBuffer.getChannelData(0);
      var outLen = Math.max(1, Math.floor(input.length / ratio));
      var out = new Int16Array(outLen);
      for (var i = 0; i < outLen; i++) {
        var pos = i * ratio, i0 = Math.floor(pos), i1 = Math.min(input.length - 1, i0 + 1), frac = pos - i0;
        var s = input[i0] * (1 - frac) + input[i1] * frac;
        out[i] = Math.max(-32768, Math.min(32767, s * 32767));
      }
      lanAudioBytes += out.byteLength;
      try { lanSocket.send(out.buffer); } catch (e) {}
    };
  } catch (e) {}
}

function lanStopHostAudio() {
  try { if (lanAudioScript && master) master.disconnect(lanAudioScript); } catch (e) {}
  try { if (lanAudioSink) lanAudioSink.disconnect(); } catch (e) {}
  lanAudioScript = null; lanAudioSink = null;
}

function lanStartHost() {
  if (lanStartBtn && lanStartBtn.disabled) return;
  var l0 = lanLoadouts[0] || { ship: selectedShip, skin: selectedSkins[selectedShip] };
  var l1 = lanLoadouts[1] || { ship: 'vector', skin: 'void_lance' };
  if (lanHostMode === 'room') {
    if (typeof skinList === 'function' && skinList(l0.ship).length) {
      selectedShip = l0.ship; selectedSkins[selectedShip] = l0.skin;
    }
  } else {
    l0 = { ship: selectedShip, skin: selectedSkins[selectedShip] };
  }
  coopEnabled = true; coopInputMode = 'remote'; coopRemote = true;
  coopRemoteP1 = lanHostMode === 'room';
  coopShip2 = l1.ship; coopSkin2 = l1.skin;
  if (selectedShip === coopShip2 && selectedSkins[selectedShip] === coopSkin2) {
    var sk = (typeof skinList === 'function') ? skinList(coopShip2) : [];
    for (var i = 0; i < sk.length; i++) if (sk[i].id !== selectedSkins[selectedShip]) { coopSkin2 = sk[i].id; break; }
  }
  if (lanOverlay) lanOverlay.style.display = 'none';
  try { initAudio(); loadSfxExtras(); } catch (e) {}
  lanStartHostAudio();
  startAtStage(selectedStage);
  if (!lanFrameTimer) {
    lanFrameTimer = setInterval(function () {
      if (!lanSocket || lanSocket.readyState !== 1) return;
      try { lanSocket.send(JSON.stringify({ type: 'frame', data: cvs.toDataURL('image/jpeg', 0.55) })); } catch (e) {}
    }, 33);
  }
}

function lanJoin() {
  if (!lanCodeInput) return;
  var code = String(lanCodeInput.value || '').trim();
  if (!/^\d{4}$/.test(code)) { lanSetStatus('ENTER A 4-DIGIT ROOM CODE'); return; }
  lanStartBtn.disabled = true; lanSetStatus('CONNECTING...');
  try {
    lanSocket = new WebSocket(lanWsUrl());
    lanSocket.binaryType = 'arraybuffer';
    lanSocket.onopen = function () { lanSocket.send(JSON.stringify({ type: 'join', room: code })); };
    lanSocket.onerror = function () { lanSetStatus('SERVER OFFLINE'); lanStartBtn.disabled = false; };
    lanSocket.onclose = function () { lanSetStatus('DISCONNECTED'); };
    lanSocket.onmessage = function (ev) {
      if (typeof ev.data !== 'string') { lanHandleAudio(ev.data); return; }
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.type === 'error') { lanSetStatus(m.message || 'JOIN FAILED'); lanStartBtn.disabled = false; }
      else if (m.type === 'joined') {
        lanRoom = m.room; lanRole = 'guest'; lanJoined = true; lanMySlot = Number(m.slot); lanHostMode = m.mode || lanHostMode;
        lanSetStatus('CONNECTED AS P' + (lanMySlot + 1) + ' · CHOOSE LOADOUT · WAITING FOR HOST');
        if (lanStartBtn) { lanStartBtn.disabled = true; lanStartBtn.textContent = 'WAITING FOR HOST'; }
        lanSendLoadout(); lanEnsureClientAudio();
        if (!lanVideo) {
          lanVideo = document.createElement('img');
          lanVideo.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:contain;background:#000;z-index:9998;';
          document.body.appendChild(lanVideo);
        }
        if (typeof cvs !== 'undefined') cvs.style.display = 'none';
        lanStartClientInput();
      } else if (m.type === 'frame') {
        if (lanOverlay) lanOverlay.style.display = 'none';
        if (!lanTouchLayer) lanBuildTouchControls(); else lanTouchLayer.style.display = 'block';
        if (lanVideo) lanVideo.src = m.data;
      } else if (m.type === 'host-left') {
        lanSetStatus('HOST LEFT'); if (lanVideo) lanVideo.remove(); lanVideo = null; if (lanTouchLayer) lanTouchLayer.style.display = 'none';
      }
    };
  } catch (e) { lanSetStatus('WS ERROR: ' + e.message); lanStartBtn.disabled = false; }
}

function lanMapTouch(cx, cy) {
  var vw = window.innerWidth, vh = window.innerHeight, ar = 390 / 844;
  var dw, dh, ox, oy;
  if (vw / vh > ar) { dh = vh; dw = dh * ar; ox = (vw - dw) / 2; oy = 0; }
  else { dw = vw; dh = dw / ar; ox = 0; oy = 0; }
  var x = (cx - ox) / dw * 390;
  var y = (cy - oy) / dh * 844 - 86;
  return { x: Math.max(22, Math.min(368, x)), y: Math.max(70, Math.min(704, y)) };
}

function lanBuildTouchControls() {
  if (lanTouchLayer) { lanTouchLayer.style.display = 'block'; return; }
  lanTouchLayer = lanEl('div', 'position:fixed;inset:0;z-index:10000;pointer-events:auto;touch-action:none;');
  var pid = null;
  lanTouchLayer.addEventListener('pointerdown', function (e) {
    if (e.target !== lanTouchLayer) return;
    pid = e.pointerId; try { lanTouchLayer.setPointerCapture(pid); } catch (err) {}
    var p = lanMapTouch(e.clientX, e.clientY); lanTouch.tx = p.x; lanTouch.ty = p.y; lanTouch.active = true;
    e.preventDefault();
  });
  lanTouchLayer.addEventListener('pointermove', function (e) {
    if (pid !== e.pointerId) return;
    var p = lanMapTouch(e.clientX, e.clientY); lanTouch.tx = p.x; lanTouch.ty = p.y;
    e.preventDefault();
  });
  function end(e) { if (pid === e.pointerId) { pid = null; e.preventDefault(); } }
  lanTouchLayer.addEventListener('pointerup', end);
  lanTouchLayer.addEventListener('pointercancel', end);

  // Semi-transparent skill hit zones, aligned to the game's bottom-right controls.
  var primary = lanEl('div', 'position:absolute;right:16px;bottom:22px;width:78px;height:78px;border-radius:50%;border:1px dashed rgba(200,180,255,0.55);background:rgba(20,10,35,0.16);pointer-events:auto;touch-action:none;z-index:10001;');
  primary.onpointerdown = function (e) { e.preventDefault(); e.stopPropagation(); lanClientPending.primary = true; primary.style.background = 'rgba(143,233,255,0.28)'; };
  primary.onpointerup = function (e) { e.preventDefault(); e.stopPropagation(); primary.style.background = 'rgba(20,10,35,0.16)'; };
  lanTouchLayer.appendChild(primary);
  var secondary = lanEl('div', 'position:absolute;right:104px;bottom:26px;width:58px;height:58px;border-radius:50%;border:1px dashed rgba(255,211,107,0.5);background:rgba(35,24,8,0.14);pointer-events:auto;touch-action:none;z-index:10001;');
  secondary.onpointerdown = function (e) { e.preventDefault(); e.stopPropagation(); lanClientPending.secondary = true; secondary.style.background = 'rgba(255,211,107,0.28)'; };
  secondary.onpointerup = function (e) { e.preventDefault(); e.stopPropagation(); secondary.style.background = 'rgba(35,24,8,0.14)'; };
  lanTouchLayer.appendChild(secondary);
  document.body.appendChild(lanTouchLayer);
}

function lanSendClientInput() {
  if (!lanSocket || lanSocket.readyState !== 1) return;
  var dx = 0, dy = 0;
  if (lanClientKeys.j) dx -= 1;
  if (lanClientKeys.l) dx += 1;
  if (lanClientKeys.i) dy -= 1;
  if (lanClientKeys.k) dy += 1;
  dx += lanTouch.dx || 0; dy += lanTouch.dy || 0;
  var len0 = Math.hypot(dx, dy); if (len0 > 1) { dx /= len0; dy /= len0; }
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
  lanSocket.send(JSON.stringify({ type: 'input', dx: dx, dy: dy, primary: primary, secondary: secondary, tx: lanTouch.active ? lanTouch.tx : null, ty: lanTouch.active ? lanTouch.ty : null }));
}

function lanStartClientInput() { if (!lanInputTimer) lanInputTimer = setInterval(lanSendClientInput, 25); }

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

window.__lanDebug = function () {
  return {
    role: lanRole, room: lanRoom, mode: lanHostMode, slots: lanSlots.slice(), mySlot: lanMySlot,
    audioSend: lanAudioBytes, audioRecv: lanAudioRecv,
    script: !!lanAudioScript,
    clientAC: lanClientAC ? lanClientAC.state : null,
    nextAudio: +lanNextAudio.toFixed(2),
    ac: (typeof AC !== 'undefined' && AC) ? AC.state : null,
    master: typeof master !== 'undefined' && !!master
  };
};

try {
  var q = new URLSearchParams(location.search || '');
  lanClientMode = q.get('lanclient') === '1';
  if (lanClientMode) {
    function bootClient() {
      lanMakeOverlay(true); lanRefreshLoadoutButtons();
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
