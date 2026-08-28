import { debounce } from '../utils.js';

export class SearchControls extends HTMLElement {
    connectedCallback() {
        const placeholder = this.getAttribute('placeholder') || 'Поиск...';
        // Сохраняем то, что было вложено внутрь тега (фильтры, селекты)
        const customFilters = this.innerHTML;

        // Рендерим единый каркас
        this.innerHTML = `
            <search class="page-controls">
                <div class="search-input-wrapper">
                    <button class="search-btn" aria-label="Найти">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                    </button>
                    <!-- autocomplete="off" важен, чтобы браузер не перекрывал наши подсказки своими -->
                    <input type="text" class="search-input" placeholder="${placeholder}" aria-label="Поиск" autocomplete="off">
                    <ul class="search-suggestions" role="listbox"></ul>
                </div>
                <!-- Контейнер для кастомных фильтров конкретной страницы -->
                <div class="page-controls-filters">
                    ${customFilters}
                </div>
            </search>
        `;

        this._initEvents();
    }

    _initEvents() {
        const input = this.querySelector('.search-input');
        const btn = this.querySelector('.search-btn');
        const wrapper = this.querySelector('.search-input-wrapper');
        this.suggestionsList = this.querySelector('.search-suggestions');

        // Отправка запроса на обновление сетки страницы
        const emitSearch = () => {
            this.closeSuggestions();
            this.dispatchEvent(new CustomEvent('onSearch', { detail: input.value, bubbles: true }));
            input.blur();
        };

        // Обработка живого ввода (только для выпадающих подсказок)
        const handleInput = async () => {
            const val = input.value.trim();
            
            // Если нет текста или страница не задала провайдер подсказок
            if (!val || !this.suggestionProvider) {
                this.closeSuggestions();
                return;
            }
            
            // Запрашиваем топ 5 вариантов у контроллера страницы (он перенаправит в SmartSearch)
            const suggestions = await this.suggestionProvider(val);
            
            if (suggestions && suggestions.length > 0) {
                this.renderSuggestions(suggestions, input);
                wrapper.classList.add('has-suggestions');
            } else {
                this.closeSuggestions();
            }
        };

        // Дебаунс только на отрисовку выпадающего списка
        input.addEventListener('input', debounce(handleInput, 200));
        
        // Показываем подсказки при клике в инпут, если там уже есть текст
        input.addEventListener('focus', () => {
            if (input.value.trim() && this.suggestionsList.children.length > 0) {
                wrapper.classList.add('has-suggestions');
            }
        });

        // Фактический поиск (меняет страницу) только по Enter
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                emitSearch();
            }
        });
        
        // Фактический поиск по клику на лупу
        btn.addEventListener('click', emitSearch);

        // Скрывать подсказки при клике вне зоны поиска
        document.addEventListener('click', (e) => {
            if (!wrapper.contains(e.target)) this.closeSuggestions();
        });
    }

    renderSuggestions(items, inputEl) {
        this.suggestionsList.innerHTML = '';
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'suggestion-item';
            
            li.innerHTML = `
                <svg class="suggestion-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <span class="suggestion-text">${item.label}</span>
            `;
            
            li.addEventListener('click', () => {
                inputEl.value = item.value; // Подставляем в инпут значение из подсказки
                this.closeSuggestions();
                // Запускаем реальный поиск после клика по подсказке
                this.dispatchEvent(new CustomEvent('onSearch', { detail: item.value, bubbles: true })); 
            });
            
            this.suggestionsList.appendChild(li);
        });
    }

    closeSuggestions() {
        this.querySelector('.search-input-wrapper').classList.remove('has-suggestions');
    }
}