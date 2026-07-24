import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';
import { debounce } from '../../shared/js/utils.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', async () => {
    const els = {
        container: document.getElementById('chars-content'),
        loader: document.getElementById('chars-loader'),
        emptyState: document.getElementById('empty-state'),
        count: document.getElementById('results-count'),
        
        searchInput: document.getElementById('search-input'),
        searchBtn: document.getElementById('search-btn'),
        
        selectContainer: document.getElementById('category-filter-container'),
        selectTrigger: document.querySelector('.custom-select-trigger'),
        selectOptions: document.querySelectorAll('.custom-select-option'),
        currentCatText: document.getElementById('current-category'),
        
        alphabetFilters: document.getElementById('alphabet-filters'), // НОВЫЙ ЭЛЕМЕНТ
        
        template: document.getElementById('char-card-template')
    };

    let allCharacters = [];
    let currentCategoryFilter = 'all'; // Переименовал, чтобы не путать
    let currentLetterFilter = 'all'; // НОВАЯ переменная для алфавитного фильтра

    const determineCategory = (char) => {
        const species = (char.meta?.species || '').toLowerCase();
        if (species.includes('человек') || species.includes('human')) return 'human';
        if (species.includes('мультяшка') || species.includes('карикатура') || species.includes('toon') || species.includes('caricature')) return 'toon';
        if (species.includes('чернильн') || species.includes('ink') || species.includes('искажен') || species.includes('lost one')) return 'ink';
        return 'other';
    };

    const renderGrid = (charsToRender) => {
        els.container.innerHTML = '';
        els.count.textContent = `Найдено личных дел: ${charsToRender.length}`;

        if (charsToRender.length === 0) {
            els.container.style.display = 'none';
            els.emptyState.style.display = 'flex';
            return;
        }

        els.emptyState.style.display = 'none';
        const fragment = document.createDocumentFragment();

        charsToRender.forEach(char => {
            const clone = els.template.content.cloneNode(true);
            const card = clone.querySelector('.char-card');
            const imgEl = clone.querySelector('.char-img');
            
            card.href = `character.html?id=${char.id}`;
            clone.querySelector('.char-card-name').textContent = char.name;

            const photo = char.assets?.avatar || char.assets?.full_body;
            if (photo) {
                imgEl.src = `assets/characters/${char.id}/${photo}`;
                imgEl.style.display = 'block';
            } else {
                imgEl.style.display = 'none'; 
            }

            fragment.appendChild(clone);
        });

        els.container.appendChild(fragment);
        els.container.style.display = 'grid';
    };

    const applyFilters = () => {
        const searchTerm = els.searchInput.value.toLowerCase().trim();
        
        const filtered = allCharacters.filter(char => {
            // Фильтр по поисковому запросу
            const matchName = char.name.toLowerCase().includes(searchTerm);
            const aliases = char.meta?.aliases ? char.meta.aliases.join(' ').toLowerCase() : '';
            const matchAlias = aliases.includes(searchTerm);
            const searchPass = matchName || matchAlias;

            // Фильтр по категории
            const charCat = determineCategory(char);
            const categoryPass = currentCategoryFilter === 'all' || charCat === currentCategoryFilter;

            // НОВЫЙ: Фильтр по первой букве
            const firstLetter = char.name.charAt(0).toLowerCase();
            const letterPass = currentLetterFilter === 'all' || firstLetter === currentLetterFilter;

            return searchPass && categoryPass && letterPass;
        });

        renderGrid(filtered);
    };

    // ФУНКЦИЯ ДЛЯ ГЕНЕРАЦИИ АЛФАВИТНЫХ ЧИПОВ
    const renderAlphabetFilters = (chars) => {
        els.alphabetFilters.innerHTML = ''; // Очищаем контейнер

        const russianAlphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const uniqueFirstLetters = new Set();
        chars.forEach(char => {
            const firstChar = char.name.charAt(0).toLowerCase();
            if (russianAlphabet.includes(firstChar)) {
                uniqueFirstLetters.add(firstChar);
            }
        });

        const sortedLetters = Array.from(uniqueFirstLetters).sort();

        // Кнопка "Все"
        const allBtn = document.createElement('button');
        allBtn.className = `alphabet-chip ${currentLetterFilter === 'all' ? 'active' : ''}`;
        allBtn.textContent = 'Все';
        allBtn.addEventListener('click', () => {
            currentLetterFilter = 'all';
            updateAlphabetFilterUI(allBtn);
            applyFilters();
        });
        els.alphabetFilters.appendChild(allBtn);

        // Кнопки для каждой буквы
        sortedLetters.forEach(letter => {
            const letterBtn = document.createElement('button');
            letterBtn.className = `alphabet-chip ${currentLetterFilter === letter ? 'active' : ''}`;
            letterBtn.textContent = letter.toUpperCase();
            letterBtn.addEventListener('click', () => {
                currentLetterFilter = letter;
                updateAlphabetFilterUI(letterBtn);
                applyFilters();
            });
            els.alphabetFilters.appendChild(letterBtn);
        });
    };

    // Обновление UI алфавитного фильтра
    const updateAlphabetFilterUI = (activeButton) => {
        document.querySelectorAll('.alphabet-chip').forEach(btn => {
            btn.classList.remove('active');
        });
        if (activeButton) {
            activeButton.classList.add('active');
        }
    };


    els.selectTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        els.selectContainer.classList.toggle('active');
        els.selectTrigger.setAttribute('aria-expanded', els.selectContainer.classList.contains('active'));
    });

    document.addEventListener('click', (e) => {
        if (!els.selectContainer.contains(e.target)) {
            els.selectContainer.classList.remove('active');
            els.selectTrigger.setAttribute('aria-expanded', 'false');
        }
    });

    els.selectOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            els.selectOptions.forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            
            els.currentCatText.textContent = opt.textContent;
            els.selectContainer.classList.remove('active');
            els.selectTrigger.setAttribute('aria-expanded', 'false');
            
            currentCategoryFilter = opt.dataset.filter;
            applyFilters();
        });
    });

    els.searchInput.addEventListener('input', debounce(applyFilters, 300));
    els.searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') applyFilters(); });
    els.searchBtn.addEventListener('click', applyFilters);

    try {
        const charIds = await fetchData('data/characters_index.json'); 
        const charPromises = charIds.map(id => fetchData(`assets/characters/${id}/data.json`).catch(() => null));
        
        const results = await Promise.all(charPromises);
        const validChars = results.filter(char => char !== null);

        allCharacters = validChars.sort((a, b) => a.name.localeCompare(b.name, 'ru'));

        els.loader.style.display = 'none';
        
        renderAlphabetFilters(allCharacters); // ГЕНЕРИРУЕМ ЧИПЫ ПРИ ЗАГРУЗКЕ
        renderGrid(allCharacters);

    } catch (error) {
        els.loader.style.display = 'none';
        els.container.style.display = 'block';
        els.container.innerHTML = `<div class="error-card"><p>Ошибка доступа к архивам персонажей.</p></div>`;
    }
});