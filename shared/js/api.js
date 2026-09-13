import { Logger } from './Logger.js';

const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // Живет 5 минут

export async function fetchData(url) {
    const now = Date.now();
    
    if (cache.has(url)) {
        const cached = cache.get(url);
        if (now - cached.timestamp < CACHE_TTL) {
            Logger.info(`Кэш хит: ${url}`);
            return cached.data;
        }
    }

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
        
        const data = await response.json();
        cache.set(url, { data, timestamp: now });
        return data;
    } catch (error) {
        Logger.error(`Ошибка загрузки данных с ${url}:`, error);
        throw error;
    }
}

// НОВАЯ ФУНКЦИЯ: Фоновая предзагрузка
export function prefetchData(url) {
    if (cache.has(url)) return;
    
    fetch(url)
        .then(res => {
            if (res.ok) return res.json();
            throw new Error('Prefetch failed');
        })
        .then(data => cache.set(url, { data, timestamp: Date.now() }))
        .catch(() => {}); // Тихо игнорируем ошибки, это не критично
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