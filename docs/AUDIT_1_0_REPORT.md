# STELLAR ASSAULT 1.0 独立审计与执行改进报告

> 审计日期：2026-10-28  
> 实际 HEAD：`345e7c2`  
> 游戏代码基线：`f43f25d`  
> 当前版本：`1.0.0-rc.1`  
> 交接说明：`docs/AUDIT_HANDOFF.md`  
> 审计方式：只读静态审计、项目自带构建/检查、隔离 Electron 运行时验证  
> 源码状态：审计期间未修改游戏源码，Git 工作区保持干净

---

## 0. 给执行 AI 的约束

1. 按本报告的 P0 → P1 → P2 顺序执行，不要先做大规模架构重写。
2. 不要直接推送到 `main`，不要创建 Release，不要修改 Steam、签名或证书配置。
3. 不要通过关闭 Stage 5 背景、Boss 相位或融合动画来“解决”性能问题。
4. 不要通过扩大 Force 清扫 lane 来“解决”漏弹。
5. 不要把测试、强制状态或模拟结果写成人工通关、Steam Deck Verified 或 Windows 实机验收。
6. 不要把未签名安装器写成“杀毒误报已解决”。
7. Boss Rush / Tower 仍属于 1.1，不得塞进 1.0。
8. 每个核心修复必须附带对应回归测试；不要将所有状态机改动压成一个大提交。
9. 本报告中的伪代码用于说明职责和步骤，执行时应匹配项目现有变量、函数和代码风格。
10. 修改任何文档所描述的行为后，同步更新对应文档和注释。

建议提交拆分：

```text
fix(stage5): repair phase-3 fallback rendering
fix(aegis): handle BulletML in shield and Force paths
fix(coop): unify P2 collision and preserve stage progression
fix(lan): serialize complete projectile and owner state
fix(run): finalize campaign exactly once and show summary
fix(lan-server): reject malformed URLs and invalid ranges
fix(input): repair keyboard/gamepad menu paths
refactor(video): introduce stage-aware playback lifecycle
test(release): add gameplay, rendering and co-op regression gates
refactor(core): unify damage/run boundaries after regressions pass
```

---

## 1. 结论摘要

**当前不建议发布正式 1.0。**

问题不只是润色和平衡：本轮发现了多个已复现的渲染、战斗、合作模式、LAN、存档和输入问题。现有自动化 PASS 不能证明已达到发布级别。

### 已通过的检查

以下命令在审计基线上通过：

```bash
bash tools/build_pages.sh
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
node tools/verify_release.mjs
```

结果摘要：

- Web 构建成功。
- fixed-step、数学、基础碰撞测试通过。
- 内容、结构、版本检查通过。
- macOS 上 Electron 开发外壳可启动。
- 全 5 关、各 3 相位渲染扫查中，只有 Stage 5 phase 3 出现重复渲染异常。

### 运行时验证边界

- 使用独立临时 Electron 配置目录，没有读取或改写真实玩家存档。
- 使用项目自带调试接口驱动真实 `step()` 和状态机。
- 强制状态、合成弹体和渲染扫查不等于人工完整通关。
- 本环境不能替代 Windows、物理 LAN、Steam Deck 或 Steamworks 验收。

---

## 2. 优先级定义

- **P0**：已确认的核心功能错误、崩溃或数据丢失风险；必须阻断 1.0。
- **P1**：正式公开发布前应完成的玩法一致性、输入、性能和发布流水线修复。
- **P2**：架构、可维护性、文档和发布质量收口；不应先于 P0/P1 占用执行顺序。

---

# 第一阶段：P0，必须阻断 1.0

## P0-01：Stage 5 第三阶段视频回退路径每帧渲染异常

**状态：代码确认 + 运行时确认**

### 证据

- `src/render/bosses.js:214` 使用未定义变量 `scale`。
- `src/render/bosses.js:396-401` 第三阶段直接进入 `drawPhase3CollapseForm()`。
- `src/legacy/game.js:293-297` 捕获异常后停止当帧后续绘制。

运行时错误：

```text
ReferenceError: scale is not defined
at drawPhase3CollapseForm
```

### 复现

