# R3.1 — LAN Co-op

状态：**可用原型**  
范围：同一局域网，Host + 1 个远程 P2  
实现：WebSocket 房间码 + Host canvas JPEG 流 + 客户端输入上行

---

## 启动

在仓库根目录：

```bash
python3 tools/lan_server.py
```

默认：

```text
HTTP  http://0.0.0.0:8785
WS    ws://0.0.0.0:8786
```

如果 8785 已被现有预览服务占用，可换端口：

```bash
python3 tools/lan_server.py 8790 8791
```

此时 Host 和 Client 地址都要加：

```text
?wsport=8791
```

---

## 使用

### 模式 A：Host 自己当 P1

1. 两台设备连接同一局域网
2. Host 打开：

```text
http://<host-ip>:8785/index.html
```

3. 点击右上角 **LAN**，或按 **L**
4. **CREATE HOST-AS-P1 ROOM**
5. 把房间码或 **COPY CLIENT LINK** 发给 P2
6. 等 Client 加入后点击 **START LAN RUN**

Host 控制 P1；P2 是远程玩家。

### 模式 B：Host 只建房间，P1/P2 分别加入

1. Host 打开同一页面
2. 点击 **LAN**
3. **CREATE 2P ROOM (HOST ONLY)**
4. 复制 **COPY CLIENT LINK**，分别发给 P1 和 P2
5. 第一个加入的是 P1，第二个加入的是 P2
6. 两个槽位都 CONNECTED 后点 **START LAN RUN**

Host 只做权威模拟和画面转发，不控制玩家。

### 邀请链接

Host 建房后自动生成：

```text
…/index.html?lanclient=1&lanjoin=<房间码>
```

客户端打开链接会自动填码并加入，无需手动输入。

### Client

1. 打开：

```text
http://<host-ip>:8785/index.html?lanclient=1
```

2. 输入 4 位房间码
3. 也可直接打开 Host 发的 `lanjoin` 邀请链接自动加入
4. 画面出现后：

```text
I/J/K/L  移动 P2
U        主技能 / 炸弹
O        副技能（AEGIS Force）
```

---

## 当前实现边界

- Host 发送的是 canvas JPEG 流，不是状态同步
- 画面约 30fps，输入约 40Hz
- Client 有 Host PCM 音频
- 客户端 P1/P2 均可独立选机体/变体，自动避开同变体
- 模式 A 只支持 1 个远程 P2；模式 B 支持 P1+P2 分别加入
- 画面是 canvas JPEG 流，不是状态同步
- 无重连、无 NAT 穿透、无公网
- Host 关闭或掉线后 Client 需要重新加入
- 仅局域网 HTTP，不适用 EdgeOne/公网 HTTPS

## 端口/防火墙

需要放行：

```text
8785/tcp  HTTP
8786/tcp  WebSocket
```

或使用自定义端口并在两个 URL 加 `?wsport=`。

---

## 为什么先做画面流

R3.1 的目标是先验证：

- 房间码加入
- Host/Client 生命周期
- 远程输入
- 两台设备同局

状态同步/回滚适合在 R3.2 在线阶段再做。LAN 画面流可先用于真机验证和输入延迟评估。

---

## 验收

- [x] Host 创建 4 位房间
- [x] Client 输入房间码加入
- [x] Host 开始游戏
- [x] Client 收到画面
- [x] Client IJKL 控制 P2
- [x] Client U 触发 P2 炸弹
- [x] 无控制台报错
- [ ] 两台物理设备实测
- [ ] 丢包/断线恢复
- [ ] Client 音频
- [ ] 客户端 P1/P2 独立选机体
- [ ] P2/P1 客户端音频
