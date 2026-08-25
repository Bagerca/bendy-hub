import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class GameModel {
    constructor() {
        this.game = null;
    }

    async fetchGame(id) {
        try {
            this.game = await fetchData(`assets/games/${id}/data.json`);
            return this.game;
        } catch (error) {
            Logger.error(`Ошибка загрузки игры ${id}`, error);
            throw error;
        }
    }

    // Для списка персонажей грузим их мини-досье параллельно
    async fetchCharacters(charIds) {
        if (!charIds || charIds.length === 0) return [];
        try {
            const promises = charIds.map(charId => 
                fetchData(`assets/characters/${charId}/data.json`).catch(() => null)
            );
            return await Promise.all(promises);
        } catch (error) {
            Logger.error('Ошибка загрузки персонажей', error);
            return [];
        }
    }
}