视频未播放时进入 Stage 5 phase 3。弹体仍绘制，但 Boss、玩家和 HUD 消失。视频正常播放时因提前返回而掩盖问题。

### 根因

静态回退路径引用不存在的全局 `scale`；既有检查没有覆盖视频回退渲染。

### 建议修复

使用局部、明确的缩放值，不依赖不存在的全局变量；视频和静态回退路径都必须测试。

```js
function drawPhase3CollapseForm() {
  if (!boss) return;

  const cx = boss.x;
  const cy = boss.y;
  const artScale = phaseBossSize() / 430;

  // Keep the existing video path.

  const ringR = [190, 164, 138, 112].map(r => r * artScale);
  const ringS = [88, 74, 60, 48].map(s => s * artScale);

  // Continue fallback rendering with local artScale.
}
```

### 风险

低。

### 回归测试

Stage 5 phase 3 分别测试：视频播放、视频暂停、视频加载失败、键盘-only、鼠标路径。要求 Boss、玩家、HUD 完整且无 console error。

---

## P0-02：AEGIS 护盾和 Force 完全绕过 BulletML 弹体

**状态：代码确认 + 运行时确认**

这是目前与“黄色大弹清不掉、碰到只扣盾不消失”最吻合的根因。

### 证据

游戏存在两套主要敌对弹体：

- `bullets`：BulletML，由 `src/game/stage-flow.js:247-260` 创建。
- `ebullets`：普通弹幕。

但以下路径只处理 `ebullets/orbBullets`：

- Force lane：`src/game/ships.js:441-464`
- Force 移动碰撞：`src/game/ships.js:557-580`
- 挂载护盾：`src/game/ships.js:689-709`
- AEGIS 承伤清理：`src/game/player-state.js:22-30`
- BulletML 碰撞入口：`src/game/step.js:397-404`

运行时结果：

```text
护盾承伤前：BulletML 30，护盾 60
护盾承伤后：BulletML 30，护盾 52

Force 发射前：BulletML 30
Force 发射后：BulletML 30，状态 detached
```

### 复现

使用真实 Boss pattern 生成 BulletML，让 AEGIS 护盾承伤或发射 Force；BulletML 数量不减少。

### 根因

弹体系统分裂，AEGIS 各清除入口只覆盖部分数组；承伤函数也没有消费触发它的 BulletML 弹体。

### 建议修复

不要继续加宽 Force。先让同一套清除逻辑覆盖所有弹体类型，并保证“承伤的弹体被消费一次”。

```js
function forEachBulletMLAt(x, y, radius, callback) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    if (!b) continue;

    if (circleOverlap(x, y, radius, b.x, b.y, b.rad || 0)) {
      callback(b, i);
    }
  }
}

function consumeBulletML(index) {
  const b = bullets[index];
  if (!b) return;

  b.dead = true;
  bullets.splice(index, 1);
}

function clearBulletMLContact(x, y, radius) {
  let cleared = 0;

  forEachBulletMLAt(x, y, radius, (b, index) => {
    spawnClearEffect(b.x, b.y);
    consumeBulletML(index);
    cleared++;
  });

  return cleared;
}
```

将清除能力接入：

1. 挂载护盾清除。
2. Force 发射 lane。
3. Force `detached` 移动碰撞。
4. AEGIS 承伤后的弹体消费。
5. 如保留“大弹在 Force 分离后也能被核心拦截”的规则，还需在 `src/game/step.js:397-404` 调用 `aegisTryBlockBigBullet(b)`。

### 风险

中。必须保持 `returning` 不清弹，不得扩大现有半径，不得改变普通弹与爆炸区的既有规则。

### 回归测试

使用真实 `setBossPattern()` 生成的 BulletML，而不只是 `__spawnEB()`；分别覆盖挂载、去程、回程、破盾瞬间、整链弹体、扇形弹体和持续刷新弹体。

---

## P0-03：P2 对普通弹体、光束和爆炸区基本免疫

**状态：代码确认 + 运行时确认**

### 证据

- 普通 `ebullets` 只检测 P1：`src/game/step.js:437-469`
- 光束只检测 P1：`src/game/combat.js:208-229`
- 爆炸区只检测 P1：`src/legacy/game.js:197-206`
- P2 没有在其他模块补做这些碰撞。
- `src/game/coop.js:249-251` 没有像 P1 一样检查 `odT`，P2 在 OD 期间仍可能受伤。

