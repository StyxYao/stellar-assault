# SHIP 02 — AEGIS（FORCE 型）触屏与机体设计

状态：R0 设计修订 v2，未实现  
日期：2026-10-24  
基线：`9ba2f0e`（Roadmap v2）  
死亡经济：冻结，不修改

---

## 1. 定位

AEGIS 是与 VECTOR 并列的第二架可选机体。

- VECTOR：当前机体，僚机挡弹，自动火力，偏均衡
- AEGIS：内置可分离 Force，蓄力炮，偏位置/爆发
- AEGIS **不携带僚机**
- AEGIS 不改变现有死亡经济
- AEGIS 使用独立最高分/排行榜标签

暂定名：`AEGIS`。  
如果后续要换名，只改显示名，不改系统 ID：`aegis`。

---

## 2. 核心机制

### Force

Force 是机体的内置实体，不是可拾取强化。

状态：

```text
ATTACHED
DETACHED
RETURNING
REBUILDING
```

规则：

- 默认 ATTACHED，位于机头前方
- 挂载时：
  - 提供前向副火力
  - 作为局部子弹阻挡体
  - **有限护盾值**，不是无限挡弹
  - 不提供玩家无敌
  - 不替代僚机，AEGIS 没有僚机
- 分离时：
  - Force 向前飞出
  - 接触敌人造成伤害
  - 不再保护机头
- 分离后手动回收：
  - 再点一次 FORCE 键
- 离开屏幕自动进入 RETURNING，避免软锁
- 死亡后：
  - 不额外损失 Force
  - 复活时自动 REBUILDING → ATTACHED
  - 不改变 `specialPower -1`、炸弹回 2 的现有规则

### Force 有限护盾

- 护盾上限：100
- 每挡一发敌弹：-8
- 停止挡弹 1.2s 后：+14/s 回复
- 护盾归零：
  - Force 进入 BROKEN
  - 2.5s 后自动重建到 40 护盾
- 死亡：
  - Force 直接重建到 100
  - 不额外扣武器等级
- 分离状态：
  - 不挡弹
  - 不回复护盾
- 只挡 Force 半径内的子弹，不保护玩家本体

### 蓄力炮

- 独立按键
- **点按开始蓄力，不需要长按**
- 再点一次按当前等级释放
- 蓄满后短暂停留自动释放，防止卡在满蓄状态
- 蓄力等级：
  - LV1：0.35s
  - LV2：0.80s
  - LV3：1.30s
- 满蓄后 0.35s 自动释放
- 释放后 0.20s 冷却
- 蓄力期间**不减速**，移动手感与平时一致

### 蓄力表现矩阵

这里的“表现”是**同一套蓄力系统的数据档位**，不是 16 套独立武器逻辑。

- 弹种：N / S / L / M
- 威力等级：LV1–LV4
- 蓄力时间：给当前档位一个 0–1 的强度缩放
- 释放时读取 `weapon + power + chargeIntensity`

| 弹种 | LV1 | LV2 | LV3 | LV4 |
|---|---|---|---|---|
| N 普通 | 单发贯穿矛 | 双发贯穿矛 | 宽幅贯穿矛 | 超载贯穿矛 + 冲击波 |
| S 散射 | 5 发扇形爆裂 | 7 发扇形 | 9 发扇形 | 11 发扇形 + 中央脉冲 |
| L 激光 | 细束 0.6s | 中束 0.8s | 宽束 1.0s | 贯穿束 1.2s |
| M 导弹 | 2 发追踪 | 3 发追踪 | 4 发追踪 | 5 发追踪 + 齐射 |

实现建议：

```js
CHARGE_PROFILES[weapon][power] = {
  kind: 'lance' | 'fan' | 'beam' | 'swarm',
  count: 1,
  width: 1,
  damage: 1,
  duration: 0,
  color: '#9fe8ff'
};
```

蓄力时间只缩放：

- 弹体尺寸
- 伤害
- 持续时间
- 音调/屏幕震动

不新增 16 种碰撞规则。  
否则 4 弹种 × 4 威力 × 3 蓄力等级 = 48 个状态，维护和平衡会失控。

### 蓄力与 Force 的关系

- 蓄力炮由机体发射，不依赖 Force 位置
- Force 挂载：蓄力炮伤害 +10%，弹体略宽
- Force 分离：蓄力炮伤害不变，Force 自身继续独立攻击
- 不做“Force 分离时蓄力炮取消”，避免多状态耦合

---

## 3. 触屏布局

逻辑坐标：390×844

### 移动

- 第一根手指在非按钮区域按下并拖动
- 机体跟随手指上方 86px，与当前触屏逻辑一致
- 第一根手指负责移动，第二根手指可点按钮
- 按钮区域按下不移动机体

