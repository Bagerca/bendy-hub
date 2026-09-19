// FILE: pages/project/ProjectModel.js

import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { ProjectConfig } from './ProjectConfig.js';

export class ProjectModel {
    constructor() {
        this.project = null;
    }

    async fetchProjectWithDependencies(id) {
        try {
            // 1. Грузим ядро проекта
            this.project = await fetchData(`assets/catalog/${id}/data.json`);
            
            const dependencies = {
                characters: [],
                teams: [],
                records: []
            };

            const fetchTasks = [];

            // Загрузка команд-переводчиков (оставляем старый подход, их мало)
            if (ProjectConfig.dependencies.includes('translators') && this.project.russifiers?.length > 0) {
                if (typeof this.project.russifiers[0] === 'string') {
                    fetchTasks.push(this._fetchTranslators(this.project.russifiers).then(res => dependencies.teams = res));
                } else {
                    dependencies.teams = this.project.russifiers; 
                }
            }

            // ОПТИМИЗАЦИЯ: Грузим глобальный индекс ВСЕХ записей 1 раз и просто фильтруем
            if (ProjectConfig.dependencies.includes('records') && this.project.wiki?.records?.length > 0) {
                fetchTasks.push(
                    fetchData('data/records_list.json').then(allRecords => {
                        dependencies.records = allRecords.filter(record => this.project.wiki.records.includes(record.categoryId));
                    }).catch(err => Logger.error('Ошибка подгрузки записей из индекса', err))
                );
            }

            // ОПТИМИЗАЦИЯ: Грузим глобальный индекс ВСЕХ персонажей 1 раз и фильтруем
            if (ProjectConfig.dependencies.includes('characters') && this.project.wiki?.characters?.length > 0) {
                fetchTasks.push(
                    fetchData('data/characters_list.json').then(allChars => {
                        dependencies.characters = allChars.filter(char => this.project.wiki.characters.includes(char.id));
                    }).catch(err => Logger.error('Ошибка подгрузки персонажей из индекса', err))
                );
            }

            // Ждем завершения всех загрузок параллельно
            await Promise.all(fetchTasks);

            return { projectData: this.project, dependencies };

        } catch (error) {
            Logger.error(`Ошибка загрузки проекта ${id} или его зависимостей`, error);
            throw error;
        }
    }

    async _fetchTranslators(teamIds) {
        try {
            const promises = teamIds.map(teamId => 
                fetchData(`assets/teams/${teamId}/data.json`).catch(() => null)
            );
            return await Promise.all(promises);
        } catch (error) {
            return [];
        }
    }
}