运行时结果：将静止 `ebullet` 放在 P2 中心：

```text
前：P2 HP 2，ebullets 0
后：P2 HP 2，ebullets 1
```

弹体与 P2 重叠但没有造成伤害。

### 根因

P1/P2 碰撞规则分散复制，普通弹体和部分持续效果只实现了 P1 路径。

### 建议修复

统一玩家碰撞入口，不再在多条循环里分别遗漏规则。

```js
function tryProjectileHitPlayer(slot, projectile) {
  const p = slot === 1 ? player : player2;
  if (!p) return { hit: false, consume: false };

  if (!circleOverlap(
    projectile.x, projectile.y, projectile.rad || 0,
    p.x, p.y, p.r
  )) {
    return { hit: false, consume: false };
  }

  const result = slot === 1
    ? hitPlayer(projectile)
    : coopHitP2(projectile);

  return {
    hit: result !== 'ignored',
    consume: result === 'absorbed' || result === 'damaged'
  };
}
```

`hitPlayer()` / `coopHitP2()` 返回明确结果：

```text
ignored：无敌、OD 或状态不允许；不消费弹体
absorbed：护盾吸收；消费触发弹体
damaged：生命受伤；消费触发弹体
```

在 `ebullets`、BulletML、orb、beam、blastZone 中统一调用。光束和爆炸区不是一次性弹体时，只记录本周期已命中，不删除整个效果。

### 风险

中。必须避免同一持续光束在无敌结束后异常多次扣血，也要避免把“忽略碰撞”错误实现为“删除弹体”。

### 回归测试

P1/P2 × VECTOR/AEGIS/PHANTOM × 普通弹/BulletML/orb/beam/blast × 正常/无敌/OD/破盾。

---

## P0-04：P2 每关被重建，且存在隐式无限续命

**状态：代码确认 + 运行时确认**

### 证据

- `src/game/stage-flow.js:89` 每关调用 `coopSpawn()`。
- `src/game/coop.js:218-247` 重新创建 P2，生命、炸弹和火力全部重置。
- `src/game/coop.js:263-276` P2 生命归零后直接恢复为 3。
- P2 没有和 P1 一致的力量损失、OD 清零和死亡流程。

运行时结果：

```text
进下一关前：P2 power 2
进下一关后：P2 power 1
```

连续触发死亡后，P2 最终仍回到 3 条命。

### 根因

“新 Run 创建玩家”和“跨关重置位置”混用同一个 `coopSpawn()`；死亡规则中硬编码了未说明的续命。

### 建议修复

```js
function startStage(index, options = {}) {
  // Existing stage setup.

  if (coopEnabled) {
    if (!player2 || options.newRun) {
      coopSpawn(); // Fresh run only.
    } else {
      coopPrepareP2ForStage(player2);
    }
  }
}

function coopPrepareP2ForStage(p) {
  p.x = W / 2 - 72;
  p.y = H - 150;
  p.invuln = 2.0;
  p.respawnT = 0;

  applyVariantStatsWithoutResettingRun(p);

  // Preserve lives, bombs, weapon, specialPower,
  // powerXp, options and ship-specific progression.
}
```

P2 生命归零的产品规则必须明确，不能静默恢复：

```js
if (p.lives <= 0) {
  enterP2DownState(); // Spectator / limited continue / run over.
  // Do not silently assign p.lives = 3.
}
```

建议 1.0 选择最简单且可说明的规则，并记录 ADR：共享失败、有限续命，或观战至下一关三选一。

### 风险

中，涉及合作模式产品规则。执行前需项目所有者选择死亡/续命规则。

### 回归测试

连续五关检查 P2 成长保留、死亡代价、双方同时归零、P2 归零后 Boss 战和结算。

---

## P0-05：LAN 快照丢失 BulletML，对象引用也无法正确恢复

**状态：代码确认 + 运行时确认**

### 证据

