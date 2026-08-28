import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js';
import { SearchControls } from '../../shared/js/components/SearchControls.js';

import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';

customElements.define('site-header', SiteHeader);
customElements.define('search-controls', SearchControls);

document.addEventListener('DOMContentLoaded', () => {
    const model = new CatalogModel();
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    // === ФИЛЬТР: ТИП ПРОЕКТА ===
    const typeSelect = new CustomSelect('type-filter-container', (selectedId) => {
        controller.handleFilterChange({ type: selectedId });
    });

    typeSelect.populate([
        { id: 'all', label: 'Все проекты' },
        { id: 'game', label: 'Игры' },
        { id: 'book', label: 'Книги и Комиксы' },
        { id: 'movie', label: 'Анимация' }
    ], 'all');

    // === НОВАЯ СОРТИРОВКА: ТОГГЛЫ ===
    const dateBtn = document.getElementById('sort-date-btn');
    const alphaBtn = document.getElementById('sort-alpha-btn');
    
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

    // === ПОИСК (Связь с компонентом умного поиска) ===
    const searchControls = document.querySelector('search-controls');
    
    // Провайдер данных для отрисовки dropdown подсказок
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    
    // Реальный поиск (меняющий DOM карточек), срабатывающий по клику лупы / нажатию Enter / выбору саджеста
    searchControls.addEventListener('onSearch', (e) => {
        controller.handleFilterChange({ search: e.detail });
    });

    // Старт
    dateBtn.setAttribute('data-dir', 'asc');
    controller.init();
});