import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';
import { Icons } from '../../shared/js/icons.js';
import { SharedFilters } from '../../shared/js/SharedFilters.js';

export async function init() {
    const model = new CatalogModel();
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    const iconAll = `<div class="svg-icon">${Icons.cat_all}</div>`;
    const iconGame = `<div class="svg-icon">${Icons.stat_gamepad}</div>`;
    const iconBook = `<div class="svg-icon">${Icons.stat_book}</div>`;
    const iconMovie = `<div class="svg-icon">${Icons.cat_movie}</div>`;

    // 1. Инициализация выпадающего списка ТИПОВ (Мульти-селект)
    const typeSelect = new window.CustomSelect('type-filter-container', {
        multiple: true,
        keepPlaceholder: true,
        placeholder: 'Все проекты',
        triggerIcon: iconAll,
        onChange: (selectedIds) => {
            controller.handleFilterChange({ type: selectedIds });
        }
    });

    const typeOptions = [
        { id: 'game', label: 'Игры', iconHtml: iconGame },
        { id: 'book', label: 'Книги и Комиксы', iconHtml: iconBook },
        { id: 'movie', label: 'Анимация', iconHtml: iconMovie }
    ];
    
    typeSelect.populate(typeOptions, typeOptions.map(o => o.id));

    // 2. Инициализация выпадающего списка СОРТИРОВКИ через глобальную Фабрику Фильтров
    SharedFilters.initSortFilter(
        'sort-filter-container', 
        ['date', 'asc'], 
        (sortValue) => controller.handleFilterChange({ sort: sortValue })
    );

    // 3. Поиск
    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));

    await controller.init();
    return controller;
}