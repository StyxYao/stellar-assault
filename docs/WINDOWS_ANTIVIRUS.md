# Windows 安装/卸载杀毒报警排查

## 结论

当前报警不是应用内存在下载器、挖矿或持久化代码，而是典型的**未签名 Electron/NSIS 误报**。

直接证据：

- `desktop/package.json` 没有配置代码签名证书。
- `desktop-build.yml` 的 Windows job 设置了 `CSC_IDENTITY_AUTO_DISCOVERY: "false"`，且没有证书 secret。
- 发布物说明明确标注 `NSIS, unsigned`。
- NSIS 安装器会解包完整 Electron 应用并创建 `Uninstall STELLAR ASSAULT.exe`；安装和卸载都是未签名的自解压/删除行为。
- 应用运行时启动本地 HTTP/WebSocket LAN 服务（8785/8786）；部分安全软件会把“新程序 + 本地监听 + 自解压安装器”组合成启发式告警。

这不能证明文件绝对安全；安全结论仍应通过签名、哈希和 VirusTotal/Defender 扫描确认。

## 为什么安装和卸载都会报

### 安装

- NSIS 自解压器未签名
- 解压出的 `STELLAR ASSAULT.exe` 未签名
- Electron 主程序没有发布者信誉
- 安装器写注册表、开始菜单、桌面快捷方式

### 卸载

- `Uninstall STELLAR ASSAULT.exe` 未签名
- 它删除应用文件和注册表项
- 新版本文件没有累积信誉

## 能立即降低误报的改动

已加入构建配置：

```json
{
  "nsis": {
    "packElevateHelper": false,
    "allowElevation": false
  },
  "win": {
    "requestedExecutionLevel": "asInvoker",
    "signAndEditExecutable": true,
    "signExts": [".exe"],
    "legalTrademarks": "STELLAR ASSAULT"
  }
}
```

作用：

- 不再打包额外的 elevate helper
- 安装按当前用户进行，不请求管理员权限
- 补全 Windows 文件元数据
- 要求 electron-builder 对所有 `.exe` 进行签名（有证书时）

## 真正避免误报：代码签名

仅靠配置不能消除杀毒误报。需要：

1. 购买 OV 或 EV Windows 代码签名证书
2. 将 `.pfx` Base64 放入 GitHub Secret `WINDOWS_CSC_LINK`
3. 密码放入 `WINDOWS_CSC_KEY_PASSWORD`
4. 重新构建

electron-builder 会签名：

- `STELLAR ASSAULT.exe`
- NSIS installer
- `Uninstall STELLAR ASSAULT.exe`

EV 证书通常能更快建立 SmartScreen 信誉；OV 证书需要持续签名同一发布者来积累。

## 临时方案

优先分发 **portable zip**：

```text
STELLAR ASSAULT-1.0.0-rc.1-win.zip
```

它不安装、不写卸载器、不需要管理员权限，误报面明显小于 NSIS。

不能保证 portable exe 完全不报警，因为主程序仍未签名。

## 误报申诉

拿到最终安装器后：

1. 计算 SHA256
2. 提交 Microsoft Defender 误报：
   https://www.microsoft.com/en-us/wdsi/filesubmission
3. 同时向具体杀毒厂商提交 false positive
4. 保留提交编号

## 不要做

- 不要建议用户关闭杀毒软件
- 不要用自签名证书冒充受信任发布者
- 不要通过混淆/加壳规避检测
- 不要把“未复现”当成“绝对安全”

## 验证清单

- [ ] `Get-AuthenticodeSignature` 对 installer 显示 `Valid`
- [ ] 对主 exe 显示 `Valid`
- [ ] 对 uninstaller 显示 `Valid`
- [ ] 安装/卸载不触发 Defender
- [ ] VirusTotal 误报数为 0
- [ ] 记录提交编号
