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

    // 1. Инициализация выпадающего списка СОРТИРОВКИ
    let currentSortType = 'date';
    let currentSortDir = 'desc'; 

    const iconDate = `<div class="svg-icon">${Icons.sort_date}</div>`;
    const iconAlpha = `<div class="svg-icon">${Icons.sort_alpha}</div>`;

    const sortSelect = new window.CustomSelect('sort-filter-container', (selectedId) => {
        if (currentSortType === selectedId) {
            currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
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

    updateSortUI(); // Первичная отрисовка списка

    // 2. Инициализация выпадающего списка АВТОРОВ
    const authorSelect = new window.CustomSelect('author-filter-container', (selectedId) => {
        controller.handleFilterChange({ author: selectedId });
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