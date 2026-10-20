# Enemy Fleet Design

## Direction

A unified enemy fleet for the four-stage campaign:

- dark gunmetal mechanical armor
- crisp panel lines and readable silhouettes
- one faction color per role
- nose-down orientation for the vertical shmup camera
- normal (`_1`) and elite (`_2`) variants share the same silhouette family
- old vector sprites are kept in `docs/enemies/vector/` as design history

## Roster

| # | Role | Normal palette | Elite palette | Gameplay read |
|---|------|----------------|---------------|---------------|
| 1 | Small Fighter | white / red | black / gold / crimson | fast, small hitbox, rush waves |
| 2 | Medium Fighter | green / silver | black / dark green / gold | mid-tier escort, aimed shots |
| 3 | Scout | purple / gold | black / gold / violet-white | circular drone, rings and sweeps |
| 4 | Bomber | deep blue / cyan | black / blue / orange | heavy, slow, wide bullet walls |
| 5 | Mech | brass / gunmetal | black / brass / red | armored gunship, dense fire |
| 6 | Interceptor | blue / violet | matte black / violet / magenta | fast flanker, converging shots |

## Files

Normal: `gpt-assets/enemies/NN_<role>_1.png`  
Elite: `gpt-assets/enemies/NN_<role>_2.png`  
Vector reference: `docs/enemies/vector/NN_<role>.png`  
Design board: `art-tests/enemies-design-board.jpg` (working review image)

## Usage

- Normal waves use `_1`.
- Elite / ace waves use `_2`.
- Do not bulk-rotate enemy sprites; all source art already points down.
- Keep the transparent 1024×1024 canvas and center the body for consistent hitbox/visual alignment.

## New Enemy Types (texture replacements for vector placeholders)

### 6 / Aegis Warden
- Role: shield drone / area denial
- Attack: twin charged beams plus a ring of eight orbiting orbs
- Normal: white / ice blue / cyan core
- Elite: black / gold shell / violet-white core
- Sprite: `gpt-assets/enemies/07_aegis_warden_1.png` / `_2.png`

### 7 / Rail Lancer
- Role: long-range sniper
- Attack: 1.05s charge telegraph, then a fast red rail beam aimed at the player
- Normal: black / crimson coils
- Elite: black / violet-white energy
- Sprite: `gpt-assets/enemies/08_rail_lancer_1.png` / `_2.png`

### 8 / Mine Seeder
- Role: area control / trap layer
- Attack: drops five slow mines; each mine fuses for 1.35s then bursts into an eight-bullet ring
- Normal: olive green / amber pods
- Elite: black / amber / gold
- Sprite: `gpt-assets/enemies/09_mine_seeder_1.png` / `_2.png`

Wave introduction:
- Stage 1: Aegis Warden at 34.5s, plus the late multi-stage Aegis wave
- Stage 2: Rail Lancer at 34.5s, Mine Seeder at 69s
- Stage 3: Mine Seeder at 33s, Rail Lancer at 69s

## Final Roster

All 9 types have a normal (`_1`) and a distinct elite (`_2`) sprite:

`01 small_fighter` · `02 medium_fighter` · `03 scout` · `04 bomber` · `05 mech` · `06 interceptor` · `07 aegis_warden` · `08 rail_lancer` · `09 mine_seeder`

Roster board: `docs/enemies/roster-9x2.jpg`
