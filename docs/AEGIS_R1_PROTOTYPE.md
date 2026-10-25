# AEGIS R1 — Sandbox Prototype

状态：R1 原型可用；未接正式关卡，未做最终平衡  
日期：2026-10-24  
设计基线：`docs/SHIP_AEGIS_DESIGN.md`

---

## 已实现

- 第二架机体 `AEGIS`
- 菜单 SHIP 选择（键盘 V / 手柄 Y / 鼠标点击）
- 触屏三个按钮：
  - CHARGE
  - BOMB
  - FORCE
- 多指输入基础：
  - 第一根手指移动
  - 第二根手指点按钮
  - 按钮区不移动机体
- CHARGE：
  - 点按开始
  - 再点释放
  - 满蓄 0.35s 自动释放
  - 无长按
  - 不减速
- Force：
  - 挂载
  - 分离
  - 手动回收
  - 离屏自动回收
  - 死亡自动重建
- Force 有限护盾：
  - 100 上限
  - 每发 -8
  - 停止挡弹 1.2s 后 +14/s
  - 归零 BROKEN 2.5s，重建 40
- 蓄力矩阵：
  - N / S / L / M 四种弹种
  - LV1–LV4 按当前 profile 缩放
- W 拾取：
  - AEGIS 下转 25% 蓄力 +100 分
  - 不生成僚机
- 音效：Laser Cannon 蓄力释放、Jet Flyby Force 弹出
- 首次 AEGIS 教学提示
- 独立分数：
  - `ships.aegis.bestScore`
  - `ships.vector.bestScore`
  - 菜单显示当前机体最高分
- 死亡规则沿用现有：
  - 生命 -1
  - 武器 -1
  - 炸弹回 2
  - Force 自动重建

---

## 实测

macOS + Electron 38.2.0：

| 检查 | 结果 |
|---|---|
| 菜单选择 AEGIS | PASS（键盘 V） |
| 进入关卡后 player.ship = aegis | PASS |
| 键盘 C 蓄力 / 再按释放 | PASS |
| 满蓄自动释放 | 代码路径存在，待更长时间实测 |
| 键盘 F 分离 / 回收 | PASS |
| Force 死亡重建 | 代码路径存在，待自然死亡实测 |
| AEGIS 独立最高分写入 | PASS |
| AEGIS 无僚机 / W 转换 | 代码路径存在，待拾取实测 |
| 触屏按钮命中 | 鼠标模拟 PASS |
| 真机多指触屏 | 未测 |
| 有限护盾挡弹 | 未测 |

---

## 已知限制

- R1 直接使用 Stage 1 作为沙盒，没有独立训练场。
- 蓄力 VFX 还是占位级：用 hitspark/普通 shot 表现。
- 16 个 profile 目前是数据档位，不是 16 套独立美术。
- Force 挂载时的局部挡弹还没有做压力测试。
- AEGIS 与 VECTOR 的 DPS/生存平衡未定。
- 手柄 Y 选机与蓄力共用，需要真机确认不误触。
- 触屏多指尚未在真实手机上验证。

---

## 下一阶段 R1.5

1. 独立训练场
2. 16 个蓄力档位的视觉/音效区分
3. 护盾挡弹压力测试
4. 真机多指测试
5. VECTOR / AEGIS 对比平衡
6. 自然死亡验证 Force 重建
