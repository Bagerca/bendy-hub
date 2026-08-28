import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { CustomSelect } from '../../shared/js/components/CustomSelect.js';
import { debounce } from '../../shared/js/utils.js';

import { CatalogModel } from './CatalogModel.js';
import { CatalogCardView } from './views/CatalogCardView.js';
import { CatalogController } from './CatalogController.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const model = new CatalogModel();
    const cardView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
    const controller = new CatalogController(model, cardView);

    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');

    // === ФИЛЬТР: ТИП ПРОЕКТА ===
    const typeSelect = new CustomSelect('type-filter-container', (selectedId) => {
        controller.handleFilterChange({ type: selectedId });
    });

    typeSelect.populate([
        { id: 'all', label: 'Все проекты' },
        { id: 'game', label: 'Игры' },
        { id: 'book', label: 'Книги и Комиксы' },
        { id: 'movie', label: 'Анимация' }
    ], 'all');


    // === НОВАЯ СОРТИРОВКА: ТОГГЛЫ ===
    const dateBtn = document.getElementById('sort-date-btn');
    const alphaBtn = document.getElementById('sort-alpha-btn');
    
    // Дефолтное состояние (как в модели)
    let currentSortType = 'date';
    let currentSortDir = 'asc'; 

    function updateSortUI() {
        // Сбрасываем активность с обеих кнопок
        dateBtn.classList.remove('active');
        alphaBtn.classList.remove('active');
        
        // Активируем нужную кнопку и задаем ей data-атрибут направления
        const activeBtn = currentSortType === 'date' ? dateBtn : alphaBtn;
        activeBtn.classList.add('active');
        activeBtn.setAttribute('data-dir', currentSortDir);

        // Отправляем команду в контроллер
        controller.handleFilterChange({ sort: `${currentSortType}_${currentSortDir}` });
    }

    function handleSortClick(clickedType) {
        if (currentSortType === clickedType) {
            // Если кликнули по той же кнопке — меняем направление
            currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
            // Если кликнули по другой кнопке — делаем ее активной (по умолчанию asc)
            currentSortType = clickedType;
            currentSortDir = 'asc';
        }
        updateSortUI();
    }

    dateBtn.addEventListener('click', () => handleSortClick('date'));
    alphaBtn.addEventListener('click', () => handleSortClick('alpha'));

    // === ПОИСК ===
    const triggerSearch = () => {
        controller.handleFilterChange({ search: searchInput.value });
    };

    searchInput.addEventListener('input', debounce(triggerSearch, 300));
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); triggerSearch(); }
    });
    searchBtn.addEventListener('click', triggerSearch);

    // Старт
    // Устанавливаем изначальный UI для дефолтной сортировки
    dateBtn.setAttribute('data-dir', 'asc');
    controller.init();
});