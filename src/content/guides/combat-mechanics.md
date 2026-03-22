# Sangokushi Taisen Ten - Combat Mechanics

> **Reference Guide:** This document contains formulas and tables for advanced play.
> For basic concepts, see [Beginner's Guide](/guides/beginners).

---

## Quick Reference

### Key Formulas

| Mechanic | Formula |
|----------|---------|
| Melee/Bow Damage | POW difference only, min damage at -8 diff |
| Charge Damage | 19 + (POW x 2) - Enemy POW |
| Counter Damage | 40 + (POW x 2) - Enemy POW |
| Double Counter | 80 + (POW x 2) - Enemy POW |
| Fire/Water Damage | 50 x (INT / Target INT) x 0.8~1.2 |
| Lightning Damage | 25 x (INT / Target INT) x Bolts x 0.9~1.1 |
| Debuff Duration | Base / (1 + Factor x Enemy INT) |

### Speed Thresholds

| Threshold | Effect |
|-----------|--------|
| 1.0+ | Cavalry can build charge flash |
| 1.3+ | Triggers Counter (or charging cavalry) |
| 2.0+ | Triggers Double Counter |

### Unit Base Speeds

| Unit | Base | Max |
|------|------|-----|
| Horse | 1.1 (1.32 charging) | 3.3 |
| Sword | 0.9 | 2.7 |
| Bow | 0.8 (0.96 Run Shot) | 2.4 |
| Spear | 0.7 | 2.1 |
| Ram | 0.5 | 2.0 |

### Debuff Dependency Factors

| Level | Factor | INT 10 Duration |
|-------|--------|-----------------|
| High | 0.5 | 1/6 of base |
| Med-High | 0.33 | 1/4.3 of base |
| Medium | 0.2 | 1/3 of base |
| Low | 0.1 | 1/2 of base |

---

## Overview

Combat in Sangokushi Taisen Ten is based on **power difference** rather than absolute power values. This is a crucial insight that contradicts the common belief that combat scales with squared values.

**Key Principle:** A POW 1 vs POW 5 fight produces the same result as POW 11 vs POW 15 — both have a power difference of 4, so the higher-powered unit wins with approximately 75% HP remaining.

This applies to all melee combat. The exceptions are **Charge** and **Counter** attacks, which include a damage bonus that scales with the attacker's own power.

---

## Time Units

All durations in this guide use **Counts (C)**, the game's time unit.

- 1C = ~2.4 seconds
- A full match is 99C (~4 minutes)

---

## Unit HP

All units start battle with **100 HP** (displayed as a full HP bar). When HP reaches 0, the unit dies and must revive at the castle.

- HP recovers while inside your castle
- Maximum HP is normally 100
- Some skills can temporarily raise HP above 100 (up to 200)
- HP has **no effect** on damage dealt, damage received, skill effects, duel outcomes, or siege damage

---

## Melee Combat

### Power Difference System

In standard melee combat, damage dealt depends entirely on the difference between your POW and the enemy's POW:

- Same POW = roughly equal damage exchange
- Higher POW = deals more damage, takes less damage
- The actual POW values don't matter, only the difference

This means low-cost units fighting each other (POW 3 vs POW 5) perform identically to high-cost units (POW 13 vs POW 15) in terms of HP remaining after combat.

### The +8 Disadvantage Cap

When you're **weaker** than your target, damage scaling stops at **8 POW below**. You always deal at least minimum damage, but it won't get any worse beyond -8.

| Your Disadvantage | Effect |
|-------------------|--------|
| 0 to -7 POW | Damage scales normally |
| -8 or worse | Damage locked at minimum (won't decrease further) |

**Example:** A POW 1 unit deals the same (tiny) damage to a POW 9 enemy as to a POW 30 enemy — both are beyond the -8 cap.

**This is NOT symmetric.** When you're stronger, there's no mentioned cap — a POW 30 unit hitting a POW 1 enemy deals full difference-based damage.

This cap applies to all standard combat (melee and bow). Charge and Counter attacks have their own formulas.

### Damage Variance

All damage calculations include random variance. Tables and formulas show average values, but actual damage fluctuates slightly with each hit.

---

## Unit Type Advantages

Unlike traditional rock-paper-scissors systems, Sangokushi Taisen doesn't use flat damage multipliers between unit types. Instead, each unit has **special abilities** that create tactical advantages:

| Matchup | Advantage | Why |
|---------|-----------|-----|
| **Spear vs Horse** | Spear wins | Counter deals massive damage to charging/fast cavalry |
| **Horse vs Bow** | Horse wins | Charging cavalry are nearly immune to bow damage |
| **Bow vs Spear** | Bow wins | Range advantage; bows can kite slow spears |

### Key Interactions

- **Spear Counter**: The primary anti-cavalry mechanic. A single Counter can deal 40-80+ damage.
- **Charge Immunity**: Charging cavalry have a defensive aura that drastically reduces bow damage.
- **Speed vs Range**: Spears are the slowest unit (0.7 base), making them easy targets for bows at range.
- **Sword (Infantry)**: No special advantages or disadvantages — balanced stats, no special attacks.
- **Ram (Siege)**: Extremely slow (0.5), but deals ~3x the siege damage of other units.

These interactions mean positioning and timing matter more than simple type matchups.

---

## Charge Attacks

Cavalry can build a charge flash by running at speed 1.0 or higher. When the flash-charged cavalry contacts an enemy, a Charge attack triggers, dealing heavy damage.

### Charge Formula

```
Charge Damage = 19 + (Cavalry POW × 2) - Enemy POW
```

This can also be expressed as:
```
Charge Damage = 20 + ((Cavalry POW - 1) × 2) - (Enemy POW - 1)
```

### Charge Damage Examples

| Cavalry POW | Enemy POW | Damage |
|-------------|-----------|--------|
| 1 | 1 | 20 |
| 5 | 1 | 28 |
| 11 | 1 | 40 |
| 11 | 11 | 30 |
| 1 | 11 | 10 |

**Key Insight:** Unlike melee combat, Charge damage includes a `Cavalry POW × 2` bonus. This means higher-power cavalry deal proportionally more charge damage, not just difference-based damage.

### Charge Defensive Bonus

While a unit has its charge flash active:
- It takes **reduced contact damage** from enemies
- The exact defensive multiplier is not fully documented
- Charging into another charging cavalry deals reduced damage due to their defensive bonus

### Flash Mechanics

- Flash builds when moving at speed 1.0+
- Flash disappears if speed drops below 1.0
- Entering melee cancels flash
- Flash is visual confirmation that Charge is ready

---

## Counter Attacks

Spear units have a passive frontal spear aura (Thrust). When fast-moving enemies contact this aura, they trigger a Counter for massive damage.

### Counter Conditions

A Counter triggers when the target:
1. Is a **charging cavalry** (has flash), OR
2. Has **movement speed ≥ 1.3**

The Counter must hit from the target's **front 180°**. Hitting from behind or the sides does NOT trigger a Counter — the unit just takes normal Thrust damage.

### Counter Formula

```
Normal Counter = 40 + (Spear POW × 2) - Enemy POW
Double Counter = 80 + (Spear POW × 2) - Enemy POW
```

### Double Counter

When the target's speed is **2.0 or higher**, a Double Counter triggers instead, with base damage increased from 40 to 80.

### Counter Damage Examples

| Spear POW | Enemy POW | Normal | Double |
|-----------|-----------|--------|--------|
| 1 | 1 | 41 | 81 |
| 1 | 30 | 12 | 52 |
| 20 | 1 | 79 | 119 |
| 10 | 10 | 50 | 90 |

**Takeaway:** Even low-POW spears can devastate high-speed enemies. A POW 1 spear Counter deals 41 damage to a POW 1 target — nearly half their HP.

---

## Bow Damage

Bow attacks use the same power-difference system as melee combat. Despite the common perception that bows are "strong" in this game, bow damage is NOT enhanced — it's identical to melee damage per hit.

The perceived strength comes from:
- Automatic targeting (no manual aiming needed)
- Attacking while moving (Run Shot)
- Safe damage from range

### Time to Kill Table

How long it takes for a bow unit to kill an enemy of various power differences:

| Enemy POW Diff | Time to Kill |
|----------------|--------------|
| Same | 9.5C |
| +1 | 10.5C |
| +2 | 12C |
| +3 | 14.5C |
| +4 | 17.5C |
| +5 | 21.5C |
| +6 | 27C |
| +7 | 42.5C |
| +8+ | 65C (minimum) |

### Notes

- **-8 cap applies here too** — See [The +8 Disadvantage Cap](#the-8-disadvantage-cap). When 8+ POW weaker, time-to-kill maxes out at 65C.
- **High-POW bows matter** — Low-POW bows become nearly useless against buffed enemies due to the cap.
- **Charging cavalry resist bows** — The charge flash grants defensive bonuses, reducing bow effectiveness further.
- **No offensive scaling** — Unlike Charge/Counter, bows don't get a power-based damage bonus.
- **Wild Shots (SR Xiahou Yuan)** — Doubles bow damage, but still hits the cap against +8 enemies. Against POW 19+ targets, 6C of doubled shots only deals ~20% HP.

---

## Speed Mechanics

Speed determines movement rate, Counter eligibility, and which attacks can be performed.

### Base Speeds by Unit Type

| Unit | Base Speed | Special State | Max Speed |
|------|------------|---------------|-----------|
| Horse | 1.1 | 1.32 (charging) | 3.3 |
| Sword | 0.9 | — | 2.7 |
| Bow | 0.8 | 0.96 (Run Shot) | 2.4 |
| Spear | 0.7 | — | 2.1 |
| Ram | 0.5 | — | 2.0 |

### Speed Multiplier Tiers

Speed-boosting skills come in fixed multiplier tiers:

| Multiplier | Available To | Double Counter? |
|------------|--------------|-----------------|
| 4x | Ram only | Yes |
| 3x | Horse, Ram | Yes |
| 2.5x | All units | Yes |
| 2x | All units | Horse yes, others no |
| 1.8x | All units | Horse yes, others no |
| 1.5x | All units | Horse yes (regular) |

### Speed Thresholds

| Threshold | Effect |
|-----------|--------|
| 1.0+ | Cavalry can build charge flash |
| 1.3+ | Triggers Counter (or charging cavalry) |
| 2.0+ | Triggers Double Counter |

### Speed Stacking

Multiple speed buffs **multiply** together:
```
1.8x × 1.5x = 2.7x speed
```

### Counter Eligibility Table

Which unit states trigger Counter at each speed multiplier:

| Unit State | 1x | 1.5x | 1.8x | 2x | 2.5x | 3x | 4x |
|------------|:--:|:----:|:----:|:--:|:----:|:--:|:--:|
| Charging Horse | x | x | 2x | 2x | 2x | 2x | - |
| Horse | - | x | x | 2x | 2x | 2x | - |
| Sword | - | x | x | x | 2x | 2x | - |
| Run Shot Bow | - | x | x | x | 2x | 2x | - |
| Bow | - | - | x | x | 2x | 2x | - |
| Spear | - | - | - | x | x | 2x | - |
| Ram | - | - | - | - | - | x | 2x |

> x = Counter, 2x = Double Counter, - = No Counter or speed not available

### Castle Exit Speed

Units with ANY active speed buff exit the castle in ~1.5C instead of the normal ~2.5C, regardless of the multiplier value.

---

## Speed Boost Skills by Tier

### 4x Speed (Ram Only)

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Yellow Accel | UC Huang Yueying | 4 | Very dangerous on Rams |

### 3x Speed (Horse/Ram)

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Unrivaled | SR Lu Bu | 6 | POW 28, lasts 3.5C |
| Speed Extreme | DS Xiahou Yuan | 5 | Lasts ~5C |
| Reckless Rush | C Niu Jin | 3 | Forced forward movement |
| Lance Tactics | C Chen Lan | 2 | Forced toward enemy castle |

### 2.5x Speed

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Take My Horse! | C Cao Ang | 3 | Targets highest-POW ally, user dies |

### 2x Speed

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Speed Tactics | Many | 4 | Duration = INT + 2.5C |
| Speed Order | SR Zhang Liao | 7 | AoE, Horse get speed + POW, others POW only |
| Flash Speed | R Guo Jia | 3 | AoE, 4C duration |
| Stealth Speed | SR Deng Ai | 5 | Grants Stealth, 13.5C duration (longest) |
| Like Chiyou | R Zhang Liao | 5 | POW grows while charging, 12C |
| Silver Lion | SR Ma Chao | 6 | Massive Charge damage bonus |
| Conqueror Fury | SR Sun Ce | 5 | Duration = INT + 3C |
| Heaven Dance | UC Cai Wenji | 5 | Dance, affects all allies on field |
| Mass Produce | Zhang Xun | 4 | Ram only, requires dead Ram |
| One Eye Roar | SR Xiahou Dun | 4 | Requires 3+ enemies in range |
| Changban Roar | DS Zhang Fei | 4 | Requires 3+ enemies in range |

### 1.8x Speed

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| White Horse | UC Gongsun Zan | 4 | AoE, 13C duration, high INT scaling |
| Horse Unity | SR Zhao Yun | 4 | Immune to Counter damage, 9C |
| 8 Trigrams | SR Zhuge Liang | 6 | Only when 2 allies in range |
| I Alone | SR Wei Yan | 4 | Kills other allies in range |
| Flawless | DS Taishi Ci | 6 | INT scaling 1.25 |

### 1.5x Speed

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Tyrant's Path | SR Dong Zhuo | 5 | AoE, damages own castle |
| Fluid Tactics | SR Sima Yi | 6 | Only when allies > enemies in range |
| Unrivaled+ | R Lu Lingqi, DS Lu Lingqi | 5 | Duration = INT + 3C |
| Soaring Time | R Sun Ce | 4 | Duration = INT + 3C |

---

## Damage Tactics

Damage tactics deal direct HP damage to enemies in range. They scale with the user's INT vs target's INT.

### Base Formula

```
Damage = Base × (User INT ÷ Target INT) × Random(0.8~1.2)
```

**Important:** If target INT is 0, damage calculates as if INT is 1 (no infinite damage).

### Fire Tactics (Base: 50)

Primarily Wu faction. Most variety of fire skills.

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Fire Ploy | C Sun Huan, C Zhu Huan | 7 | Wide AoE |
| Chibi Inferno | R Zhou Yu | 7 | Longest range (≈ max bow range) |
| Wu Flames | C Yu Fan | 5 | Focus skill, damage on release |
| Yiling Flames | DS Lu Xun | 7 | Square AoE, INT 6 limits damage |
| Self-Destruct | C Yuan Shu | 3 | User dies, HUGE AoE |

**Not in game:** Flame of Admonition, Final Inferno, Wu Flames (different), Timed Self-Destruct

### Water Tactics (Base: 50)

Primarily Wei faction. All have fixed positioning (no aiming).

| Skill | Lord | MP | Notes |
|-------|------|----|-------|
| Water Bane | UC Zhong Hui, EX Wang Yi, UC Yu Ji | 7 | Forward-facing horizontal |
| Great Flood | UC Xun You, LE Xun You | 7 | Screen-wide horizontal |

**Not in game:** Water Ploy, Outer Moat Flood, Great River Flood

### Lightning Tactics (Base: 25/35)

Primarily Shu faction. Hits random targets in range.

| Skill | Lord | MP | Bolts | Base | Notes |
|-------|------|----|-------|------|-------|
| Lightning | C Xiahou Yueji, R Xu Shu, C Lei Bo | 6 | 3 | 25 | Random targeting |
| Judgment Bolt | DS Guan Yu | 8 | 4 | 25 | Self-centered AoE |
| Guard Thunder | DS Ma Liang | 8 | 5 | 35 | Own territory only |

**Lightning Formula:**
```
Damage = 25 × (User INT ÷ Target INT) × Bolts × Random(0.9~1.1)
```

Lightning has tighter random variance (0.9~1.1) than fire/water (0.8~1.2).

**Not in game:** Destruction Thunder, Small Lightning, 8 Trigrams Ultimate

### Damage Tactic Comparison

| Type | Base | Random Range | Positioning |
|------|------|--------------|-------------|
| Fire | 50 | 0.8~1.2 | Aimable |
| Water | 50 | 0.8~1.2 | Fixed forward |
| Lightning | 25 (35) | 0.9~1.1 | Random in range |

---

## Debuff Duration

Debuff skills last longer against low-INT targets. The game uses four dependency levels.

### Duration Formula by Dependency

| Dependency | Formula | INT 10 vs INT 0 |
|------------|---------|-----------------|
| High | Base ÷ (1 + 0.5 × Enemy INT) | 1/6 duration |
| Medium-High | Base ÷ (1 + 0.33 × Enemy INT) | 1/4.3 duration |
| Medium | Base ÷ (1 + 0.2 × Enemy INT) | 1/3 duration |
| Low | Base ÷ (1 + 0.1 × Enemy INT) | 1/2 duration |

**Example:** Fluid Tactics (Medium-High) against INT 5 UC Guan Yu:
```
25 ÷ (1 + 0.33 × 5) = 25 ÷ 2.67 = 9.375C
```

### High Dependency Debuffs

| Skill | Lord | MP | Base (INT 0) | Effect |
|-------|------|----|--------------|--------|
| Death Ploy | R Jia Xu (Rogue) | 5 | 36C | POW -4, +15s revival on death |
| Divide Ploy | R Jia Xu (Wei) | 6 | 34C | Multi: POW -4, INT -3, SPD ×0.6 |
| | | | | Single: POW -2, INT -1, SPD ×0.8 |
| Weaken Ploy | C Lady Guo, DS Kuai Yue | 4 | 26C | POW -4 |
| Chain Ploy+ | R Pang Tong | 6 | 34C | SPD ×0.2 |
| Chain Ploy | C Man Chong | 5 | 33C | SPD ×0.5 |
| Block Retreat | UC Dong Bai | 2 | 20C | Cannot return to castle |

#### High Dependency Duration Table

| Skill | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|---|---|
| Death Ploy | 36 | 24 | 18 | 14.5 | 12 | 10.5 | 9 | 8 | 7 | 6.5 | 6 |
| Divide Ploy | 34 | 23 | 17 | 13.5 | 11 | 9.5 | 8.5 | 7.5 | 7 | 6 | 5.5 |
| Weaken Ploy | 26 | 17 | 13 | 10.5 | 8.5 | 7.5 | 6.5 | 6 | 5 | 4.5 | 4 |
| Chain Ploy+ | 34 | 23 | 17 | 13.5 | 11 | 9.5 | 8.5 | 7.5 | 7 | 6 | 5.5 |
| Chain Ploy | 33 | 22 | 16.5 | 13 | 11 | 9.5 | 8 | 7 | 6.5 | 6 | 5.5 |
| Block Retreat | 20 | 13.5 | 10 | 8 | 7 | 6 | 5 | 4.5 | 4 | 3.5 | 3 |

### Medium-High Dependency Debuffs

| Skill | Lord | MP | Base | Effect |
|-------|------|----|------|--------|
| Fluid Tactics | SR Sima Yi | 6 | 25C | Dispels buffs, POW -3 |

#### Medium-High Duration Table

| Skill | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|---|---|
| Fluid Tactics | 25 | 19 | 15 | 12.5 | 11 | 9.5 | 8.5 | 7.5 | 7 | 6 | 6 |

### Medium Dependency Debuffs

| Skill | Lord | MP | Base | Effect |
|-------|------|----|------|--------|
| Provoke | R Zhang Fei (INT 2) | 3 | 3.5C | Forces movement toward caster |
| Provoke | R Jiang Wei, R Ma Su, DS Diao Chan (INT 7) | 3 | 6C | Forces movement toward caster |
| Provoke | SR Jiang Wei (INT 8) | 3 | 6C | Forces movement toward caster |
| Guide to Shu | C Zhang Song (INT 7) | 3 | 6C | Forces movement toward caster |

#### Medium Duration Table

| User INT | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|----------|---|---|---|---|---|---|---|---|---|---|---|
| INT 2 | 3.5 | 3 | 3 | 2.5 | 2 | 2 | 2 | 2 | 1.5 | 1.5 | 1 |
| INT 7 | 6 | 5 | 4.5 | 4 | 3.5 | 3 | 3 | 2.5 | 2.5 | 2 | 2 |
| INT 8 | 6 | 5.5 | 5 | 4 | 4 | 3.5 | 3 | 3 | 2.5 | 2.5 | 2 |

### Low Dependency Debuffs

| Skill | Lord | MP | Base | Effect |
|-------|------|----|------|--------|
| Fury Payback | SR Wang Yi | 5 | 10.5C | POW -10, SPD ×0.2 |
| Prodigy Purge | DS Jiang Wei | 5 | 11C | POW -10, SPD ×0.2 |
| One Eye Roar | R Xiahou Dun | 4 | 3.5C | Stuns enemies, self POW up |
| Changban Roar | DS Zhang Fei | 4 | 4.5C | Stuns enemies, self POW up |

#### Low Duration Table

| Skill | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-------|---|---|---|---|---|---|---|---|---|---|---|
| Fury Payback | 10.5 | 9.5 | 9 | 8 | 7.5 | 7 | 6.5 | 6 | 6 | 5.5 | 5 |
| Prodigy Purge | 11 | 10 | 9 | 8.5 | 8 | 7.5 | 7 | 6.5 | 6 | 6 | 5.5 |
| One Eye Roar | 3.5 | 3 | 3 | 3 | 2.5 | 2.5 | 2 | 2 | 2 | 2 | 2 |
| Changban Roar | 4.5 | 4 | 3.5 | 3 | 3 | 3 | 2.5 | 2.5 | 2 | 2 | 2 |

### Damage-Over-Time Debuff

| Skill | Lord | MP | Effect |
|-------|------|----|--------|
| Assassin Toxin | UC Li Ru | 4 | HP drains over time, cured by entering castle |

#### Assassin Toxin Table

| Enemy INT | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|-----------|---|---|---|---|---|---|---|---|---|---|---|
| Damage % | 70 | 64 | 58 | 54 | 50 | 47 | 44 | 41 | 39 | 37 | 35 |
| Duration | 11.5 | 10.5 | 9.5 | 9 | 8 | 7.5 | 7 | 6.5 | 6.5 | 6 | 6 |

---

## Duels

When two unit centers touch, a Duel may trigger. Duels are button-mashing minigames where both players compete for "Musou bars."

### Musou Bar Distribution

Based on POW difference, each side receives a mix of:
- **Musou-possible bars** — Can become Musou with correct timing
- **Standard bars** — Cannot become Musou

| Your POW | vs 0 | vs 1 | vs 2 | vs 3 | vs 4 | vs 5 | vs 6 | vs 7 | vs 8 | vs 9 | vs 10 |
|----------|------|------|------|------|------|------|------|------|------|------|-------|
| 1 | 1v1 | 1v2 | 1v2 | 1v3 | 1v3 | 1v3 | 1v4 | 1v4 | 1v4 | 1v5 | — |
| 2 | 2v1 | 2v2 | 1v2 | 2v3 | 1v3 | 1v3 | 2v4 | 1v4 | 1v4 | 2v5 | — |
| 3 | 2v1 | 2v1 | 2v2 | 2v3 | 2v3 | 1v3 | 2v4 | 2v4 | 1v4 | 2v5 | — |
| 4 | 3v1 | 3v2 | 3v2 | 3v3 | 2v3 | 2v3 | 2v4 | 2v4 | 2v4 | 2v5 | — |
| 5 | 3v1 | 3v1 | 3v2 | 3v2 | 3v3 | 2v3 | 3v4 | 2v4 | 2v4 | 3v5 | — |
| 6 | 3v1 | 3v1 | 3v1 | 3v2 | 3v2 | 3v3 | 3v4 | 3v4 | 2v4 | 3v5 | — |
| 7 | 4v1 | 4v2 | 4v2 | 4v2 | 4v3 | 4v3 | 4v4 | 3v4 | 3v4 | 3v5 | — |
| 8 | 4v1 | 4v1 | 4v2 | 4v2 | 4v2 | 4v3 | 4v3 | 4v4 | 3v4 | 4v5 | — |
| 9 | 4v1 | 4v1 | 4v1 | 4v2 | 4v2 | 4v2 | 4v3 | 4v3 | 4v4 | 4v5 | — |
| 10 | 5v1 | 5v2 | 5v2 | 5v2 | 5v3 | 5v3 | 5v3 | 5v4 | 5v4 | 5v5 | — |

> Format: `Your Musou bars` v `Enemy Musou bars` (out of 5 total bars each)

**Example:** Your POW 7 vs Enemy POW 6 (both without Valor):
- You get 4 Musou-possible bars, 1 standard bar
- Enemy gets 3 Musou-possible bars, 2 standard bars

### Valor Trait

Lords with the **Valor** trait convert some of their standard bars into guaranteed Musou bars, improving duel odds beyond what the POW table shows.

---

## Additional References

- [Beginner's Guide](/guides/beginners) — Basic concepts and controls
- [Deck Strategies](/guides/deck-strategies) — Deck building and tactics
- [DUEL Mode Guide](/guides/duel) — DUEL mode progression
- [CONQUEST Guide](/guides/campaign) — Campaign mode walkthrough
