// Pure collision helpers. No DOM / canvas dependencies.
function circleOverlap(ax, ay, ar, bx, by, br) {
  var dx = ax - bx, dy = ay - by, rr = ar + br;
  return dx * dx + dy * dy < rr * rr;
}
function circleContains(px, py, cx, cy, r) {
  var dx = px - cx, dy = py - cy;
  return dx * dx + dy * dy < r * r;
}
