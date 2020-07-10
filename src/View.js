import html from "nanohtml";

export const View = (render) => ({
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
  map: (mapFn) => View((state, dispatch) => mapFn(render(state, dispatch))),
});

View.empty = View((state, dispatch) => html``);
View.of = (val) => View((state, dispatch) => val);
