# Asset orientation and generation rules

## Screen orientation

- Player ship: nose points **up**
- All enemy aircraft: nose points **down**, toward the player
- All bosses: front / main cannon / nose points **down**, toward the player
- Sentry/turret-style enemies: radial orientation is acceptable

## Pipeline

1. Generate or edit the asset.
2. Verify orientation visually before integration.
3. Normalize transparent bounds to a 1024×1024 canvas.
4. Save the source asset already facing down.
5. Do **not** apply a runtime vertical flip unless the asset is documented as an exception.

This prevents accidental double-flips when art is regenerated.

## Boss bullet palettes

| Boss | Main | Accent | Beam |
|---|---|---|---|
| Boss 1 Void Sovereign | crimson | ice blue | crimson |
| Boss 2 Abyss Devourer | violet | magenta | violet |
| Boss 3 Star Behemoth | amber | cyan | cyan |
| Boss 4 Seraphic Wings | white-gold | ivory | warm gold |

Bullets are pre-rendered per palette; collision radii and trajectories are unchanged.

## Stage background layers

Each stage uses three layers:

1. `assets/bg/stageN-main.webp` — opaque main background, scroll speed 82 px/s
2. `assets/bg/stageN-edge.webp` — transparent side nebula/station/asteroid layer, scroll speed 165 px/s
3. Procedural dust — fastest layer, 220–410 px/s

The image layers are mirrored vertically at runtime so the loop seam is exact. The center of the edge layer is masked transparent for bullet readability.