- `World.snapshotFull()`：`src/game/coop.js:79-98`
- `World.restore()`：`src/game/coop.js:100-133`
- 两者均没有 `bullets` 和 `runner`。
- `enemies/beams/orbBullets` 中的 `owner`、`leader` 经 JSON 克隆后变成不同对象，恢复后 `enemies.indexOf(owner)` 会失败。

运行时结果：

```text
Host 实际 BulletML：30
快照存在 bullets 字段：false
清空后恢复快照：BulletML 0
```

### 复现

Host 运行带 BulletML 的 Boss pattern，获取 `World.snapshotFull()`；清空本地弹体后恢复快照，BulletML 仍为空。

### 根因

快照模型不完整，并把运行时对象引用直接交给 JSON 克隆。Client 没有可恢复的 BulletML runner。

### 建议修复

1.0 不需要重写为确定性锁步，但快照必须完整、可序列化。

```js
function snapshotEnemy(e) {
  return {
    id: e.id,
    type: e.type,
    x: e.x,
    y: e.y,
    hp: e.hp,
    leaderId: e.leader ? e.leader.id : null
  };
}

function snapshotBeam(b) {
  return {
    ...plainBeamFields(b),
    ownerId: b.owner ? b.owner.id : null,
    ownerKind: b.owner === boss ? 'boss' : 'enemy'
  };
}

function restoreWorld(s) {
  const enemyById = new Map();

  enemies = s.enemies.map(raw => {
    const e = restoreEnemy(raw);
    enemyById.set(e.id, e);
    return e;
  });

  for (const e of enemies) {
    e.leader = enemyById.get(rawLeaderId(e)) || null;
  }

  beams = s.beams.map(raw => restoreBeam(raw, enemyById, boss));
  bullets = s.bullets.map(restoreClientBulletML);
}
```

对于 Client 的 BulletML，不要序列化不可恢复的 runner 闭包。使用 Host 权威的普通坐标快照：

```js
function restoreClientBulletML(raw) {
  return {
    x: raw.x,
    y: raw.y,
    rad: raw.rad,
    dead: false,
    r: {
      x: raw.x,
      y: raw.y,
      direction: raw.direction,
      update() {
        // Client does not rerun BulletML scripts.
        // Host supplies authoritative positions at 20 Hz.
      }
    }
  };
}
```

同时补齐关卡过渡计时器和必要状态，避免 Client 使用陈旧本地值。

### 风险

高。必须独立回归 LAN，不能只验证“两个 Client 能加入”。

### 回归测试

Fresh Client、重连 Client、所有 Boss 相位、escort leader、enemy-owned beam、orb、Stage 5 全流程。

---

## P0-06：正常击败最终 Boss 不保存胜场、Rank 或 Top 5

**状态：代码确认 + 运行时确认**

### 证据

- 最终 Boss 死亡进入 `finale`：`src/game/step.js:405-419`
- `finale → cast`：`src/game/step.js:44`
- `startCast()`：`src/game/stage-flow.js:2-5`
- 这条正常路径没有 `recordRunEnd(true)`。
- Cast 最终页不显示 `lastRunResult`，与 `README.md:144` 的承诺不符。

运行时沿真实状态路径走到 Cast：

```text
bossDeath1 → bossOmen → boss → finale → cast

wins：0 → 0
runs：0
topRuns：0
```

### 根因

普通关卡的通关记录路径与 Stage 5 自定义 finale 路径不一致；Run 结束没有统一、幂等入口。

### 建议修复

```js
let runFinalized = false;

function resetRun() {
  runFinalized = false;
  // Existing reset.
}

function finishRun(won) {
  if (runFinalized) return;
  runFinalized = true;

  recordRunEnd(won);
}

function updateFinale(dt) {
  finaleT += dt;

  if (finaleT >= 8.35) {
    finishRun(true);
    startCast();
  }
}
```

在 Cast 结束或独立结算页展示：

```text
SCORE / RANK / MEDAL / LOCAL TOP 5
```

同时区分“从第一关开始的完整 Campaign”和“Stage Select 单关 Run”，避免单关分数污染完整战役榜。

### 风险

中。需要避免调试函数、重复状态跳转和正常路径重复记录。

### 回归测试

正常 finale、游戏失败、重复调用结束函数、Stage Select、重新进入 Cast，确保每次 Run 只记录一次。

