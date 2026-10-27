# R3.1 — LAN Screen Clean Close-out

状态：**Host 画面流 / 双触屏 / Ready 流程回归通过**
架构：Host 唯一模拟 → canvas 画面 + PCM 音频 → Client 只发输入

## 模式

- Host as P1：Host 控制 P1，一个远程 P2
- Host-only 2P：Host 只做权威端，P1/P2 分别加入

## 已完成

- 邀请链接自动加入
- 第一个客户端 P1，第二个 P2
- P1 选关、机体、变体；P2 只选机体/变体
- 图片化机体/变体/关卡卡片
- P1/P2 READY；两人 READY 自动开始
- 30 秒未齐：随机基准机体、第一关
- Host 权威修正同变体，并回传客户端
- 触屏：整屏拖动；AEGIS 左 CHG / 右 FORCE；其他机体只保留主技能
- 44.1kHz PCM 音频 + 抖动缓冲
- 画面约 45fps；输入约 60Hz；WebSocket 帧背压保护
- Client token 掉线重连、页面刷新重连
- 客户端收到 lobby / ready / countdown / stage / loadout-set

## 已验证

- [x] 双客户端加入，P1/P2 槽位正确
- [x] P1 选第 3 关 → Host stage index 2
- [x] P1/P2 READY 自动开始
- [x] 30 秒超时自动第一关
- [x] AEGIS 左蓄力/右 Force
- [x] 同变体冲突 → Host 修正 → Client 卡片更新
- [x] Client 重载后 token 重连
- [x] 炸弹后 PCM 发送/接收继续
- [x] 无控制台错误

## 仍需

- 两台物理触屏设备
- 真实 Wi-Fi 丢包/延迟
- Host 掉线迁移（不做）
- 完整状态同步（下一阶段）


## State-sync beta

LAN 默认 `SYNC · STATE SYNC`：Host 20Hz 发 World 快照，Client restore 后本地 canvas 绘制并跑本地 step 预测；Host 快照周期校正；输入仍回 Host。`SYNC · JPEG FALLBACK` 为手动回退。
