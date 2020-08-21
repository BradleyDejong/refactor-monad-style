// Reader.js

// Reader a b
// a -> b

// Reader a        b
// Reader AppState (View HTML)              -- VIEWS
// Reader Action   (Endo AppState)          -- REDUCERS
// Reader Action   (Array (Promise Action)) -- EFFECTS

export const Reader = (run) => ({
  map: (f) => Reader((ctx) => f(run(ctx))),
  chain: (f) => Reader((ctx) => f(run(ctx)).run(ctx)),
  concat: (other) => Reader((ctx) => run(ctx).concat(other.run(ctx))),
  run,
});

Reader.of = (x) => Reader((ctx) => x);
Reader.ask = (q) => (q ? Reader((ctx) => q(ctx)) : Reader((ctx) => ctx));
export const { ask } = Reader;
