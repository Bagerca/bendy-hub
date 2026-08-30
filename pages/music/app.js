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

    const dateBtn = document.getElementById('sort-date-btn');
    const alphaBtn = document.getElementById('sort-alpha-btn');
    const gridBtn = document.getElementById('btn-view-grid');
    const listBtn = document.getElementById('btn-view-list');

    // Вставляем иконки
    dateBtn.innerHTML = `${Icons.sort_date}${Icons.sort_arrow}`;
    alphaBtn.innerHTML = `${Icons.sort_alpha}${Icons.sort_arrow}`;
    gridBtn.innerHTML = Icons.view_grid;
    listBtn.innerHTML = Icons.view_list;
    
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

    dateBtn.addEventListener('click', () => {
        currentSortDir = currentSortType === 'date' && currentSortDir === 'asc' ? 'desc' : 'asc';
        currentSortType = 'date';
        updateSortUI();
    });
    
    alphaBtn.addEventListener('click', () => {
        currentSortDir = currentSortType === 'alpha' && currentSortDir === 'asc' ? 'desc' : 'asc';
        currentSortType = 'alpha';
        updateSortUI();
    });

    dateBtn.setAttribute('data-dir', 'asc');
    await controller.init();

    return controller;
}