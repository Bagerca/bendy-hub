import { Logger } from '../Logger.js';
import { ThemeManager } from '../ThemeManager.js';

export class SiteHeader extends HTMLElement {
    connectedCallback() {
        const activePage = this.getAttribute('active-page') || 'home';

        this.innerHTML = `
            <header class="site-header">
                <div class="header-content">
                    <nav class="site-nav">
                        <a href="index.html" class="nav-link ${activePage === 'home' ? 'active' : ''}">Главная</a>
                        <a href="feed.html" class="nav-link ${activePage === 'feed' ? 'active' : ''}">Лента</a>
                        <a href="catalog.html" class="nav-link ${activePage === 'catalog' ? 'active' : ''}">Каталог</a>
                        <a href="characters.html" class="nav-link ${activePage === 'characters' ? 'active' : ''}">Персонажи</a>
                        <a href="music.html" class="nav-link ${activePage === 'music' ? 'active' : ''}">Музыка</a>
                        <a href="timeline.html" class="nav-link ${activePage === 'timeline' ? 'active' : ''}">Хронология</a>
                        <a href="records.html" class="nav-link ${activePage === 'records' ? 'active' : ''}">Архивы</a>
                    </nav>
                    
                    <button id="theme-toggle" class="theme-toggle" aria-label="Переключить тему">
                        <svg class="icon-moon" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
                        <svg class="icon-sun" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: none;"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
                    </button>
                </div>
            </header>
        `;

        // Делегируем логику глобальному контроллеру тем
        new ThemeManager('theme-toggle');
    }
}