import { CustomSelect } from './components/CustomSelect.js';

export class Router {
    constructor(routes, rootElementId) {
        this.routes = routes;
        this.rootElem = document.getElementById(rootElementId);
        this.htmlCache = new Map();
        this.currentController = null; // Отслеживаем активный контроллер

        window.addEventListener('popstate', () => this.handleRoute(window.location.href));

        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (link && link.href.startsWith(window.location.origin)) {
                if (link.getAttribute('target') === '_blank' || link.getAttribute('href') === '#') return;
                
                e.preventDefault();
                this.navigate(link.href);
            }
        });
    }

    async navigate(url) {
        const urlObj = new URL(url, window.location.origin);
        let routeKey = urlObj.pathname.split('/').pop().replace('.html', '');
        if (!routeKey || routeKey === 'index') routeKey = 'home';

        urlObj.pathname = '/';
        urlObj.searchParams.set('page', routeKey); 

        window.history.pushState({}, '', urlObj.href);
        await this.handleRoute(urlObj.href);
    }

    async handleRoute(url) {
        const urlObj = new URL(url, window.location.origin);
        
        let routeKey = urlObj.searchParams.get('page');
        if (!routeKey) {
            routeKey = urlObj.pathname.split('/').pop().replace('.html', '') || 'home';
            if (routeKey === 'index') routeKey = 'home';
        }

        const route = this.routes[routeKey];
        if (!route) {
            console.error(`Route not found: ${routeKey}`);
            return;
        }

        // ОЧИСТКА ПАМЯТИ: Уничтожаем старый контроллер, чтобы убить обзерверы и таймеры
        if (this.currentController && typeof this.currentController.destroy === 'function') {
            this.currentController.destroy();
        }
        this.currentController = null;

        CustomSelect.instances = []; 
        this.rootElem.innerHTML = '<div class="loading-state" style="margin-top:100px;"><div class="spinner" style="margin: 0 auto 10px;"></div></div>';

        // Загрузка HTML
        try {
            let htmlContent = '';
            if (this.htmlCache.has(routeKey)) {
                htmlContent = this.htmlCache.get(routeKey);
            } else {
                const response = await fetch(route.template);
                if (!response.ok) throw new Error('Failed to load template');
                htmlContent = await response.text();
                this.htmlCache.set(routeKey, htmlContent);
            }
            
            this.rootElem.innerHTML = htmlContent;
        } catch (error) {
            console.error(`Error loading HTML for ${routeKey}:`, error);
            this.rootElem.innerHTML = '<div class="error-card"><p>Ошибка загрузки страницы.</p></div>';
            return;
        }

        // Подсветка меню
        const header = document.querySelector('site-header');
        if (header) {
            let navPage = routeKey;
            if (routeKey === 'project') navPage = 'catalog';
            if (routeKey === 'character') navPage = 'characters';
            header.setAttribute('active-page', navPage);
        }

        // Запуск JS контроллера и его сохранение в память
        try {
            const module = await import(route.module);
            if (module.init) {
                this.currentController = await module.init(); 
            }
            window.scrollTo({ top: 0, behavior: 'instant' });
        } catch (err) {
            console.error(`Error loading JS module for ${routeKey}:`, err);
        }
    }
}