import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { SearchControls } from '../../shared/js/components/SearchControls.js';

import { MusicModel } from './MusicModel.js';
import { MusicView } from './MusicView.js';
import { AudioPlayer } from './AudioPlayer.js';
import { MusicController } from './MusicController.js';

customElements.define('site-header', SiteHeader);
customElements.define('search-controls', SearchControls);

document.addEventListener('DOMContentLoaded', () => {
    const model = new MusicModel();
    const view = new MusicView();
    const player = new AudioPlayer();
    const controller = new MusicController(model, view, player);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => {
        controller.handleFilterChange({ search: e.detail });
    });

    // === СОРТИРОВКА ===
    const dateBtn = document.getElementById('sort-date-btn');
    const alphaBtn = document.getElementById('sort-alpha-btn');
    
    // Ставим Date ASC по умолчанию (От старых к новым)
    let currentSortType = 'date';
    let currentSortDir = 'asc'; 

    function updateSortUI() {
        dateBtn.classList.remove('active');
        alphaBtn.classList.remove('active');
        
        const activeBtn = currentSortType === 'date' ? dateBtn : alphaBtn;
        activeBtn.classList.add('active');
        activeBtn.setAttribute('data-dir', currentSortDir);

        controller.handleFilterChange({ sort: `${currentSortType}_${currentSortDir}` });
    }

    function handleSortClick(clickedType) {
        if (currentSortType === clickedType) {
            currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            currentSortType = clickedType;
            currentSortDir = 'asc';
        }
        updateSortUI();
    }

    dateBtn.addEventListener('click', () => handleSortClick('date'));
    alphaBtn.addEventListener('click', () => handleSortClick('alpha'));

    dateBtn.setAttribute('data-dir', 'asc');
    controller.init();
});