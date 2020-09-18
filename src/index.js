// Third Party Imports
import html from "nanohtml";
import nanomorph from "nanomorph";
import { concat, prop } from "ramda";

// Type Imports
import { View } from "./View";
import { Reader, ask } from "./Reader.js";

import { initialState, selectors, setLastUpdated } from "./state";

// HTML Imports
import { decorations, unicorns } from "./decorations";
import { clickCounter, renderTotalClicks } from "./click-tracker";
import { headerTitleHtml, headerHtml } from "./header";
import { contentHtml } from "./content";
import { refreshHtml } from "./refresh";
import { refreshDebugHtml } from "./refresh-debug";
import { blinkHtml } from "./blink";
import { contentHeaderHtml } from "./content-header";

const debugLastUpdated = Reader((ctx) =>
  View((d) => refreshDebugHtml(d, () => ctx.dispatch("Debug Clicked")))
);

const renderClickMe = ask(prop("dispatch")).map((dispatch) =>
  View((clicks) => clickCounter(clicks, () => dispatch("clicked")))
);

const renderRefresh = ask(prop("dispatch")).map((dispatch) =>
  View((lastUpdated) => refreshHtml(lastUpdated, () => dispatch("update")))
);

const blink = (someView) => someView.map(blinkHtml);

const renderDecorations = View.of(decorations).concat(blink(View.of(unicorns)));

const totalClicks = View(renderTotalClicks);

const makeGreenText = (v) => {
  v.classList.add("mapclass");
  return v;
};

const readerWithAdapter = (adapterFn) => (r) =>
  r.map((v) => v.contramap(adapterFn));

const quoteView = ask(prop("dispatch")).map((d) =>
  View(
    (q) =>
      html`<div>Quote:</div>
        <div>${q}</div>
        <div></div>
        <button onclick=${() => d("QUOTE")}>Get new quote</button>`
  )
);

const children = [
  renderRefresh.map((v) => v.contramap(selectors.lastUpdated)),
  renderClickMe.map((v) => v.contramap((s) => s.clicks)),
  Reader.of(renderDecorations.contramap((s) => undefined)),
  Reader.of(totalClicks.contramap((s) => s.totalClicks)),
  quoteView.map((v) => v.contramap((s) => s.quote)),
];

const contentViews = children.reduce(concat, Reader.of(View.empty));

const content = contentViews.map((v) => v.map(contentHtml));

const debug = Reader((ctx) => ctx.env === "prod").chain((isProd) =>
  isProd ? Reader.of(View.empty) : debugLastUpdated
);

const headerReader = ask(prop("title")).map((title) =>
  View.of(headerTitleHtml(title))
);

const appHeader = headerReader.map((r) => r.map(headerHtml));

const wholeApp = Reader.of(View.of(contentHeaderHtml))
  .concat(content)
  .concat(debug.map((v) => v.contramap(selectors.lastUpdated)))
  .concat(appHeader)
  .chain((x) => {
    return Reader.of(
      x.chain((y) =>
        View.of(html`<div id="app">
          ${y}
        </div>`)
      )
    );
  });

const Endo = (run) => ({
  run,
  concat: (otherEndo) => Endo((a) => otherEndo.run(run(a))),
});

Endo.empty = Endo((x) => x);

const reducer1 = Reader((action) =>
  Endo((state) =>
    action === "clicked"
      ? {
          ...state,
          clicks: state.clicks + 1,
        }
      : state
  )
);

const reducer2 = Reader((action) =>
  Endo((state) =>
    action === "update" ? setLastUpdated(new Date(), state) : state
  )
);

const quoteReducer = Reader((action) =>
  Endo((state) =>
    action.type && action.type === "QUOTE_UPDATED"
      ? { ...state, quote: action.quote }
      : state
  )
);

// AppState -> AppState
// Endo AppState
const actionCounter = (state) => ({
  ...state,
  totalClicks: state.totalClicks + 1,
});

const allOurReducers = [
  reducer1,
  reducer2,
  Reader.of(Endo(actionCounter)),
  quoteReducer,
];

const reduce = (state, event) => {
  return allOurReducers
    .reduce(concat, Reader.of(Endo.empty))
    .run(event) // Runs the reader
    .run(state); // Runs the Endo
};

// IMPURE
const app = document.getElementById("app");
const state = initialState;

const rerender = (state, dispatch) =>
  nanomorph(
    app,
    wholeApp
      .run({
        env: process.env.NODE_ENV === "production" ? "prod" : "dev",
        dispatch,
        title: "World's best app",
      })
      .render(state)
  );

// getQuoteEffect :: Action -> Array (Promise Action)
const getQuoteEffect = (action) =>
  action === "QUOTE"
    ? [
        fetch("https://api.quotable.io/random")
          .then((res) => res.json())
          .then((body) => {
            const quote = body.content;
            return { type: "QUOTE_UPDATED", quote };
          }),
      ]
    : [];

// loggingEffect :: Action -> Array (Promise Action)
const loggingEffect = (action) => {
  console.log("GOT ACTION", action);
  return [];
};

// updateDom :: Action -> Array (Promise Action)
const updateDom = (action) => {
  updateState(action);
  rerender(state, dispatchGlobal);
  return [];
};

const foldMap = (foldable, semigroup, empty) =>
  foldable.map(semigroup).reduce(concat, empty);

const allEffects = foldMap(
  [getQuoteEffect, loggingEffect, updateDom],
  Reader,
  Reader.of([])
);

//.reduce(concat, Reader.of([]));
const runEffects = (action) => allEffects.run(action);

const updateState = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
};

const dispatchGlobal = (action) => {
  const nextActions = runEffects(action);
  nextActions.forEach((p) => p.then(dispatchGlobal));
};

rerender(state, dispatchGlobal); // start the app
