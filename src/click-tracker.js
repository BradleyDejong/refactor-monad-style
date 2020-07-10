import html from "nanohtml";

export const renderClicky = (clicks, onClick) => html`
  <div>
    You've clicked ${clicks} times
  </div>
  <button onclick=${onClick}>
    Click Me
  </button>
`;
