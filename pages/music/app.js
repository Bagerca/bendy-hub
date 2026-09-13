import { MusicModel } from './MusicModel.js';
import { MusicView } from './MusicView.js';
import { MusicController } from './MusicController.js';
import { Icons } from '../../shared/js/icons.js';

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

    // 1. Инициализация выпадающего списка СОРТИРОВКИ (Двойные ползунки)
    const iconDate = `<div class="svg-icon">${Icons.sort_date}</div>`;
    const iconAlpha = `<div class="svg-icon">${Icons.sort_alpha}</div>`;
    
    // Кастомные иконки для убывания/возрастания
    const iconDesc = `<div class="svg-icon">${Icons.sort_desc}</div>`;
    const iconAsc = `<div class="svg-icon">${Icons.sort_asc}</div>`;

    const sortSelect = new window.CustomSelect('sort-filter-container', {
        keepPlaceholder: true,
        placeholder: 'Сортировка',
        triggerIcon: `<div class="svg-icon">${Icons.filter_sort}</div>`,
        onChange: (selectedIds) => {
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
    ], ['date', 'desc']);

    // 2. Инициализация выпадающего списка АВТОРОВ (Мульти-селект)
    const authorSelect = new window.CustomSelect('author-filter-container', {
        multiple: true,
        keepPlaceholder: true,
        placeholder: 'Авторы',
        triggerIcon: `<div class="svg-icon">${Icons.stat_users}</div>`,
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