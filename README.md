# best-cooking-game-20261125-0137

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/Daniikhwan/best-cooking-game-20261125-0137/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/Daniikhwan/best-cooking-game-20261125-0137/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

**Warung Sizzle** — run the busiest street-food warung in town. Chop it, fry it, plate it, serve it before the customer walks. A complete cooking game in static files: a kitchen and an order board, ingredients on the counter, dishes mid-assembly, a shift timer and a plate ready to serve.

## How to play

- **WASD / arrows** — walk the kitchen
- **E or Space** — pick up, chop, cook, plate, serve (hold E to chop)
- **Click** a nearby station — use it
- **P** — pause · **R** — restart · **M** — mute

Orders arrive on the board with a patience bar. Fetch each ingredient from the crates, chop it on the board or fry it in the wok, assemble the dish on the plating counter, then serve it at the pass. Serve fast for tips, chain serves for a combo — and never leave food in the wok, or it burns. Four dishes: Nasi Goreng, Mie Ayam, Sate Ayam, Gado-Gado. One shift lasts 120 seconds; the last 30 are rush hour.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

No build step, no network request: every asset is drawn on the canvas and every sound is synthesised with WebAudio. `main.ts` hands the game in by copying `game/` and `screenshots/` to the output directory and writing `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?ref=vnsny7za&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
