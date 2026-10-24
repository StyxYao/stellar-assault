// Ranking port. Implementations: local (M2), Steam leaderboards (M3/M9), WeChat (later).
var RankingPort = {
  adapter: null,
  setAdapter: function(adapter) { this.adapter = adapter || null; },
  submit: function(entry) {
    if (this.adapter && typeof this.adapter.submit === 'function') return this.adapter.submit(entry);
    return Promise.resolve({ ok: false, reason: 'ranking-not-configured' });
  },
  fetch: function(mode, limit) {
    if (this.adapter && typeof this.adapter.fetch === 'function') return this.adapter.fetch(mode, limit);
    return Promise.resolve([]);
  }
};
function makeLocalRankingAdapter(storageKey) {
  var key = storageKey || 'stellar-assault-ranking';
  return {
    submit: function(entry) {
      try {
        var rows = JSON.parse(localStorage.getItem(key) || '[]');
        rows.push(entry);
        rows.sort(function(a, b) { return (b.wave || 0) - (a.wave || 0) || (b.score || 0) - (a.score || 0); });
        localStorage.setItem(key, JSON.stringify(rows.slice(0, 50)));
        return Promise.resolve({ ok: true, local: true });
      } catch (e) {
        return Promise.resolve({ ok: false, reason: 'storage-unavailable' });
      }
    },
    fetch: function(mode, limit) {
      try {
        var rows = JSON.parse(localStorage.getItem(key) || '[]');
        return Promise.resolve(rows.filter(function(r) { return !mode || r.mode === mode; }).slice(0, limit || 20));
      } catch (e) {
        return Promise.resolve([]);
      }
    }
  };
}
