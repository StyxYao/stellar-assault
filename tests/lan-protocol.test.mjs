import { spawn } from 'node:child_process';

const HTTP_PORT = 8941;
const WS_PORT = 8942;
const server = spawn(process.execPath, ['tools/lan_server.mjs', String(HTTP_PORT), String(WS_PORT)], { stdio: 'ignore' });

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function connect() {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://127.0.0.1:${WS_PORT}`);
    ws.addEventListener('open', () => resolve(ws), { once: true });
    ws.addEventListener('error', () => reject(new Error('websocket connect failed')), { once: true });
  });
}
function waitFor(ws, type, timeout = 4000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.removeEventListener('message', onMsg); reject(new Error('timeout waiting for ' + type)); }, timeout);
    function onMsg(e) {
      let msg;
      try { msg = JSON.parse(e.data); } catch { return; }
      if (msg.type !== type) return;
      clearTimeout(timer); ws.removeEventListener('message', onMsg); resolve(msg);
    }
    ws.addEventListener('message', onMsg);
  });
}
function send(ws, msg) { ws.send(JSON.stringify(msg)); }

let host, guest, guest2;
try {
  await sleep(350);
  host = await connect();
  const createdP = waitFor(host, 'created');
  send(host, { type: 'create', mode: 'hostp1' });
  const created = await createdP;
  if (!created.room) throw new Error('create did not return room');

  guest = await connect();
  const joinedP = waitFor(guest, 'joined');
  const noticeP = waitFor(host, 'player-joined');
  send(guest, { type: 'join', room: created.room });
  const joined = await joinedP;
  const notice = await noticeP;
  if (joined.slot !== 1 || notice.slot !== 1) throw new Error('P2 slot mismatch: ' + JSON.stringify({ joined, notice }));

  const loadoutP = waitFor(host, 'loadout');
  send(guest, { type: 'loadout', ship: 'aegis', skin: 'orbital' });
  const loadout = await loadoutP;
  if (loadout.ship !== 'aegis' || loadout.slot !== 1) throw new Error('loadout relay mismatch');

  const readyP = waitFor(host, 'ready');
  send(guest, { type: 'ready', ready: true, stage: 2 });
  const ready = await readyP;
  if (!ready.ready || ready.stage !== 2) throw new Error('ready relay mismatch');

  const leftP = waitFor(host, 'player-left');
  guest.close();
  const left = await leftP;
  if (left.slot !== 1) throw new Error('player-left slot mismatch');

  guest2 = await connect();
  const rejoinP = waitFor(guest2, 'rejoined');
  const notice2P = waitFor(host, 'player-joined');
  send(guest2, { type: 'rejoin', room: created.room, token: joined.token });
  const rejoined = await rejoinP;
  const notice2 = await notice2P;
  if (rejoined.slot !== 1 || notice2.slot !== 1) throw new Error('rejoin slot mismatch');

  const hostLeftP = waitFor(guest2, 'host-left');
  host.close();
  await hostLeftP;
  console.log('lan protocol ok');
  process.exitCode = 0;
} catch (e) {
  console.error('lan protocol FAIL:', e.message);
  process.exitCode = 1;
} finally {
  try { host && host.close(); } catch {}
  try { guest && guest.close(); } catch {}
  try { guest2 && guest2.close(); } catch {}
  try { server.kill(); } catch {}
}
