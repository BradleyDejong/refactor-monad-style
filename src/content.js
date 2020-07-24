import html from "nanohtml";

export const contentHtml = (someHtml) =>
  html`
    <div id="content" class="content">
      ${someHtml}
    </div>
  `;
