# LAN State Sync — Next Phase Plan

状态：**Host 权威快照同步 + Client 本地预测已默认启用**
范围：仅 LAN 2P。世界联机、公网、NAT、4 人、Host migration 不做。

## 目标

从“Host 画面流 + Client 输入”升级为“两边跑同一 World，只同步输入/状态”，降低画面延迟和带宽。

## 前置

- [x] 本地双人 P1/P2 槽位
- [x] `World.players` 玩家槽位绑定
- [x] 固定 1/60 步长
- [x] World 可序列化快照（`World.snapshot()`）
- [x] 确定性随机数（`rng()` / visual `vrng()` 分离）
- [x] 同步种子 / 输入序号协议骨架
- [x] Host World 快照 → Client restore/render 原型
- [x] Client 本地 step 预测 + Host 快照校正（Beta）
- [ ] 预测/回滚的正式误差处理
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

## 当前实现

- LAN 默认 `STATE SYNC`，20Hz 完整 World 快照
- Client restore 后本地 step 预测，Host 快照校正
- JPEG 画面流保留为手动 fallback

- `World.snapshot()` 已用于确定性回归
- `__resetDeterministic(stage, seed)` + `__simulate(frames)` 已跑通两实例同快照
- `sync-start` 已下发 seed/stage；input 已带 seq
- `World.snapshotFull()` / `World.restore()` 已接入
- LAN 面板可切 **SYNC · SNAPSHOT BETA**
- Host 20Hz 广播 World 快照；Client restore 后在本机 canvas 绘制，不再传 JPEG
- Client 会跑本地 `step()` 做预测，Host 20Hz 快照校正
- Client 保留 `lanSyncClientHold` 作为回放/调试开关

## 建议顺序

1. `World.restore()`：先用于回放/调试
2. 无网络双实例重放：同一输入序列结果一致
3. LAN 输入帧 + 序号
4. 锁步原型
5. 再加入预测/回滚

## 测试

- [x] 单客户端 Host-as-P1：快照 restore，canvas 本地绘制
- [x] Client 本地 step 预测：time/bullets 持续前进，快照校正无报错
- [x] Host-only 双客户端：P1/P2 都 restore，画面一致
- [x] 客户端输入仍驱动 Host 的 P2
- [x] 切换 JPEG/SNAPSHOT 不改现有流程
- [x] 无控制台错误

## 暂不做

- 世界联机
- 公网 relay/TURN
- 4 人
- Host migration
