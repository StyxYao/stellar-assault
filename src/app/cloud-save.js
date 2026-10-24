// Cloud-save port. The desktop file store is the local source of truth in M2;
// Steam Auto-Cloud / Steamworks and WeChat adapters plug in here later.
var CloudSavePort = {
  adapter: null,
  setAdapter: function(adapter) { this.adapter = adapter || null; },
  pull: function() {
    if (this.adapter && typeof this.adapter.pull === 'function') return this.adapter.pull();
    return Promise.resolve(null);
  },
  push: function(data) {
    if (this.adapter && typeof this.adapter.push === 'function') return this.adapter.push(data);
    return Promise.resolve({ ok: false, reason: 'cloud-not-configured' });
  }
};
