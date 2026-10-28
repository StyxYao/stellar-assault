# STELLAR ASSAULT — 独立审计 / 改进方案交接

> 交接对象：外部模型 / 独立审计者  
> 交接日期：2026-10-28  
> 仓库：`/Users/a123123/.dsh/im/stellar-assault-repo`  
> 分支：`main`  
> 代码基线 HEAD：`f43f25d`（本文档为交接提交，不改变游戏代码）  
> 最近 tag：`steam/r3-phantom-od-force`  
> 版本号：`1.0.0-rc.1`  
> 发布状态：**未发布 1.0 正式版**

---

## 0. 先看这里

这不是一个“请直接改代码”的任务。请先做只读审计，输出：

1. 结论摘要
2. 按严重程度排序的问题清单
3. 每个问题的证据（文件、函数、状态机路径）
4. 复现步骤
5. 建议修复方案与风险
6. 需要回归测试的路径

**不要直接推送到 main，不要创建 Release，不要改 Steam/签名配置，不要关闭动画来“解决”性能问题。**

用户是项目所有者，所有产品取舍以本文第 1 节为准。

---

## 1. 产品边界（硬约束）

### 1.0 范围

- 5 个关卡，5 个 Boss
- 3 艘战机：VECTOR / AEGIS / PHANTOM
- 每艘 3 个变体
- 单人、本地双人、LAN 双人
- Web 优先
- Windows / Linux / macOS Electron 桌面
- 无世界联机、无匹配服务器、无账号系统
- Boss Rush / Tower 推迟到 **1.1**

### 不允许擅自改变

- 不允许关闭 Stage5 背景 / Boss 相位 / 融合动画来换取性能
- 不允许无证据扩大 Force 清扫 lane
- 不允许把“未签名”说成“已解决杀毒误报”
- 不允许把测试/模拟结果说成 Steam Deck Verified
- 不允许给 1.0 加世界联机、Boss Rush、Tower
- 不允许默认提交安装包；用户没有要求安装包

### 当前发布门禁

正式 1.0 仍需：

- Windows 本地人工完整 5 关
- 本地双人完整 5 关
- 两台物理设备 LAN
- Steam Deck 物理设备（当前无）
- Steamworks AppID / partner / depot / 签名证书（当前无）

CI 只能证明构建和启动，不替代上述门禁。

---

## 2. 当前发布身份

```text
HEAD    f43f25d
tag     steam/r3-phantom-od-force
version 1.0.0-rc.1
```

最新 Windows / Linux 原生包：

