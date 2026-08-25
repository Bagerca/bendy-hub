import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { InfiniteScroll } from '../../shared/js/components/InfiniteScroll.js';
import { fetchData } from '../../shared/js/api.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';
import { debounce } from '../../shared/js/utils.js';

import { FeedModel } from './FeedModel.js';
import { PostView } from './PostView.js';
import { FeedController } from './FeedController.js';
import { TranslationService } from './services/TranslationService.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js'; // Используем единый компонент

customElements.define('site-header', SiteHeader);

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

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    let currentSelectedAuthor = 'all';

    const triggerSearch = () => {
        controller.handleSearchOrFilter(searchInput.value, currentSelectedAuthor);
    };

    const authorSelect = new CustomSelect('author-filter-container', (selectedId) => {
        currentSelectedAuthor = selectedId;
        triggerSearch();
    });

    try {
        const data = await fetchData('data/feed.json'); 
        const feedData = Array.isArray(data) ? data : [];

        // Иконка для пункта "Все разработчики" (Обычный SVG)
        const allDevsIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`;
        
        // Закодированная SVG картинка для атрибута src (решает баг со сломанными кавычками)
        const fallbackAvatarUri = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%238B949E' stroke-width='2'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";

        const selectOptions = [
            { id: 'all', label: 'Все разработчики', iconHtml: allDevsIcon }
        ];

        TRACKED_AUTHORS.forEach(author => {
            const latestPost = feedData.find(p => p.authorHandle.toLowerCase() === author.handle.toLowerCase());
            const predictedLocalPath = `assets/avatars/${author.handle.replace('@', '').toLowerCase()}.jpg`;
            const avatarUrl = latestPost?.localAvatarPath || latestPost?.originalAvatarUrl || predictedLocalPath;
            
            // Безопасный onerror без ломающихся кавычек
            selectOptions.push({
                id: author.handle,
                label: author.handle,
                iconHtml: `<img src="${avatarUrl}" alt="Avatar" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackAvatarUri}';">`
            });
        });

        authorSelect.populate(selectOptions, 'all');

        if (feedData.length > 0) {
            model.setPosts(feedData);
            controller.start();
        } else {
            controller.renderEmptyState();
        }

        searchInput.addEventListener('input', debounce(triggerSearch, 400));
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                triggerSearch();
            }
        });
        searchBtn.addEventListener('click', triggerSearch);

    } catch (error) {
        controller.renderErrorState('Не удалось загрузить ленту. База данных недоступна или повреждена.');
    }
});