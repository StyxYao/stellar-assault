// Deterministic fixed-step accumulator. No DOM / platform APIs.
function FixedStep(step, maxSteps) {
  this.step = step || 1 / 60;
  this.maxSteps = maxSteps || 4;
  this.accumulator = 0;
}
FixedStep.prototype.advance = function (dt, update) {
  if (!(dt > 0)) return 0;
  this.accumulator += dt;
  var steps = 0;
  while (this.accumulator >= this.step && steps < this.maxSteps) {
    update(this.step);
    this.accumulator -= this.step;
    steps++;
  }
  return steps;
};
FixedStep.prototype.reset = function () { this.accumulator = 0; };
