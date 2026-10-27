# Stage 5 Fused Boss — Attack Director

## 问题

第二阶段/第三阶段同时运行：

- 普通 Boss pattern timers
- `SIG_FNS` 随机签名
- ultimate
- Boss mechanic

蓝色 `CHRONOS BLOOM` 弹幕又会叠加其他攻击，容易形成死区。

## 修复

### 蓝色弹幕规律化

`bossChronosBloom()` 现在是：

- 三层等距环
- 固定 12 发/层
- 层间固定 15° 偏移
- 单一安全楔形
- 速度固定为 84 / 110 / 136
- 不再使用逐发随机位置

### 单波调度

`stage5Director` 在 Boss phase 1/2：

- 每次只释放 1–2 个技能（phase 1）
- 每次只释放 1–3 个技能（phase 2）
- 本波弹幕完全离开屏幕后才生成下一波
- Boss 机制 warning/active 期间不生成新波
- 场上有 `crossOrb` 时也等待，避免与延时核心攻击叠加
- phase 1/2 不再同时运行普通 pattern timers、SIG_FNS 和 ultimate

## Stage 4 RADIANT CAGE

原来已经有伤害判定：

```text
离开移动安全通道 → hitPlayer()
```

但视觉上只有边界光束，容易被误认为“飞出去也没事”。

现在：

- 中央安全通道整块高亮
- 明确显示 `SAFE LIGHT · STAY INSIDE`
- 通道外区域染紫
- 离开安全区会实际扣血/触发 HP 无敌

设计目的：强制玩家跟随移动安全走廊，而不是站桩输出。
