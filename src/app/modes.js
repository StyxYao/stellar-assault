// Game-mode contracts. These are descriptors, not implementations.
// Campaign is live today; Boss Rush and Tower are intentionally scaffolded only.
var GAME_MODE_CONTRACTS = {
  campaign: {
    id: 'campaign',
    label: 'CAMPAIGN',
    subtitle: '5 STAGES · 5 BOSSES',
    kind: 'stages',
    available: true,
    leaderboardKey: 'campaign_score',
    unlock: null,
    clearCondition: 'all_stages',
    stages: 5
  },
  bossRush: {
    id: 'bossRush',
    label: 'BOSS RUSH',
    subtitle: 'FIVE ECHOES · NO STAGES',
    kind: 'boss_sequence',
    available: false,
    leaderboardKey: 'boss_rush_score',
    unlock: 'campaign_clear',
    clearCondition: 'all_bosses',
    bossSequence: ['b1_', 'b2_', 'b3_', 'b4_', 'b5_'],
    allowContinues: false
  },
  tower: {
    id: 'tower',
    label: 'TOWER',
    subtitle: 'ENDLESS ASCENT · RANK BY WAVE',
    kind: 'endless',
    available: false,
    leaderboardKey: 'tower_wave',
    unlock: 'campaign_stage_3',
    clearCondition: 'endless',
    bossEveryWaves: 5,
    scaling: { hp: 1.08, damage: 1.04, speed: 1.01 },
    rankBy: ['wave', 'score']
  }
};
function getGameModeContract(id) { return GAME_MODE_CONTRACTS[id] || null; }
function listGameModeContracts() {
  return Object.keys(GAME_MODE_CONTRACTS).map(function(id) { return GAME_MODE_CONTRACTS[id]; });
}
