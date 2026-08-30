import { ThemeManager } from '../ThemeManager.js';
import { Icons } from '../icons.js';

export class SiteHeader extends HTMLElement {
    static get observedAttributes() { return ['active-page']; }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'active-page') this.updateActiveLink(newValue);
    }

    connectedCallback() {
        const activePage = this.getAttribute('active-page') || 'home';

        this.innerHTML = `
            <header class="site-header">
                <div class="header-content">
                    <nav class="site-nav">
                        <a href="index.html" data-page="home" class="nav-link">Главная</a>
                        <a href="feed.html" data-page="feed" class="nav-link">Лента</a>
                        <a href="catalog.html" data-page="catalog" class="nav-link">Каталог</a>
                        <a href="characters.html" data-page="characters" class="nav-link">Персонажи</a>
                        <a href="music.html" data-page="music" class="nav-link">Музыка</a>
                        <a href="timeline.html" data-page="timeline" class="nav-link">Хронология</a>
                        <a href="records.html" data-page="records" class="nav-link">Архивы</a>
                    </nav>
                    <button id="theme-toggle" class="theme-toggle" aria-label="Переключить тему">
                        ${Icons.theme_moon}
                        ${Icons.theme_sun}
                    </button>
                </div>
            </header>
        `;

        new ThemeManager('theme-toggle');
        this.updateActiveLink(activePage);
    }

    updateActiveLink(pageId) {
        this.querySelectorAll('.nav-link').forEach(link => {
            link.classList.toggle('active', link.dataset.page === pageId);
        });
    }
}