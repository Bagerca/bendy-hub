import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';
import { Icons } from '../../shared/js/icons.js';

export async function init() {
    const model = new CatalogModel();
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    // 1. Инициализация выпадающего списка ТИПОВ
    const typeSelect = new window.CustomSelect('type-filter-container', (selectedId) => {
        controller.handleFilterChange({ type: selectedId });
    });

    const iconAll = `<div class="svg-icon">${Icons.cat_all}</div>`;
    const iconGame = `<div class="svg-icon">${Icons.stat_gamepad}</div>`;
    const iconBook = `<div class="svg-icon">${Icons.stat_book}</div>`;
    const iconMovie = `<div class="svg-icon">${Icons.cat_movie}</div>`;

    typeSelect.populate([
        { id: 'all', label: 'Все проекты', iconHtml: iconAll },
        { id: 'game', label: 'Игры', iconHtml: iconGame },
        { id: 'book', label: 'Книги и Комиксы', iconHtml: iconBook },
        { id: 'movie', label: 'Анимация', iconHtml: iconMovie }
    ], 'all');

    // 2. Инициализация выпадающего списка СОРТИРОВКИ
    let currentSortType = 'date';
    let currentSortDir = 'desc'; 

    const iconDate = `<div class="svg-icon">${Icons.sort_date}</div>`;
    const iconAlpha = `<div class="svg-icon">${Icons.sort_alpha}</div>`;

    const sortSelect = new window.CustomSelect('sort-filter-container', (selectedId) => {
        if (currentSortType === selectedId) {
            // Если кликаем по уже активной кнопке — меняем направление
            currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            // Если выбрали другую — применяем её дефолтное направление
            currentSortType = selectedId;
            currentSortDir = selectedId === 'date' ? 'desc' : 'asc';
        }
        
        updateSortUI();
        controller.handleFilterChange({ sort: `${currentSortType}_${currentSortDir}` });
    });

    function updateSortUI() {
        const getArrow = (dir) => `<span class="sort-dir-wrap ${dir}">${Icons.sort_dir}</span>`;
        
        sortSelect.populate([
            { 
                id: 'date', 
                label: `По дате ${currentSortType === 'date' ? getArrow(currentSortDir) : ''}`, 
                iconHtml: iconDate 
            },
            { 
                id: 'alpha', 
                label: `По алфавиту ${currentSortType === 'alpha' ? getArrow(currentSortDir) : ''}`, 
                iconHtml: iconAlpha 
            }
        ], currentSortType);
    }

    updateSortUI(); // Первичная отрисовка списка сортировки

    // 3. Поиск
    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));

    await controller.init();
    
    return controller;
}