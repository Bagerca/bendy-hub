import { MusicModel } from './MusicModel.js';
import { MusicView } from './MusicView.js';
import { MusicController } from './MusicController.js';
import { Icons } from '../../shared/js/icons.js';
import { SharedFilters } from '../../shared/js/SharedFilters.js';

export async function init() {
    const model = new MusicModel();
    const view = new MusicView();
    const player = window.globalPlayer; 
    
    const controller = new MusicController(model, view, player);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => {
        controller.handleFilterChange({ search: e.detail });
    });

    // 1. Инициализация выпадающего списка СОРТИРОВКИ через глобальную Фабрику Фильтров
    SharedFilters.initSortFilter(
        'sort-filter-container', 
        ['date', 'desc'], 
        (sortValue) => controller.handleFilterChange({ sort: sortValue })
    );

    // 2. Инициализация выпадающего списка АВТОРОВ (Мульти-селект)
    const authorSelect = new window.CustomSelect('author-filter-container', {
        multiple: true,
        keepPlaceholder: true,
        placeholder: 'Авторы',
        triggerIcon: `<div class="svg-icon">${Icons.filter_authors || Icons.stat_users}</div>`, // Заменили иконку
        onChange: (selectedIds) => {
            controller.handleFilterChange({ authors: selectedIds });
        }
    });

    controller.authorSelect = authorSelect; 

    // 3. Кнопки отображения
    const gridBtn = document.getElementById('btn-view-grid');
    const listBtn = document.getElementById('btn-view-list');
    gridBtn.innerHTML = Icons.view_grid;
    listBtn.innerHTML = Icons.view_list;

    await controller.init();

    return controller;
}