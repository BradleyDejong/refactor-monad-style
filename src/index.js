// Third Party Imports
import html from "nanohtml";
import nanomorph from "nanomorph";
import { concat, prop } from "ramda";

// Type Imports
import { View } from "./View";
import { Reader, ask } from "./Reader.js";

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

const children = [
  renderRefresh.map((v) => v.contramap((s) => s.lastUpdated)),
  renderClickMe.map((v) => v.contramap((s) => s.clicks)),
  Reader.of(renderDecorations.contramap((s) => undefined)),
  Reader.of(totalClicks.contramap((s) => s.totalClicks)),
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

const dispatchGlobal = (event) => {
  const newState = reduce(state, event);
  Object.assign(state, newState);
  rerender(state, dispatchGlobal);
};

const wholeApp = Reader.of(View.of(contentHeaderHtml))
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

rerender(state, dispatchGlobal); // start the app
