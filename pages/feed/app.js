import { InfiniteScroll } from '../../shared/js/components/InfiniteScroll.js';
import { fetchData } from '../../shared/js/api.js';
import { FeedModel } from './FeedModel.js';
import { PostView } from './PostView.js';
import { FeedController } from './FeedController.js';
import { Icons } from '../../shared/js/icons.js';

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
    let currentPostType = 'all';
    let currentSearchTerm = '';

    const triggerSearch = () => controller.handleSearchOrFilter(currentSearchTerm, currentSelectedAuthor, currentPostType);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = null; 
    
    searchControls.addEventListener('onSearch', (e) => {
        currentSearchTerm = e.detail;
        triggerSearch();
    });

    // --- ФИЛЬТР: АВТОРЫ ---
    const authorSelect = new window.CustomSelect('author-filter-container', (selectedId) => {
        currentSelectedAuthor = selectedId;
        triggerSearch();
    });

    // --- ФИЛЬТР: ТИП ПОСТА (Без "Ответы фанатам") ---
    const typeSelect = new window.CustomSelect('type-filter-container', (selectedId) => {
        currentPostType = selectedId;
        triggerSearch();
    });

    // Иконки для фильтра типов
    const iconPencil = `<div class="svg-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></div>`;
    const iconQuote = `<div class="svg-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div>`;
    const iconRepost = `<div class="svg-icon">${Icons.action_repost}</div>`;

    typeSelect.populate([
        { id: 'all', label: 'Все записи', iconHtml: `<div class="svg-icon">${Icons.cat_all}</div>` },
        { id: 'clean', label: 'Только оригинальные', iconHtml: iconPencil },
        { id: 'quotes', label: 'Только цитаты', iconHtml: iconQuote },
        { id: 'retweets', label: 'Репосты', iconHtml: iconRepost }
    ], 'all');

    try {
        const allDevsIcon = `<div class="svg-icon">${Icons.cat_all}</div>`;
        const fallbackAvatarUri = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

        const selectOptions = [{ id: 'all', label: 'Все разработчики', iconHtml: allDevsIcon }];

        const feedPromises = TRACKED_AUTHORS.map(author => {
            const handleClean = author.handle.replace('@', '').toLowerCase();
            
            selectOptions.push({
                id: author.handle, 
                label: author.name, 
                iconHtml: `<img src="assets/developers/${handleClean}/avatar.jpg" alt="Avatar" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackAvatarUri}';">`
            });

            return fetchData(`assets/developers/${handleClean}/feed.json`).catch(() => []);
        });

        authorSelect.populate(selectOptions, 'all');

        const results = await Promise.all(feedPromises);
        let combinedFeed = [];
        results.forEach(feedArray => {
            if (Array.isArray(feedArray)) combinedFeed.push(...feedArray);
        });

        if (combinedFeed.length > 0) {
            model.setPosts(combinedFeed);
            controller.start();
        } else {
            controller.renderEmptyState();
        }

    } catch (error) {
        controller.renderErrorState('Не удалось загрузить ленту.');
    }
    
    return controller;
}