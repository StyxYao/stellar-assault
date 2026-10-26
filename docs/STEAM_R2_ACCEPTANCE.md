> 历史验收快照，PHANTOM 已提前接入；当前进度见 `docs/R2_PROGRESS_AUDIT.md`。

# Steam R2 — VECTOR / AEGIS Skins and Integration

状态：代码与本地预览通过；真机触屏/Windows 仍待 M7  
日期：2026-10-24

---

## 已交付

- VECTOR：3 套完整机体图
  - 虚空之矛（默认）
  - 星陨之翼
  - 深渊之刃（保持红色）
- AEGIS：3 套完整机体图 + 护盾/Force 叠加层
  - 轨道守卫（默认）
  - 虚空回响
  - 时序巡游者
- 菜单 SHIP / SKIN 选择
- 分机体皮肤存档
- 分机体最高分
- AEGIS 蓄力、Force、护盾、W 转换
- AEGIS 首局教学
- PHANTOM 锁定预览槽（仅外观，机制后置）
- 完整机体图模型，不拆 body/ring/core

---

## 操作

```text
V      切换 VECTOR / AEGIS
B      切换当前机体皮肤
←/→    选关
Enter  开始
```

鼠标：点击 SHIP / SKIN 按钮。

---

## 实测

| 检查 | 结果 |
|---|---|
| VECTOR 默认虚空之矛 | PASS |
| VECTOR 切换星陨之翼 | PASS |
| VECTOR 深渊之刃资源 | PASS |
| AEGIS 默认轨道守卫 | PASS |
| AEGIS 切换皮肤 | PASS |
| 皮肤写入 save | PASS |
| 分机体最高分 | PASS |
| AEGIS 护盾层叠加 | PASS |
| AEGIS 教学 | PASS |
| PHANTOM 锁定预览文字 | PASS |
| 皮肤 sprite 无报错 | PASS |
| 真机多指触屏 | 未测 |
| Windows 原生 | 未测 |

---

## 已知限制

- 皮肤 sprite 来自设定板裁切，部分 80×80 细节仍需人工清理。
- 轨道守卫的环已经烘焙在完整图里；Force 分离只移动护盾层，机体图上的环不会消失。这是简化资产模型的取舍。
- PHANTOM 目前只有锁定预览，没有机体选择和机制。
- 深渊之刃是红色外观，需继续确认敌我识别。
- 皮肤立绘 portrait 已保存，但还没进选人界面大图。
- 真机触屏和 Windows 未验证。

---

## 预览

- 本地 Web：`http://192.168.31.185:8785/index.html`
- Electron：`desktop/`，`npm start`
- 截图：菜单、VECTOR 默认、AEGIS 默认