---

## P0-07：一个畸形 HTTP URL 可以直接使 LAN 服务退出

**状态：代码确认 + 运行时确认**

### 证据

`tools/lan_server.mjs:129-133` 在请求回调中直接执行 `decodeURIComponent()`，没有异常处理。

运行时请求 `/%`：

```text
URIError: URI malformed
Node.js exit code 1
```

### 根因

HTTP 输入解析缺少异常边界；Range 处理也缺少完整校验。

### 建议修复

```js
function serveStatic(req, res) {
  let url;

  try {
    url = decodeURIComponent((req.url || '/').split('?')[0]);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('bad request');
    return;
  }

  // Resolve and validate path.
}
```

同时修正 Range：

```js
const start = m[1] ? Number(m[1]) : 0;
const end = m[2]
  ? Math.min(Number(m[2]), st.size - 1)
  : st.size - 1;

if (!Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 || start > end || start >= st.size) {
  res.writeHead(416, { 'Content-Range': `bytes */${st.size}` });
  res.end();
  return;
}
```

### 风险

低。

### 回归测试

`/%`、非法路径、越界 Range、suffix Range、正常视频拖动；服务不得退出。

---

# 第二阶段：P1，正确性、输入与性能收口

## P1-01：桌面控制选择有真实异常，手柄确认还会被重复消费

**状态：代码确认 + 运行时确认**

### 证据

- `src/platform/desktop/input.js:64-70` 在 `desktopConfirm()` 内使用未定义的 `k` 和 `e`。
- 已复现 `ReferenceError: k is not defined`。
- `desktopPoll()` 开头已经读取一次 A/B 键，机体选择分支又调用 `desktopPadEdge()`，第二次拿不到同一个边沿。
- P2 固定读取 `pads[1]`，只有一只手柄且分配给 P2 时无法使用。
- `README.md:58` 宣称 `P` 暂停，但游戏内没有对应实现。

### 建议修复与伪代码

```js
function desktopConfirm() {
  if (controlSelectOpen) {
    controlSelectChoose(controlSelectIndex);
    return;
  }

  // Other confirm paths; no k/e references.
}

function desktopPoll() {
  const pressed = readAllButtonEdgesOnce(pad);

  if (shipSelectOpen) {
    if (pressed.a) desktopConfirm();
    if (pressed.b) closeShipSelect();
    return;
  }

  // Reuse pressed.a/b everywhere; never poll the same edge twice.
}
```

手柄按逻辑玩家槽位映射，不按数组位置硬编码。`P` 暂停应选择实现或修正文档，保持说明一致。

### 回归测试

纯键盘完成所有菜单；单手柄 P1、单手柄 P2、双手柄、控制选择、机体和变体选择。

---

## P1-02：视频生命周期破坏懒加载，键盘路径不播放动画

**状态：代码确认 + 运行时确认**

### 证据与复现

- `src/platform/web/input.js:18-22` 任意菜单指针操作都会播放全部 Stage 5 视频。
- `src/platform/desktop/input.js:35-40` 的桌面键盘初始化不启动视频。
- `src/platform/web/video.js:51-55` 进入 Stage 5 对所有视频重新 `load()`。
- `src/render/bosses.js:145` 绕过 `videoFrameSource()`，直接绘制视频。

实测：

```text
键盘-only：背景视频 ready 0，paused true
菜单点击后：ready 4，paused false
进入 Stage 5：被重置为 paused true，currentTime 0
```

这可能导致后台同时解码两段 60 fps 的 720×1200 视频和其他视频，也可能在进入关卡后停在静态回退。

### 建议修复

建立统一 VideoManager，按需加载和播放，不关闭动画。

```js
function prepareStage5Videos() {
  for (const v of stage5Videos) {
    if (v.readyState === 0) v.load();
  }

  playWhenReady(bgLoopVideo);
  preloadOnly(phase2LoopVideo, phase3LoopVideo, hedronLoopVideo, fusionVideo);
}

function setBossVisualPhase(phase) {
  pauseIfUnused(phase2LoopVideo, phase !== 1);
  pauseIfUnused(phase3LoopVideo, phase !== 2);
  pauseIfUnused(hedronLoopVideo, phase !== 0);

  if (phase === 1) playWhenReady(phase2LoopVideo);
  if (phase === 2) playWhenReady(phase3LoopVideo);
  if (phase === 0) playWhenReady(hedronLoopVideo);
}
```

