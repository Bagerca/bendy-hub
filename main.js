import { SiteHeader } from './shared/js/components/SiteHeader.js';
import { SearchControls } from './shared/js/components/SearchControls.js';
import './shared/js/components/CustomSelect.js'; // ДОБАВЛЕН ИМПОРТ СЕЛЕКТА
import { FloatingPlayer } from './pages/music/FloatingPlayer.js';
import { LightboxManager } from './shared/js/Lightbox.js';
import { TranslationService } from './pages/feed/services/TranslationService.js';
import { Router } from './shared/js/Router.js';

// Регистрируем кастомные веб-компоненты
if (!customElements.get('site-header')) customElements.define('site-header', SiteHeader);
if (!customElements.get('search-controls')) customElements.define('search-controls', SearchControls);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Создаем глобальные синглтоны
    window.globalPlayer = new FloatingPlayer();
    window.globalLightbox = new LightboxManager('lightbox', 'lightbox-img');
    window.globalTranslator = new TranslationService();

    // 2. Умная генерация абсолютных путей
    const getBaseUrl = () => {
        let path = window.location.pathname;
        if (path.endsWith('.html')) {
            path = path.substring(0, path.lastIndexOf('/'));
        }
        if (!path.endsWith('/')) {
            path += '/';
        }
        return window.location.origin + path;
    };

    const baseUrl = getBaseUrl();
    const getUrl = (path) => new URL(path, baseUrl).href;

    // 3. Настраиваем маршруты с безопасными путями
    const routes = {
        'home': { 
            module: getUrl('./pages/home/app.js'),
            template: getUrl('./pages/home/home.html')
        },
        'catalog': { 
            module: getUrl('./pages/catalog/app.js'),
            template: getUrl('./pages/catalog/catalog.html')
        },
        'project': { 
            module: getUrl('./pages/project/app.js'),
            template: getUrl('./pages/project/project.html')
        },
        'characters': { 
            module: getUrl('./pages/characters/app.js'),
            template: getUrl('./pages/characters/characters.html')
        },
        'character': { 
            module: getUrl('./pages/character/app.js'),
            template: getUrl('./pages/character/character.html')
        },
        'music': { 
            module: getUrl('./pages/music/app.js'),
            template: getUrl('./pages/music/music.html')
        },
        'feed': { 
            module: getUrl('./pages/feed/app.js'),
            template: getUrl('./pages/feed/feed.html')
        },
        'timeline': { 
            module: getUrl('./pages/timeline/app.js'),
            template: getUrl('./pages/timeline/timeline.html')
        },
        'records': { 
            module: getUrl('./pages/records/app.js'),
            template: getUrl('./pages/records/records.html')
        }
    };

    // 4. Запускаем Роутер и делаем его глобальным
    const router = new Router(routes, 'app-root');
    window.router = router;
    
    router.handleRoute(window.location.href);
});