export class CharactersController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        try {
            await this.model.fetchAll();
            
            // Генерируем алфавит один раз при загрузке
            const uniqueLetters = this.model.getUniqueFirstLetters();
            this.view.renderAlphabet(uniqueLetters, 'all', (letter, btnNode) => {
                this.handleFilterChange({ letter });
                this.view.updateAlphabetUI(btnNode);
            });

            // Рендерим всё
            this.view.renderGrid(this.model.filteredCharacters);
            
        } catch (error) {
            this.view.renderErrorState('Ошибка доступа к архивам персонажей. База данных недоступна.');
        }
    }

    handleFilterChange(updates) {
        const filtered = this.model.applyFilters(updates);
        this.view.renderGrid(filtered);
    }
}