import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { InfiniteScroll } from '../../shared/js/components/InfiniteScroll.js';
import { fetchData } from '../../shared/js/api.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';
import { SearchControls } from '../../shared/js/components/SearchControls.js';

import { FeedModel } from './FeedModel.js';
import { PostView } from './PostView.js';
import { FeedController } from './FeedController.js';
import { TranslationService } from './services/TranslationService.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js';

customElements.define('site-header', SiteHeader);
customElements.define('search-controls', SearchControls);

const TRACKED_AUTHORS = [
    { handle: '@Bendy', name: 'Bendy' },
    { handle: '@themeatly', name: 'theMeatly' },
    { handle: '@m_ZeroLogics', name: 'Mike Mood' },
    { handle: '@BLacroix30', name: 'Brian Lacroix' },
    { handle: '@bookpast', name: 'Adrienne' },
    { handle: '@BendyRun', name: "Bendy's Nightmare Run" },
    { handle: '@GentCorporation', name: 'GENT' },
    { handle: '@Doberart', name: 'Elizabeth King' }
];

document.addEventListener('DOMContentLoaded', async () => {
    const lightbox = new LightboxManager('lightbox', 'lightbox-img');
    const translator = new TranslationService();

    const model = new FeedModel(20);
    const view = new PostView('post-template', lightbox, translator);
    
    const scroller = new InfiniteScroll('scroll-sentinel', () => {
        controller.appendNextChunk();
    });

    const controller = new FeedController(model, view, scroller);

    let currentSelectedAuthor = 'all';
    let currentSearchTerm = ''; // Сохраняем состояние поиска для комбинирования с селектом

    const triggerSearch = () => {
        controller.handleSearchOrFilter(currentSearchTerm, currentSelectedAuthor);
    };

    const searchControls = document.querySelector('search-controls');
    
    // Подсказки (Ищет только имена авторов в ленте)
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    
    // Событие подтверждения поиска
    searchControls.addEventListener('onSearch', (e) => {
        currentSearchTerm = e.detail;
        triggerSearch();
    });

    const authorSelect = new CustomSelect('author-filter-container', (selectedId) => {
        currentSelectedAuthor = selectedId;
        triggerSearch();
    });

    try {
        const data = await fetchData('data/feed.json'); 
        const feedData = Array.isArray(data) ? data : [];

        const allDevsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`;
        const fallbackAvatarUri = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

        const selectOptions = [
            { id: 'all', label: 'Все разработчики', iconHtml: allDevsIcon }
        ];

        TRACKED_AUTHORS.forEach(author => {
            // Динамически строим путь к аватарке
            const handleClean = author.handle.replace('@', '').toLowerCase();
            const newLocalPath = `assets/developers/${handleClean}/avatar.jpg`;
            
            selectOptions.push({
                id: author.handle,
                label: author.handle,
                iconHtml: `<img src="${newLocalPath}" alt="Avatar" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackAvatarUri}';">`
            });
        });

        authorSelect.populate(selectOptions, 'all');

        if (feedData.length > 0) {
            model.setPosts(feedData);
            controller.start();
        } else {
            controller.renderEmptyState();
        }

    } catch (error) {
        controller.renderErrorState('Не удалось загрузить ленту. База данных недоступна или повреждена.');
    }
});