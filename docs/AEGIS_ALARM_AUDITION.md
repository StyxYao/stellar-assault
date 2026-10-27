# AEGIS Break Alarm — Audition

候选文件：

```text
assets/audio/aegis-break-1-pulse.mp3
assets/audio/aegis-break-2-chime.mp3
assets/audio/aegis-break-3-digital.mp3
assets/audio/aegis-break-4-impact.mp3
```

试听页：

```text
aegis-alarm-audition.html
```

选择 1–4 后，将把 `aegisShieldBreak()` 里的 `sfx('alarm')` 替换为对应样本。

## Set 2

更完整的 6 个候选：

```text
5  CRYSTAL SHATTER  玻璃/FM 碎裂
6  SOFT SIREN       双声部下滑
7  SONAR            三声纳回声
8  COLLAPSE         低频坍塌 + 金属余响
9  ARC FAILURE      电弧故障
10 LOW HORN         低音号角
```

试听：

```text
aegis-alarm-audition-2.html
```

## Set 3 — fault / warning

```text
11 FAULT HYBRID    5+6 分层 + 电弧尾音
12 POWER FAULT     电容下滑 + 断续电弧 + ping
13 GLITCH SIREN    断音故障警报
14 LOW ENERGY      低电量脉冲 + 渐高三声
15 RELAY FAIL      继电器连击 + 警告钟
16 REACTOR STALL   反应堆降速 + 低音警报
```

试听：

```text
aegis-alarm-audition-3.html
```


## Set 4 — energy blast (break, not alarm)

```text
17 PLASMA BURST        等离子爆炸
18 ARC DETONATION      电弧引爆
19 SHIELD NOVA         护盾新星
20 REACTOR RUPTURE     反应堆爆裂
21 ION BURST           离子爆点
22 CORE COLLAPSE       核心内爆
```

试听：

```text
aegis-blast-audition.html
```


## Selected

Selected by user: `1 PULSE + 22 CORE COLLAPSE`.

File:

```text
assets/audio/aegis-break-mix-1-22.mp3
```

Wired to `aegisShieldBreak()` through `playAegisBreak()`.
