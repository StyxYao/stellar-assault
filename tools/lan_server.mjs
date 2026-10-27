#!/usr/bin/env node
// Dependency-free LAN server: static dist + WebSocket room relay.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'dist');
const MIME = { '.html':'text/html; charset=utf-8', '.js':'text/javascript', '.css':'text/css', '.png':'image/png', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.webp':'image/webp', '.mp3':'audio/mpeg', '.mp4':'video/mp4', '.ttf':'font/ttf', '.txt':'text/plain' };
const ROOMS = new Map();
let nextId = 1;

function code() {
  let c;
  do { c = String(1000 + Math.floor(Math.random() * 9000)); } while (ROOMS.has(c));
  return c;
}
function send(ws, obj) { writeFrame(ws.socket, 1, Buffer.from(JSON.stringify(obj))); }
function sendRaw(ws, buf) { writeFrame(ws.socket, 2, buf); }

function writeFrame(socket, opcode, payload) {
  if (!socket || socket.destroyed) return;
  const len = payload.length;
  let head;
  if (len < 126) { head = Buffer.from([0x80 | opcode, len]); }
  else if (len < 65536) { head = Buffer.alloc(4); head[0] = 0x80 | opcode; head[1] = 126; head.writeUInt16BE(len, 2); }
  else { head = Buffer.alloc(10); head[0] = 0x80 | opcode; head[1] = 127; head.writeBigUInt64BE(BigInt(len), 2); }
  try { socket.write(head); socket.write(payload); } catch (e) {}
}

function parseFrames(client, chunk) {
  client.buf = Buffer.concat([client.buf, chunk]);
  while (client.buf.length >= 2) {
    const b0 = client.buf[0], b1 = client.buf[1];
    const fin = (b0 & 0x80) !== 0, opcode = b0 & 0x0f;
    let len = b1 & 0x7f, off = 2;
    if (len === 126) { if (client.buf.length < 4) return; len = client.buf.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (client.buf.length < 10) return; len = Number(client.buf.readBigUInt64BE(2)); off = 10; }
    if (len > 4 * 1024 * 1024) { client.socket.destroy(); return; }
    if (client.buf.length < off + 4 + len) return;
    const mask = client.buf.subarray(off, off + 4);
    const payload = Buffer.from(client.buf.subarray(off + 4, off + 4 + len));
    for (let i = 0; i < payload.length; i++) payload[i] ^= mask[i & 3];
    client.buf = client.buf.subarray(off + 4 + len);
    if (opcode === 0x8) { try { client.socket.end(); } catch (e) {} return; }
    if (opcode === 0x9) { writeFrame(client.socket, 0xA, payload); continue; }
    if (opcode === 0xA) continue;
    if (opcode === 0x0) { client.frag = Buffer.concat([client.frag || Buffer.alloc(0), payload]); if (fin) { handlePayload(client, client.frag); client.frag = null; } continue; }
    if (!fin) { client.frag = payload; continue; }
    handlePayload(client, payload, opcode);
  }
}

function findRoom(client) {
  if (client.room && ROOMS.has(client.room)) return ROOMS.get(client.room);
  return null;
}
function closeClient(client) {
  const room = findRoom(client);
  if (!room) return;
  if (room.host === client) {
    for (const p of room.players) if (p) send(p, { type: 'host-left' });
    ROOMS.delete(client.room);
  } else if (client.slot != null) {
    if (room.players[client.slot] === client) room.players[client.slot] = null;
    if (room.host) send(room.host, { type: 'player-left', slot: client.slot });
  }
}

function handlePayload(client, payload, opcode) {
  if (opcode === 2 || (opcode == null && client.lastOpcode === 2)) {
    const room = findRoom(client);
    if (room) for (const p of room.players) if (p && p !== client) sendRaw(p, payload);
    return;
  }
  let msg;
  try { msg = JSON.parse(payload.toString('utf8')); } catch (e) { return; }
  const typ = msg.type;
  if (typ === 'create') {
    const c = code();
    ROOMS.set(c, { host: client, mode: msg.mode === 'room' ? 'room' : 'hostp1', players: [null, null], tokens: [null, null] });
    client.room = c; client.host = true;
    send(client, { type: 'created', room: c, mode: msg.mode === 'room' ? 'room' : 'hostp1', role: 'host' });
    return;
  }
  if (typ === 'join' || typ === 'rejoin') {
    const c = String(msg.room || '').slice(0, 8), room = ROOMS.get(c);
    if (!room) return send(client, { type: 'error', message: typ === 'rejoin' ? 'ROOM GONE' : 'ROOM NOT FOUND' });
    let slot = -1;
    if (typ === 'rejoin') {
      for (let i = 0; i < 2; i++) if (room.tokens[i] === String(msg.token || '') && room.players[i] === null) { slot = i; break; }
      if (slot < 0) return send(client, { type: 'error', message: 'RECONNECT FAILED' });
    } else {
      const free = room.players.map((p, i) => p === null ? i : -1).filter(i => i >= 0);
      const allowed = room.mode === 'hostp1' ? (room.players[1] === null ? [1] : []) : free;
      if (!allowed.length) return send(client, { type: 'error', message: 'ROOM FULL' });
      slot = allowed[0];
    }
    const token = room.tokens[slot] || crypto.randomBytes(12).toString('hex');
    room.players[slot] = client; room.tokens[slot] = token;
    client.room = c; client.slot = slot; client.host = false;
    send(client, { type: typ === 'rejoin' ? 'rejoined' : 'joined', room: c, slot, mode: room.mode, token });
    if (room.host) send(room.host, { type: 'player-joined', room: c, slot });
    return;
  }
  const room = findRoom(client);
  if (!room) return;
  // Host broadcast relay must work for the host as well as guests.
  if (typ === 'frame') {
    for (const p of room.players) if (p) send(p, { type: 'frame', data: msg.data || '' });
    return;
  }
  if (typ === 'broadcast') {
    const inner = msg.payload || {};
    for (const p of room.players) if (p) send(p, inner);
    return;
  }
  if (client.host) return;
  if (typ === 'input' || typ === 'loadout' || typ === 'ready' || typ === 'stage') {
    msg.slot = client.slot != null ? client.slot : 1;
    if (room.host) send(room.host, msg);
  } else if (room.host) {
    send(room.host, msg);
  }
}

function serveStatic(req, res) {
  let url = decodeURIComponent((req.url || '/').split('?')[0]);
  if (url === '/' || url === '') url = '/index.html';
  const file = path.resolve(ROOT, '.' + url);
  if (!file.startsWith(ROOT + path.sep)) { res.writeHead(403); return res.end('forbidden'); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) { res.writeHead(404); return res.end('not found'); }
    const ext = path.extname(file).toLowerCase(), mime = MIME[ext] || 'application/octet-stream';
    const range = req.headers.range;
    if (range) {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        const start = m[1] ? Number(m[1]) : 0, end = m[2] ? Number(m[2]) : st.size - 1;
        if (start <= end && start < st.size) {
          res.writeHead(206, { 'Content-Type': mime, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${st.size}`, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
          return fs.createReadStream(file, { start, end }).pipe(res);
        }
      }
    }
    res.writeHead(200, { 'Content-Type': mime, 'Content-Length': st.size, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
    fs.createReadStream(file).pipe(res);
  });
}

function startWebSocket(port) {
  const server = http.createServer();
  server.on('upgrade', (req, socket) => {
    const key = req.headers['sec-websocket-key'];
    if (!key) return socket.destroy();
    const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
    socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
    const client = { socket, buf: Buffer.alloc(0), room: null, slot: null, host: false };
    client.id = nextId++;
    socket.on('data', chunk => { try { parseFrames(client, chunk); } catch (e) { socket.destroy(); } });
    socket.on('close', () => closeClient(client));
    socket.on('error', () => {});
  });
  server.listen(port, '0.0.0.0');
  return server;
}

export function startLanServer(httpPort = 8785, wsPort = 8786, root = ROOT) {
  const httpServer = http.createServer(serveStatic);
  httpServer.on('error', e => console.warn('LAN HTTP unavailable:', e.message));
  httpServer.listen(httpPort, '0.0.0.0');
  const wsServer = startWebSocket(wsPort);
  wsServer.on('error', e => console.warn('LAN WS unavailable:', e.message));
  return { httpServer, wsServer, httpPort, wsPort, root };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const hp = Number(process.argv[2]) || 8785;
  const wp = Number(process.argv[3]) || 8786;
  startLanServer(hp, wp);
  console.log(`STELLAR ASSAULT LAN: http://0.0.0.0:${hp}  ws://0.0.0.0:${wp}`);
}
