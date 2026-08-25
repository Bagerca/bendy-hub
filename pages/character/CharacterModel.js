import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CharacterModel {
    constructor() {
        this.characterData = null;
    }

    async fetchCharacter(charId) {
        try {
            this.characterData = await fetchData(`assets/characters/${charId}/data.json`);
            return this.characterData;
        } catch (error) {
            Logger.error(`Ошибка загрузки данных персонажа ${charId}`, error);
            throw error;
        }
    }

    /**
     * Параллельный поиск упоминаний персонажа в базе игр.
     * Решает проблему N+1 инкапсулируя всю логику загрузки в один метод.
     */
    async findAppearances(charId) {
        try {
            const gamesIndex = await fetchData('data/games_index.json');
            
            // Выполняем запросы параллельно, игнорируя битые файлы
            const gamePromises = gamesIndex.map(gId => 
                fetchData(`assets/games/${gId}/data.json`).catch(() => null)
            );
            
            const allGames = await Promise.all(gamePromises);

            // Фильтруем игры, в которых упомянут данный персонаж
            return allGames.filter(game => game !== null && game.wiki?.characters?.includes(charId));
        } catch (error) {
            Logger.error(`Ошибка поиска появлений персонажа ${charId}`, error);
            throw new Error('Сбой базы данных');
        }
    }
}