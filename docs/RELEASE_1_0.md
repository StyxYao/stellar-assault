# STELLAR ASSAULT 1.0 — Release Candidate

版本：**1.0.0-rc.1**  
日期：2026-10-27

## 1.0 范围

```text
5 关 + 5 Boss
VECTOR / AEGIS / PHANTOM + 9 变体
本地单人
本地双人
LAN 2P（Host 权威快照 + Client 预测）
Web / EdgeOne
Electron Desktop（含内置 LAN server）
```

Boss Rush / Tower 明确属于 1.1。

## RC 已通过

- R4 内容审计
- R5 四关机制
- R6 五 Boss 核心机制
- R7 Rank / Medal / 本地 Top 5
- 移动端暂停/设置/退出
- iOS Web meta/安全区/音频解锁
- 首屏资源 6.7MB
- Node LAN server + Electron 自动 Host
- 自动化 Stage 1→5 → finale
- 本地双人回归
- Node LAN 双客户端状态同步
- `electron-builder` macOS unpacked app

## 外部发布门禁

这些无法由当前 CI/模拟器替代：

- [ ] 完整 5 关非强制人工通关
- [ ] 本地双人完整 5 关
- [ ] 两台物理设备 LAN
- [ ] iOS Safari / Android 真机
- [ ] Windows / Steam Deck
- [ ] 实体手柄
- [ ] Apple/Windows 签名
- [ ] Steamworks App ID / Overlay / 成就 / Cloud
- [ ] Steam depot 上传与 QA

## 发布顺序

1. 完成物理门禁
2. 修复 QA 发现的问题
3. 更新 `VERSION` 为 `1.0.0`
4. tag `steam/1.0.0`
5. 生成最终安装包
6. 上传 Steam private depot
7. 最终回滚包与发布说明
