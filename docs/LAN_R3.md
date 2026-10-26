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

### Host

1. 两台设备连接同一局域网
2. Host 打开：

```text
http://<host-ip>:8785/index.html
```

3. 点击右上角 **LAN**，或按 **L**
4. **CREATE ROOM**
5. 记下 4 位房间码
6. 等 Client 加入后点击 **START LAN RUN**

Host 控制 P1；P2 是远程玩家。

### Client

1. 打开：

```text
http://<host-ip>:8785/index.html?lanclient=1
```

2. 输入 4 位房间码
3. **JOIN**
4. 画面出现后：

```text
I/J/K/L  移动 P2
U        主技能 / 炸弹
O        副技能（AEGIS Force）
```

---

## 当前实现边界

- Host 发送的是 canvas JPEG 流，不是状态同步
- 帧率约 18fps，输入约 25Hz
- Client 无音频
- P2 当前固定 VECTOR
- 只支持 1 个远程 P2
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
- [ ] P2 完整机体/变体选择
