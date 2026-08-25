import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';
import { PostRenderer } from './PostRenderer.js';
import { FeedManager } from './FeedManager.js';
import { CustomSelect } from './CustomSelect.js';

customElements.define('site-header', SiteHeader);

// ЖЕСТКО ЗАДАННЫЙ СПИСОК АВТОРОВ (Чтобы они всегда были в фильтре, даже если постов нет)
const TRACKED_AUTHORS = [
    { handle: '@Bendy', name: 'Bendy' },  // ДОБАВЛЕН
    { handle: '@themeatly', name: 'theMeatly' },
    { handle: '@m_ZeroLogics', name: 'Mike Mood' },
    { handle: '@BLacroix30', name: 'Brian Lacroix' },
    { handle: '@bookpast', name: 'Adrienne' },
    { handle: '@BendyRun', name: "Bendy's Nightmare Run" },
    { handle: '@GentCorporation', name: 'GENT' },
    { handle: '@Doberart', name: 'Elizabeth King' }
];

document.addEventListener('DOMContentLoaded', async () => {
    console.info('[FeedApp] Инициализация ленты...');
    
    const lightbox = new LightboxManager('lightbox', 'lightbox-img');
    const renderer = new PostRenderer('post-template', lightbox);
    const feed = new FeedManager('feed-content', 'scroll-sentinel', renderer);

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    let currentSelectedAuthor = 'all';

    const executeSearch = () => {
        feed.applyFilters(searchInput.value, currentSelectedAuthor);
    };

    const authorSelect = new CustomSelect('author-filter-container', (selected) => {
        currentSelectedAuthor = selected;
        executeSearch(); 
    });

    try {
        const data = await fetchData('data/feed.json'); 
        
        // Если feed.json пустой, не крашим приложение, а просто продолжаем с пустым массивом
        const feedData = Array.isArray(data) ? data : [];

        // Формируем список для дропдауна из жестко заданного массива
        const authorsForDropdown = TRACKED_AUTHORS.map(author => {
            // Ищем автора в кэше постов, чтобы взять его последнюю сохраненную аватарку
            const latestPost = feedData.find(p => p.authorHandle.toLowerCase() === author.handle.toLowerCase());
            
            // Если поста нет, мы все равно знаем, как python сохраняет локальную картинку:
            const predictedLocalPath = `assets/avatars/${author.handle.replace('@', '').toLowerCase()}.jpg`;
            
            return {
                handle: author.handle,
                name: author.name,
                // Приоритет: Локальный путь из JSON -> Оригинальный URL из JSON -> Предсказанный локальный путь
                avatarUrl: latestPost?.localAvatarPath || latestPost?.originalAvatarUrl || predictedLocalPath
            };
        });
        
        authorSelect.populate(authorsForDropdown);
        
        if (feedData.length > 0) {
            feed.setPosts(feedData);
        } else {
            feed.showError('В базе данных пока нет твитов. Попробуйте обновить архивы.');
        }

        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                executeSearch();
            }
        });

        searchBtn.addEventListener('click', () => {
            executeSearch();
        });

    } catch (error) {
        feed.showError('Не удалось загрузить ленту. База данных недоступна.');
    }
});