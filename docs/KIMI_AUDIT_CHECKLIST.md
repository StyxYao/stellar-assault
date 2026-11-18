# STELLAR ASSAULT / 星海强袭 — 里程碑与待审计清单

> 面向：Kimi / 外部审计模型  
> 日期：2026-10-30  
> 仓库：`/Users/a123123/.dsh/im/stellar-assault-repo`  
> main：`e87763e`  
> 游戏行为基线：`b9bf087`  
> 版本：`1.0.0-rc.1`  
> 当前结论：**自动化与三平台构建基本收口，正式 1.0 未完成**

---

## 0. 审计边界

请先做只读审计，不要直接改代码、发 Release 或创建 Steam 构建。

必须区分：

```text
自动化 smoke ≠ 人工通关
Windows/Linux CI success ≠ 真机验收
macOS ad-hoc ≠ Apple 公证
素材/BGM 授权确认 ≠ 全部法律审核
```

---

## 1. 里程碑总览

| 阶段 | 状态 | 说明 |
|---|---|---|
| M0 原型 | 完成 | 固定步长、基础射击、Boss 原型 |
| M1 核心战斗 | 完成 | 3 机体、武器、OD、Boss 弹幕 |
| M2 内容完整 | 完成 | 5 关、5 Boss、9 变体、Stage5 终局 |
| M3 平台化 | 完成 | Web/EdgeOne、Electron、LAN、本地双人 |
| M4 独立审计 P0/P1 | 代码完成 | 审计报告 `docs/AUDIT_1_0_REPORT.md` |
| M5 发布门禁自动化 | 完成 | Windows/Linux/macOS CI、render smoke |
| M6 正式 1.0 / Steam | **未完成** | 人工、签名、Steamworks、法务包装 |
| M7 微信小游戏 | 筹备 | 名称/logo 已准备，技术移植未开始 |

---

## 2. 已完成并验证

### 2.1 P0（审计报告）

```text
[x] P0-01 Stage5 phase3 静态回退 scale ReferenceError
[x] P0-02 AEGIS 护盾/Force 未清 BulletML
[x] P0-03 P2 弹幕/光束/爆炸区伤害
[x] P0-04 P2 生命归零隐式续命 -> 共享失败
[x] P0-05 LAN 快照缺 BulletML / owner 引用
[x] P0-06 最终 Boss 正常胜利不记录 Run
[x] P0-07 LAN 畸形 URL / 非法 Range
```

### 2.2 P1

```text
[x] P1-01 桌面 k/e 未定义、手柄重复消费、P 暂停
[x] P1-02 视频生命周期、菜单误启动全部视频
[x] P1-03 Boss 无敌被特殊武器绕过；phantomCloneFire try/finally
[x] P1-04 波次跨 Run 污染、No Miss、结算计时
[x] P1-05 AEGIS 视觉/碰撞/光束几何
[x] P1-06 CI 跑测试 + render/input/fallback smoke
```

### 2.3 P2

```text
[x] P2-02 分域错误上报、限频日志
[x] P2-03 音量 NaN、桌面存档重载皮肤、debug gate、CSP
[x] P2-04 窗口最小尺寸、状态写入防抖、README
[~] P2-01 架构：完成了 damageBoss/finishRun/stageStats/快照 ID 等边界；
          未做完整 ProjectileRegistry/PlayerDamageService/RunState 重构
[~] P2-05 法务：素材/BGM 权利已确认；EULA/隐私/第三方包内声明未完成
```

### 2.4 最近一轮游戏行为修复

```text
[x] Phantom OD 本体不再套 VECTOR OD 弹幕
[x] Phantom OD 5 架分身随机普通武器、等级跟随玩家
[x] Phantom OD 分身高度锁定进入 OD 时玩家 Y
[x] Phantom 本体 LASER 不再调用 laserDamageOD
[x] Stage5 Boss phase2 -> 3 移除专属 bossDeathBoom/7 FX
[x] Stage5 字幕 -> FINAL RESULT -> CAST
[x] AEGIS 蓄力基础攻击力 ×1.8
[x] LAN P2 退出后 P1 可重新进入 LAN
[x] P2 加入后 P1 自动进入选机，并显示高亮提示
[x] Stage5 phase3 不透明 + 中心黑洞实心
```

### 2.5 构建/部署

