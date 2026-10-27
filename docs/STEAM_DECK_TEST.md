# Steam Deck Local Test

Deck 是 x86_64 SteamOS Linux；用 Linux AppImage，不需要 Windows。

## 准备

下载：

```text
/Users/a123123/.dsh/im/backups/desktop-artifacts/stellar-assault-linux.zip
```

解压后：

```text
STELLAR ASSAULT-1.0.0-rc.1.AppImage
```

把 AppImage 通过 USB/SD 卡/局域网上传到 Deck。

## Desktop Mode

1. Deck 进入 Desktop Mode
2. 文件管理器打开 AppImage 所在目录
3. 右键属性 → 允许作为程序执行
4. 双击运行
5. 首次可能提示缺少执行权限，终端执行：

```bash
chmod +x "STELLAR ASSAULT-1.0.0-rc.1.AppImage"
./"STELLAR ASSAULT-1.0.0-rc.1.AppImage"
```

## 添加到 Steam

1. Steam → 游戏 → 添加非 Steam 游戏
2. 选择 AppImage
3. 启动参数可加：

```text
--no-sandbox
```

4. 在 Gaming Mode 启动
5. 测试手柄/触控/音频/LAN

## 内置 LAN

桌面版会自动启动：

```text
http://<Deck-IP>:8785
ws://<Deck-IP>:8786
```

如果 Deck 作为 LAN Host，客户端链接使用 Deck 的局域网 IP。

## 没有 Deck 时

没有 Deck 硬件就无法做 Deck 实机验证。可以：

- 在任意 x86_64 Linux 桌面运行 AppImage
- 或用 GitHub Actions 的 Linux Xvfb smoke 作为启动验证

不能把 Linux Xvfb / 普通 Linux 结果称为 **Steam Deck Verified**。
