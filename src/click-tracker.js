import html from "nanohtml";
import { ask } from "./Reader";
import { prop } from "ramda";
import { View } from "./View";

export const renderClicky = ask(prop("dispatch")).map((dispatch) =>
                                                      View(
                                                          (clicks) =>
                                                          html`
  <div>
    You've clicked ${clicks} times
  </div>
  <button onclick=${() => dispatch("clicked")}>
    Click Me
  </button>
`));

export const renderTotalClicks = (totalClicks, dispatch) => 
  html`
    <div>Total clicks:</div>
    <div>${totalClicks}</div>
  `;
