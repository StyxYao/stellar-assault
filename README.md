# STELLAR ASSAULT

一款竖屏科幻弹幕射击游戏。

驾驶三艘定位完全不同的战机，穿过五个关卡，击败五名 Boss，在弹幕、光束和融合攻击中活下来。

- **5 个关卡 / 5 名 Boss**
- **3 艘战机 + 9 种变体**
- **单人 / 本地双人 / 局域网双人**
- **触屏、鼠标、键盘均可游玩**
- **Web 与 Windows / Linux 桌面版**

当前版本：**1.0.0-rc.1**  
Boss Rush 与 Tower 模式计划在 **1.1** 推出。

---

## 开始游戏

### Web

打开构建后的游戏入口：

```text
dist/index.html
```

或使用当前 Web 部署。首次在 iPhone/iPad 上进入时，先点一下屏幕，浏览器才会允许播放声音。

### Windows / Linux

桌面构建由 GitHub Actions 生成，包含安装包与便携版：

```text
https://github.com/StyxYao/stellar-assault/actions/workflows/desktop-build.yml
```

选择最新一次成功的 **Desktop Build**，下载：

```text
stellar-assault-windows
stellar-assault-linux
```

桌面版目前**未签名**，Windows SmartScreen 可能会提示“未知发布者”。这是预期行为，选择“更多信息 → 仍要运行”即可。

---

## 操作

| 操作 | 方式 |
|---|---|
| 移动 | 触屏拖动 / 鼠标拖动 / 方向键 / WASD |
| 射击 | 自动开火 |
| 炸弹 | `Z` / `Space` / 屏幕 BOMB 按钮 |
| 暂停 | `P` / `Esc` / 左上角暂停按钮 |
| AEGIS 蓄力炮 | `C` / 屏幕 CHG 按钮 |
| AEGIS Force | `F` / 屏幕 FORCE 按钮 |
| PHANTOM 潜行/分身 | `Z` / 屏幕 PHASE 按钮 |

手机上按住屏幕拖动即可，机体跟随手指上方，不需要点击射击。

---

## 三种战机

### VECTOR — 标准火力

均衡型战机，靠僚机和炸弹建立火力网。

- 升级僚机
- 清屏炸弹
- 适合第一次通关

### AEGIS — 护盾与 Force

以护盾和可分离的 Force 核心为核心。

- 护盾可以吸收伤害并清除接触弹
- Force 挂载时防御，分离后提供额外火力
- 蓄力炮可以打出更宽、更强的光束
- 低护盾会触发警报，破盾后需要等待恢复

### PHANTOM — 潜行与分身

以隐身、诱饵和分身复制火力为核心。

- 潜行期间无敌
- 分身复制主武器和等级
- 分身可以吸引敌人火力
- Quantum：稳定型，2 个分身
- Raven：4 秒潜行，+150% 潜行伤害，1 个分身
- Butterfly：4 个分身

---

## 模式

### 单人

标准五关战役。

### 本地双人

同一台设备，两名玩家共用屏幕。

### LAN 双人

一台设备作为 Host，另一台设备通过局域网加入。

- 默认端口：`8785`（HTTP）/ `8786`（WebSocket）
- 桌面版会自动启动 Host
- 如果连接失败，检查两台设备是否在同一局域网、防火墙是否放行端口

不支持互联网联机、房间匹配或账号系统。

---

## 拾取物

| 拾取 | 效果 |
|---|---|
| `P` | 提升武器等级 |
| `A` | 切换武器 |
| `S / L / M` | 直接切到对应武器 |
| `D / W` | 战机专属升级：僚机 / Force / 分身 |
| `B` | 补充炸弹或能量 |
| `1UP` | 生命 +1 |

---

## 关卡与结算

每个关卡结束会显示：

- 本关得分
- 评级（E–S）
- 击破数
- 通关时间
- 无伤 / 炸弹储备奖励

完整通关后还会显示本次 Run 的总评级、奖章和本地最高分。

---

## 已知限制

- 仅支持单人、本地双人和 LAN 双人，不含世界联机
- Steam 正式发行仍在准备中
- Steam Deck 尚未完成实机验证，不能标注为 Verified
- Windows / Linux 构建未签名
- 部分旧设备可能无法流畅播放高码率背景视频
- 1.0 暂不含 Boss Rush / Tower

---

## 常见问题

### 没有声音？

iPhone/iPad 需要先触摸屏幕一次；桌面浏览器检查标签页是否被静音。

### LAN 找不到主机？

确认：

1. 两台设备在同一网络
2. Host 防火墙允许 `8785` 和 `8786`
3. 输入的是 Host 的局域网 IP，而不是 `localhost`

### 存档在哪里？

Web 版使用浏览器本地存储；桌面版使用应用数据目录。清除浏览器站点数据会删除存档。

### 为什么 Windows 提示未知发布者？

当前构建没有代码签名证书。

---

## 从源码运行

```bash
python3 -m pip install -r requirements.txt
bash tools/build_pages.sh
node tools/lan_server.mjs 8785 8786
```

测试与校验：

```bash
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
node tools/validate_content.mjs
python3 tools/check_structure.py
```

开发与架构文档：

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- [`docs/DEVELOPMENT.md`](docs/DEVELOPMENT.md)
- [`docs/RELEASE_1_0.md`](docs/RELEASE_1_0.md)
- [`CHANGELOG.md`](CHANGELOG.md)

---

## 制作

- 设计 / 程序 / 关卡：STELLAR ASSAULT team
- 引擎：原生 Canvas 2D + WebAudio
- 桌面壳：Electron
- 第三方素材与工具：[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)

代码与原创美术保留所有权利，除非后续单独添加许可证。
