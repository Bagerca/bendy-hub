import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class CharactersModel {
    constructor() {
        this.allCharacters = [];
        this.filteredCharacters = [];
        this.filters = { search: '', category: 'all', letter: 'all' };
    }

    async fetchAll() {
        try {
            const charIds = await fetchData('data/characters_index.json'); 
            const charPromises = charIds.map(id => 
                fetchData(`assets/characters/${id}/data.json`).catch(() => null)
            );
            const results = await Promise.all(charPromises);
            
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

    _determineCategory(char) {
        const species = (char.meta?.species || '').toLowerCase();
        if (species.includes('человек') || species.includes('human')) return 'human';
        if (species.includes('мультяшка') || species.includes('toon') || species.includes('карикатура')) return 'toon';
        if (species.includes('чернильн') || species.includes('ink') || species.includes('искажен') || species.includes('lost one')) return 'ink';
        return 'other';
    }

    getSuggestions(query) {
        // Ищем и по имени, и по алиасам (например, "объект 414" -> Генри)
        const results = SmartSearch.execute(query, this.allCharacters, ['name', 'meta.aliases']);
        return results.slice(0, 5).map(char => ({ label: char.name, value: char.name }));
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, category, letter } = this.filters;

        // Умный поиск
        let result = SmartSearch.execute(search, this.allCharacters, ['name', 'meta.aliases']);

        result = result.filter(char => {
            const charCat = this._determineCategory(char);
            const categoryPass = category === 'all' || charCat === category;
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