```text
Windows/Linux release gate:
  run 40862893018
  success

macOS CI:
  run 41069510954
  success
  artifacts: macos-arm64 / macos-x64

CI main:
  run 41073569549
  success

EdgeOne:
  build b9bf087
  deployed

本地 LAN 预览:
  http://192.168.31.185:8795/index.html
  build b9bf087
```

macOS CI artifacts：

```text
stellar-assault-macos-arm64
stellar-assault-macos-x64
```

均为 ad-hoc 签名、未公证。

---

## 3. 当前发布阻塞

### R0-1 完整人工五关

仍缺最新版本的真实人工通关：

```text
[ ] Stage 1 → 2 → 3 → 4 → 5
[ ] 每个 Boss 三相位
[ ] Stage5 finale
[ ] FINAL RESULT
[ ] CAST
[ ] 回菜单
```

重点核对：

- 是否软锁/黑屏
- 是否有 HUD/玩家消失
- 是否出现未捕获错误
- phase3 是否完全实心
- 中心黑洞是否纯黑
- Boss 2→3 爆炸是否与其他 Boss 一致
- FINAL RESULT 是否在字幕之后、Cast 之前
- 分数/Rank/Top5 是否正确

### R0-2 Windows 实机

```text
[ ] NSIS 安装/卸载
[ ] Defender / 第三方杀毒
[ ] Xbox / 实体手柄
[ ] 完整五关
[ ] LAN Host
[ ] RTX 3080 视频/GPU 性能
[ ] chrome://gpu 证据
```

CI Windows smoke 使用 `--disable-gpu`，只证明启动和 LAN HTTP，不证明 GPU/视频。

### R0-3 macOS 实机

```text
[ ] arm64 安装/启动
[ ] x64 安装/启动（若测试机为 Intel）
[ ] Gatekeeper / quarantine
[ ] 完整五关
[ ] 手柄
```

当前两包均为 **ad-hoc 签名，未 notarize**。正式发布必须 Developer ID + notarytool + staple。

### R0-4 Steam Deck / Linux

```text
[ ] AppImage 实机启动
[ ] 手柄
[ ] 休眠恢复
[ ] 性能
```

Linux packaged smoke 最近通过，但此前有一次失败；根因未 100% 证明，按“首次启动慢/抖动”记录。

### R0-5 物理 LAN

```text
[ ] 两台真实设备
[ ] Host 创建房间
[ ] P2 加入
[ ] P1 自动进入选机
[ ] 完整五关
[ ] P2 退出
[ ] P1 回菜单
[ ] 再次进入 LAN
[ ] P2 重连
```

目前只有同机双浏览器和 Node 双客户端证据。

### R0-6 本地双人

```text
[ ] 完整五关
[ ] P2 共享失败
[ ] P2 跨关成长
[ ] 结算
```

### R0-7 签名 / 公证

```text
[ ] Windows Authenticode
[ ] macOS Developer ID
[ ] macOS notarization + staple
[ ] 安装器签名验证
```

### R0-8 Steamworks

```text
[ ] AppID
[ ] depot
[ ] Steam Cloud
[ ] 成就
[ ] Overlay
[ ] 商店页
[ ] 商店/法务审核
```

### R0-9 包内法务文本

```text
[ ] EULA
[ ] 隐私说明
[ ] 第三方声明
[ ] CC BY / Sampling Plus / CC0 逐项复核
```

素材/BGM 权利已确认，但完整发布法务审核仍未完成。

### R0-10 最终版本

```text
当前：1.0.0-rc.1
[ ] 升 1.0.0
[ ] tag steam/1.0.0
[ ] 最终三平台签名包
[ ] EdgeOne 最终部署
[ ] 发布说明 / 回滚包
```

---

## 4. 代码层待复核问题（给 Kimi）

### 4.1 Phantom OD

请搜索所有：

```text
player.odT > 0
laserDamageOD
```

确认本体没有任何路径重新进入 VECTOR OD 弹幕。

重点文件：

```text
src/game/step.js
src/game/player-weapons.js
src/game/combat.js
src/game/phantom.js
src/game/ships.js
```

已知：

- `fireNormal/fireSpread/launchMissiles` 使用 `playerOdPatternActive()`
- `laserDamage()` 使用同一判断
- `laserDamageOD()` 内部还有 `phantomOdOwnsAttack()` 双保险
- OD 分身 `phantomCloneFire()` 强制 `player.odT = 0`

