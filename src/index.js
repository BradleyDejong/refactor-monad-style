import html from "nanohtml";
import morphdom from "morphdom";

const header = () => html`<h1>World's best app</h1>`;

const renderRefresh = (state, dispatch) => html`
  <div>
    Last updated at ${state.lastUpdated.toLocaleString()}.
  </div>
  <button onclick=${() => dispatch("update")}>
    Click To Update
  </button>
`;

const renderClicky = (state, dispatch) => html`
  <div>
    You've clicked ${state.clicks} times
  </div>
  <button onclick=${() => dispatch("clicked")}>
    Click Me
  </button>
`;

const renderDecorations = (state, dispatch) => html`
  <div class="decoration">
    insert decoration here
  </div>
  <span class="decoration"> 🦄🦄🦄🦄🦄🦄 </span>
`;

const content = (state, dispatch) => html`
  <div class="content">
    ${renderRefresh(state, dispatch)} ${renderDecorations()}
    ${renderClicky(state, dispatch)}
  </div>
`;

const render = ({ state, dispatch }) => html`<div id="app">
  ${header(state, dispatch)} ${content(state, dispatch)}
</div>`;

const reduce = (state, event) => {
  if (event === "clicked") {
    return {
      ...state,
      clicks: state.clicks + 1,
    };
  } else if (event === "update") {
    return {
      ...state,
      lastUpdated: new Date(),
    };
  }
  return state;
};

// IMPURE
const app = document.getElementById("app");
const state = {
  lastUpdated: new Date(),
  clicks: 0,
};

const rerender = (state, dispatch) =>
  morphdom(app, render({ state, dispatch }));

const dispatch = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatch);
};

rerender(state, dispatch); // start the app
