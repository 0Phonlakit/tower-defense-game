# Rogue Tower Defense

A roguelike tower defense game that runs in the browser. It is written in plain JavaScript (HTML5 Canvas), with nothing to install and no build step.

Enemies walk along a path toward your base, and you build towers to stop them. The base has 20 HP. When it reaches 0 the run ends (Game Over), and you earn Coins based on how many waves you cleared. Spend them on permanent upgrades before starting the next run.

## How to play

Open `index.html` in a browser (double-click it, or drag it into a browser window).

Progress (Coins, upgrades, unlocked towers) is saved in the browser's `localStorage`. Clearing site data or playing in a private window loses your save.

### Controls

| Input | Action |
|---|---|
| `1` – `8` | Select a tower to build (press again to cancel) |
| Left click | Place a tower / select a built tower |
| Right click, `Esc` | Cancel placement / selection |
| `Space` | Start wave 1 / skip the countdown to the next wave |
| `U` | Upgrade the selected tower |

The right-hand panel has x1/x2/x3 speed buttons.

## Rules

- **Base**: has 20 HP. Each enemy that reaches it removes HP depending on its type. 0 HP = Game Over.
- **Gold** (per run): earned by killing enemies and from end-of-wave bonuses. Spend it to build and upgrade towers (max Lv.4). Selling a tower refunds 70%.
- **Wave countdown**: once the last enemy of a wave has spawned, a 30-second countdown starts. Press Skip (or `Space`) to start the next wave early and get bonus gold: the full clear bonus with 30s left, scaling down to 0 as the timer runs out. When it reaches 0 the next wave starts automatically with no bonus. Waves can overlap; each wave still pays its clear bonus when all of its own enemies are gone.
- **Perks**: after each wave is cleared, pick 1 of 3 random perks. They last for the current run only.
- **Coins** (permanent): awarded at Game Over based on waves cleared:

  `coin = wave × 5 + wave² ÷ 3` → 5 waves gives 33, 10 waves gives 83, 20 waves gives 233

### Enemies

| Type | Base damage | Notes |
|---|---|---|
| Normal | -1 | Standard |
| Fast | -1 | Low HP, fast (from wave 3) |
| Armored | -2 | High HP, slow (from wave 5) |
| Boss | -5 | Every 10 waves |

Enemy HP grows every wave; see `Enemy.hpMultiplier()`.

### Towers

| Tower | Element | Cost | Unlock | Strength |
|---|---|---|---|---|
| Machine gun | – | 50 | Available from the start | Fast fire, single target |
| Cannon | – | 90 | 60 coins | Area splash damage |
| Frost | Ice | 70 | 50 coins | Slows enemies |
| Sniper | – | 120 | 100 coins | Long range, high damage |
| Flame | Fire | 80 | 80 coins | Sets enemies on fire (damage over 3s) |
| Tesla | Lightning | 100 | 120 coins | Instant zap that chains to 2 more enemies (70% per jump) |
| Tide | Water | 60 | 70 coins | Cheap splash that sets up reactions |
| Poison | – | 90 | 90 coins | Poison stacks up to 5 times (4s), strong vs tanks and bosses |

Burn and poison damage scale with tower level and damage bonuses, like normal hits.

### Elemental reactions

An elemental hit marks the enemy with that element for 3 seconds (the small colored dot on the enemy). Hitting it with a **different** element triggers a reaction and clears the mark. The same element just refreshes it. Physical towers never trigger reactions.

| Elements | Reaction | Effect |
|---|---|---|
| Fire + Ice | Melt | That hit does x2 damage |
| Fire + Water | Vaporize | That hit does x1.5 damage |
| Fire + Lightning | Overload | Explosion (radius 60) hits every nearby enemy for 1.5x the hit |
| Ice + Water | Freeze | Enemy stops for 1.5s (bosses 0.5s) |
| Ice + Lightning | Superconduct | Enemy takes +25% damage for 4s |
| Water + Lightning | Electro-charged | Shocks up to 3 nearby enemies for 50% of the hit |

### Permanent upgrades (bought with Coins)

Damage, fire rate, range, starting gold, gold per enemy, critical hit chance

## Project structure

```
tower-defense/
├── index.html            Game page; loads scripts in order
├── style.css
├── package.json          Only a test script (no dependencies)
├── src/
│   ├── core/             Game logic, no DOM access — testable in Node
│   │   ├── config.js     Constants: map, towers, enemies, permanent upgrades, elements/reactions
│   │   ├── utils.js      createRng (seeded random), pickRandom
│   │   ├── path.js       class Path        Enemy walking path
│   │   ├── enemy.js      class Enemy       Movement, HP, slow/freeze, aura, burn/poison
│   │   ├── tower.js      class Tower       Stats, targeting, upgrade/sell
│   │   ├── projectile.js class Projectile  Homing projectiles
│   │   ├── wave.js       class WaveGenerator  Composition of each wave
│   │   ├── perks.js      PERKS, class PerkPicker
│   │   ├── meta.js       class MetaProgress   Coins/permanent upgrades + saving
│   │   └── game.js       class Game        One run (state machine)
│   ├── ui/
│   │   ├── renderer.js   class Renderer    Draws to the canvas (read-only)
│   │   └── app.js        class App         DOM, input, overlays, game loop
│   └── main.js           Entry point
└── tests/                Unit tests (node:test)
```

### Architecture

- **`Game`** is one run. It moves through phases: `build` (before wave 1) → `wave` → `perk` → `wave` … → `over`
  - Player commands: `buildTower`, `upgradeTower`, `sellTower`, `startWave`, `skipCountdown`, `choosePerk`
  - Advancing time: `update(dt)`
  - Events via `on(name, fn)`: `wavestart`, `wavecleared`, `perkchosen`, `gameover`
- **`MetaProgress`** keeps progress across runs. It takes a `storage` object with `getItem`/`setItem` (`localStorage` in the browser, a fake in tests).
- **`App`** creates a new `Game` for every run, listens to its events to show overlays, and forwards UI commands to the `Game`.
- **`Renderer`** draws the `Game` state without changing it.
- `Game` accepts an injected `rng`, so tests use `createRng(seed)` for repeatable results.

Files in `src/core/` use the UMD pattern: in the browser they attach their classes to `window.TD`, and in Node they work with `require()`. That lets you open `index.html` straight from `file://` without a server (ES modules don't work over `file://`).

## Running tests

Requires Node.js 20 or later. No `npm install` needed.

```bash
npm test
```

Tests cover `src/core/` only (path, enemies, towers, projectiles, waves, perks, saving, elemental reactions, burn/poison, Tesla chains, and the `Game` flow, e.g. a normal enemy reaching the base removes 1 HP, and 0 HP triggers Game Over and pays out Coins). `src/ui/` has no unit tests.

## Balancing

| To change | Edit |
|---|---|
| Tower/enemy stats, costs | `src/core/config.js` |
| Reactions, aura/burn/poison durations | `REACTIONS` and the constants above it in `src/core/config.js` |
| How fast enemy HP grows | `Enemy.hpMultiplier()` in `src/core/enemy.js` |
| Enemies per wave, end-of-wave bonus | `src/core/wave.js` |
| Countdown length | `WAVE_COUNTDOWN` in `src/core/config.js` |
| Skip bonus | `Game.skipBonus` in `src/core/game.js` |
| Coin formula | `MetaProgress.coinsForWaves()` in `src/core/meta.js` |
| Perks | `PERKS` in `src/core/perks.js` |

After changing any formula, run `npm test` and update the expected values in the tests to match.
