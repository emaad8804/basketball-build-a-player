# Build-a-Hooper

Spin NBA teams. Steal one skill from every player you land on. Build a
9-attribute superstar, survive the Fatal Flaw wheel — then find out if your
build can win a ring.

A fan-made basketball builder game. Play the Daily Challenge (everyone gets the
same spin sequence) or Free Play as a Guard, Forward, or Center build.

## Development

```sh
npm install
npm run dev        # local dev server
npm run build      # typecheck + production build
npm run preview    # serve the production build
```

## Player data

The 526-player roster and attribute grades are generated from the 2K ratings
sheet plus real stats.nba.com data:

```sh
npm run data:build
```

See `scripts/build-player-data.js` for the pipeline.

## Design

`DESIGN.md` is the design source of truth — read it before any UI work.
