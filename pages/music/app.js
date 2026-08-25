import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { debounce } from '../../shared/js/utils.js';

import { MusicModel } from './MusicModel.js';
import { MusicView } from './MusicView.js';
import { AudioPlayer } from './AudioPlayer.js';
import { MusicController } from './MusicController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация MVC слоев
    const model = new MusicModel();
    const view = new MusicView();
    const player = new AudioPlayer();
    const controller = new MusicController(model, view, player);

    // 2. Инициализация UI поиска
    const searchInput = document.getElementById('search-input');
    
    searchInput.addEventListener('input', debounce((e) => {
        controller.handleSearch(e.target.value);
    }, 300));
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            controller.handleSearch(e.target.value);
        }
    });

    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            controller.handleSearch(searchInput.value);
        });
    }

    // 3. Запуск
    controller.init();
});