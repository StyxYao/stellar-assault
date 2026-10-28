// Structured, rate-limited diagnostics. Debug builds keep a recent error log;
// production logs each error key once so a render loop cannot flood the console.
var ERROR_LOG = [];
var ERROR_SEEN = Object.create(null);
function reportError(error, context) {
  var key = String(context || 'unknown');
  var message = error && error.message ? error.message : String(error || 'unknown error');
  if (!ERROR_SEEN[key]) {
    ERROR_SEEN[key] = true;
    try { console.error('[' + key + ']', error || message); } catch (e) {}
  }
  ERROR_LOG.push({ key: key, message: message, at: Date.now() });
  if (ERROR_LOG.length > 40) ERROR_LOG.shift();
  return false;
}
