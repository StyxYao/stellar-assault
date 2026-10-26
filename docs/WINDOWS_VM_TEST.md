# Windows VM / Native Test Checklist

状态：待环境（Windows 镜像 / VM 或 Windows 机器）
用途：R2/R10 Windows 功能矩阵

## 环境

- [ ] Windows 10/11 x64 或 Windows 11 ARM
- [ ] 桌面会话（不是纯 Server Core）
- [ ] 音频输出
- [ ] 至少一个手柄（可选）
- [ ] Steam 客户端与测试 App ID（仅 Steam 服务项）

Apple Silicon 注意：

- Windows 11 ARM 需要 win32-arm64 Electron 包
- x64 Windows 包应在 Windows x64 机器/VM 上测

## 软件包

- [ ] 解压目录可启动
- [ ] 不依赖开发环境
- [ ] 首次启动无缺失 DLL/VC++ 运行库
- [ ] 退出后进程完全结束

## 基础

- [ ] 启动进入菜单
- [ ] 窗口尺寸正确，不溢出
- [ ] 全屏进入/退出
- [ ] Alt-Tab / 最小化 / 恢复
- [ ] 失焦自动暂停
- [ ] 退出/重开
- [ ] 存档写入 `%APPDATA%/stellar-assault-desktop/save.json`
- [ ] 重开后音量/皮肤/最高分保留
- [ ] 选机重开回到 VECTOR

## 音频/视频

- [ ] BGM 播放
- [ ] SFX 播放
- [ ] 菜单 F+C / H+C 正常
- [ ] 第 1/5 关背景视频播放
- [ ] 视频不黑屏/H.264 可解码
- [ ] 窗口失焦后 BGM 暂停/恢复

## 输入

- [ ] 键盘移动
- [ ] Z/Space 技能
- [ ] Enter 确认
- [ ] Esc 暂停
- [ ] 鼠标拖拽
- [ ] 鼠标左键射击
- [ ] 鼠标右键技能/炸弹
- [ ] 手柄左摇杆/D-Pad
- [ ] 手柄 A 确认
- [ ] 手柄 B/X 技能
- [ ] 手柄 Start 暂停
- [ ] 热插拔手柄

## 三机体

- [ ] VECTOR 第一关可玩
- [ ] AEGIS 第一关可玩
- [ ] PHANTOM 第一关可玩
- [ ] PHANTOM 技能/分身/E/D
- [ ] AEGIS 蓄力/Force
- [ ] 教学页可开
- [ ] 初始/复活技能 3 次

## 性能/稳定性

- [ ] 第一关 60fps 附近
- [ ] 第五关视频/弹幕不崩
- [ ] 连续 10 分钟无崩溃
- [ ] 暂停 5 分钟后恢复
- [ ] 无控制台/DevTools 报错

## Steam（可选）

- [ ] Overlay 可打开
- [ ] 成就接口
- [ ] Steam Cloud 上传/下载
- [ ] 两台机器云冲突
- [ ] 退出时云同步不阻塞

## 结果记录

| 项目 | 结果 | 备注 |
|---|---|---|
| 软件包启动 |  |  |
| 窗口/全屏 |  |  |
| 音视频 |  |  |
| 键鼠 |  |  |
| 手柄 |  |  |
| 三机体 |  |  |
| 性能 |  |  |
| Steam |  |  |

Windows VM 只能算功能级通过；最终 Windows 物理机仍需复测性能/视频/Steam。
