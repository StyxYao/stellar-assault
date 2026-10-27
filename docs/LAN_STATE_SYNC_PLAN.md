# LAN State Sync — Next Phase Plan

状态：**准备讨论，不实现**
范围：仅 LAN 2P。世界联机、公网、NAT、4 人、Host migration 不做。

## 目标

从“Host 画面流 + Client 输入”升级为“两边跑同一 World，只同步输入/状态”，降低画面延迟和带宽。

## 前置

- [x] 本地双人 P1/P2 槽位
- [x] `World.players` 玩家槽位绑定
- [x] 固定 1/60 步长
- [ ] World 可序列化快照
- [ ] 输入帧/序号
- [ ] 确定性随机数
- [ ] 不同步检测

## 候选路线

### A. 锁步输入

- Host/Client 只交换输入帧
- 两边固定步运行
- 延迟低、带宽低
- 对确定性和丢包处理要求高

### B. 快照 + 预测

- Host 周期发 World 快照
- Client 本地预测 + 校正
- 更抗丢包
- 实现复杂度高

### C. 回滚

- 保存最近 N 帧 World
- 收到迟到输入后回滚重放
- 体验最好
- 工程量最大

## 建议顺序

1. `World.snapshot()` / `World.restore()`：先只用于调试
2. 无网络双实例重放：同一输入序列结果一致
3. LAN 输入帧 + 序号
4. 锁步原型
5. 再加入预测/回滚

## 暂不做

- 世界联机
- 公网 relay/TURN
- 4 人
- Host migration
