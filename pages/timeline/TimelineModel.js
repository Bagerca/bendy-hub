import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class TimelineModel {
    constructor() {
        this.cache = {
            lore: null,
            dev: null
        };
        this.currentMode = 'lore'; // По умолчанию
    }

    async getTimelineData(mode) {
        if (this.cache[mode]) {
            return this.cache[mode];
        }

        try {
            const filename = mode === 'lore' ? 'data/timeline_lore.json' : 'data/timeline_dev.json';
            const data = await fetchData(filename);
            this.cache[mode] = data;
            return data;
        } catch (error) {
            Logger.error(`Ошибка загрузки таймлайна для режима: ${mode}`, error);
            throw error;
        }
    }

    setMode(mode) {
        this.currentMode = mode;
    }

    getCurrentMode() {
        return this.currentMode;
    }
}