### 按钮

```text
CHARGE   中心 (252, 766)  半径 32
BOMB     中心 (326, 766)  半径 38
FORCE    中心 (326, 674)  半径 30
```

视觉上：

- CHARGE：圆形，显示 `CHG` 与蓄力环
- BOMB：沿用现有炸弹按钮，但 AEGIS 使用较小命中半径
- FORCE：圆形，显示 `FORCE`/`RECALL`
- 按钮之间保留至少 4px 视觉间距

### 多指

- `movePointerId`：只跟随第一根非按钮手指
- 按钮按下立即触发，不设置 target
- 按钮抬起不影响移动
- 移动手指抬起后，下一根非按钮手指可接管移动
- 两个按钮同时按：各自处理，互不阻塞

### 防误触

- 按钮命中区域独立于移动区域
- 按钮内按下不会触发双击炸弹
- 按钮内拖动不移动机体
- 蓄力中再次点 CHARGE：释放；不是重新开始
- FORCE 在 RETURNING/REBUILDING 中点击：忽略

---

## 4. 触屏状态机

### CHARGE

```text
IDLE
  tap CHARGE -> CHARGING (chargeT=0)

CHARGING
  chargeT += dt
  update ring / level
  tap CHARGE -> RELEASE if level>=1
  if chargeT >= 1.30 -> FULL
  if FULL for 0.35s -> RELEASE
  if level<1 and tap -> CANCEL

RELEASE
  spawn beam at current level
  cooldown 0.20s -> IDLE
```

### FORCE

```text
ATTACHED
  tap FORCE -> DETACHED
  position = ship front
  blocks local bullets

DETACHED
  moves forward
  contact damage
  tap FORCE -> RETURNING
  offscreen -> RETURNING

RETURNING
  ease back toward ship
  contact damage
  arrive -> ATTACHED

REBUILDING
  death/respawn only
  short 0.35s visual rebuild
  -> ATTACHED
```

---

## 5. 死亡规则

完全沿用现有死亡经济：

- 有僚机时先消耗僚机（AEGIS 没有僚机，不适用）
- 死亡：
  - 生命 -1
  - 武器等级 -1
  - 僚机清空（本来没有）
  - 炸弹回 2
  - 复活短暂无敌
- AEGIS 额外规则：
  - Force 自动重建
  - 不扣 Force 等级
  - 不额外清空 Charge
  - 不额外清空拾取物

不允许：

- Force 永久丢失
- 死亡再扣一层武器
- 死亡清空全部拾取

---

## 6. 拾取与僚机

AEGIS 没有僚机。

- `W` 是 Wingman 僚机，不是 A/P
- AEGIS 不生成 Option
- 建议转换：
  - 蓄力能量 +25%
  - 同时 +100 分
- 不改变现有掉落表
- 不新增死亡掉落

VECTOR 仍保留现有僚机逻辑。

---

## 7. 独立分数

- 存档增加 `ships.aegis.bestScore`
- VECTOR 保留 `ships.vector.bestScore`
- RunResult 带 `shipId: 'aegis'`
- 本地榜/Steam 榜按 `shipId` 过滤
- 主菜单显示当前机体最高分
- 成就可区分：
  - AEGIS 通关
  - AEGIS 全 Boss
  - AEGIS 无僚机（本身无僚机，改成无炸弹/无伤等）

---

## 8. 平衡目标

首版目标：

| 维度 | VECTOR | AEGIS |
|---|---|---|
| 基础 DPS | 100% | 85% |
| Force 分离 DPS | — | 120% |
| 防御 | 僚机一次性挡弹 | Force 局部挡弹，不挡玩家 |
| 操作复杂度 | 低 | 中 |
| 爆发 | 低 | 高 |
| 生存 | 中 | 中低 |

原则：

- AEGIS 不能同时拥有“高 DPS + 强防御”
- Force 分离是输出交换防御
- 蓄力炮不能替代普通射击的持续输出
- 不允许 Force + 僚机双层盾

---

## 9. R0 验收

- 触屏布局定稿
- 多指规则定稿
- CHARGE 状态机定稿
- FORCE 状态机定稿
- 死亡重建规则定稿
- 独立分数结构定稿
- 与 VECTOR 差异表定稿

## 10. 仍待确认

1. 机体名：已确认 AEGIS。
2. Force 挡弹：已确认有限护盾，具体数值待 R1 调。
3. 蓄满自动释放 0.35s：先按此实现。
4. W：确认是僚机；建议转 25% 蓄力 +100 分。
5. 蓄力不减速：已确认。
6. 独立榜：按 `aegis` 单独，暂不按 mode 拆。
