# STELLAR ASSAULT 1.0 — 收口交接报告

> 交接日期：2026-10-29  
> 代码基线：`main` / `b9bf087`  
> 代码行为基线：`bc5f23a`（最后一次游戏代码提交）  
> 当前版本：`1.0.0-rc.1`  
> 当前状态：**自动化与三平台构建已通过；正式 1.0 仍不能发布**  
> 本文档目标：给后续审计/执行模型一份真实、可复核的剩余工作清单

---

## 0. 先看结论

当前不是“代码没写完”，而是**发布门禁还没走完**。

已经关闭：

- 审计 P0 全部
- 审计 P1 全部可执行项
- P2 可执行项
- Windows / Linux / macOS 构建
- Windows / Linux packaged startup smoke
- 浏览器 render/input/fallback smoke
- EdgeOne 主站部署
- 素材/BGM 权利由项目所有者确认

仍然阻塞正式 1.0：

```text
[ ] Windows 实机完整五关 + 手柄 + 安装卸载 + 杀毒
[ ] macOS 实机安装 + Gatekeeper；Intel/universal 未构建
[ ] Steam Deck 实机
[ ] 两台物理设备 LAN / 断线重连
[ ] 本地双人完整五关
[ ] Windows / macOS 代码签名、公证
[ ] Windows 安装包内 EULA / 隐私 / 第三方声明
[ ] Steamworks / depot / Cloud / 成就 / Overlay / 商店
[ ] 版本升 1.0.0 并生成最终发布包
```

---

## 1. 当前代码、站点与产物

### 代码

```text
main        b9bf087
游戏代码    bc5f23a
tag         steam/r3-release-gate
```

`b9bf087` 只改了 Linux smoke 的 CI 等待与日志诊断；游戏行为仍是 `bc5f23a`。

### EdgeOne

```text
deploymentId: dpfm3nwza05i
build.txt:    b9bf087
status:       Success
```

当前临时预览：

```text
https://stellar-assault-kvhizspi.edgeone.cool/index.html?eo_token=f8269d7579264dd65c5be6b597aa9f77&eo_time=1793272478
```

### 本地 LAN 预览

```text
http://192.168.31.185:8795/index.html
build: b9bf087
```

### 最新 release-gate run

```text
run 40862893018
status: success
Windows: success
Linux:   success
```

```text
https://github.com/StyxYao/stellar-assault/actions/runs/40862893018
```

Artifacts：

```text
stellar-assault-windows
stellar-assault-linux
```

### macOS 包

```text
desktop/release/STELLAR ASSAULT-1.0.0-rc.1-arm64.dmg
desktop/release/STELLAR ASSAULT-1.0.0-rc.1-arm64-mac.zip
```

```text
276 MB / 264 MB
arm64 only
ad-hoc signature
not notarized
```

DMG 校验通过；`spctl` 不会通过，因为未公证。

---

## 2. 最近一轮已修复内容

### 2.1 Phantom OD

最终行为：

```text
玩家本体：普通武器射击，不进入 VECTOR OD 弹幕
5 架分身：无敌、横排、随机普通武器、等级跟随玩家
分身：不进入 VECTOR OD 弹幕
高度：锁定进入 OD 时的玩家 Y
```

覆盖武器路径：

- NORMAL
- SPREAD
- LASER（包含 `laserDamageOD` 双重防护）
- MISSILE

OD 起始会清空遗留 `odLaserFx`，避免残留 VECTOR OD 激光折射外观。

### 2.2 Stage5 Boss 2→3 爆炸

已删除第五关专属：

```js
bossDeathBoom(boss, true)
+ 7 个额外 boss FX
```

现在和其他 Boss 一样使用通用：

```text
boom()
shake
phaseFx
```

### 2.3 Stage5 通关流程

```text
finale
→ FINAL RESULT
→ cast
```

新增 `finalResult` 状态，显示：

- 分数滚动
- Rank / Medal
- Kills / Time
- No Miss / Damage Taken
- Local Top 5

点击/Enter 可继续，约 7 秒后自动进入 Cast。

### 2.4 其他重要修复

- AEGIS 蓄力基础攻击力 ×1.8
- AEGIS Force/护盾 BulletML 清除
- P2 共享失败、跨关成长
- LAN 快照 BulletML / owner 引用
- LAN P2 退出后重进
- P2 加入后 P1 同步选机 + 明显提示
- 最终 Run 幂等记录
- 菜单不再启动全部视频
- Stage5 phase3 不透明 mask + 中心黑洞实心
- AEGIS 几何统一
- 输入 `k/e`、手柄边沿、P 暂停
- CSP、存档 NaN、debug gate、窗口尺寸、错误上报

---

## 3. 自动化已经覆盖什么

### 通过

