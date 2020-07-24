import html from "nanohtml";

export const blinkHtml = (someViewHtml) =>
  html`<div style="animation: blink 300ms infinite;">${someViewHtml}</div>`;
