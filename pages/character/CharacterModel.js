// FILE: pages/character/CharacterModel.js

import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CharacterModel {
    constructor() {
        this.characterData = null;
    }

    async fetchCharacter(charId) {
        try {
            // 1. Грузим полное личное дело персонажа для подробной Вики (история, факты)
            this.characterData = await fetchData(`assets/characters/${charId}/data.json`);
            
            // 2. Берем записи из общего индекса (ОПТИМИЗАЦИЯ)
            const allCharactersList = await fetchData('data/characters_list.json');
            const listData = allCharactersList.find(c => c.id === charId);
            
            this.characterData.records = listData && listData.records ? listData.records : [];
            
            return this.characterData;
        } catch (error) {
            Logger.error(`Ошибка загрузки данных персонажа ${charId}`, error);
            throw error;
        }
    }

    async findAppearances(charId) {
        try {
            // Загружаем общий индекс каталога (кэшируется браузером)
            const allProjects = await fetchData('data/catalog_list.json');
            
            // Фильтруем те игры/книги, где в characters_included есть этот charId
            return allProjects.filter(project => 
                project.characters_included && project.characters_included.includes(charId)
            );
        } catch (error) {
            Logger.error(`Ошибка поиска появлений персонажа ${charId}`, error);
            throw new Error('Сбой базы данных');
        }
    }
}