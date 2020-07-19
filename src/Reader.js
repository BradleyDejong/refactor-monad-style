// Reader.js
export const Reader = (run) => ({
    map: (f) => Reader((ctx) => f(run(ctx))),
    chain: (f) => Reader((ctx) => f(run(ctx)).run(ctx)),
    concat: (other) => Reader((ctx) => run(ctx).concat(other.run(ctx))),
    run,
});

Reader.of = (x) => Reader((ctx) => x);
Reader.ask = (q) => (q ? Reader((ctx) => q(ctx)) : Reader((ctx) => ctx));
export const { ask } = Reader;

