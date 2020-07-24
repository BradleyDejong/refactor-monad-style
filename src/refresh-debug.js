import html from "nanohtml";

export const refreshDebugHtml = (lastUpdated, onClick) => html` <strong
  style="position: fixed; bottom: 0; width: 100vw;"
  >${lastUpdated}
  <button onclick=${onClick}>
    Debug Mode
  </button></strong
>`;
