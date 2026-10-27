# R3 — Local Co-op Clean Close-out

状态：**本机双人回归通过**
范围：同一台电脑、同一画面、P1 + P2

## 结构

- P1 仍使用 legacy 全局槽位，但绑定为 `slot=1 / owner=P1`
- P2 是独立槽位：机体、变体、HP、LIVES、BOMBS、OD、武器、僚机、Force/Cloak
- `World.players` 持有当前玩家槽位，供后续状态同步复用
- P2 的舰船系统调用改为作用域化的 `coopUseSlot()`；退出时恢复 P1 上下文，避免状态泄漏
- P2 机体在运行中切换时会补齐 AEGIS/PHANTOM 状态，不再读取 null 状态

## 已验证

- [x] 单人模式：World 只有 P1，无控制台报错
- [x] 双人启动：World 有 P1/P2
- [x] P2 IJKL 移动
- [x] P2 U 炸弹
- [x] P2 AEGIS：CHG 蓄力、FORCE 发射/回收
- [x] P2 PHANTOM：隐身/分身
- [x] P2 受伤、掉命、复位
- [x] P2 拾取
- [x] P2 独立机体切换
- [x] 强制 Boss → Clear 流程
- [x] 无控制台错误

## 仍需

- 不强制、完整通关的平衡测试
- P2 长局武器/僚机/激光压力测试
- 两台物理设备不属于本项

## 关键调试

```js
window.__world()
window.__coop()
window.__setP2Ship('aegis')
window.__setP2Od(1.2)
```
