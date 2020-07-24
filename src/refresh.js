import html from "nanohtml";

export const refreshHtml = (lastUpdated, onClick) => html`
  <div>
    Last updated at ${lastUpdated.toLocaleString()}.
  </div>
  <button onclick=${onClick}>
    Click To Update
  </button>
`;