```text
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
node tools/verify_release.mjs
node tools/render_smoke.mjs
```

`render_smoke.mjs` 覆盖：

- 菜单不自动播放 Stage5 视频
- Stage5 phase 0/1/2 静态回退
- 真实 phase3 视频播放 + alpha mask
- 页面错误检查
- `P` 暂停

### CI

- `.github/workflows/ci.yml`：syntax、structure、content、core tests、build、Playwright render smoke
- `.github/workflows/desktop-build.yml`：unit/content/structure/release checks、Windows、Linux、packaged startup smoke、signature report

### 明确没有覆盖

- 完整人工五关
- Windows 实机 GPU / 视频性能
- macOS Gatekeeper / 安装
- 实体手柄
- 两台物理设备 LAN
- Steam Deck
- Steamworks
- 安装器杀毒误报
- 签名/公证

---

## 4. 最近一次 Linux smoke 异常

### 历史

`bc5f23a` 的 Desktop Build（run `40802649300`）中：

```text
Windows job: success
Linux job:   failure
overall:     failure
```

Windows artifact 实际是成功上传的；失败只在 Linux packaged smoke。

### 处理

在 `b9bf087` 中强化了 `.github/workflows/desktop-build.yml`：

- 启动等待从 15s 提升到 30s
- 检测 AppImage 进程是否提前退出
- 失败时打印 AppImage 日志
- 失败时打印进程和 8785 端口
- 增加 `--disable-dev-shm-usage`

### 结果

`steam/r3-release-gate` run `40862893018`：

```text
Windows: success
Linux:   success
```

因此当前 Linux smoke 已闭环；但根因没有 100% 证明，按“启动慢/首次启动抖动”记录。后续若再出现，优先看失败时新增的 `appimage-smoke.log`。

---

## 5. 仍需人工完成的发布门禁

### 5.1 完整人工五关

必须使用最新 `b9bf087`（游戏行为 `bc5f23a`）的包，不使用旧 artifact。

逐项记录：

```text
Stage 1 → 2 → 3 → 4 → 5
每个 Boss 的 3 个相位
Stage5 finale
FINAL RESULT
CAST
回到菜单
```

重点：

- 是否软锁
- 是否长时间黑屏
- 是否有 HUD/玩家消失
- 是否出现未捕获错误
- Stage5 phase3 是否不透明、中心黑洞是否实心
- Boss 2→3 爆炸是否和别的 Boss 一致
- FINAL RESULT 是否在字幕之后、Cast 之前
- 分数/Rank/Top 5 是否正确

### 5.2 Windows 实机

```text
[ ] 安装 NSIS
[ ] 卸载
[ ] 开始菜单 / 桌面快捷方式
[ ] Xbox 手柄
[ ] 键盘
[ ] 完整五关
[ ] LAN Host
[ ] 杀毒扫描
[ ] RTX 3080 视频/动画性能
```

需要采集：

- `chrome://gpu`
- Video Decode / Canvas / Rasterization
- 帧时间或录像
- 安装包是否被 Defender/第三方杀软拦截

CI 的 Windows smoke 使用 `--disable-gpu`，不能替代这些。

### 5.3 macOS 实机

```text
[ ] arm64 实机安装
[ ] 右键打开 / Gatekeeper 行为
[ ] 完整五关
[ ] 视频/动画
[ ] 手柄
[ ] 退出/重进
```

当前只有 arm64 包。  
如果测试机是 Intel Mac，需要另出 x64 或 universal 包；当前没有构建。

### 5.4 两台物理设备 LAN

目前只有同机双浏览器模拟和 Node 双客户端测试。

必须用两台真实设备：

```text
[ ] P1 Host 创建房间
[ ] P2 加入
[ ] P2 选机 → P1 自动进入选机
[ ] P1 开始
[ ] 完整五关
[ ] P2 退出
[ ] P1 回主菜单
[ ] P1 再次进入 LAN
[ ] P2 重连
[ ] 关卡切换
[ ] 所有 Boss 相位
```

### 5.5 Steam Deck

```text
[ ] AppImage 启动
[ ] 手柄
[ ] 性能
[ ] 休眠/恢复
[ ] 分辨率
[ ] 字体/HUD
```

### 5.6 本地双人

```text
[ ] 完整五关
[ ] P2 共享失败
[ ] P2 跨关成长
[ ] P1/P2 选机
[ ] 双人结算
```

---

## 6. 签名、公证、安装器

### macOS

当前：

```text
identity = null
ad-hoc codesign
not notarized
```

正式发布需要：

```text
[ ] Apple Developer ID Application 证书
[ ] codesign 正式签名
[ ] notarytool 公证
[ ] staple
[ ] Gatekeeper 实机验证
```

没有证书时只能作为内部测试包，不能作为正式 1.0 分发。

