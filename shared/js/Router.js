export class Router {
    constructor(routes, rootElementId) {
        this.routes = routes;
        this.rootElem = document.getElementById(rootElementId);
        this.htmlCache = new Map();
        this.currentController = null;

        window.addEventListener('popstate', () => this.handleRoute(window.location.href));

        document.body.addEventListener('click', (e) => {
            const link = e.target.closest('a');
            if (!link) return;

            // ИСПРАВЛЕНИЕ: Игнорируем скачивания, внешние вкладки, пустые якоря и blob-ссылки
            if (link.hasAttribute('download') || 
                link.getAttribute('target') === '_blank' || 
                link.getAttribute('href') === '#' || 
                link.href.startsWith('blob:')) {
                return;
            }

            if (link.href.includes(window.location.host)) {
                e.preventDefault();
                this.navigate(link.href);
            }
        });
    }

    async navigate(url) {
        const base = window.location.origin + window.location.pathname;
        const tempUrl = new URL(url, base);
        
        let pageName = tempUrl.pathname.split('/').pop().replace('.html', '');
        if (!pageName || pageName === 'index') pageName = 'home';
        
        const params = new URLSearchParams(tempUrl.search);
        
        if (params.has('page')) {
            let pVal = params.get('page');
            if (pVal.includes('?')) {
                const parts = pVal.split('?');
                pageName = parts[0];
                const subParams = new URLSearchParams(parts[1]);
                for (let [k, v] of subParams.entries()) {
                    params.set(k, v);
                }
            }
        }
        
        params.set('page', pageName);
        const finalUrl = `?${params.toString()}`;
        
        window.history.pushState({}, '', finalUrl);
        await this.handleRoute(window.location.href);
    }

    async handleRoute(url) {
        const urlObj = new URL(url, window.location.href);
        
        let routeKey = urlObj.searchParams.get('page');
        
        if (routeKey && routeKey.includes('?')) {
            routeKey = routeKey.split('?')[0];
        }

        if (!routeKey) {
            routeKey = urlObj.pathname.split('/').pop().replace('.html', '') || 'home';
        }
        if (routeKey === 'index') routeKey = 'home';

        const route = this.routes[routeKey];
        if (!route) {
            console.error(`Route not found: ${routeKey}`);
            this.rootElem.innerHTML = `
                <div class="error-card" style="margin:4rem auto; max-width:600px; text-align:center;">
                    <p>Страница не найдена. Возможно, вы перешли по устаревшей или сломанной ссылке.</p>
                    <button onclick="window.router.navigate('index.html')" style="margin-top:15px; padding:8px 16px; cursor:pointer; background:var(--bg-body); border:1px solid var(--border-color); color:var(--text-main); border-radius:8px;">На главную</button>
                </div>`;
            return;
        }

        // ОЧИСТКА ПАМЯТИ
        if (this.currentController && typeof this.currentController.destroy === 'function') {
            this.currentController.destroy();
        }
        this.currentController = null;

        if (window.CustomSelect) {
            window.CustomSelect.instances = []; 
        }
        
        this.rootElem.innerHTML = '<div class="loading-state" style="margin-top:100px;"><div class="spinner" style="margin: 0 auto 10px;"></div></div>';

        try {
            let htmlContent = '';
            if (this.htmlCache.has(routeKey)) {
                htmlContent = this.htmlCache.get(routeKey);
            } else {
                const response = await fetch(route.template);
                if (!response.ok) throw new Error(`Failed to load template: ${route.template}`);
                htmlContent = await response.text();
                this.htmlCache.set(routeKey, htmlContent);
            }
            
            this.rootElem.innerHTML = htmlContent;
        } catch (error) {
            console.error(`Error loading HTML for ${routeKey}:`, error);
            this.rootElem.innerHTML = '<div class="error-card"><p>Ошибка загрузки страницы. Проверьте соединение с сетью.</p></div>';
            return;
        }

        const header = document.querySelector('site-header');
        if (header) {
            let navPage = routeKey;
            if (routeKey === 'project') navPage = 'catalog';
            if (routeKey === 'character') navPage = 'characters';
            header.setAttribute('active-page', navPage);
        }

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