其他要求：

- 删除菜单指针路径中的“播放全部视频”。
- 键盘、鼠标、触屏走同一生命周期。
- `src/render/bosses.js:145` 改为 `videoFrameSource(hedronLoopVideo)`。
- 记录 rVFC 回调次数、`error/stalled/waiting`、缓存异常、视频分辨率和绘制耗时。

### 风险

主要在自动播放策略与播放时机。

### 回归测试

菜单资源请求、Stage 5 进入、三个相位、融合动画、窗口/全屏、切后台恢复。Windows 仍需真实 GPU Profile。

---

## P1-03：Boss 无敌和相位规则被特殊武器绕过

**状态：代码确认**

### 证据

- PHANTOM 分身激光：`src/game/phantom.js:192-210`
- AEGIS 蓄力光束：`src/game/ships.js:362-381`
- AEGIS Force：`src/game/ships.js:480-483`、`599-604`

这些路径伤害 Boss 时不检查 `boss.invuln`。同时 Boss 相位判断在伤害处理之前，巨额单帧伤害可能跨越中间相位直接死亡。

### 建议修复

```js
function damageBoss(amount, source) {
  if (!boss || boss.hp <= 0) return false;
  if (boss.invuln > 0 && !source.ignoreInvuln) return false;

  boss.hp = Math.max(0, boss.hp - amount);
  processBossPhaseThresholdsBeforeDeath();
  return true;
}
```

所有武器统一走该入口。是否允许 Bomb 无视无敌必须显式声明，不能由不同函数偶然决定。

PHANTOM 还存在规格冲突：交接文档说“补到 cap、超出移除最旧”，但 `src/game/phantom.js:56-59` 满 cap 后直接不生成。应先确认规则，再同步代码与文档。

`phantomCloneFire()` 应使用 `try/finally` 恢复主玩家状态：

```js
function phantomCloneFire(clone) {
  const saved = capturePlayerState();
  try {
    applyCloneStateToPlayer(clone);
    fireCloneWeapon(clone);
  } finally {
    restorePlayerState(saved);
    phantomState.cloneFiring = false;
  }
}
```

### 回归测试

所有特殊武器 × Boss 入场/换相/觉醒/正常状态；大额伤害跨阈值；PHANTOM 满 cap 再放技能。

---

## P1-04：波次数据跨 Run 污染，No Miss 和计时统计不准确

**状态：代码确认**

### 证据

- `src/game/step.js:105-109` 在 mini Boss 存活时直接修改全局 `waves[wi].t`。
- 下次 Run 会继承被推迟的波次时间。
- `src/game/stage-flow.js:95` 用剩余生命判断 No Miss，1UP 可以掩盖死亡。
- `stageT` 只在普通关卡段增长，结算时间不包含 Boss 战。

### 建议修复与伪代码

```js
// Run-local state; never mutate STAGES[stage].waves.
let waveDelay = 0;

function startStage() {
  waveDelay = 0;
}

function updateWaveSchedule(dt) {
  if (enemies.some(e => e.mini)) {
    waveDelay += dt;
    return;
  }

  while (waveIndex < waves.length &&
         waves[waveIndex].t + waveDelay <= stageT) {
    spawnWave(waves[waveIndex++]);
  }
}
```

结算使用独立统计：

```js
stageStats = {
  tookDamage: false,
  deaths: 0,
  startedAt: time
};

// On actual HP/life damage, not on 1UP-adjusted lives:
stageStats.tookDamage = true;

stageResult.noDeath = stageStats.deaths === 0;
stageResult.time = time - stageStats.startedAt;
```

### 回归测试

同一 seed 连续重开同一关，波次时间必须一致；死亡后获得 1UP 不应恢复 No Miss；Boss 战时间计入结算。

---

## P1-05：AEGIS 视觉和不同伤害类型使用不同几何规则

**状态：代码确认**

### 证据

