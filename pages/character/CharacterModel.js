import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CharacterModel {
    constructor() {
        this.characterData = null;
    }

    async fetchCharacter(charId) {
        try {
            // Личное дело конкретного персонажа грузим целиком
            this.characterData = await fetchData(`assets/characters/${charId}/data.json`);
            return this.characterData;
        } catch (error) {
            Logger.error(`Ошибка загрузки данных персонажа ${charId}`, error);
            throw error;
        }
    }

    /**
     * Поиск упоминаний персонажа в базе проектов.
     * Благодаря catalog_list.json, мы делаем всего ОДИН запрос!
     */
    async findAppearances(charId) {
        try {
            const allProjects = await fetchData('data/catalog_list.json');
            
            // Фильтруем проекты (игры, книги, анимации), в которых упомянут данный персонаж
            return allProjects.filter(project => 
                project.characters_included && project.characters_included.includes(charId)
            );
        } catch (error) {
            Logger.error(`Ошибка поиска появлений персонажа ${charId}`, error);
            throw new Error('Сбой базы данных');
        }
    }
}