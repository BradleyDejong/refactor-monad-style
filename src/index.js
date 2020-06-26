import html from "nanohtml";
import nanomorph from "nanomorph";
import { concat } from "ramda";

const View = (render) => ({
  render: render,
  contramap: (adapterFn) =>
    View((state, dispatch) => render(adapterFn(state), dispatch)),
  concat: (otherView) =>
    View(
      (state, dispatch) => html`
        ${render(state, dispatch)} ${otherView.render(state, dispatch)}
      `
    ),
  chain: (otherViewFn) =>
    View((state, dispatch) =>
      otherViewFn(render(state, dispatch)).render(state, dispatch)
    ),
  map: (mapFn) => View((state, distach) => mapFn(render(state, dispatch))),
});

View.empty = View((state, dispatch) => html``);

const header = View(() => html`<h1>World's best app</h1>`);

const renderRefresh = View(
  (lastUpdated, dispatch) => html`
    <div>
      Last updated at ${lastUpdated.toLocaleString()}.
    </div>
    <button onclick=${() => dispatch("update")}>
      Click To Update
    </button>
  `
);

const renderClicky = View(
  (clicks, dispatch) => html`
    <div>
      You've clicked ${clicks} times
    </div>
    <button onclick=${() => dispatch("clicked")}>
      Click Me
    </button>
  `
);

const renderDecorations = View(
  (state, dispatch) => html`
    <div class="decoration">
      insert decoration here
    </div>
    <span class="decoration"> 🦄🦄🦄🦄🦄🦄 </span>
  `
);

const renderTotalClicks = View(
  (totalClicks, dispatch) => html`
    <div>Total clicks:</div>
    <div>${totalClicks}</div>
  `
);

const makeBlinky = (someView) =>
  someView.chain((someViewHtml) =>
    View((state, dispatch) => html` <i>${someViewHtml}</i> `)
  );

const makeGreenText = (v) => {
  v.classList.add("mapclass");
  return v;
};

const children = [
  renderRefresh.contramap((s) => s.lastUpdated),
  renderClicky.contramap((s) => s.clicks),
  makeBlinky(renderDecorations.contramap((s) => undefined)).map(makeGreenText),
  renderTotalClicks.contramap((s) => s.totalClicks),
];

const contentViews = children.reduce(concat, View.empty);

const content = contentViews.chain((allViewsHtml) =>
  View(
    (state, dispatch) => html`
      <div id="content" class="content">
        ${allViewsHtml}
      </div>
    `
  )
);

const wholeApp = header
  .concat(content)
  .chain((x) => View(() => html`<div id="app">${x}</div>`));

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
  nanomorph(app, wholeApp.render({ state, dispatch }));

const dispatch = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatch);
};

rerender(state, dispatch); // start the app
