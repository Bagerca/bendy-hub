import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';
import { LibraryManager } from './LibraryManager.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    const library = new LibraryManager();

    try {
        // 1. Получаем список папок
        const gameFolders = await fetchData('data/games_index.json'); 
        
        // 2. Параллельно загружаем data.json из каждой папки
        const gamePromises = gameFolders.map(folderId => 
            fetchData(`assets/games/${folderId}/data.json`).catch(err => {
                console.warn(`Не удалось загрузить данные для: ${folderId}`);
                return null; // Если файл поврежден, пропускаем игру, не ломая сайт
            })
        );
        
        const results = await Promise.all(gamePromises);
        const validGames = results.filter(game => game !== null);

        // 3. Рендерим библиотеку
        library.render(validGames);
    } catch (error) {
        library.showError('Сбой доступа к индексу архивов Joey Drew Studios.');
    }
});