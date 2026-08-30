import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';
import { Icons } from '../../shared/js/icons.js';

export async function init() {
    const model = new CatalogModel();
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    const typeSelect = new window.CustomSelect('type-filter-container', (selectedId) => {
        controller.handleFilterChange({ type: selectedId });
    });

    const iconAll = `<div class="svg-icon">${Icons.cat_all}</div>`;
    const iconGame = `<div class="svg-icon">${Icons.stat_gamepad}</div>`;
    const iconBook = `<div class="svg-icon">${Icons.stat_book}</div>`;
    
    // Заменили иконку YouTube на новую иконку кинопленки
    const iconMovie = `<div class="svg-icon">${Icons.cat_movie}</div>`;

    typeSelect.populate([
        { id: 'all', label: 'Все проекты', iconHtml: iconAll },
        { id: 'game', label: 'Игры', iconHtml: iconGame },
        { id: 'book', label: 'Книги и Комиксы', iconHtml: iconBook },
        { id: 'movie', label: 'Анимация', iconHtml: iconMovie }
    ], 'all');

    const dateBtn = document.getElementById('sort-date-btn');
    const alphaBtn = document.getElementById('sort-alpha-btn');
    
    dateBtn.innerHTML = `${Icons.sort_date}${Icons.sort_arrow}`;
    alphaBtn.innerHTML = `${Icons.sort_alpha}${Icons.sort_arrow}`;

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

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));

    dateBtn.setAttribute('data-dir', 'asc');
    await controller.init();
    
    return controller;
}