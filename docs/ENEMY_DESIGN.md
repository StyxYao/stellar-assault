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
