import { debounce } from '../utils.js';
import { Icons } from '../icons.js';

export class SearchControls extends HTMLElement {
    connectedCallback() {
        const placeholder = this.getAttribute('placeholder') || 'Поиск...';
        const customFilters = this.innerHTML;

        this.innerHTML = `
            <search class="page-controls">
                <div class="search-input-wrapper">
                    <button class="search-btn" aria-label="Найти">
                        ${Icons.search}
                    </button>
                    <input type="text" class="search-input" placeholder="${placeholder}" aria-label="Поиск" autocomplete="off">
                    <ul class="search-suggestions" role="listbox"></ul>
                </div>
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

        const emitSearch = () => {
            this.closeSuggestions();
            this.dispatchEvent(new CustomEvent('onSearch', { detail: input.value, bubbles: true }));
        };

        const handleInput = async () => {
            const val = input.value.trim();
            if (val === '') {
                this.closeSuggestions();
                emitSearch(); 
                return;
            }
            if (!this.suggestionProvider) {
                this.closeSuggestions();
                return;
            }
            
            const suggestions = await this.suggestionProvider(val);
            if (suggestions && suggestions.length > 0) {
                this.renderSuggestions(suggestions, input);
                wrapper.classList.add('has-suggestions');
            } else {
                this.closeSuggestions();
            }
        };

        input.addEventListener('input', debounce(handleInput, 200));
        
        input.addEventListener('focus', () => {
            if (input.value.trim() && this.suggestionsList.children.length > 0) {
                wrapper.classList.add('has-suggestions');
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                emitSearch();
                input.blur(); 
            }
        });
        
        btn.addEventListener('click', emitSearch);

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
                <div class="suggestion-icon">${Icons.search}</div>
                <span class="suggestion-text">${item.label}</span>
            `;
            
            li.addEventListener('click', () => {
                inputEl.value = item.value; 
                this.closeSuggestions();
                this.dispatchEvent(new CustomEvent('onSearch', { detail: item.value, bubbles: true })); 
            });
            
            this.suggestionsList.appendChild(li);
        });
    }

    closeSuggestions() {
        this.querySelector('.search-input-wrapper').classList.remove('has-suggestions');
    }
}