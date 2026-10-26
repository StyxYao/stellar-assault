#!/usr/bin/env python3
"""STELLAR ASSAULT LAN server: static dist + WebSocket room relay.

Modes:
  hostp1 : host is P1, one guest is P2
  room   : host is authority only, two guests are P1/P2
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


async def broadcast_frame(room, msg):
    for ws in room.get("players", []):
        if ws:
            await send(ws, msg)


async def handler(ws):
    global NEXT_ID
    peer_id = NEXT_ID
    NEXT_ID += 1
    room_code = None
    slot = None
    is_host = False
    try:
        async for raw in ws:
            try:
                msg = json.loads(raw)
            except Exception:
                continue
            typ = msg.get("type")
            if typ == "create":
                code = make_code()
                mode = "room" if msg.get("mode") == "room" else "hostp1"
                ROOMS[code] = {"host": ws, "mode": mode, "players": [None, None]}
                room_code = code
                is_host = True
                await send(ws, {"type": "created", "room": code, "mode": mode, "role": "host"})
            elif typ == "join":
                code = str(msg.get("room", ""))[:8]
                room = ROOMS.get(code)
                if not room:
                    await send(ws, {"type": "error", "message": "ROOM NOT FOUND"})
                    continue
                free = [i for i, p in enumerate(room["players"]) if p is None]
                if room["mode"] == "hostp1":
                    free = [1] if room["players"][1] is None else []
                if not free:
                    await send(ws, {"type": "error", "message": "ROOM FULL"})
                    continue
                slot = free[0]
                room["players"][slot] = ws
                room_code = code
                await send(ws, {"type": "joined", "room": code, "slot": slot, "mode": room["mode"]})
                await send(room["host"], {"type": "player-joined", "room": code, "slot": slot})
            elif typ in ("input", "signal", "frame"):
                room = ROOMS.get(room_code or msg.get("room", ""))
                if not room:
                    continue
                if typ == "frame":
                    await broadcast_frame(room, {"type": "frame", "data": msg.get("data", "")})
                elif typ == "input":
                    msg["slot"] = slot if slot is not None else 1
                    await send(room["host"], msg)
                else:
                    # signaling is kept for future use; relay to host
                    await send(room["host"], msg)
            elif typ == "leave":
                break
    except Exception:
        pass
    finally:
        room = ROOMS.get(room_code)
        if room:
            if is_host:
                for p in room["players"]:
                    if p:
                        await send(p, {"type": "host-left"})
                ROOMS.pop(room_code, None)
            elif slot is not None:
                if 0 <= slot < 2 and room["players"][slot] is ws:
                    room["players"][slot] = None
                await send(room["host"], {"type": "player-left", "slot": slot})


async def main():
    threading.Thread(target=serve_static, daemon=True).start()
    print(f"STELLAR ASSAULT LAN: http://0.0.0.0:{HTTP_PORT}  ws://0.0.0.0:{WS_PORT}")
    async with websockets.serve(handler, "0.0.0.0", WS_PORT, max_size=4 * 1024 * 1024):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
