# R2 Balance Baseline — Default Variants

日期：2026-10-26  
用途：R2 初步平衡冒烟，不是最终平衡结论  
环境：Electron 测试构建，`--mute-audio`，固定 60Hz

## 测试方法

- 机体：默认变体
  - VECTOR / Void Lance
  - AEGIS / Orbital
  - PHANTOM / Quantum
- 第一关开场后进入 `play`
- 玩家无敌，武器等级固定 1
- 固定目标：中心 x，y=300，HP 999999，不还手
- 6 秒持续输出，计算 `(初始HP-结束HP)/6`
- PHANTOM 额外测一次“开技能 + 分身”的 6 秒输出
- 未使用 AEGIS 蓄力炮 / Force 爆发，因此不是全技能 DPS

## 结果

| 机体 / 条件 | 6s 伤害 | 估算 DPS |
|---|---:|---:|
| VECTOR · 基础射击 | 258 | 43 |
| AEGIS · 基础射击 | 297 | 50 |
| PHANTOM · 基础射击 | 258 | 43 |
| PHANTOM · 隐身 + 1 分身 | 420 | 70 |

## 初步结论

- VECTOR 与 PHANTOM 的基础单目标输出一致；PHANTOM 的差异来自分身与隐身爆发。
- AEGIS 基础射击略高（约 +16%），但本次没有计算蓄力炮，不能据此判定 AEGIS 过强。
- PHANTOM 开技能后约 +63%，符合“短时爆发 + 长冷却”的定位，但需要继续测 25 秒分身生命周期和 3 次技能总量。
- 本测试没有覆盖：弹幕生存、移动损失、Boss 多阶段、AEGIS 蓄力/Force、三套变体差异。

## 下一步

1. 增加 AEGIS 蓄力炮 / Force 分离的 6 秒基准。
2. 增加 30 秒移动/生存测试。
3. 三种默认变体跑第一关完整通关，记录死亡、通关时间、技能使用次数。
4. 把结果写回 R2 验收表，而不是只看单体 DPS。

## 冒烟记录

- 三机体均可进入第一关
- Phantom 技能、分身、E/D、死亡重置逻辑已单独测
- AEGIS / Phantom 教学页可打开
- 菜单 F+C / H+C 音频资源加载无报错
- 页面控制台无报错
- 真机触屏 / Windows / Deck 仍待测
