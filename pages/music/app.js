import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';
import { debounce } from '../../shared/js/utils.js';
import { MusicManager } from './MusicManager.js';
import { AudioPlayer } from './AudioPlayer.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    
    const manager = new MusicManager();
    const player = new AudioPlayer(manager); // Передаем ссылку на менеджер
    manager.setPlayer(player); // И обратно, чтобы они могли общаться

    const searchInput = document.getElementById('search-input');
    
    // Закрытие модалки
    manager.closeBtn.addEventListener('click', () => manager.closeLyrics());
    manager.modal.addEventListener('click', (e) => {
        const rect = manager.modal.getBoundingClientRect();
        if (!(rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width)) {
            manager.closeLyrics();
        }
    });

    try {
        // Загружаем наш сгенерированный JSON
        const songsData = await fetchData('data/songs.json');
        manager.setTracks(songsData);

        searchInput.addEventListener('input', debounce((e) => {
            manager.applySearch(e.target.value);
        }, 300));

    } catch (error) {
        document.getElementById('music-loader').style.display = 'none';
        document.getElementById('music-grid').innerHTML = `<div class="error-card" style="grid-column: 1/-1"><p>Ошибка загрузки аудио архивов. Файл data/songs.json не найден.</p></div>`;
        document.getElementById('music-grid').style.display = 'block';
    }
});