- `drawForceField()` 把参数当直径，但调用方多处传入半径：`src/render/aegis.js:16-31`、`56-75`
- 光束阻挡中心使用 `aegisVisualX()`，而护盾碰撞使用 `aegisCoreX()`：`src/game/combat.js:192-205`
- 光束、爆炸区和普通弹体的 Force 半径公式不同。

### 建议修复

定义唯一几何源，视觉光晕可以更大，但实体边界圈必须与判定一致。

```js
function getAegisGeometry() {
  return {
    coreX: aegisCoreX(),
    coreY: player.y,
    shieldRadius: aegisShieldRadius(),
    forceX: aegisState.forceX,
    forceY: aegisState.forceY,
    forceHitRadius: aegisShieldRadius()
  };
}

function drawForceField(x, y, collisionRadius, style) {
  drawAura(x, y, style.auraRadius);
  drawSolidBoundaryCircle(x, y, collisionRadius);
}
```

不得通过扩大 Force lane 解决该问题。

### 回归测试

四个 Force 等级、三个 AEGIS 变体、普通弹/大弹/光束/爆炸区的视觉边界与碰撞边界对照。

---

## P1-06：CI 没有运行现有测试，也没有覆盖真实渲染

**状态：代码确认**

`.github/workflows/desktop-build.yml` 在打包前没有执行现有测试；Windows smoke 还使用 `--disable-gpu`，只验证进程启动和 LAN HTTP。这是 `scale` 异常能进入 RC 的直接原因之一。

### 建议流水线

```text
build web
→ unit/content/structure/release checks
→ Electron console-error smoke
→ all stages × all phases render sweep
→ video enabled / fallback sweep
→ desktop package
→ packaged startup smoke
→ optional GPU/video smoke
```

浏览器 smoke 必须把以下情况设为失败：

```text
Runtime.exceptionThrown
console.error("draw error", ...)
连续多帧只有背景/弹体而没有玩家和 HUD
```

保留现有 `--disable-gpu` 启动 smoke，但另增不禁用 GPU 的视频测试；不能把它当作 Windows 性能验收。

### 必补回归套件

```text
AEGIS：ebullets + BulletML × attached/detached/returning/broken
P2：所有伤害类型、跨关成长、死亡规则
LAN：Fresh restore、owner 关系、重连、全流程
Run：Stage 5 通关只记录一次
Input：键盘/手柄全菜单
Render：5 关 × 3 相位 × 视频播放/回退
LAN server：畸形 URL、Range、静态文件和视频
```

---

# 第三阶段：P2，架构、可维护性和发布质量

## P2-01：优先消除复制规则，不做大爆炸重写

当前模块拆分已有进展，但仍通过拼接 IIFE 和大量可变全局状态协作。问题最集中的文件：

- `src/render/ui.js`：1222 行
- `src/platform/web/lan.js`：840 行
- `src/game/ships.js`：768 行
- `src/legacy/game.js`：507 行
- `src/game/coop.js`：489 行
- `src/game/step.js`：472 行

建议只抽取四个高收益边界：

```text
ProjectileRegistry：所有弹体遍历、位置、消费
PlayerDamageService：P1/P2 无敌、护盾、受伤、死亡
BossDamageService：无敌、相位、死亡
RunState：跨关成长、结束幂等、结算来源
```

暂时不强行切换 ES Module，不重写 Boss 逻辑。先建立回归，再做小步抽取。

## P2-02：改善异常可观测性

大量空 `catch {}` 会隐藏实际故障；`draw()` 则会每帧重复打印异常。

```js
reportError(error, {
  subsystem: 'render',
  state,
  stage,
  phase: boss?.phase,
  oncePerKey: true
});
```

开发构建保留详细堆栈；生产构建按错误键限频，并保留最近错误供诊断页读取。`runSignature()`、LAN restore、视频缓存等关键路径不能静默吞掉所有错误。

## P2-03：存档与调试入口

- `src/app/save.js:38-41` 的音量归一化可能产生 `NaN`，使用 `Number.isFinite()`。
- 桌面文件存档加载后应重新应用皮肤和完整设置。
- `recordRunEnd()` 必须幂等。
- `__god`、`__killBoss`、`__setScore`、`__endRun` 等调试函数应只在显式 debug 构建或 `?debug=1` 下暴露。
- Electron 增加严格 CSP；当前有 insecure CSP 警告。

