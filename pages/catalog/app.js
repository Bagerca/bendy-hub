import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js';
import { debounce } from '../../shared/js/utils.js';

import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new CatalogModel();
    // Передаем новые семантические ID шаблонов
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    const typeSelect = new CustomSelect('type-filter-container', (selectedId) => {
        controller.handleFilterChange(document.getElementById('search-input').value, selectedId);
    });

    typeSelect.populate([
        { id: 'all', label: 'Все проекты' },
        { id: 'game', label: 'Игры' },
        { id: 'book', label: 'Книги и Комиксы' },
        { id: 'movie', label: 'Анимация' }
    ], 'all');

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    const triggerSearch = () => {
        const activeItem = document.querySelector('#type-filter-container .custom-select-option.selected .custom-select-text span');
        let currentType = 'all';
        if (activeItem) {
            const label = activeItem.textContent;
            if (label === 'Игры') currentType = 'game';
            else if (label === 'Книги и Комиксы') currentType = 'book';
            else if (label === 'Анимация') currentType = 'movie';
        }
        controller.handleFilterChange(searchInput.value, currentType);
    };

    searchInput.addEventListener('input', debounce(triggerSearch, 300));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); triggerSearch(); }
    });
    searchBtn.addEventListener('click', triggerSearch);

    controller.init();
});