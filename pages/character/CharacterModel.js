import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CharacterModel {
    constructor() {
        this.characterData = null;
    }

    async fetchCharacter(charId) {
        try {
            // 1. Грузим личное дело персонажа из его папки
            this.characterData = await fetchData(`assets/characters/${charId}/data.json`);
            
            // 2. Делаем умный финт ушами: забираем записи из сводного индекса characters_list.json!
            // Это сэкономит нам запросы к десяткам папок архивов.
            const allCharacters = await fetchData('data/characters_list.json');
            const listData = allCharacters.find(c => c.id === charId);
            
            if (listData && listData.records) {
                this.characterData.records = listData.records;
            } else {
                this.characterData.records = [];
            }
            
            return this.characterData;
        } catch (error) {
            Logger.error(`Ошибка загрузки данных персонажа ${charId}`, error);
            throw error;
        }
    }

    async findAppearances(charId) {
        try {
            const allProjects = await fetchData('data/catalog_list.json');
            return allProjects.filter(project => 
                project.characters_included && project.characters_included.includes(charId)
            );
        } catch (error) {
            Logger.error(`Ошибка поиска появлений персонажа ${charId}`, error);
            throw new Error('Сбой базы данных');
        }
    }
}