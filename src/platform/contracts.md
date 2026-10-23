# Platform contracts

These are the boundaries to extract before shipping to Steam and WeChat.

```ts
interface VideoSurface {
  play(): Promise<void>;
  pause(): void;
  seek(t: number): void;
  draw(ctx: CanvasRenderingContext2D, rect: Rect, alpha: number): void;
  readonly duration: number;
  readonly currentTime: number;
}

interface AudioPort {
  playSfx(name: string, volume: number): void;
  playBgm(name: string): void;
  stopBgm(): void;
  setMuted(muted: boolean): void;
}

interface StoragePort {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
}

interface InputPort {
  onPointer(handler: (x: number, y: number) => void): void;
  onKey(handler: (code: string, down: boolean) => void): void;
}
```

Web can implement these with DOM/Web Audio. WeChat must implement them with `wx.createCanvas`, `wx.createInnerAudioContext`, `wx.createImage` and a non-DOM video path. Steam uses the web adapters inside Electron/Tauri plus Steamworks for cloud/achievements.
