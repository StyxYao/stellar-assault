# Steam R2 — Three-Ship Integration

状态：**功能签收通过，硬件矩阵有条件待验**  
更新：2026-10-26  
基线：`9da7329` + 本轮测试钩子  
说明：R2 原计划只含 VECTOR / AEGIS；PHANTOM 已提前接入，因此本验收按三机体执行。

---

## 已交付

### 机体

- VECTOR：3 套完整外观
- AEGIS：3 套完整外观 + Force 层
- PHANTOM：3 套 Qwen 透明外观
  - Quantum Hunter
  - Phantom Raven
  - Phantom Butterfly

### 选机与存档

- 三机体选择
- 9 套变体选择
- 选机**不跨重启持久化**：每次启动回到 VECTOR
- 分机体皮肤持久化
- 分机体最高分持久化（含 PHANTOM）
- 开始确认面板

### 教学

选机菜单新增：

```text
TUTORIAL · VECTOR / AEGIS / PHANTOM
```

- VECTOR：移动、自动射击、炸弹、僚机
- AEGIS：蓄力炮、Force 挂载/分离、E/D
- PHANTOM：隐身、分身、E/D
- AEGIS 首局提示仍保留；即使已看过，也能从菜单重开

### 菜单反馈

```text
移动 / 切换：F + C
选择 / 确认：H + C
```

使用实际音频资源，HTTP 环境加载通过。

### PHANTOM

- 隐身 3s / Raven 4s
- 攻击加成 +30% / Raven +100% / Butterfly +0%
- 分身复制武器和等级，固定 50% 基准伤害
- 分身 3 HP / Raven 1 HP
- 分身受伤后 1s 无敌
- 分身自动索敌、横向瞄准、安全编队
- 分身上限 1→2 / 2→4
- E 恢复充能，D 提升上限
- 技能自动侧移 + 残影 + B 低频音效
- 分身被击毁爆炸

### 技能次数

所有机体初始及死亡复活默认 **3 次**。

---

## 操作

```text
V              打开选机
B              打开当前机体皮肤
↑ / ↓          选择机体 / 变体
← / →          选关
Enter          确认 / 开始
T              选机菜单内打开教程
Esc            关闭 / 暂停
Z / Space      炸弹 / PHANTOM 技能
C / F          AEGIS 蓄力 / Force
```

---

## 验证结果

| 检查 | 结果 | 说明 |
|---|---|---|
| 三机体可选 | PASS | VECTOR / AEGIS / PHANTOM |
| 9 套变体可选 | PASS | 3+3+3 |
| 机体预览/数值行 | PASS | 含 HP、伤害、上限 |
| 选机不持久化 | PASS | 重载后回到 VECTOR |
| 分机体皮肤持久化 | PASS | save 写入 |
| 分机体最高分 | PASS | Phantom 读档重置已修 |
| 开始确认 | PASS | Change Ship / Cancel |
| AEGIS 教程 | PASS | 首局 + 菜单入口 |
| PHANTOM 教程 | PASS | 菜单两页 |
| 菜单 F+C / H+C | PASS | 音频资源加载 |
| 三机体进入第一关 | PASS | 正常 play |
| 初始技能次数 | PASS | 3 |
| 死亡复活技能次数 | PASS | 3 |
| PHANTOM 技能/分身 | PASS | 测试无报错 |
| 分身上限/E/D | PASS | 之前专项测试 |
| 分身受击无敌 | PASS（代码） | 需更多实战样本 |
| 第一关 Boss/清关流程 | PASS（强制路径） | 三机体 boss→clear |
| 第一关完整无干预清关 | 未完成 | 自动测试在 mini/波次处停滞 |
| 默认变体 DPS 基准 | PASS | 见 `BALANCE_BASELINE.md` |
| 触屏按钮 | PASS（模拟） | PHANTOM 技能触发 |
| Deck 1280×800 | PASS（模拟） | 画布 370×800 居中，无溢出 |
| 手柄专用体感 | PENDING | 未做真手柄全键测试 |
| Windows 原生 | PENDING | 当前 macOS 环境无法验证 |
| 真机多指触屏 | PENDING | 仅 Playwright touch 模拟 |

### 基准 DPS

| 条件 | DPS |
|---|---:|
| VECTOR 基础 | 43 |
| AEGIS 基础 | 50 |
| PHANTOM 基础 | 43 |
| PHANTOM 隐身 + 分身 | 70 |

说明：AEGIS 蓄力炮/Force 爆发未纳入；这是单目标基准，不是完整平衡结论。

---

## 已知限制

- 选机不持久化是产品策略，不是 bug。
- 第一关完整无干预清关尚未人工验收；自动化在长波次/mini 阶段停滞。
- Windows、Steam Deck 真机、真实多指触屏、手柄全键未验证。
- AEGIS Force 环仍烘焙在完整机体图内，分离时只移动护盾层。
- PHANTOM 的分身索敌/伤害仍需更多局内样本。
- 深渊之刃红色外观需继续确认敌我识别。

---

## 预览

- 本地 Web：`http://192.168.31.185:8785/index.html`
- Electron：`desktop/`，`npm start`
- EdgeOne：见本轮聊天预览链接

---

## R2 结论

**功能/内容可以收口，进入 R3 双人联机。**  
剩余项属于 QA/硬件矩阵，而非缺少 R2 功能：

1. 第一关人工完整清关
2. Windows 原生
3. 真实触屏 / Deck / 手柄全键
4. 最终手感平衡

R3 规划见 `docs/MULTIPLAYER_R3.md`。
