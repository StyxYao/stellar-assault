# R2 Progress Audit

日期：2026-10-26  
基线：`2d22ad6` + 当前未提交的菜单 F/H+C 调整  
范围：Steam R2（机体集成）+ 已提前进入的 PHANTOM 系列

## 结论

R2 的**可玩集成**已经基本完成：VECTOR、AEGIS、PHANTOM 都能选、能存外观、能进入正式关卡。

但 R2 还不能按原验收单签收，原因不是缺机体，而是：

- 选机选择没有跨重启恢复（启动固定回 VECTOR）
- PHANTOM 首局教学缺失
- 三机体平衡没有数据化验收
- 真机触屏 / Windows / Steam Deck 未验证
- R2 验收文档仍是“PHANTOM 锁定”的旧版本
- PHANTOM 最佳分在存档归一化时曾被重置（已修复）

## R2 检查表

| 项目 | 状态 | 说明 |
|---|---|---|
| 3 机体可选 | PASS | VECTOR / AEGIS / PHANTOM |
| 9 套外观可选 | PASS | 3 + 3 + 3 |
| 机体/变体选择 UI | PASS | 含数值说明行 |
| 皮肤写入存档 | PASS | 分机体 `skin` |
| 分机体最高分 | PASS | 含 PHANTOM（本次修复读档重置） |
| 选择跨重启恢复 | FAIL / 待决策 | `initSaveStore` 启动强制 VECTOR；Phantom 值也会被归一化成 VECTOR |
| 第一关完整可玩 | PASS | 三机体均可进入 |
| AEGIS 教学 | PASS | 首局 6 秒提示 |
| PHANTOM 教学 | MISSING | 没有首局隐身/分身/E/D 提示 |
| 键鼠操作 | PASS | 含 Phantom 技能键 |
| 手柄操作 | 代码通过 / 未专测 | 技能走 `bomb()` 映射 |
| 触屏技能按钮 | 代码通过 / 未真机测 | `phantomButtonAt()` |
| 死亡经济一致 | PARTIAL | 共用生命/掉级；PHANTOM 无僚机/炸弹，死亡重置分身上限，属于机体例外 |
| 无单一最优机体 | 未验收 | 没有 DPS/生存/通关时间对比 |
| 菜单按键音 | PASS | F 移动，H+C 确认 |
| Windows 原生 | PENDING | M1 遗留 |
| 真机多指触屏 | PENDING | M1 遗留 |
| Steam Deck | PENDING | M1 遗留 |
| R2 验收文档 | STALE | 仍写 PHANTOM 锁定预览 |

## PHANTOM 提前完成了哪些

原计划（`docs/SHIP_LINEUP.md`）：

```text
R2：VECTOR + AEGIS，6 套外观
R3 / 1.1：PHANTOM 机制、3 套外观、第三套排行榜
```

现在提前完成的是**整套第三机体**，不只是外观：

- 3 个可玩变体：Quantum / Raven / Butterfly
- 3 套 Qwen 透明贴图 + 80×80 游戏资源
- 完整选机、变体选择、开始确认
- 隐身、无敌、攻击加成
- 3 HP / Raven 1 HP 分身
- 完整武器/等级复制，固定 50% 基准伤害
- 分身自动索敌、横向瞄准、安全编队
- 分身上限、D 升级、死亡重置、最早分身替换
- E 恢复技能充能
- 敌人/Boss 优先瞄准分身
- 技能自动侧移、残影、B 低频音效
- 分身被击毁爆炸
- 分身高亮 HUD、技能按钮、伤害说明
- 分机体最高分 + 皮肤存档

这相当于把 R3 的**机体与外观部分**提前做掉了。

### 但还没有提前完成

- PHANTOM 首局教学
- 三变体最终平衡
- 选人界面大立绘 / 皮肤展示页
- 第三套完整排行榜（目前只有最高分，没有榜）
- Phantom 专属成就 / Steam 统计
- Phantom 专属关卡或 Boss 交互
- 真机 / Windows / Deck 验收

## R2 剩余事项（建议顺序）

### P0 — 签收前必须

1. 决定选机持久化策略
   - 方案 A：跨重启记住上次机体（R2 原文要求）
   - 方案 B：每次启动固定 VECTOR（当前行为）
2. 补 PHANTOM 首局教学
   - 隐身 3 秒 / Raven 4 秒
   - E 充能，D 提升分身上限
   - 分身为 50% 伤害
3. 三机体平衡冒烟
   - 第一关同路线通关时间
   - 无伤/受伤次数
   - 分身覆盖率、技能空窗
4. 真机矩阵
   - Windows 键鼠
   - 触屏技能按钮
   - 手柄技能键
   - Steam Deck 1280×800

### P1 — 文档与验收

5. 更新 `STEAM_R2_ACCEPTANCE.md`
6. 补 PHANTOM 验收截图和操作表
7. 记录已知例外：PHANTOM 无僚机/炸弹，死亡重置分身

## 后续里程碑

### R3 — 内容审计（下一步）

产出两张表：

- 5 关：现有机制 / 是否只是换背景 / 建议机制
- 5 Boss：阶段机制 / 是否只是换弹幕 / 建议核心交互

现有 `STAGE4.md`、`STAGE5.md`、`ENEMY_DESIGN.md` 可作为输入，但还没有合并成 R3 审计表。

### R4 — 关卡机制

每关一个主机制，带预警、音效、视觉反馈，不新增不可躲弹幕。

### R5 — Boss 机制

每个 Boss 一个必须改变走位/输出窗口的核心交互，验证安全缺口和阶段预兆。

### R6 — Rank / Medal / Score

- Rank 0–5
- Medal / Chain
- 共享计分公式
- 本地榜
- 存档扩展

当前只有最高分，没有 Rank/Medal/完整榜。

### R7 / R8 / R9

- R7 Boss Rush：目前只有 `modes.js` 契约和 `bossrush.html` 实验页，未进菜单
- R8 Tower：同上，仅契约
- R9 Steam QA：Steamworks、成就、云存档、安装包仍未开始

## 建议下一动作

先做 **R2 P0 签收包**：

```text
选机持久化决策
+ PHANTOM 首局教学
+ 三机体第一关平衡冒烟
+ Windows/触屏/Deck 冒烟
```

然后再进入 **R3 内容审计**。不要直接开 R4/R5，否则会在未审计的关卡结构上做二次返工。
