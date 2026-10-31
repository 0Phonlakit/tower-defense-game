# Rogue Tower Defense

A roguelike tower defense game that runs in the browser. It is written in plain JavaScript (HTML5 Canvas), with nothing to install and no build step.

A fantasy tower defense drawn in pixel art: archer towers, catapults and mages against goblins, orcs and dragons. Each run is played on a random map. Enemies walk along several routes toward your base, and you build towers to stop them. The base has 20 HP. When it reaches 0 the run ends (Game Over), and you earn Coins based on how many waves you cleared. Spend them on permanent upgrades before starting the next run.

## How to play

Open `index.html` in a browser (double-click it, or drag it into a browser window).

Every launch starts with a short "Made By 0Phonlakit" splash that fades into the save-slot screen (click or press any key to skip it). Behind the menu screens a silent demo game plays itself on a random map, using its own throwaway progress, so it never touches your save. Menus use a parchment-and-wood look with wooden buttons, and each screen fades in. Titles use the Mitr font from Google Fonts when online and fall back to a system Thai font offline.

The game opens on the save slot screen. There are 3 slots; each keeps its own Coins, permanent upgrades, unlocked towers, best wave and run count. Each card shows that summary (or "empty"), with Play/New and Delete. The last slot played is highlighted. Progress saved before slots existed is moved into slot 1 the first time (the old data is kept as a backup). Settings are shared by all slots.

After picking a slot you get the main menu, which shows the current slot and a "change slot" button:

- **เริ่มเกม (Start)**: starts a run right away on a random map.
- **อัพเกรด (Upgrade)**: spend Coins on permanent upgrades, split into tabs: Attack (damage, fire rate, range, crit), Economy (starting gold, gold per kill) and Tower unlocks. The reset-save button here clears only the current slot.
- **ตั้งค่า (Settings)**: language (ไทย / English / 한국어 / 日本語 / Français — every screen, name and in-game message switches right away, and the choice is saved), resolution (Auto fits the window, or a fixed 960×640 / 1200×800 / 1440×960 board, drawn sharp on high-DPI screens) and three volume sliders: effects, background music, and other sounds (buttons and notifications).
- **คู่มือ (Guide)**: three tabs: towers (each tower's level-1 stats, cost and unlock price), enemies (common enemies plus every map's special units, with flying and resistances) and elemental reactions.
- **ออกจากเกม (Exit)**: tries to close the tab. Browsers only let a page close a tab that a script opened, so if that is blocked you get a goodbye screen; close the tab yourself.

All sounds and the music are generated with the Web Audio API (no sound files). They start after your first click or key press, because browsers block audio before that.

