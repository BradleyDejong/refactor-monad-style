import html from "nanohtml";

export const headerTitleHtml = (title) => html`${title}`;

export const headerHtml = (title) =>
  html`
    <header style="position: fixed; top: 0; left: 50%; margin-left: -50%;">
      ${title}
    </header>
  `;