### Windows

当前：

```text
unsigned NSIS + zip
```

正式发布需要：

```text
[ ] Windows 代码签名证书
[ ] electron-builder CSC_LINK / CSC_KEY_PASSWORD
[ ] Authenticode 验证
[ ] Defender / 杀毒误报复测
[ ] 如果需要，提交厂商白名单
```

---

## 7. 法务/包内声明

已确认：

- 项目所有者拥有/确认 BGM 再分发权
- 项目所有者拥有/确认供给/生成美术再分发权

仍未完成：

```text
[ ] EULA 文本
[ ] 隐私说明
[ ] 第三方声明进入 Windows / Linux 包
[ ] CC BY / Sampling Plus / CC0 逐项署名复核
[ ] Steam 商店/法务审核
```

参考：

```text
THIRD_PARTY_NOTICES.md
docs/RELEASE_LEGAL_BLOCKERS.md
```

注意：素材/BGM 授权确认不等于整个发布已通过法律审核。

---

## 8. Steamworks

全部仍未开始：

```text
[ ] AppID
[ ] depot
[ ] Steam Cloud
[ ] 成就
[ ] Overlay
[ ] 商店页
[ ] 商店素材
[ ] 价格/地区
[ ] Steam 私测
[ ] 最终发布
```

这是正式 Steam 发布的外部阻塞，不是代码问题。

---

## 9. 版本与最终产物

当前仍是：

```text
1.0.0-rc.1
```

正式 1.0 前：

```text
[ ] 版本号升 1.0.0
[ ] tag steam/1.0.0
[ ] Windows 最终签名包
[ ] macOS 最终签名/公证包
[ ] Linux 最终包
[ ] EdgeOne 最终部署
[ ] 发布说明
[ ] 回滚包
```

当前 tag `steam/r3-release-gate` 是验证 tag，不是 1.0 发布 tag。

---

## 10. 代码层剩余风险

### P2-01 架构

没有做完整的大重构：

```text
ProjectileRegistry
PlayerDamageService
RunState
```

原因：报告明确建议不要在大范围行为修复中一起重写。现有边界修复已覆盖当前缺陷；正式 1.0 可以不阻塞，但后续应补。

### P2-03 CSP

当前 CSP 仍有：

```text
unsafe-inline
unsafe-eval
```

因为单文件内联脚本和 BulletML 表达式求值需要。若安全审计要求更严格，需要构建拆分/nonce，不能只删 CSP 关键字。

### 测试覆盖

- P1-04 的波次污染/1UP/No Miss 没有独立自动回归
- LAN 没有物理设备自动测试
- Windows GPU/视频没有自动测试
- macOS 没有 CI 构建

---

## 11. 建议收口顺序

```text
1. 用 b9bf087 做完整人工五关
2. Windows 实机五关 + 手柄 + 安装卸载 + 杀毒 + 3080 视频
3. macOS arm64 实机；决定 Intel/universal
4. 两台物理设备 LAN + 断线重连
5. 本地双人完整五关
6. 修人工发现的问题
7. 申请/配置 Windows 与 macOS 证书
8. 升版本 1.0.0，打 steam/1.0.0
9. 最终三平台签名包
10. Steamworks / depot / Cloud / 成就 / Overlay / 商店
```

---

## 12. 给审计模型的要求

请只做只读审计，不直接改游戏代码或发布。

重点复核：

1. `b9bf087`/`bc5f23a` 的最终结果状态机
2. Phantom OD 的四条武器路径
3. Stage5 Boss 2→3 是否真的没有特殊爆炸残留
4. Linux smoke 的修正是否掩盖了真实回归
5. 签名/公证/Steam 发布清单是否完整
6. 最终包内法务文本是否缺失

不要把以下当成已完成：

```text
CI smoke = 人工通关
Windows job success = Windows 实机验收
Mac ad-hoc = Apple 公证
素材授权 = 全部法律审核
```

---

## 13. 现有产物与清理

当前保留：

```text
desktop/release/STELLAR ASSAULT-1.0.0-rc.1-arm64.dmg
desktop/release/STELLAR ASSAULT-1.0.0-rc.1-arm64-mac.zip
```

已删除：

```text
.cache/test-mac.dmg
```

未删除：

- 源码
- `dist`
- 备份 bundle
- Electron 缓存
- 当前测试包

没有发现其他历史 Stellar 安装包。

---

## 14. 结论

```text
代码/自动化：接近可发布
Windows/Linux 构建：通过
macOS arm64 测试包：可用但未签名/未公证
EdgeOne：已部署 b9bf087
正式 1.0：未达到
```

真正的下一步不是继续猜代码，而是：

```text
人工五关
Windows/macOS/Deck 实机
物理 LAN
签名/公证
Steamworks
```
