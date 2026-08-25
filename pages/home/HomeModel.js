import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class HomeModel {
    constructor() {
        this.homeData = null;
    }

    async fetchHomeData() {
        try {
            this.homeData = await fetchData('data/home.json');
            return this.homeData;
        } catch (error) {
            Logger.error('Ошибка загрузки данных главной страницы', error);
            throw error;
        }
    }
}