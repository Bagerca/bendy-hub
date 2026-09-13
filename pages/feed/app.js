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

    let currentSelectedAuthors = [];
    let currentPostTypes = [];
    let currentSearchTerm = '';
    let currentSortDir = 'desc'; // По умолчанию новые

    const triggerSearch = () => controller.handleSearchOrFilter(currentSearchTerm, currentSelectedAuthors, currentPostTypes, currentSortDir);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = null; 
    
    searchControls.addEventListener('onSearch', (e) => {
        currentSearchTerm = e.detail;
        triggerSearch();
    });

    const iconLayers = `<div class="svg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg></div>`;
    const iconUsers = `<div class="svg-icon">${Icons.stat_users}</div>`;

    const iconPencil = `<div class="svg-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></div>`;
    const iconQuote = `<div class="svg-icon"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg></div>`;
    const iconRepost = `<div class="svg-icon">${Icons.action_repost}</div>`;
    const iconImage = `<div class="svg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg></div>`;
    const iconVideo = `<div class="svg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg></div>`;
    const iconLink = `<div class="svg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg></div>`;

    // 1. Инициализация ОБЪЕДИНЕННОГО списка (Сортировка + Типы)
    const filterOptions = [
        {
            id: 'sort_dir',
            type: 'dual-toggle',
            state1: { id: 'desc', label: 'С новых', iconHtml: `<div class="svg-icon">${Icons.sort_desc}</div>` },
            state2: { id: 'asc', label: 'Со старых', iconHtml: `<div class="svg-icon">${Icons.sort_asc}</div>` }
        },
        { id: 'clean', label: 'Оригинальные', iconHtml: iconPencil },
        { id: 'quotes', label: 'Цитаты', iconHtml: iconQuote },
        { id: 'retweets', label: 'Репосты', iconHtml: iconRepost },
        { id: 'images', label: 'С картинками', iconHtml: iconImage },
        { id: 'videos', label: 'С видео / GIF', iconHtml: iconVideo },
        { id: 'links', label: 'Карточки ссылок', iconHtml: iconLink }
    ];
    
    currentPostTypes = filterOptions.filter(o => o.type !== 'dual-toggle').map(o => o.id);

    const typeSelect = new window.CustomSelect('type-filter-container', {
        multiple: true,
        keepPlaceholder: true,
        placeholder: 'Настройки ленты',
        triggerIcon: iconLayers,
        onChange: (selectedIds) => {
            currentSortDir = selectedIds.includes('asc') ? 'asc' : 'desc';
            currentPostTypes = selectedIds.filter(id => id !== 'asc' && id !== 'desc' && id !== 'sort_dir');
            triggerSearch();
        }
    });

    const initialSettings = [currentSortDir, ...currentPostTypes];
    typeSelect.populate(filterOptions, initialSettings);

    // 2. Инициализация списка АВТОРОВ
    try {
        const fallbackAvatarUri = Icons.avatar_fallback;
        const authorOptions = [];

        const feedPromises = TRACKED_AUTHORS.map(author => {
            const handleClean = author.handle.replace('@', '').toLowerCase();
            
            authorOptions.push({
                id: author.handle, 
                label: author.name, 
                iconHtml: `<img src="assets/developers/${handleClean}/avatar.jpg" alt="Avatar" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackAvatarUri}';">`
            });

            return fetchData(`assets/developers/${handleClean}/feed.json`).catch(() => []);
        });

        currentSelectedAuthors = authorOptions.map(o => o.id);

        const authorSelect = new window.CustomSelect('author-filter-container', {
            multiple: true,
            keepPlaceholder: true,
            placeholder: 'Разработчики',
            triggerIcon: iconUsers,
            onChange: (selectedIds) => {
                currentSelectedAuthors = selectedIds;
                triggerSearch();
            }
        });

        authorSelect.populate(authorOptions, currentSelectedAuthors);

        // Сборка ленты
        const results = await Promise.all(feedPromises);
        let combinedFeed = [];
        results.forEach(feedArray => {
            if (Array.isArray(feedArray)) combinedFeed.push(...feedArray);
        });

        if (combinedFeed.length > 0) {
            model.setPosts(combinedFeed);
            controller.handleSearchOrFilter(currentSearchTerm, currentSelectedAuthors, currentPostTypes, currentSortDir);
        } else {
            controller.renderEmptyState();
        }

    } catch (error) {
        controller.renderErrorState('Не удалось загрузить ленту.');
    }
    
    return controller;
}