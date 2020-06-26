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
});

View.empty = View((state, dispatch) => html``);

const header = () => html`<h1>World's best app</h1>`;

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

const children = [
  renderRefresh.contramap((s) => s.lastUpdated),
  renderClicky.contramap((s) => s.clicks),
  renderDecorations.contramap((s) => undefined),
];

const refreshAndClicky = children.reduce(concat, View.empty);

const content = (state, dispatch) => html`
  <div id="content" class="content">
    ${refreshAndClicky.render(state, dispatch)}
    <div>Total clicks:</div>
    <div>${state.totalClicks}</div>
  </div>
`;

const wholeApp = View(
  ({ state, dispatch }) => html`<div id="app">
    ${header(state, dispatch)} ${content(state, dispatch)}
  </div>`
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
  nanomorph(app, wholeApp.render({ state, dispatch }));

const dispatch = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatch);
};

rerender(state, dispatch); // start the app
