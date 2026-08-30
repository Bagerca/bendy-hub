import { Logger } from './Logger.js';

// Реализация In-Memory кэширования для статики
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // Живет 5 минут

export async function fetchData(url) {
    const now = Date.now();
    
    // Возвращаем из кэша, если данные еще свежие
    if (cache.has(url)) {
        const cached = cache.get(url);
        if (now - cached.timestamp < CACHE_TTL) {
            Logger.info(`Кэш хит: ${url}`);
            return cached.data;
        }
    }

    try {
        // Убрали агрессивный cache-busting (?t=...), так как теперь есть контролируемый TTL
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        
        // Записываем в кэш
        cache.set(url, { data, timestamp: now });
        return data;
    } catch (error) {
        Logger.error(`Ошибка загрузки данных с ${url}:`, error);
        throw error;
    }
}

export async function translateTextApi(text, targetLang = 'ru') {
    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        
        if (response.status === 429) {
            throw new Error('RATE_LIMIT');
        }
        if (!response.ok) {
            throw new Error(`Google API HTTP Error: ${response.status}`);
        }
        
        const data = await response.json();
        return data[0].map(item => item[0]).join('');
    } catch (error) {
        Logger.error('Ошибка Translation API:', error.message);
        throw error;
    }
}