```text
run 40660253102
commit f43f25d
```

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40660253102
```

最新 EdgeOne deployment：

```text
deploymentId: dp2qtb0efxox
commit: f43f25d
```

预览入口（token 会过期，仅用于当前验收）：

```text
https://stellar-assault-kvhizspi.edgeone.cool/index.html?eo_token=51b1b0b3c4166f1a848f13e0aa9d015a&eo_time=1793177777
```

本地 LAN：

```text
http://192.168.31.185:8785/index.html
```

构建产物：

```text
dist/index.html
dist/build.txt
dist/assets/
```

最新 bundle 备份：

```text
/Users/a123123/.dsh/im/backups/stellar-assault-phantom-od-force.bundle
```

---

## 3. 快速开始

### 3.1 构建 Web

```bash
cd /Users/a123123/.dsh/im/stellar-assault-repo
python3 -m pip install -r requirements.txt
bash tools/build_pages.sh
```

构建脚本会：

- 删除整个 `dist/`
- 组装 `src/modules.json`
- 外置图片资源
- 复制运行期 `assets/`
- 写入 `dist/build.txt`

`dist/` 和 `rrootage3.html` 是构建产物，不提交。

### 3.2 启动本地 LAN

```bash
node tools/lan_server.mjs 8785 8786
```

然后访问：

```text
http://127.0.0.1:8785/index.html
```

### 3.3 自动化检查

```bash
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
node tools/verify_release.mjs
```

### 3.4 Electron

```bash
cd desktop
npm ci
npm start
```

macOS 上开发只验证外壳；Windows 行为和性能必须在 Windows 上验证。

### 3.5 Windows 构建

GitHub Actions：

```text
.github/workflows/desktop-build.yml
```

触发：`steam/*` tag 或手动 dispatch。

当前构建仍是**未签名** NSIS / zip。杀毒误报的背景见第 9 节。

---

## 4. 架构

### 4.1 构建模型

不是 ES Module runtime。所有源码按 `src/modules.json` 顺序拼接成一个 IIFE 闭包：

```text
src/core/
src/content/
src/app/
src/game/
src/render/
src/platform/web/
src/platform/desktop/
src/legacy/game.js   ← 组合根 / 兼容层
```

`src/legacy/game.js` 仍是最大的组合根。`tools/build_game3.py` 负责拼接，`tools/build_pages.sh` 负责交付。

### 4.2 关键模块

```text
src/core/fixed-step.js        固定 1/60 步长
src/core/rng.js               确定性随机
src/game/step.js              主固定步进
src/game/stage-flow.js        关卡切换 / Boss 生成 / clear
src/game/boss-patterns.js     Boss 弹幕
src/game/boss-ultimates.js    Boss 大招 / 融合签名
src/game/boss-mechanics.js    每关 Boss 机制
src/game/ships.js             VECTOR/AEGIS/PHANTOM 主状态和 Force
src/game/phantom.js           Phantom 分身 / 潜行 / OD
src/game/player-state.js      受击 / 拾取 / 死亡
src/game/combat.js            子弹 / 光束 / 碰撞
src/game/coop.js              World 快照 / P2 槽位
src/platform/web/lan.js       LAN Host/Client、邀请链接、复制
src/platform/web/input.js     鼠标/触屏/菜单输入
src/platform/desktop/input.js 键盘/手柄/桌面 BGM
src/platform/web/video.js     视频元素、帧缓存
src/render/background.js      Stage5 视频/程序化背景
src/render/bosses.js          Boss 相位视频/静态映射
src/render/aegis.js           Aegis 护盾/Force/蓄力视觉
src/render/player.js          机体渲染顺序
src/render/ui.js              菜单、HUD、结算、Cast
```

### 4.3 坐标与渲染

- 逻辑分辨率 `390 × 844`
- Canvas DPR2
- 固定 `1/60` 模拟
- 背景/视频使用 cover 绘制
- UI 坐标全部是逻辑坐标

### 4.4 存档与 LAN

- `src/app/save.js` / `SaveStore`
- 本地 Top 5 / 设置 / Rank
- LAN 使用 Host 权威状态
- 20Hz 全量快照 + 客户端预测
- `World.snapshot()` / `World.restore()` 在 `src/game/coop.js`

LAN 入口：

```bash
node tools/lan_server.mjs 8785 8786
```

Electron 启动时自动启动 LAN server。

---

## 5. 关键玩法状态机（审计重点）

### 5.1 关卡 clear / 结算

- `state === 'clear'`
- `stageClearT` 3.4s 后进入下一关
- 结算页由 `drawStageClear()` 绘制
- Rank 由本关得分、No Miss、Bomb 储备计算
- 下一关开始重置 `stageClearT` / `stageResult`

### 5.2 AEGIS Force

`aegisState.force` 状态：

```text
attached
detached
returning
broken
```

当前行为（`src/game/ships.js`）：

- 只有 `attached` 有护盾环形清除
- `returning` **不清弹**（用户明确要求）
- `detached` 去程清弹
- `broken` 等待恢复

当前 `aegisForceCollide()` 只在 `detached` 执行。

### 5.3 AEGIS 护盾

当前实现：

```js
aegisShieldRadius() = max(18, (18 + aegisForceRadius() * 0.55) * 0.70)
```

- 护盾中心：`aegisCoreX() = player.x`
- 视觉半径与碰撞半径一致（attached）
- 护盾判定包含弹体半径：
  `distance < shieldRadius + bullet.rad`
- 本帧接触的全部 ebullets/orbs 先清空，再结算扣盾
- 如果扣盾到 0，在本帧清空完成后破盾
- `aegisTryBlockBigBullet()` 额外拦截大弹
- `aegisBlockBossBlast()` 拦截 Boss 爆炸区

相关风险：

- Force lane 是 `min(38, shieldRadius)`
- Force 去程 orb 碰撞半径也是 `shieldRadius`
- Force 视觉 aura 仍大于碰撞半径，容易让玩家误判
- `aegisAbsorbHit()` 只清除 ebullets/orbs，不清 beams / blastZones
- 用户明确反馈：黄色大弹在“护盾减伤但不消失”与“Force 瞄准后仍剩一颗”上仍有问题；需要独立复现

### 5.4 PHANTOM

当前规则：

```text
Quantum   CAP 2
Butterfly CAP 4
Raven     CAP 1
```

- 放技能：先补充到 cap，超出后移除最旧
- W：升级分身 HP 3 → 6
- 分身伤害 70%
- 隐身伤害：普通 +50%，Raven +150%
- 分身/潜行透明度 70%
- 出现/消失有光圈 + 闪白

OD：

- OD 期间额外 4 架 **odClones**
- 不占原有 cap
- 无敌
- 站桩
- 使用当前武器输出
- OD 结束立即清除

OD 代码在 `src/game/phantom.js`，独立于 `clones`。

### 5.5 Stage5 攻击

- 之前的一波限制 `boss-director.js` 已移出构建
- Stage5 phase 1/2 恢复原始 pattern + ultimate + signature 混合
- 最近一次密度测试：phase1 约 129 ebullets，phase2 约 147
- 用户尚未对最新版做完整人工通关

---

## 6. 当前最需要独立审计的问题

### P0-A. 黄色大弹 / 护盾 / Force

用户反馈原文：

> 黄色弹链是停留在原处轨迹继续前进，且有些 boss 不是弹链是扇形的一排分散子弹，也是一样的，和排列无关，同样一片弹幕其他子弹都清了它还在那。第一关 boss 是蓝色，第二关是红色。

> 视频后半段我专门录了发射 force 清除弹幕的情况，瞄准那个子弹，周围弹幕清了它也没事。

> 不发射 force 的时候这个子弹也是碰到了会减护盾但是不会消失。

已做过：

- 护盾中心改为 `player.x`
- 护盾/Force 半径包含弹体半径
- 批量接触先清再扣盾
- Force 去程 `detached` 才清弹
- Force 回程不清弹（用户要求）
- Force 视觉圈核心对齐、绘制在机体上方
- Force 回程不再清弹

仍需独立确认：

1. 该黄色弹是否为普通 `ebullets`，还是 beam / blastZone / 其他渲染对象。
2. Force 去程瞄准时是否真的覆盖该弹。
3. 是否在 `returning` 状态被误判为“去程”。
4. 是否有 **持续刷新** 导致看起来是同一颗。
5. 是否有弹体中心/半径/视觉三者不一致。
6. 为什么同一片弹幕只有一颗留下。

复现建议：

- Stage 4 / SERAPHIC WINGS，正常游玩，不开启 debug
- 记录 2–3 秒原始速度 + 0.25× 慢放
- 记录 HUD：`SHIELD`、`FORCE`、`RETURN/EMPTY/BROKEN`
- 分别测试：
  - Force 挂载
  - Force 去程
  - Force 回程
  - 护盾未破
  - 护盾破盾瞬间

不要在未确认前继续扩大 Force lane。

### P0-B. Windows 视频卡顿 / 循环黑帧

用户环境：

```text
RTX 3080（当时顶配）
Windows
手机 Web 正常
```

用户明确要求：**不能取消动画**。

当前已实现（需要审计）：

- `videoFxEnabled = true`
- `requestVideoFrameCallback` 把新视频帧缓存到 offscreen canvas
- 游戏渲染绘制缓存 canvas
- 循环边界跳过黑帧
- 背景 / 融合首帧 seam underlay
- Windows Electron 启动参数：
  - `enable-gpu-rasterization`
  - `enable-zero-copy`
  - `ignore-gpu-blocklist`

参考：

- https://web.dev/articles/requestvideoframecallback-rvfc
- https://wicg.github.io/video-rvfc/

需要确认：

- Electron 实际是否启用 GPU / 硬件视频解码
- `requestVideoFrameCallback` 是否真的在回调
- 缓存 canvas 是否造成额外拷贝
- 视频循环黑帧是否来自解码器还是网络/预加载
- 是否应使用 WebGL/CSS 合成而不是 Canvas 2D
- 是否需要在 Windows 上 profile 每个视频路径

诊断建议：

```text
chrome://gpu
Video Decode
Canvas
Rasterization
```

需要用户提供 `chrome://gpu` 截图或 GPU 日志。

### P0-C. Windows 安装/卸载杀毒误报

当前是：

```text
NSIS
未签名
electron-builder
```

已做：

- 移除额外 elevate helper
- `allowElevation: false`
- 元数据 / copyright / legalTrademarks
- `CSC_LINK` / `CSC_KEY_PASSWORD` 可选签名路径
- 构建后 `Get-AuthenticodeSignature` 报告

未做：

- 真实代码签名证书
- 杀毒厂商误报提交

结论：没有证书无法保证不报警。不要建议用户关闭杀毒软件。

详见：

```text
docs/WINDOWS_ANTIVIRUS.md
```

### P1-A. Stage5 密度 / 平衡

用户希望恢复攻击密度，已移除 director。  
需要人类实际体验确认是否过密、是否出现死区、是否与 Boss 机制叠加。

### P1-B. Stage3 phase 3 视觉裁切

已把 Boss3 phase3 绘制缩到 0.82，并将硬红边框改为柔和危险晕影。  
需要确认是否仍有硬边或“没截全”。

### P1-C. Stage4 RADIANT CAGE

安全通道已有实际伤害和视觉说明，但用户曾误以为“飞出去也没事”。  
需要再次确认视觉和判定一致。

### P1-D. Cast 特别感谢

已增加空行、金色标题、字号和分隔线。  
需要滚动到底部确认排版。

---

## 7. 近期已做且需要回归的改动

### 菜单 / 输入

- 桌面启动自动播放 BGM（不需要点击）
- 主菜单不再“任意点击进入单人模式”
- 鼠标悬停选中模式/机体/变体
- 鼠标点击机体真正选择
- 左键 AEGIS 蓄力
- 右键技能：AEGIS Force / PHANTOM 潜行 / VECTOR 炸弹

### 视频 / 渲染

- 移除每帧 `getImageData()` 视频抠像
- `requestVideoFrameCallback` 帧缓存
- 循环黑帧跳过
- Windows GPU flags
- Force 圈 / 护盾圈 / 机体核心对齐
- Force 圈绘制在机体上方

### 音频

- AEGIS 破盾：22+5 混合，缩短 25%，升调，叠加敌人爆炸
- AEGIS 低护盾：MELTDOWN 16，1.2s → 0.9s，保留音高
- 菜单 BGM 自动启动（桌面）

### 资产 / 构建

- `dist` 每次构建前清空
- 未使用旧菜单 / 试听候选 / 源素材移到 `attic/`
- `attic` 不进入生产
- README 改为玩家向

### 结算

- 每关 clear 有分数滚动、E–S Rank、Kills / Time / No Miss / Bomb Reserve
- 3.4s 后自动进入下一关

---

## 8. 审计任务建议（按顺序）

### 第一轮：只读静态审计

1. 读 `src/game/ships.js` 的 AEGIS 全部状态机。
2. 读 `src/game/step.js` 的 ebullets / orbBullets / beams / blastZones 更新。
3. 读 `src/game/player-state.js` 的 `hitPlayer()`。
4. 读 `src/render/aegis.js` 的视觉/碰撞半径。
5. 读 `src/platform/web/video.js`、`src/render/background.js`、`src/render/bosses.js` 的视频路径。
6. 检查是否有其他弹体数组或渲染对象绕过护盾清除。

输出：

```text
文件 / 函数 / 行
状态机路径
可复现条件
```

### 第二轮：自动化复现

可使用浏览器调试函数：

```text
__selectShip('aegis')
__runStage(3)
__warn()
__setBossPhase(2)
__spawnEB(x,y)
__spawnBomb(x,y)
__bossBlast(x,y)
__aegis()
__aegisForce()
__phantom()
__phantomW()
__od()
__menuState()
__bgv()
__bossInfo()
```

但必须区分：

- 调试器合成的弹体
- 实际 Boss pattern 生成的弹体
- 真实人类输入

不要用合成测试直接宣称真实 bug 已修复。

### 第三轮：Windows 性能

需要在 Windows 机器上：

- 运行打包版
- 记录 `chrome://gpu`
- 记录 FPS / 视频解码状态
- 分别测：
  - Stage5 背景
  - Boss phase2/3
  - fusion
  - 窗口/全屏
- 确认是 decode、canvas 拷贝、compositor 还是 GPU 驱动

### 第四轮：发布审计

- Windows 人工 5 关
- 本地双人
- 两台物理设备 LAN
- Steam Deck（如果有）
- 安装/卸载/杀毒
- 签名状态

---

## 9. 已知未完成 / 外部阻塞

```text
[ ] Windows 人工完整 5 关
[ ] Windows 手柄
[ ] Windows 本地安装/卸载
[ ] Windows 杀毒误报最终确认
[ ] 两台物理设备 LAN
[ ] 本地双人完整 5 关
[ ] Steam Deck 实机
[ ] Steamworks AppID/partner/depot
[ ] Windows/macOS 代码签名证书
[ ] Steam 商店页 / 成就 / 云存档
```

不能把以上未完成项写成已完成。

---

## 10. 安全 / 凭证

- 之前聊天中出现过一个 GitHub PAT，已使用并删除本地副本；用户应确认已 Revoke。
- 仓库不应包含任何 token / 证书 / 私钥。
- `docs/WINDOWS_ANTIVIRUS.md` 中的签名 Secret 名称只是配置说明，不是实际值。
- 不要输出或提交 `.secrets/`、`*.pfx`、`*.pem`、`*.key`。

---

## 11. 关键文件索引

```text
README.md                              玩家向说明
CHANGELOG.md                           版本历史
docs/ARCHITECTURE.md                   架构
docs/DEVELOPMENT.md                    构建/测试
docs/QA_1_0.md                         1.0 QA 门禁
docs/RELEASE_1_0.md                    发布清单
docs/BOSS_BIG_BULLETS.md               Boss 大弹 / 护盾
docs/AEGIS_SHIELD_FIX.md               AEGIS 修复记录
docs/PHANTOM_MECHANICS.md              Phantom / OD
docs/WINDOWS_VIDEO_PERFORMANCE.md      视频管线
docs/WINDOWS_ANTIVIRUS.md              Windows 误报/签名
docs/CI_DESKTOP_BUILD.md               CI
docs/DESKTOP_ARTIFACTS.md              桌面包
docs/STEAM_DECK_TEST.md                Deck
docs/ROADMAP_1_0.md                    1.0 范围
attic/README.md                        归档素材说明
```

---

## 12. 期望的审计交付格式

请输出：

### 结论

- 哪些问题已确认
- 哪些只是猜测
- 哪些无法在当前离线环境复现

### 问题列表

```text
ID:
严重度: P0/P1/P2
标题:
证据:
复现:
根因:
建议修复:
回归测试:
```

### 改进方案

按优先级：

1. 发布阻断
2. 玩法正确性
3. Windows 性能
4. 资产/构建
5. 文档/体验

### 不要做

- 不要直接修改并推送
- 不要通过关闭动画“解决”卡顿
- 不要通过扩大 Force 范围“解决”漏弹
- 不要声称未验证的 Windows/Deck 结果
- 不要把 CI smoke 当成人工通关

---

## 13. 一句话总结

当前是一个**可构建、可启动、可完整模拟到 finale 的 1.0 RC**，但仍有三个不能靠猜测关闭的 P0：

```text
1. AEGIS Force/护盾对特殊黄色大弹的清除边界
2. Windows 3080 上视频动画卡顿/黑帧
3. Windows 未签名安装器/卸载器杀毒误报
```

请在只读审计后给出有证据的修复方案，不要继续加宽 Force 或关闭动画。