存档数值处理示例：

```js
function finiteUnit(value, fallback = 1) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : fallback;
}
```

## P2-04：窗口与文档

- `desktop/main.cjs:58-70` 的最小高度 854，无法适配 800px 高的工作区；窗口模式会超出屏幕。应根据工作区允许更小逻辑缩放，Fullscreen 也需单独测试。
- 窗口位置在 `resize/move` 时同步写文件，建议防抖。
- `desktop/README.md:19` 仍写“Not yet: save”，已过时。
- README 的暂停键、macOS 支持、总评级说明需在修复后同步。
- `src/core/rng.js:2` 的注释“should call rng(), not rng()”应改为正确的 RNG 说明。

窗口状态写入示例：

```js
let windowStateTimer = null;

function scheduleWindowStateWrite() {
  clearTimeout(windowStateTimer);
  windowStateTimer = setTimeout(writeState, 250);
}
```

## P2-05：第三方许可证是发布门禁

`THIRD_PARTY_NOTICES.md` 目前只是来源摘要，不能直接等同于完整合规：

- 补充 rRootage/BulletML 的实际版权与 BSD 3-Clause 全文。
- 核对 CC BY、Sampling Plus 素材所需署名和许可证文本。
- 确认 BGM 的再分发权。
- 完成隐私说明、EULA、第三方声明。

这部分需要项目所有者确认，不能据此直接宣称法律合规。

---

## 4. 架构与代码质量评价

### 值得保留的部分

- 固定 1/60 模拟和视觉 RNG 分离方向正确。
- 内容、核心数学、渲染、平台模块已有初步边界。
- 资源外置和按需加载方向正确。
- Electron 已启用 `contextIsolation`、关闭 `nodeIntegration`、启用 `sandbox`。
- 三艘战机的机制定位有明显差异，视觉识别度较强。

### 主要耦合问题

当前高风险耦合不是单纯“文件太大”，而是以下规则被多个模块复制：

1. 弹体类型与清除方式。
2. P1/P2 受伤和死亡。
3. Boss 无敌、相位和伤害。
4. 跨关成长与 Run 结束。
5. 视频创建、加载、播放和缓存。

这些问题已经直接造成行为不一致，因此应先统一规则，再做文件级美化。

### 可读性改进方向

- 用明确的状态结果字符串或枚举替代无返回值的伤害函数。
- 用 ID 引用替代快照中的对象引用。
- 用 run-local 数据替代修改全局内容定义。
- 用 `try/finally` 保护所有临时玩家上下文切换。
- 关键错误不要静默吞掉；为渲染、LAN、视频和存档添加分域诊断。

---

## 5. 总体验收顺序

```text
A. P0 修复及对应自动化回归
B. P1 输入、视频、伤害与统计修复
C. 全关卡/全相位渲染和完整状态机自动检查
D. Windows 实际 GPU Profile 与打包版人工五关
E. 本地双人完整五关 + 两台物理设备 LAN
F. macOS 打包/签名/公证与 Windows 签名/安装/卸载
G. Steam Deck、Steamworks、商店和最终发布门禁
```

任何一步发现新问题，都应回到对应优先级修复，不得通过缩小测试范围直接放行。

---

## 6. 仍不能在本环境关闭的发布门禁

以下没有足够证据，不能写成已完成：

- Windows RTX 3080 的卡顿、黑帧根因与修复效果。
- Windows 打包版完整五关、手柄、安装/卸载和杀毒表现。
- 两台物理设备 LAN。
- 本地双人完整五关。
- macOS 当前版本的打包、签名、公证和 Apple Silicon/Intel 覆盖。
- Steam Deck 实机。
- 三艘战机及九变体的实际难度、Stage 5 密度和死区。
- 未签名安装器不能宣称“杀毒误报已解决”。
- Steam AppID、depot、Overlay、成就、Cloud 和商店发布。
- 第三方素材与 BGM 的最终再分发权确认。

**最终判断：先完成 P0 和对应自动化回归，再进行 Windows 性能与物理设备门禁；之后才适合把版本号从 RC 提升为正式 1.0。**
