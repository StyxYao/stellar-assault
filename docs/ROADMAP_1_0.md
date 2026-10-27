# STELLAR ASSAULT — 1.0 Scope

修订：2026-10-27  
状态：**执行中**

## 1.0 定义

1.0 是 **5 关战役版**，不包含 Boss Rush / Tower。

```text
5 关 + 5 Boss
VECTOR / AEGIS / PHANTOM + 9 变体
本地单人
本地双人（上下分屏任务设置）
LAN 2P（Host 权威快照 + Client 预测）
Web / EdgeOne
Desktop / Electron 基础发行
```

## 1.0 必过门禁

### 内容

- [x] R4 内容审计表：5 关 / 5 Boss（见 R4_CONTENT_AUDIT.md）
- [ ] R5 每关一个主要机制
- [ ] R6 每个 Boss 一个核心交互
- [ ] R7 Rank / Medal / Score / 本地榜
- [ ] 5 关完整、非强制通关

### 稳定化

- [x] 移动端暂停 / 设置 / 退出到菜单
- [x] 首屏资源懒加载：GIMG 按需 + 第五关视频延迟加载（首屏约 6.7MB）
- [x] iOS Safari 安全区、音频手势解锁（待真机）
- [ ] 本地双人完整通关
- [ ] LAN 双客户端完整第一关
- [ ] LAN 物理设备测试
- [ ] 断线重连 / 切后台 / 音频恢复
- [ ] 无软锁、无不可恢复状态

### 发行

- [ ] 1.0.0 版本号统一
- [ ] README / CHANGELOG / 验收文档同步
- [ ] Windows / macOS Desktop 构建
- [ ] Steamworks / 安装包 / 商店素材（Steam 发行门禁）
- [ ] 隐私 / EULA / 第三方声明
- [ ] 回滚包与发布快照

## 1.1 范围

- Boss Rush
- Tower
- 1.0 后新增机体/关卡
- 更完整的在线/排行榜能力（不包含世界联机）

## 明确不做

- 世界联机
- 公网 NAT / 专用服务器
- 4 人
- Switch 移植
- 确定性锁步/回滚替换当前 LAN 架构
