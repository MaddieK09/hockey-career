import { GAME_TITLE, GAME_VERSION } from '../config/game';

export function renderMenu(root: HTMLElement): void {
  root.innerHTML = `
    <main class="menu-shell">
      <div class="ice-lines" aria-hidden="true"></div>
      <section class="menu-card" aria-labelledby="game-title">
        <p class="eyebrow">BUILD YOUR LEGACY</p>
        <h1 id="game-title">${GAME_TITLE}</h1>
        <p class="subtitle">From your first shift to the biggest stage.</p>
        <nav class="menu-actions" aria-label="Game menu">
          <button type="button" data-action="new">New Career <span aria-hidden="true">→</span></button>
          <button type="button" data-action="load" disabled>Load Career <small>Coming soon</small></button>
          <button type="button" data-action="settings" disabled>Settings <small>Coming soon</small></button>
        </nav>
        <p class="status" role="status" aria-live="polite">Choose New Career to begin.</p>
        <p class="version">Early development · v${GAME_VERSION}</p>
      </section>
    </main>
  `;
  root.querySelector<HTMLButtonElement>('[data-action="new"]')?.addEventListener('click', () => {
    const status = root.querySelector<HTMLElement>('.status');
    if (status) status.textContent = 'Player creator is our next milestone. Stay tuned!';
  });
}
