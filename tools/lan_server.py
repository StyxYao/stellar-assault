#!/usr/bin/env python3
"""STELLAR ASSAULT LAN server: static dist + WebSocket room relay.

Usage:
  python3 tools/lan_server.py [http_port] [ws_port]

The game is served from ./dist. Open http://<host-ip>:8785/index.html.
Host creates a room in the game; guest opens the same URL with ?lanclient=1.
Only LAN use; no authentication, no internet relay.
"""
import asyncio
import http.server
import json
import os
import random
import socketserver
import sys
import threading
from pathlib import Path

try:
    import websockets
except ImportError:
    raise SystemExit("pip install websockets")

ROOT = Path(__file__).resolve().parent.parent / "dist"
HTTP_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8785
WS_PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8786
ROOMS = {}
NEXT_ID = 1


class StaticHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        if os.environ.get("LAN_VERBOSE"):
            super().log_message(fmt, *args)


def serve_static():
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("0.0.0.0", HTTP_PORT), StaticHandler) as httpd:
        httpd.serve_forever()


def make_code():
    while True:
        code = f"{random.randint(1000, 9999)}"
        if code not in ROOMS:
            return code


async def send(ws, payload):
    try:
        await ws.send(json.dumps(payload, separators=(",", ":")))
    except Exception:
        pass


async def handler(ws):
    global NEXT_ID
    peer_id = NEXT_ID
    NEXT_ID += 1
    room_code = None
    role = None
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            typ = msg.get("type")
            if typ == "create":
                code = make_code()
                ROOMS[code] = {"host": ws, "guest": None, "host_id": peer_id}
                room_code = code
                role = "host"
                await send(ws, {"type": "created", "room": code, "role": "host"})
            elif typ == "join":
                code = str(msg.get("room", ""))[:8]
                room = ROOMS.get(code)
                if not room or room.get("guest") is not None:
                    await send(ws, {"type": "error", "message": "ROOM NOT FOUND OR FULL"})
                    continue
                room["guest"] = ws
                room["guest_id"] = peer_id
                room_code = code
                role = "guest"
                await send(ws, {"type": "joined", "room": code, "role": "guest"})
                await send(room["host"], {"type": "peer-joined", "room": code})
            elif typ in ("input", "signal", "frame"):
                room = ROOMS.get(room_code or msg.get("room", ""))
                if not room:
                    continue
                target = room.get("guest") if role == "host" else room.get("host")
                if target:
                    msg["from"] = role
                    await send(target, msg)
            elif typ == "leave":
                break
    except Exception:
        pass
    finally:
        room = ROOMS.get(room_code)
        if room:
            other = room.get("guest") if role == "host" else room.get("host")
            if other:
                await send(other, {"type": "peer-left"})
            if role == "host":
                ROOMS.pop(room_code, None)
            elif role == "guest":
                room["guest"] = None


async def main():
    threading.Thread(target=serve_static, daemon=True).start()
    print(f"STELLAR ASSAULT LAN: http://0.0.0.0:{HTTP_PORT}  ws://0.0.0.0:{WS_PORT}")
    async with websockets.serve(handler, "0.0.0.0", WS_PORT, max_size=4 * 1024 * 1024):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
