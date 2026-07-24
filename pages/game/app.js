import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';
import { LightboxManager } from '../../shared/js/Lightbox.js';
import { GameManager } from './GameManager.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    const lightbox = new LightboxManager('lightbox', 'lightbox-img');
    const manager = new GameManager(lightbox);

    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');

    if (!gameId) {
        manager.showError('Игра не найдена. Некорректная ссылка.');
        return;
    }

    try {
        // ЗАГРУЖАЕМ ТОЛЬКО ФАЙЛ ИЗ ПАПКИ ЭТОЙ ИГРЫ!
        const gameData = await fetchData(`assets/games/${gameId}/data.json`);
        manager.render(gameData, gameId);
    } catch (error) {
        manager.showError('Информация о данной игре отсутствует в архивах или файл поврежден.');
    }
});