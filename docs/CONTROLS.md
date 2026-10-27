# Local Controls

P1 and P2 have independent modes:

```text
AUTO
KEYBOARD
MOUSE
TOUCH
GAMEPAD
```

## Rules

- P1 and P2 may both use keyboard.
- P1 and P2 may both use gamepad, using pad 0 / pad 1.
- Only one player may use a pointer device:
  - both `MOUSE` + `TOUCH` combinations are blocked
  - the setup screen shows `CONTROL CONFLICT`
- `AUTO` yields the pointer to the other player.
- `AUTO` accepts keyboard, mouse/touch and gamepad for P1.
- P2 `AUTO` uses keyboard/gamepad so it does not steal P1's pointer.

## Setup UI

Mission Setup has:

```text
P1 CONTROL · AUTO
P2 CONTROL · KEYBOARD   (co-op only)
```

There is no single co-op control toggle anymore.

## Input routing

- P1 pointer only when P1 allows pointer.
- P2 pointer only when P2 allows pointer.
- P1 keyboard/gamepad gated by P1 mode.
- P2 keyboard/gamepad gated by P2 mode.
