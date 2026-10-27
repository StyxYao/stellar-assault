# R7 — Rank / Medal / Score

状态：**本地版已实现**

## Rank

0–5，按本局 Score 计算，并在通关/失败时结算：

| Score | Rank | Medal |
|---:|---:|---|
| <3000 | 0 | E |
| 3000 | 1 | D |
| 8000 | 2 | C |
| 15000 | 3 | B |
| 25000 | 4 | A |
| 40000 | 5 | S |

额外规则：

- 通关至少 Rank 2
- 通关且剩余 2 条以上生命，Rank +1（最高 5）
- 第一关失败 Rank -1

## 本地榜

`SaveStore.campaign.topRuns` 保留最高 5 局：

```text
score / stage / won / rank / medal / timestamp
```

结算页显示：

```text
RANK 3 · MEDAL B
LOCAL TOP 3
```

## Chain

1.0 不实现独立 Chain 系统；Rank/Medal 已覆盖 1.0 结算需求。Chain 作为 1.1 扩展。

## 验收

- [x] Rank 0–5
- [x] Medal E–S
- [x] 通关/失败都写结算
- [x] 本地最高 5 局
- [x] 存档归一化保留 rank/topRuns
- [ ] 双人/LAN 结算一致性实机
