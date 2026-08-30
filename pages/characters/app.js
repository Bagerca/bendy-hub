import { CharactersModel } from './CharactersModel.js';
import { CharactersView } from './CharactersView.js';
import { CharactersController } from './CharactersController.js';
import { Icons } from '../../shared/js/icons.js';

export async function init() {
    const model = new CharactersModel();
    const view = new CharactersView();
    const controller = new CharactersController(model, view);

    const searchControls = document.querySelector('search-controls');
    searchControls.suggestionProvider = (query) => model.getSuggestions(query);
    searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));

    const categorySelect = new window.CustomSelect('category-filter-container', (selectedId) => {
        controller.handleFilterChange({ category: selectedId });
    });

    const iconAll = `<div class="svg-icon">${Icons.cat_all}</div>`;
    const iconHuman = `<div class="svg-icon">${Icons.cat_human}</div>`;
    const iconInk = `<div class="svg-icon">${Icons.cat_ink}</div>`;
    const iconToon = `<div class="svg-icon">${Icons.cat_toon}</div>`;
    
    categorySelect.populate([
        { id: 'all', label: 'Все категории', iconHtml: iconAll },
        { id: 'human', label: 'Люди', iconHtml: iconHuman },
        { id: 'ink', label: 'Чернильные сущности', iconHtml: iconInk },
        { id: 'toon', label: 'Мультяшки', iconHtml: iconToon }
    ], 'all');

    await controller.init();
    return controller;
}