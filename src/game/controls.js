// Per-player local control modes. P1 and P2 are independent.
var CONTROL_MODES = ['auto', 'keyboard', 'mouse', 'touch', 'gamepad'];
var controlModeP1 = 'auto';
var controlModeP2 = 'keyboard';

function controlModeLabel(mode) {
  return String(mode || 'auto').toUpperCase();
}
function controlIsPointer(mode) { return mode === 'mouse' || mode === 'touch'; }
function controlModeFor(slot) { return slot === 2 ? controlModeP2 : controlModeP1; }
function controlOtherSlot(slot) { return slot === 2 ? 1 : 2; }
function controlOtherMode(slot) { return controlModeFor(controlOtherSlot(slot)); }

function controlConflict(a, b) {
  return controlIsPointer(a) && controlIsPointer(b);
}

function controlModeAllows(slot, source, pointerType) {
  if (slot === 2) {
    if (typeof coopEnabled === 'undefined' || !coopEnabled) return false;
    if (typeof player2 === 'undefined' || !player2) return false;
  }
  var mode = controlModeFor(slot);
  var other = controlOtherMode(slot);
  if (mode === 'auto') {
    if (source === 'pointer') {
      // Auto never takes the only pointer away from the other player.
      if (slot === 2) return false;
      if (controlIsPointer(other)) return false;
      return true;
    }
    return true;
  }
  if (mode === 'keyboard') return source === 'keyboard';
  if (mode === 'gamepad') return source === 'gamepad';
  if (mode === 'mouse') return source === 'pointer' && (!pointerType || pointerType === 'mouse');
  if (mode === 'touch') return source === 'pointer' && (!pointerType || pointerType === 'touch');
  return false;
}

function setControlMode(slot, mode) {
  if (CONTROL_MODES.indexOf(mode) < 0) return false;
  var other = controlOtherMode(slot);
  if (slot === 2 && (typeof coopEnabled === 'undefined' || !coopEnabled)) return false;
  if (controlConflict(mode, other)) {
    pickupMsg = 'CONTROL CONFLICT · P1 AND P2 BOTH POINTER';
    pickupT = 1.8;
    return false;
  }
  if (slot === 1 && controlConflict(mode, controlModeP2)) {
    pickupMsg = 'CONTROL CONFLICT · P2 IS USING POINTER';
    pickupT = 1.8;
    return false;
  }
  if (slot === 1) controlModeP1 = mode; else controlModeP2 = mode;
  pickupMsg = 'P' + slot + ' CONTROL · ' + controlModeLabel(mode);
  pickupT = 1.2;
  return true;
}

function cycleControlMode(slot, delta) {
  var cur = controlModeFor(slot);
  var i = CONTROL_MODES.indexOf(cur);
  if (i < 0) i = 0;
  var n = CONTROL_MODES.length;
  var next = (i + (delta || 1) + n) % n;
  return setControlMode(slot, CONTROL_MODES[next]);
}
