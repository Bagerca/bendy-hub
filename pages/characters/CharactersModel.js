import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class CharactersModel {
    constructor() {
        this.allCharacters = [];
        this.filteredCharacters = [];
        this.filters = { search: '', category: ['human', 'ink', 'toon', 'other'], letter: 'all' };
    }

    async fetchAll() {
        try {
            // Всего 1 запрос вместо десятков!
            const results = await fetchData('data/characters_list.json'); 
            
            this.allCharacters = results.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
            this.filteredCharacters = [...this.allCharacters];
            return this.allCharacters;
        } catch (error) {
            Logger.error('Ошибка загрузки архивов персонажей', error);
            throw error;
        }
    }

    _determineCategory(char) {
        const species = (char.meta?.species || '').toLowerCase();
        if (species.includes('человек') || species.includes('human')) return 'human';
        if (species.includes('мультяшка') || species.includes('toon') || species.includes('карикатура')) return 'toon';
        if (species.includes('чернильн') || species.includes('ink') || species.includes('искажен') || species.includes('lost one')) return 'ink';
        return 'other';
    }

    getSuggestions(query) {
        const results = SmartSearch.execute(query, this.allCharacters, ['name', 'meta.aliases']);
        return results.slice(0, 5).map(char => ({ label: char.name, value: char.name }));
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, category, letter } = this.filters;

        let result = SmartSearch.execute(search, this.allCharacters, ['name', 'meta.aliases']);

        result = result.filter(char => {
            const charCat = this._determineCategory(char);
            const categoryPass = category.length > 0 && category.includes(charCat);
            const firstLetter = char.name.charAt(0).toLowerCase();
            const letterPass = letter === 'all' || firstLetter === letter;
            return categoryPass && letterPass;
        });

        this.filteredCharacters = result;
        return this.filteredCharacters;
    }

    getUniqueFirstLetters() {
        const russianAlphabet = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';
        const uniqueLetters = new Set();
        this.allCharacters.forEach(char => {
            const firstChar = char.name.charAt(0).toLowerCase();
            if (russianAlphabet.includes(firstChar)) uniqueLetters.add(firstChar);
        });
        return Array.from(uniqueLetters).sort();
    }
}