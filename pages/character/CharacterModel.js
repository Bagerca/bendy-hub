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
     * Параллельный поиск упоминаний персонажа в базе каталога (проектов).
     * Решает проблему N+1 инкапсулируя всю логику загрузки в один метод.
     */
    async findAppearances(charId) {
        try {
            // Изменено: теперь ищем в едином индексе каталога
            const catalogIndex = await fetchData('data/catalog_index.json');
            
            // Выполняем запросы параллельно к новой папке catalog, игнорируя битые файлы
            const projectPromises = catalogIndex.map(pId => 
                fetchData(`assets/catalog/${pId}/data.json`).catch(() => null)
            );
            
            const allProjects = await Promise.all(projectPromises);

            // Фильтруем проекты (игры, книги, анимации), в которых упомянут данный персонаж
            return allProjects.filter(project => project !== null && project.wiki?.characters?.includes(charId));
        } catch (error) {
            Logger.error(`Ошибка поиска появлений персонажа ${charId}`, error);
            throw new Error('Сбой базы данных');
        }
    }
}