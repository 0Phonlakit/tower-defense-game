# Rogue Tower Defense

A roguelike tower defense game that runs in the browser. It is written in plain JavaScript (HTML5 Canvas), with nothing to install and no build step.

Enemies walk along a path toward your base, and you build towers to stop them. The base has 20 HP. When it reaches 0 the run ends (Game Over), and you earn Coins based on how many waves you cleared. Spend them on permanent upgrades before starting the next run.

## How to play

Open `index.html` in a browser (double-click it, or drag it into a browser window).

Progress (Coins, upgrades, unlocked towers) is saved in the browser's `localStorage`. Clearing site data or playing in a private window loses your save.

### Controls

| Input | Action |
|---|---|
| `1` – `4` | Select a tower to build (press again to cancel) |
| Left click | Place a tower / select a built tower |
| Right click, `Esc` | Cancel placement / selection |
| `Space` | Start the next wave |
| `U` | Upgrade the selected tower |

The right-hand panel has x1/x2/x3 speed buttons and an "auto-start waves" option.

## Rules

- **Base**: has 20 HP. Each enemy that reaches it removes HP depending on its type. 0 HP = Game Over.
- **Gold** (per run): earned by killing enemies and from end-of-wave bonuses. Spend it to build and upgrade towers (max Lv.4). Selling a tower refunds 70%.
- **Perks**: after each wave, pick 1 of 3 random perks. They last for the current run only.
- **Coins** (permanent): awarded at Game Over based on waves cleared:

  `coin = wave × 5 + wave² ÷ 2` → 5 waves gives 37, 10 waves gives 100, 20 waves gives 300

### Enemies

| Type | Base damage | Notes |
|---|---|---|
| Normal | -1 | Standard |
| Fast | -1 | Low HP, fast (from wave 3) |
| Armored | -2 | High HP, slow (from wave 5) |
| Boss | -5 | Every 10 waves |

Enemy HP grows every wave; see `Enemy.hpMultiplier()`.

### Towers

| Tower | Cost | Unlock | Strength |
|---|---|---|---|
| Machine gun | 50 | Available from the start | Fast fire, single target |
| Cannon | 90 | 60 coins | Area splash damage |
| Frost | 70 | 50 coins | Slows enemies |
| Sniper | 120 | 100 coins | Long range, high damage |

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
│   │   ├── config.js     Constants: map, towers, enemies, permanent upgrades
│   │   ├── utils.js      createRng (seeded random), pickRandom
│   │   ├── path.js       class Path        Enemy walking path
│   │   ├── enemy.js      class Enemy       Movement, HP, slow effects
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

- **`Game`** is one run. It moves through phases: `build` → `wave` → `perk` → `build` … → `over`
  - Player commands: `buildTower`, `upgradeTower`, `sellTower`, `startWave`, `choosePerk`
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

Tests cover `src/core/` only (path, enemies, towers, projectiles, waves, perks, saving, and the `Game` flow, e.g. a normal enemy reaching the base removes 1 HP, and 0 HP triggers Game Over and pays out Coins). `src/ui/` has no unit tests.

## Balancing

| To change | Edit |
|---|---|
| Tower/enemy stats, costs | `src/core/config.js` |
| How fast enemy HP grows | `Enemy.hpMultiplier()` in `src/core/enemy.js` |
| Enemies per wave, end-of-wave bonus | `src/core/wave.js` |
| Coin formula | `MetaProgress.coinsForWaves()` in `src/core/meta.js` |
| Perks | `PERKS` in `src/core/perks.js` |

After changing any formula, run `npm test` and update the expected values in the tests to match.
