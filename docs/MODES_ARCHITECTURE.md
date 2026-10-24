# Game Modes & Ranking Architecture

Status: contracts only. Campaign is the only playable mode; Boss Rush and Tower are not exposed in the menu yet.

## Modes

`src/app/modes.js` defines `GAME_MODE_CONTRACTS`.

| Mode | Kind | Status | Ranking |
|---|---|---|---|
| Campaign | 5 stages / 5 bosses | live | `campaign_score` |
| Boss Rush | boss sequence, no stage waves | scaffold | `boss_rush_score` |
| Tower | endless waves + boss every N | scaffold | `tower_wave` |

### Boss Rush

Planned lifecycle:

1. Select Boss Rush in the mode menu.
2. Load boss definitions in `bossSequence`.
3. Skip stage waves, background stage transitions and mid-stage mini bosses.
4. After each boss: short interlude, heal/supply policy, next boss.
5. Finish when all bosses are dead or the player has no lives.
6. Submit `{ mode, score, clearTime, bossesDefeated, livesRemaining }`.

### Tower

Planned lifecycle:

1. Generate a wave from a deterministic seed.
2. Scale enemy HP/damage/speed by wave using `scaling`.
3. Insert a boss every `bossEveryWaves`.
4. Grant a supply choice every N waves.
5. Finish on death; rank by `wave`, then `score`.
6. Submit `{ mode, wave, score, seed, duration, build }`.

Tower should not use the Campaign `stageT`/`STAGES` switch. It needs an endless wave provider and a run-summary object.

## Required runtime interfaces

```ts
interface GameModeRuntime {
  start(options: RunOptions): void;
  nextWave(run: RunState): void;
  onWaveCleared(run: RunState): void;
  onBossDefeated(run: RunState): void;
  isComplete(run: RunState): boolean;
  summarize(run: RunState): RunResult;
}
```

The current closure can host these as plain objects. Do not add another global state machine until M4; first extract `RunState` and `startRun(modeId, options)`.

## Ranking

`src/app/ranking.js` defines `RankingPort` and `makeLocalRankingAdapter()`.

Adapters:

- Local: localStorage, used for M2 save/leaderboard prototyping.
- Steam: Steamworks leaderboards in M3/M9; submit only after run validation.
- WeChat: platform leaderboard later; not part of Steam M1.

Submission shape:

```ts
interface RankEntry {
  mode: 'campaign' | 'bossRush' | 'tower';
  score: number;
  wave?: number;
  duration?: number;
  bossesDefeated?: number;
  seed?: string;
  version: string;
}
```

## Integration order

1. M2: save/load + local ranking adapter.
2. M3: Steam identity and leaderboard adapter.
3. M4: mode menu, Boss Rush, Tower skeleton.
4. M5: mode-specific UI, localized labels.
5. M7: score validation and leaderboard abuse tests.

## Non-goals for M1/M2

- No online backend.
- No anti-cheat claim for client-side scores.
- No Tower content until the endless wave provider exists.
