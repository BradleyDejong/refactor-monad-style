import html from "nanohtml";
import nanomorph from "nanomorph";
import { concat } from "ramda";

import { View } from "./View";
import { decorations, unicorns } from "./decorations";
import { renderClicky, renderTotalClicks } from "./click-tracker";

const Fn = (run) => ({
  map: (f) => Fn((ctx) => f(this.run(ctx))),
  chain: (f) => Fn((ctx) => f(this.run(ctx)).run(ctx)),
  concat: (other) => Fn((ctx) => run(ctx).concat(other.run(ctx))),
  run,
});

Fn.of = (x) => Fn((ctx) => x);

const env = process.env.NODE_ENV === "production" ? "prod" : "dev";

const blink = (someView) =>
  someView.map(
    (someViewHtml) =>
      html`<div style="animation: blink 300ms infinite;">${someViewHtml}</div>`
  );

const header = html`<h1>World's best app</h1>`;

const debugLastUpdated = (d) =>
  html`<strong style="position: fixed; bottom: 0; width: 100vw;">${d}</strong>`;

const renderRefresh = View(
  (lastUpdated, dispatch) => html`
    <div>
      Last updated at ${lastUpdated.toLocaleString()}.
    </div>
    <button onclick=${() => dispatch("update")}>
      Click To Update
    </button>

    ${env === "production" ? "" : debugLastUpdated(lastUpdated)}
  `
);

const renderDecorations = View.of(decorations).concat(blink(View.of(unicorns)));

const totalClicks = View(renderTotalClicks);

const makeGreenText = (v) => {
  v.classList.add("mapclass");
  return v;
};

const clickTracker = View((clicks, dispatch) =>
  renderClicky(clicks, () => dispatch("clicked"))
);

const children = [
  renderRefresh.contramap((s) => s.lastUpdated),
  clickTracker.contramap((s) => s.clicks),
  renderDecorations.contramap((s) => undefined),
  totalClicks.contramap((s) => s.totalClicks),
];

const contentViews = children.reduce(concat, View.empty);

const content = contentViews.map(
  (allViewsHtml) =>
    html`
      <div id="content" class="content">
        ${allViewsHtml}
      </div>
    `
);

const wholeApp = View.of(header)
  .concat(content)
  .chain((x) =>
    View.of(html`<div id="app">
      ${x}
    </div>`)
  );

const reduce = (state, event) => {
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

const dispatch = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatch);
};

rerender(state, dispatch); // start the app
