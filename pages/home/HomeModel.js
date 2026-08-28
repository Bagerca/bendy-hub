import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class HomeModel {
    constructor() {
        this.manifestoData = null;
        this.statsData = [];
        this.joinTeamData = null;
        this.teamData = [];
    }

    async fetchHomeData() {
        try {
            // 1. Загружаем статику (Текст, кнопку)
            const homeInfo = await fetchData('data/home.json');
            this.manifestoData = homeInfo.manifesto;
            this.joinTeamData = homeInfo.joinTeam;

            // 2. ДИНАМИЧЕСКИ высчитываем настоящую статистику
            this.statsData = await this._calculateDynamicStats();

            // 3. Загружаем индекс команды сайта
            const teamIds = await fetchData('data/team_index.json').catch(() => []);
            
            // 4. Загружаем личные дела каждого участника параллельно
            if (teamIds.length > 0) {
                const teamPromises = teamIds.map(id => 
                    fetchData(`assets/team/${id}/data.json`).catch(err => {
                        Logger.warn(`Не удалось загрузить профиль участника: ${id}`, err);
                        return null;
                    })
                );

                const results = await Promise.all(teamPromises);
                this.teamData = results.filter(member => member !== null);
            }

            return {
                manifesto: this.manifestoData,
                stats: this.statsData,
                joinTeam: this.joinTeamData,
                team: this.teamData
            };
        } catch (error) {
            Logger.error('Ошибка загрузки данных главной страницы', error);
            throw error;
        }
    }

    // Метод: парсим все базы данных и считаем реальное количество
    async _calculateDynamicStats() {
        try {
            // Запрашиваем все массивы параллельно
            const [projects, chars, songs, recordsIndex] = await Promise.all([
                fetchData('data/catalog_index.json').catch(() => []),
                fetchData('data/characters_index.json').catch(() => []),
                fetchData('data/songs.json').catch(() => []),
                fetchData('data/records_index.json').catch(() => [])
            ]);

            let recordsCount = 0;
            
            // Для записей нужно прочитать каждый файл категории и посчитать кол-во items
            if (recordsIndex.length > 0) {
                const recordPromises = recordsIndex.map(file => 
                    fetchData(`data/records/${file}.json`).catch(() => null)
                );
                const recordsData = await Promise.all(recordPromises);
                
                recordsData.forEach(category => {
                    if (category && category.items) {
                        recordsCount += category.items.length;
                    }
                });
            }

            return [
                { icon: 'gamepad', value: projects.length, label: 'Проектов' },
                { icon: 'users', value: chars.length, label: 'Персонажей' },
                { icon: 'music', value: songs.length, label: 'Треков' },
                { icon: 'book', value: recordsCount, label: 'Записей' }
            ];

        } catch (error) {
            Logger.error('Ошибка при расчете динамической статистики', error);
            return []; // Если всё упало, просто вернем пустой массив
        }
    }
}