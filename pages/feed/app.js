import { InfiniteScroll } from '../../shared/js/components/InfiniteScroll.js';
import { fetchData } from '../../shared/js/api.js';
import { FeedModel } from './FeedModel.js';
import { PostView } from './PostView.js';
import { FeedController } from './FeedController.js';
import { Icons } from '../../shared/js/icons.js'; // Импортируем иконки

const TRACKED_AUTHORS = [
    { handle: '@Bendy', name: 'Bendy' },
    { handle: '@themeatly', name: 'theMeatly' },
    { handle: '@m_ZeroLogics', name: 'Mike Desjardins' },
    { handle: '@BLacroix30', name: 'Ben Lacroix' },
    { handle: '@bookpast', name: 'Bookpast' },
    { handle: '@BendyRun', name: "Bendy's Nightmare Run" },
    { handle: '@GentCorporation', name: 'GENT' },
    { handle: '@Doberart', name: 'Elizabeth King' }
];

export async function init() {
    const model = new FeedModel(20);
    
    const authorNamesMap = {};
    TRACKED_AUTHORS.forEach(author => {
        authorNamesMap[author.handle.toLowerCase()] = author.name;
    });

    const view = new PostView('post-template', window.globalLightbox, window.globalTranslator, authorNamesMap);
    const controller = new FeedController(model, view, null);
    
    const scroller = new InfiniteScroll('scroll-sentinel', () => controller.appendNextChunk());
    controller.scroller = scroller;

    let currentSelectedAuthor = 'all';
    let currentSearchTerm = '';

    const triggerSearch = () => controller.handleSearchOrFilter(currentSearchTerm, currentSelectedAuthor);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = null; 
    
    searchControls.addEventListener('onSearch', (e) => {
        currentSearchTerm = e.detail;
        triggerSearch();
    });

    const authorSelect = new window.CustomSelect('author-filter-container', (selectedId) => {
        currentSelectedAuthor = selectedId;
        triggerSearch();
    });

    try {
        const data = await fetchData('data/feed.json'); 
        const feedData = Array.isArray(data) ? data : [];

        // Используем иконку cat_all из глобального хранилища
        const allDevsIcon = `<div class="svg-icon">${Icons.cat_all}</div>`;
        const fallbackAvatarUri = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

        const selectOptions = [{ id: 'all', label: 'Все разработчики', iconHtml: allDevsIcon }];

        TRACKED_AUTHORS.forEach(author => {
            const handleClean = author.handle.replace('@', '').toLowerCase();
            selectOptions.push({
                id: author.handle, 
                label: author.name, 
                iconHtml: `<img src="assets/developers/${handleClean}/avatar.jpg" alt="Avatar" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackAvatarUri}';">`
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
        controller.renderErrorState('Не удалось загрузить ленту.');
    }
    
    return controller;
}