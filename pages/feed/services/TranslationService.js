import { translateTextApi } from '../../../shared/js/api.js';
import { Logger } from '../../../shared/js/Logger.js';

/**
 * Изолированный сервис для работы с API переводов.
 * Имеет собственный кэш в памяти для экономии запросов к Google API.
 */
export class TranslationService {
    constructor() {
        this.cache = new Map();
    }

    async translate(text) {
        const hash = this._hashText(text);
        
        if (this.cache.has(hash)) {
            return this.cache.get(hash);
        }

        try {
            const translated = await translateTextApi(text);
            this.cache.set(hash, translated);
            return translated;
        } catch (error) {
            Logger.error('TranslationService Failed:', error);
            throw error;
        }
    }

    // Простой хэш для ключа кэша
    _hashText(str) {
        let hash = 0;
        for (let i = 0, len = str.length; i < len; i++) {
            let chr = str.charCodeAt(i);
            hash = (hash << 5) - hash + chr;
            hash |= 0;
        }
        return hash.toString();
    }
}