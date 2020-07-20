import html from "nanohtml";

export const View = (render) => ({
  render: render,
  contramap: (adapterFn) => View((state) => render(adapterFn(state))),
  concat: (otherView) =>
    View((state) => html` ${render(state)} ${otherView.render(state)} `),
  chain: (otherViewFn) =>
    View((state) => otherViewFn(render(state)).render(state)),
  map: (mapFn) => View((state) => mapFn(render(state))),
});

View.empty = View((state) => html``);
View.of = (val) => View((state) => val);
