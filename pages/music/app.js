import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { SearchControls } from '../../shared/js/components/SearchControls.js';

import { MusicModel } from './MusicModel.js';
import { MusicView } from './MusicView.js';
import { AudioPlayer } from './AudioPlayer.js';
import { MusicController } from './MusicController.js';

customElements.define('site-header', SiteHeader);
customElements.define('search-controls', SearchControls);

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация MVC слоев
    const model = new MusicModel();
    const view = new MusicView();
    const player = new AudioPlayer();
    const controller = new MusicController(model, view, player);

    // 2. Инициализация UI поиска
    const searchControls = document.querySelector('search-controls');
    
    // Предоставляем функцию для автодополнения (показывает треки и авторов)
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    
    // Принимаем окончательный запрос
    searchControls.addEventListener('onSearch', (e) => {
        controller.handleSearch(e.detail);
    });

    // 3. Запуск
    controller.init();
});