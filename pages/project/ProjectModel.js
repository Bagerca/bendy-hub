import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class ProjectModel {
    constructor() {
        this.project = null;
    }

    async fetchProject(id) {
        try {
            this.project = await fetchData(`assets/catalog/${id}/data.json`);
            return this.project;
        } catch (error) {
            Logger.error(`Ошибка загрузки проекта ${id}`, error);
            throw error;
        }
    }

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

    // НОВЫЙ МЕТОД: Загрузка команд локализаторов по их ID
    async fetchTranslators(teamIds) {
        if (!teamIds || teamIds.length === 0) return [];
        try {
            const promises = teamIds.map(teamId => 
                fetchData(`assets/teams/${teamId}/data.json`).catch(() => null)
            );
            return await Promise.all(promises);
        } catch (error) {
            Logger.error('Ошибка загрузки команд', error);
            return [];
        }
    }
}