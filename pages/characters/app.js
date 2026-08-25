import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js';
import { debounce } from '../../shared/js/utils.js';

import { CharactersModel } from './CharactersModel.js';
import { CharactersView } from './CharactersView.js';
import { CharactersController } from './CharactersController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    // 1. MVC Инициализация
    const model = new CharactersModel();
    const view = new CharactersView();
    const controller = new CharactersController(model, view);

    // 2. Инициализация UI элементов
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // Настройка универсального селекта категорий
    const categorySelect = new CustomSelect('category-filter-container', (selectedId) => {
        controller.handleFilterChange({ category: selectedId });
    });

    // Иконка по умолчанию для категорий
    const catIcon = `<div class="svg-icon"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></div>`;
    
    categorySelect.populate([
        { id: 'all', label: 'Все категории', iconHtml: catIcon },
        { id: 'human', label: 'Люди', iconHtml: catIcon },
        { id: 'ink', label: 'Чернильные сущности', iconHtml: catIcon },
        { id: 'toon', label: 'Мультяшки', iconHtml: catIcon }
    ], 'all');

    // 3. Обработчики поиска
    searchInput.addEventListener('input', debounce((e) => {
        controller.handleFilterChange({ search: e.target.value });
    }, 300));
    
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            controller.handleFilterChange({ search: searchInput.value });
        }
    });
    
    searchBtn.addEventListener('click', () => {
        controller.handleFilterChange({ search: searchInput.value });
    });

    // 4. Запуск
    controller.init();
});