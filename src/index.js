import html from "nanohtml";
import nanomorph from "nanomorph";
import { concat, prop } from "ramda";

import { View } from "./View";
import { decorations, unicorns } from "./decorations";
import { renderClicky, renderTotalClicks } from "./click-tracker";

const Reader = (run) => ({
  map: (f) => Reader((ctx) => f(run(ctx))),
  chain: (f) => Reader((ctx) => f(run(ctx)).run(ctx)),
  concat: (other) => Reader((ctx) => run(ctx).concat(other.run(ctx))),
  run,
});

Reader.of = (x) => Reader((ctx) => x);
Reader.ask = (q) => (q ? Reader((ctx) => q(ctx)) : Reader((ctx) => ctx));
const { ask } = Reader;

const blink = (someView) =>
  someView.map(
    (someViewHtml) =>
      html`<div style="animation: blink 300ms infinite;">${someViewHtml}</div>`
  );

const header = html`<h1>World's best app</h1>`;

const debugLastUpdated = Reader((ctx) =>
  View(
    (d) =>
      html`<strong style="position: fixed; bottom: 0; width: 100vw;"
        >${d}
        <button onclick=${() => ctx.dispatch("Debug clicked")}>
          Debug Mode
        </button></strong
      >`
  )
);

const renderRefresh = ask(prop("dispatch")).map((dispatch) =>
  View(
    (lastUpdated) => html`
      <div>
        Last updated at ${lastUpdated.toLocaleString()}.
      </div>
      <button onclick=${() => dispatch("update")}>
        Click To Update
      </button>
    `
  )
);

const renderDecorations = View.of(decorations).concat(blink(View.of(unicorns)));

const totalClicks = View(renderTotalClicks);

const makeGreenText = (v) => {
  v.classList.add("mapclass");
  return v;
};

const readerWithAdapter = (adapterFn) => (r) =>
  r.map((v) => v.contramap(adapterFn));

const clickTracker = View((clicks, dispatch) =>
  renderClicky(clicks, () => dispatch("clicked"))
);

const children = [
  renderRefresh.map((v) => v.contramap((s) => s.lastUpdated)),
  Reader.of(clickTracker.contramap((s) => s.clicks)),
  Reader.of(renderDecorations.contramap((s) => undefined)),
  Reader.of(totalClicks.contramap((s) => s.totalClicks)),
];

const contentViews = children.reduce(concat, Reader.of(View.empty));

const content = contentViews.map((v) =>
  v.map(
    (allViewsHtml) =>
      html`
        <div id="content" class="content">
          ${allViewsHtml}
        </div>
      `
  )
);

const debug = Reader((ctx) => ctx.env === "prod").chain((isProd) =>
  isProd ? Reader.of(View.empty) : debugLastUpdated
);

const headerReader = ask(prop("title")).map((title) => View.of(html`${title}`));

const appHeader = headerReader.map((r) =>
  r.map(
    (v) =>
      html`
        <header style="position: fixed; top: 0; left: 50%; margin-left: -50%;">
          ${v}
        </header>
      `
  )
);

const dispatch = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatch);
};

const wholeApp = Reader.of(View.of(header))
  .concat(content)
  .concat(debug.map((v) => v.contramap((s) => s.lastUpdated)))
  .concat(appHeader)
  .chain((x) => {
    return Reader.of(
      x.chain((y) =>
        View.of(html`<div id="app">
          ${y}
        </div>`)
      )
    );
  })
  .run({
    env: process.env.NODE_ENV === "production" ? "prod" : "dev",
    dispatch,
    title: "World's best app",
  });

const reduce = (state, event) => {
  console.log("EVENT", event);
  if (event === "clicked") {
    return {
      ...state,
      clicks: state.clicks + 1,
      totalClicks: state.totalClicks + 1,
    };
  } else if (event === "update") {
    return {
      ...state,
      lastUpdated: new Date(),
      totalClicks: state.totalClicks + 1,
    };
  }

  return state;
};

// IMPURE
const app = document.getElementById("app");
const state = {
  lastUpdated: new Date(),
  clicks: 0,
  totalClicks: 0,
};

const rerender = (state, dispatch) =>
  nanomorph(app, wholeApp.render(state, dispatch));

rerender(state, dispatch); // start the app
