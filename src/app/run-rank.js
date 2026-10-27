// R7 run rank, medal and local top runs.
var lastRunResult = null;
var RUN_MEDALS = ['E','D','C','B','A','S'];
function runRankCompute(won) {
  var s = Math.max(0, Number(score) || 0);
  var rank = 0;
  if (s >= 3000) rank = 1;
  if (s >= 8000) rank = 2;
  if (s >= 15000) rank = 3;
  if (s >= 25000) rank = 4;
  if (s >= 40000) rank = 5;
  if (won) rank = Math.max(rank, 2);
  var lives = player ? player.lives : 0;
  if (won && lives >= 2 && rank < 5) rank++;
  if (!won && stage <= 0 && rank > 0) rank--;
  rank = Math.max(0, Math.min(5, rank));
  return { rank: rank, medal: RUN_MEDALS[rank], score: s, stage: stage, won: !!won };
}
function runRankRecord(won) {
  var r = runRankCompute(won);
  lastRunResult = r;
  try {
    if (!SaveStore.data) return r;
    var c = SaveStore.data.campaign;
    c.lastRank = r.rank; c.lastMedal = r.medal;
    if (r.rank >= (c.bestRank || 0)) { c.bestRank = r.rank; c.bestMedal = r.medal; }
    var rows = c.topRuns || [];
    rows.push({ score: r.score, stage: r.stage, won: r.won, rank: r.rank, medal: r.medal, at: Date.now() });
    rows.sort(function (a, b) { return (b.score || 0) - (a.score || 0); });
    c.topRuns = rows.slice(0, 5);
  } catch (e) {}
  return r;
}
