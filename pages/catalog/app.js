import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';
import { Icons } from '../../shared/js/icons.js';

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
    
    // Передаем все id по умолчанию, чтобы галочки стояли везде
    typeSelect.populate(typeOptions, typeOptions.map(o => o.id));

    // 2. Инициализация выпадающего списка СОРТИРОВКИ (Двойные ползунки)
    const iconDate = `<div class="svg-icon">${Icons.sort_date}</div>`;
    const iconAlpha = `<div class="svg-icon">${Icons.sort_alpha}</div>`;
    
    const iconDesc = `<div class="svg-icon">${Icons.sort_desc}</div>`;
    const iconAsc = `<div class="svg-icon">${Icons.sort_asc}</div>`;

    const sortSelect = new window.CustomSelect('sort-filter-container', {
        keepPlaceholder: true,
        placeholder: 'Сортировка',
        triggerIcon: `<div class="svg-icon">${Icons.filter_sort}</div>`,
        onChange: (selectedIds) => {
            // selectedIds будет содержать 2 значения, например ['date', 'desc'] или ['alpha', 'asc']
            const type = selectedIds.includes('alpha') ? 'alpha' : 'date';
            const dir = selectedIds.includes('asc') ? 'asc' : 'desc';
            controller.handleFilterChange({ sort: `${type}_${dir}` });
        }
    });

    sortSelect.populate([
        {
            id: 'sort_type',
            type: 'dual-toggle',
            state1: { id: 'date', label: 'По дате', iconHtml: iconDate },
            state2: { id: 'alpha', label: 'По алфавиту', iconHtml: iconAlpha }
        },
        {
            id: 'sort_dir',
            type: 'dual-toggle',
            state1: { id: 'desc', label: 'Убывание', iconHtml: iconDesc },
            state2: { id: 'asc', label: 'Возрастание', iconHtml: iconAsc }
        }
    ], ['date', 'asc']); // ИСПРАВЛЕНО: Теперь UI соответствует дефолту модели ('date_asc')

    // 3. Поиск
    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));

    await controller.init();
    return controller;
}