During a run the sidebar shows only three blocks: status (HP, gold, wave, enemies left, map), tower building, and the wave controls. Clicking a built tower opens a small popup next to it with its level and the Upgrade (cost) and Sell (refund) buttons. `Esc` or the ⏸ button pauses the game; the pause screen lists the perks taken this run (4 lines, scroll for more) and has resume, settings, guide (showing this map's special units) and quit to menu. Quitting ends the run like a Game Over, so you still get Coins for the waves you cleared.

Progress (Coins, upgrades, unlocked towers) and settings are saved in the browser's `localStorage`. Clearing site data or playing in a private window loses them.

### Controls

| Input | Action |
|---|---|
| `1` – `8` | Select a tower to build (press again to cancel) |
| Left click | Place a tower / select a built tower |
| Right click | Cancel placement / selection |
| `Esc` | Cancel placement / selection, or pause if nothing is selected |
| `Space` | Start wave 1 / skip the countdown to the next wave |
| `U` | Upgrade the selected tower |

The right-hand panel has x1/x2/x3 speed buttons.

## Rules

- **Maps**: each run picks 1 of 10 maps at random ("Play again" also rolls a new one; the map's 2 special units are listed in the Guide from the pause screen). Every map has its own background and 5 routes from separate spawners to one base. Routes never cross: where two routes meet they join and share the rest of the road to the base. Roads that are not joined keep at least 2 free tiles between them, so there is always room for 2 towers side by side. The board is 24×16 tiles. 2 routes are open at the start, and 1 more opens at waves 10, 20 and 30. Routes that are not open yet are drawn in muted colors with no spawner, and you can't build on them. Where roads meet they are drawn as one connected road.
- **Route tracking**: before wave 1 and during each countdown, red arrows run along the open routes the next wave will use, with one arrow stream per road (routes sharing a road share its arrows). A bar under the board always shows base HP and the current wave, plus how many enemies the next wave has in total while it is previewed. Routes that haven't opened yet show no arrows, even right before they open; from the wave they open on, they are tracked like the others. Each enemy's route is picked at random from the open routes.
- **Base**: has 20 HP. Each enemy that reaches it removes HP depending on its type. 0 HP = Game Over.
- **Gold** (per run): earned by killing enemies and from end-of-wave bonuses. Spend it to build and upgrade towers (max Lv.4). Selling a tower refunds 70%.
- **Wave countdown**: once the last enemy of a wave has spawned, a 30-second countdown starts. Press Skip (or `Space`) to start the next wave early and get bonus gold: the full clear bonus with 30s left, scaling down to 0 as the timer runs out. When it reaches 0 the next wave starts automatically with no bonus. Waves can overlap; each wave still pays its clear bonus when all of its own enemies are gone.
- **Perks**: after each wave is cleared, pick 1 of 3 random perks. They last for the current run only. Taking the same perk again stacks it, up to 10 times per perk (one-time perks like emergency funds count too); at 10 it is no longer offered. Some perks still stop earlier at their own limit (range, crit, splash, slow, build cost, interest). Perk cards show how many you already have, and the pause screen lists each perk once with its count.
- **Coins** (permanent): awarded at Game Over based on waves cleared:

  `coin = wave × 5 + wave² ÷ 3` → 5 waves gives 33, 10 waves gives 83, 20 waves gives 233

### Enemies

| Type | Base damage | Notes |
|---|---|---|
| Goblin (ก็อบลิน) | -1 | Standard |
| Wolf (หมาป่า) | -1 | Low HP, fast (from wave 3) |
| Orc knight (อัศวินออร์ค) | -2 | High HP, slow (from wave 5) |
| Dragon (มังกร, boss) | -5 | Every 10 waves |
| Map units | -3 | 2 per map, from wave 5 (see below) |

Enemy HP grows every wave; see `Enemy.hpMultiplier()`.

### Map units, flyers and resistances

Each map has 2 units that only appear there. From wave 5 they make up 25% of a wave's enemies, rising to 40% by wave 20. Each one takes 3 HP from the base. Unit A is **immune** to one damage type: it takes no damage and gets no burn, slow, poison or element mark from it. Unit B is tough (220 base HP, between a tank and a boss) and takes only **35%** from one damage type, including burn/poison from it.

Damage types: physical (Gun, Cannon, Sniper), poison (Poison), fire, ice, water, lightning (the elemental towers).

| Map | Unit A | Unit B |
|---|---|---|
| Meadow | ✈ Giant bee: immune to poison | Iron beetle: poison 35% |
| Desert | ✈ Fire hawk: immune to fire | Sand worm: fire 35% |
| Snow | ✈ Snow owl: immune to ice | Frost giant: ice 35% |
| Volcano | Lava spirit: immune to fire | Magma golem: fire 35% |
| Swamp | ✈ Giant mosquito: immune to water | Bog croc: water 35% |
| Beach | ✈ Storm gull: immune to lightning | Armored crab: lightning 35% |
| Night | ✈ Vampire bat: immune to poison | Haunted armor: physical 35% |
| Autumn | ✈ Crow: immune to lightning | Treant: water 35% |
| Crystal cave | Crystal golem: immune to lightning | ✈ Crystal moth: ice 35% |
| Ruins | ✈ Gargoyle: physical 50% | Mummy: fire 35% |

✈ = flying. Flyers only spawn while you have at least one **anti-air tower** (Gun, Sniper or Tesla) on the map, checked as each enemy spawns. Without one, each flyer walks in as its ground twin instead: same HP, speed, reward and resistance (Giant bee → Giant ant, Fire hawk → Fire lizard, Snow owl → Snow hare, Giant mosquito → Giant leech, Storm gull → Storm turtle, Vampire bat → Ghoul rat, Crow → Scarecrow, Crystal moth → Crystal grub, Gargoyle → Walking statue). Flyers follow the same routes but only anti-air towers can target them. Splash from Cannon, Frost and Tide doesn't hit them either. Anti-air towers deal x1.15 damage to flyers and x0.8 to ground units.

### Towers

| Tower | Element | Air | Cost | Unlock | Strength |
|---|---|---|---|---|---|
| Archer tower (หอธนู) | – | ✔ | 50 | Available from the start | Fast fire, single target |
| Catapult (เครื่องยิงหิน) | – | | 90 | 60 coins | Area splash damage |
| Frost mage (จอมเวทน้ำแข็ง) | Ice | | 70 | 50 coins | Slows enemies |
| Ballista (หน้าไม้ยักษ์) | – | ✔ | 120 | 100 coins | Long range, high damage |
| Fire mage (จอมเวทไฟ) | Fire | | 80 | 80 coins | Sets enemies on fire (damage over 3s) |
| Storm crystal (คริสตัลพายุ) | Lightning | ✔ | 100 | 120 coins | Instant zap that chains to 2 more enemies (70% per jump) |
| Water shrine (ศาลเจ้าน้ำ) | Water | | 60 | 70 coins | Cheap splash that sets up reactions |
| Alchemist (นักเล่นแร่แปรธาตุ) | – | | 90 | 90 coins | Poison stacks up to 5 times (4s), strong vs tanks and bosses |

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
│   │   ├── config.js     Constants: grid, towers, enemies, permanent upgrades, elements/reactions
│   │   ├── i18n.js       UI text (t) and game-data names (loc); Thai + English built in
│   │   ├── lang-ko.js / lang-ja.js / lang-fr.js   Korean, Japanese and French packs
│   │   ├── utils.js      createRng (seeded random), pickRandom
│   │   ├── path.js       class Path        One enemy route
│   │   ├── maps.js       MAP_DEFS, class GameMap  The 10 maps (themes + 5 routes each), route opening
│   │   ├── enemy.js      class Enemy       Movement, HP, slow/freeze, aura, burn/poison
│   │   ├── tower.js      class Tower       Stats, targeting, upgrade/sell
│   │   ├── projectile.js class Projectile  Homing projectiles
│   │   ├── wave.js       class WaveGenerator  Composition of each wave
│   │   ├── perks.js      PERKS, class PerkPicker
│   │   ├── meta.js       class MetaProgress   Coins/permanent upgrades + saving
│   │   ├── saves.js      class SaveSlots   The 3 save slots (one MetaProgress each)
│   │   ├── settings.js   class Settings    Resolution + volumes, saved separately
│   │   └── game.js       class Game        One run (state machine)
│   ├── ui/
│   │   ├── sprites.js    Pixel-art sprites (enemies, towers, bases, scenery) drawn in code
│   │   ├── renderer.js   class Renderer    Draws to the canvas (read-only)
│   │   ├── audio.js      class SoundSystem Generated effects, music and UI sounds (Web Audio)
│   │   ├── demo.js       class MenuDemo    Self-playing demo game behind the menus
│   │   └── app.js        class App         Menus, DOM, input, overlays, game loop
│   └── main.js           Entry point
└── tests/                Unit tests (node:test)
```

### Architecture

- **`Game`** is one run. It moves through phases: `build` (before wave 1) → `wave` → `perk` → `wave` … → `over`
  - Created with a `GameMap`. Each wave is planned one wave ahead (`nextPlan`: enemy types + route per enemy); `upcoming` exposes that plan for the route preview.
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

Tests cover `src/core/` (including both languages having the same text keys and English names for all game data) and the sprite data, including the 4 looks per tower (road spacing, save slots, perk stacking, path, maps and route opening, map units, ground twins, resistances, anti-air, routes never crossing, next-wave route plans, enemies, towers, projectiles, waves, perks, saving, settings, upgrade tabs, elemental reactions, burn/poison, Tesla chains, sound events, quitting a run, and the `Game` flow, e.g. a normal enemy reaching the base removes 1 HP, and 0 HP triggers Game Over and pays out Coins). `src/ui/` has no unit tests.

## Balancing

| To change | Edit |
|---|---|
| Tower/enemy stats, costs | `src/core/config.js` |
| Reactions, aura/burn/poison durations | `REACTIONS` and the constants above it in `src/core/config.js` |
| How fast enemy HP grows | `Enemy.hpMultiplier()` in `src/core/enemy.js` |
| Enemies per wave, end-of-wave bonus | `src/core/wave.js` |
| Map units, resistances, flyers | `ENEMY_DEFS` (entries with `unique: true`) and `AIR_BONUS`/`AA_GROUND_MULT` in `src/core/config.js`; `uniques` in `MAP_DEFS`; `uniqueShare()` in `src/core/wave.js` |
| Map layouts, themes, when routes open | `LAYOUTS`, `MAP_DEFS`, `START_ROUTES`, `ROUTE_STEP` in `src/core/maps.js` |
| Countdown length | `WAVE_COUNTDOWN` in `src/core/config.js` |
| Skip bonus | `Game.skipBonus` in `src/core/game.js` |
| Coin formula | `MetaProgress.coinsForWaves()` in `src/core/meta.js` |
| Perks | `PERKS` in `src/core/perks.js` |

After changing any formula, run `npm test` and update the expected values in the tests to match.

## Art

Everything is pixel art drawn in code (`src/ui/sprites.js`), with no image files:

- **Enemies** use 12 hand-drawn 12×12 body shapes (goblin, knight, beast, dragon, bird, insect, bat, golem, spirit, crab, serpent, plant), each unit with its own colors. They face the way they walk; flyers bob above a shadow.
- **Towers** (16×16) change look at every level (1–4) instead of showing level bars: each level keeps the shape and adds parts such as gold trim, side turrets, banners, a bigger crystal or orb, sparks and a crown, and level 3–4 towers glow in their color.
- **Bases** (16×16, a different one per map: stone castle, sandstone fort, ice palace, obsidian keep, witch hut, lighthouse, moon tower, tree house, crystal citadel, ancient temple) and **scenery** (8×8) are built from rectangles, triangles and lines, with the outline added automatically.
- **Shots** look different per tower and point the way they fly: arrows, tumbling boulders, ice shards with a sparkle trail, fireballs with embers, water orbs, spinning poison flasks; the ballista leaves a bolt streak and the storm crystal a jagged lightning bolt. Each hit has its own effect too: sparks, dust and debris, frost shards, a fire burst, a water splash, a poison cloud.
- Ground and roads get a pixel texture in each map's colors. Ground, scenery, roads and the base are drawn once into a cached layer and only redrawn when the map, the open routes or the resolution change.

## Languages

The game is in Thai, English, Korean, Japanese and French, chosen in Settings (default Thai). UI text lives under one key per string: Thai and English in `src/core/i18n.js` (`STRINGS.th` / `STRINGS.en`), Korean, Japanese and French in their own packs (`src/core/lang-ko.js`, `lang-ja.js`, `lang-fr.js`). `{name}` placeholders are filled by `TD.t`. Game data keeps its Thai names in its own file (towers and enemies in `config.js`, maps in `maps.js`, perks in `perks.js`); the other languages' names come from each language's data table via `TD.loc`, falling back to English. Fixed page text is tagged with `data-i18n` in `index.html`.

To add a string, add the key to every language; a test fails if any language's keys or placeholders differ from Thai, or if any tower, enemy, map, upgrade, perk, element, reaction, damage type or tab has no name in a language. The Korean, Japanese and French texts have not been reviewed by native speakers yet.