需要确认：

```text
[ ] options / wingBeam / laserRate 是否还有 OD 特例
[ ] 5 架分身是否都恢复开火
[ ] 分身随机武器是否只在 OD 生成时定一次
[ ] 分身高度是否锁定 odAnchorY
```

### 4.2 Stage5 phase2→3 爆炸

`bossPhase()` 中第五关专属：

```js
bossDeathBoom(boss, true)
+ 7 个额外 boss FX
```

已删除。请确认没有其他 stage4 分支重新触发特殊爆炸。

### 4.3 最终结算状态机

流程：

```text
finale -> finalResult -> cast
```

重点：

```text
[ ] finishRun 是否只执行一次
[ ] 点击/Enter 是否从 finalResult 直接进 cast
[ ] 7 秒自动进 cast 是否重复
[ ] 重进 Cast 是否重复记录
[ ] Stage Select 单关是否污染完整战役榜
```

### 4.4 LAN

重点：

```text
[ ] lanOpenHost 在旧 socket/隐藏 overlay 下是否总是重建
[ ] pauseQuitToMenu 是否关闭 LAN
[ ] P2 加入时 P1 是否进入 ship select
[ ] P1 的 START LAN RUN 是否可启动
[ ] P2 离开后提示/按钮是否正确
```

### 4.5 CI / 产物

```text
[ ] Linux smoke 的 30s 等待是否掩盖真实回归
[ ] macOS x64 artifact 体积约 1.1GB，是否包含重复/错误架构内容
[ ] Windows/macOS 签名检查是否真正阻止未签名正式包
[ ] 当前 mac DMG 是 b9bf087 构建，main 已到 e87763e（仅品牌资产/docs）
```

### 4.6 架构/安全

```text
[ ] P2-01 未做完整 ProjectileRegistry/PlayerDamageService/RunState
[ ] CSP 仍有 unsafe-inline / unsafe-eval
[ ] P1-04 缺少独立自动回归
[ ] 没有完整五关自动渲染 sweep
```

---

## 5. 自动化证据

本地：

```text
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
node tools/verify_release.mjs
node tools/render_smoke.mjs
```

全部通过。

CI：

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40862893018
https://github.com/StyxYao/stellar-assault/actions/runs/41069510954
```

`render_smoke` 覆盖：

- 菜单不自动播放 Stage5 视频
- Stage5 phase 0/1/2 静态回退
- phase3 视频 + alpha mask
- 页面错误
- P 暂停

不覆盖：

- 人工五关
- GPU 性能
- 实体手柄
- 物理 LAN
- Steamworks

---

## 6. 建议审计输出格式

请按以下格式输出：

```text
ID:
严重度: R0/P0/P1/P2
结论: 确认/怀疑/无法验证
证据: 文件/函数/CI run
复现:
建议:
回归测试:
```

请特别回答：

1. 是否还有 Phantom 本体 VECTOR OD 残留路径？
2. 最终结算是否可能重复调用 `finishRun` 或跳过 Cast？
3. Stage5 phase2→3 是否还有特殊爆炸残留？
4. Linux smoke 修复是根因修复还是超时掩盖？
5. macOS x64 artifact 是否有架构/内容问题？
6. 当前 1.0 发布门禁清单是否完整？
7. 哪些项目可以在无人环境下继续自动化，哪些必须人工？

---

## 7. Definition of Done（1.0）

```text
[ ] 完整人工五关
[ ] 本地双人完整五关
[ ] 两台物理设备 LAN
[ ] Windows 实机安装/手柄/杀毒/GPU
[ ] macOS arm64 + x64 实机
[ ] Steam Deck 实机
[ ] Windows/macOS 签名 + 公证
[ ] 包内 EULA/隐私/第三方声明
[ ] Steamworks/depot/Cloud/成就/Overlay
[ ] 版本 1.0.0 + steam/1.0.0 tag
[ ] 最终三平台签名包
[ ] EdgeOne 最终部署
```

---

## 8. 一句话总结

```text
代码与自动化：接近 1.0
三平台构建：已通过
正式 1.0：卡在人工实机、签名、物理 LAN、Steamworks 和法务包装
```
