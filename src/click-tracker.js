import html from "nanohtml";

export const clickCounter = (clicks, onClick) => html`
  <div>
    You've clicked ${clicks} times
  </div>
  <button onclick=${onClick}>
    Click Me
  </button>
`;

export const renderTotalClicks = (totalClicks) =>
  html`
    <div>Total clicks:</div>
    <div>${totalClicks}</div>
  `;
