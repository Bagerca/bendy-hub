import { SiteHeader } from './shared/js/components/SiteHeader.js';
import { SearchControls } from './shared/js/components/SearchControls.js';
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

    // 2. Вспомогательная функция для генерации абсолютных путей.
    // Решает проблему 404: Router.js больше не будет искать файлы внутри shared/js/
const getModuleUrl = (path) => new URL(path, window.location.href).href;

    // 3. Настраиваем маршруты (ДОБАВЛЕНЫ template)
    const routes = {
        'home': { 
            module: getModuleUrl('./pages/home/app.js'),
            template: './pages/home/home.html'
        },
        'catalog': { 
            module: getModuleUrl('./pages/catalog/app.js'),
            template: './pages/catalog/catalog.html'
        },
        'project': { 
            module: getModuleUrl('./pages/project/app.js'),
            template: './pages/project/project.html'
        },
        'characters': { 
            module: getModuleUrl('./pages/characters/app.js'),
            template: './pages/characters/characters.html'
        },
        'character': { 
            module: getModuleUrl('./pages/character/app.js'),
            template: './pages/character/character.html'
        },
        'music': { 
            module: getModuleUrl('./pages/music/app.js'),
            template: './pages/music/music.html'
        },
        'feed': { 
            module: getModuleUrl('./pages/feed/app.js'),
            template: './pages/feed/feed.html'
        },
        'timeline': { 
            module: getModuleUrl('./pages/timeline/app.js'),
            template: './pages/timeline/timeline.html'
        },
        'records': { 
            module: getModuleUrl('./pages/records/app.js'),
            template: './pages/records/records.html'
        }
    };

    // 4. Запускаем Роутер и делаем его глобальным
    const router = new Router(routes, 'app-root');
    window.router = router;
    
    router.handleRoute(window.location.href);
});
