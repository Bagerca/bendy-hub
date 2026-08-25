import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CharactersModel {
    constructor() {
        this.allCharacters = [];
        this.filteredCharacters = [];
        
        this.filters = {
            search: '',
            category: 'all',
            letter: 'all'
        };
    }

    async fetchAll() {
        try {
            const charIds = await fetchData('data/characters_index.json'); 
            const charPromises = charIds.map(id => 
                fetchData(`assets/characters/${id}/data.json`).catch(() => null)
            );
            
            const results = await Promise.all(charPromises);
            
            // Фильтруем битые файлы и сортируем по алфавиту
            this.allCharacters = results
                .filter(char => char !== null)
                .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            
            this.filteredCharacters = [...this.allCharacters];
            return this.allCharacters;
        } catch (error) {
            Logger.error('Ошибка загрузки архивов персонажей', error);
            throw error;
        }
    }

    // Бизнес-логика определения расы/категории
    _determineCategory(char) {
        const species = (char.meta?.species || '').toLowerCase();
        if (species.includes('человек') || species.includes('human')) return 'human';
        if (species.includes('мультяшка') || species.includes('toon') || species.includes('карикатура')) return 'toon';
        if (species.includes('чернильн') || species.includes('ink') || species.includes('искажен') || species.includes('lost one')) return 'ink';
        return 'other';
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, category, letter } = this.filters;
        const term = search.toLowerCase().trim();

        this.filteredCharacters = this.allCharacters.filter(char => {
            // Поиск по имени и алиасам
            const matchName = char.name.toLowerCase().includes(term);
            const aliases = char.meta?.aliases ? char.meta.aliases.join(' ').toLowerCase() : '';
            const matchAlias = aliases.includes(term);
            const searchPass = matchName || matchAlias;

            // Фильтр по категории
            const charCat = this._determineCategory(char);
            const categoryPass = category === 'all' || charCat === category;

            // Фильтр по букве
            const firstLetter = char.name.charAt(0).toLowerCase();
            const letterPass = letter === 'all' || firstLetter === letter;

            return searchPass && categoryPass && letterPass;
        });

        return this.filteredCharacters;
    }

    getUniqueFirstLetters() {
        const russianAlphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const uniqueLetters = new Set();
        
        this.allCharacters.forEach(char => {
            const firstChar = char.name.charAt(0).toLowerCase();
            if (russianAlphabet.includes(firstChar)) {
                uniqueLetters.add(firstChar);
            }
        });

        return Array.from(uniqueLetters).sort();
    }

    getFilteredCount() {
        return this.filteredCharacters.length;
    }
}