import { CharactersModel } from './CharactersModel.js';
import { CharactersView } from './CharactersView.js';
import { CharactersController } from './CharactersController.js';
import { Icons } from '../../shared/js/icons.js';

export async function init() {
    const model = new CharactersModel();
    const view = new CharactersView();
    const controller = new CharactersController(model, view);

    // 1. Инициализация поиска (с защитой от Null)
    const searchControls = document.querySelector('search-controls');
    if (searchControls) {
        searchControls.suggestionProvider = (query) => model.getSuggestions(query);
        searchControls.addEventListener('onSearch', (e) => controller.handleFilterChange({ search: e.detail }));
    } else {
        console.warn("[Characters] Элемент <search-controls> не найден. Поиск отключен.");
    }

    // 2. Инициализация категорий (с защитой от Null)
    const categoryContainer = document.getElementById('category-filter-container');
    if (categoryContainer) {
        const categorySelect = new window.CustomSelect('category-filter-container', {
            multiple: true,
            keepPlaceholder: true,
            placeholder: 'Категории',
            triggerIcon: `<div class="svg-icon">${Icons.cat_all}</div>`,
            onChange: (selectedIds) => {
                controller.handleFilterChange({ category: selectedIds });
            }
        });

        const iconHuman = `<div class="svg-icon">${Icons.cat_human}</div>`;
        const iconInk = `<div class="svg-icon">${Icons.cat_ink}</div>`;
        const iconToon = `<div class="svg-icon">${Icons.cat_toon}</div>`;
        // Иконка для неопознанных персонажей
        const iconOther = `<div class="svg-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg></div>`;
        
        const catOptions = [
            { id: 'human', label: 'Люди', iconHtml: iconHuman },
            { id: 'ink', label: 'Чернильные сущности', iconHtml: iconInk },
            { id: 'toon', label: 'Мультяшки', iconHtml: iconToon },
            { id: 'other', label: 'Прочее', iconHtml: iconOther }
        ];

        categorySelect.populate(catOptions, catOptions.map(o => o.id));
    }

    await controller.init();
    return controller;
}