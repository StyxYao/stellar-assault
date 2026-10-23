# STELLAR ASSAULT

移动端优先的竖屏弹幕射击游戏，Canvas 2D + WebAudio，无运行时框架依赖。

项目最初是 rRootage / BulletML 的个人学习致敬作，现在按可上架产品方向维护：Web 先行，Steam 与微信小游戏作为后续平台目标。

## 当前状态

- 5 个关卡、5 个 Boss
- 第五关：Hedron 第一阶段 → 四 Boss 融合 → 二/三阶段 → 终局
- 4 种武器：NORMAL / SPREAD / LASER / MISSILE，Lv1–Lv4
- 僚机、炸弹、生命/血量、掉落、补给运输机
- 第五关 6 种独立敌机：独立血量、攻击、子弹素材、阵型
- 玩家真实判定圈视觉提示
- 触屏拖动操作，自动开火
- 模块化基础完成：27 个模块，`src/legacy/game.js` 仅保留 440 行组合根

Steam 构建和微信小游戏适配尚未实现，接口规划见 [`docs/HANDOFF.md`](docs/HANDOFF.md)。

## 快速开始

### 环境

- Python 3
- Pillow（`requirements.txt`）
- Node.js 22（仅测试 / 语法检查需要）

```bash
python3 -m pip install -r requirements.txt
```

### 完整 Web 构建（推荐）

```bash
bash tools/build_pages.sh
```

输出：

```text
dist/
  index.html
  build.txt
  assets/
    bg/
    audio/
    fonts/
    video/
```

`build_pages.sh` 会：

1. 创建/使用本地虚拟环境
2. 安装 Pillow
3. 按 `src/modules.json` 组装模块
4. 生成单文件基础包
5. 外置图片资源
6. 复制背景、音频、字体、视频
7. 写入 `build.txt`（当前 commit）
8. 校验关键视频是否存在

### 单文件版本

```bash
python3 tools/build_game3.py
```

输出 `rrootage3.html`，用于本地调试或离线分发。

`rrootage3.html`、`dist/` 均为构建产物，不提交到 Git。

## 目录结构

```text
src/
  core/        固定步长、数学、碰撞
  content/     敌机、关卡波次、Boss 数据
  render/      玩家、敌机、子弹、Boss、背景、UI、特效、武器
  game/        Boss 技能、敌机系统、玩家武器/状态、战斗、关卡流程、step
  platform/    平台契约 + Web 输入/音频/视频适配
  legacy/      组合根与兼容层
  modules.json 模块顺序清单

assets/        运行时资源
gpt-assets/    源美术
tools/         构建、优化、校验、快照脚本
tests/         Node 单元测试
docs/          架构、迁移、部署、交接文档
```

详细设计见 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)。  
当前交接状态见 [`docs/HANDOFF.md`](docs/HANDOFF.md)。

## 模块化说明

当前是 **Phase 2 文件级模块化**：

- 模块通过 `src/modules.json` 顺序组装进同一个 Web 闭包
- 还没有切换成 ES Module 运行时
- 这样可以在不破坏玩法的前提下持续抽取
- 新逻辑不要继续写进 `src/legacy/game.js`

后续 Phase 3 会把 `World / Projectiles / Ports` 显式注入，去掉对全局 `boss / player / enemies / ebullets` 的依赖。

## 测试与校验

```bash
python3 tools/check_structure.py
node tools/validate_content.mjs
node tests/fixed-step.test.mjs
node tests/math.test.mjs
node tests/collision.test.mjs
```

CI 在 `.github/workflows/ci.yml`，会执行：

- `src/` 下所有 JS 模块语法检查
- 模块结构与目录边界检查
- 五关波次和敌机/Boss 内容校验
- 固定步长、数学、碰撞单元测试

## 操作

- 按住屏幕拖动：机体跟随手指上方
- 自动开火
- 点击 BOMB 按钮：炸弹
- 双击屏幕：炸弹快捷操作

拾取物：

- `P`：提升武器等级
- `A`：切换武器
- `S / L / M`：切到对应武器
- `W`：增加/升级僚机
- `B`：炸弹 +1
- `1UP`：生命 +1

## 部署

### EdgeOne Makers

项目包含 `edgeone.json`：

```json
{
  "buildCommand": "bash tools/build_pages.sh",
  "outputDirectory": "./dist"
}
```

导入 `StyxYao/stellar-assault`，分支 `main`，根目录留空，输出目录 `./dist`。

部署后访问：

```text
https://你的域名/build.txt
```

应与仓库最新 commit 一致。若页面仍是旧版本，先看 EdgeOne 部署记录和构建日志，不要先怀疑 CDN。

### Cloudflare Workers

`wrangler.jsonc` 使用 `src/worker.js` 作为静态资源入口：

```bash
npx wrangler deploy
```

注意 Cloudflare Workers 静态资源单文件上限为 5MB。当前视频中背景视频和部分长 BGM 需要压缩后才能放入。

### Cloudflare Pages

如果使用 Pages：

- 生产分支：`main`
- 根目录：留空
- 构建命令：`bash tools/build_pages.sh`
- 输出目录：`dist`

### 国内交付

背景、音频、视频等大资源可按 [`docs/ROADMAP.md`](docs/ROADMAP.md) 规划放对象存储或子包，详见 [`docs/EDGEONE.md`](docs/EDGEONE.md)。

## 回滚与迁移记录

每一步重构都有独立 commit、annotated tag、迁移日志和本地快照。

```bash
cat docs/MIGRATION_LOG.md
```

查看某一步：

```bash
git show step/phase6j-step
```

恢复到最终模块化基线：

```bash
git switch -c recover/modular-foundation checkpoint/modular-foundation
```

本地快照：

```bash
bash tools/make_snapshot.sh before-change
```

生成 `.backups/*.tar.gz` 和完整 Git bundle，`.backups/` 已被 Git 忽略。

## 版本与变更

- [`CHANGELOG.md`](CHANGELOG.md)
- 当前模块化基线：`0.3.0`
- 每个抽取步骤的 tag 见 [`docs/MIGRATION_LOG.md`](docs/MIGRATION_LOG.md)

## 平台路线

- **Web**：当前可玩
- **Steam**：Electron/Tauri + Steamworks，离线资源、成就、云存档、Steam Deck
- **微信小游戏**：Canvas/音频/输入/存储适配，替换 DOM 视频，处理主包/分包体积

## 许可

代码和原创美术默认保留所有权利，除非后续单独添加许可证。

第三方素材、引擎和工具记录在 [`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md)。
