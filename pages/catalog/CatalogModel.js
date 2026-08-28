import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CatalogModel {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        
        // Храним состояние фильтров и сортировки
        this.filters = {
            search: '',
            type: 'all',
            sort: 'date_asc' // ПО УМОЛЧАНИЮ: Сначала старые
        };
    }

    async fetchAllItems() {
        try {
            const folders = await fetchData('data/catalog_index.json'); 
            const promises = folders.map(folderId => 
                fetchData(`assets/catalog/${folderId}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить данные проекта: ${folderId}`, err);
                    return null; 
                })
            );
            
            const results = await Promise.all(promises);
            this.allItems = results.filter(item => item !== null);
            this.filteredItems = [...this.allItems];
            
            // Применяем дефолтную сортировку при старте
            return this.applyFilters({});
        } catch (error) {
            Logger.error('Сбой доступа к индексу каталога', error);
            throw error;
        }
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, type, sort } = this.filters;
        const term = search.toLowerCase().trim();

        // 1. Фильтрация
        let result = this.allItems.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(term);
            const itemType = item.type || 'game';
            const matchType = type === 'all' || itemType === type;
            return matchSearch && matchType;
        });

        // 2. Сортировка
        result.sort((a, b) => {
            // По алфавиту
            if (sort.startsWith('alpha')) {
                const cmp = a.title.localeCompare(b.title, 'ru');
                return sort === 'alpha_asc' ? cmp : -cmp;
            } 
            // По дате выхода
            else {
                const timeA = this._parseRussianDate(a.release_date);
                const timeB = this._parseRussianDate(b.release_date);
                
                // date_desc (Сначала новые): B - A
                // date_asc (Сначала старые): A - B
                return sort === 'date_desc' ? timeB - timeA : timeA - timeB;
            }
        });

        this.filteredItems = result;
        return result;
    }

    /**
     * Конвертирует строку "15 ноя. 2022 г." в Timestamp для сортировки.
     * Если дата "..." или TBA, возвращает Infinity (всегда в конце при asc, в начале при desc).
     */
    _parseRussianDate(dateStr) {
        if (!dateStr || dateStr === '...' || dateStr.toUpperCase() === 'TBA') {
            return Infinity; 
        }

        try {
            const months = {
                'янв': 0, 'фев': 1, 'мар': 2, 'апр': 3, 'мая': 4, 'май': 4,
                'июн': 5, 'июл': 6, 'авг': 7, 'сен': 8, 'окт': 9, 'ноя': 10, 'дек': 11
            };

            const cleanStr = dateStr.replace(/г\.?/g, '').trim();
            const parts = cleanStr.split(/\s+/);

            if (parts.length >= 3) {
                const day = parseInt(parts[0], 10);
                const monthStr = parts[1].replace('.', '').toLowerCase();
                const year = parseInt(parts[2], 10);
                const month = months[monthStr] !== undefined ? months[monthStr] : 0;
                
                return new Date(year, month, day).getTime();
            }
        } catch (err) {
            return 0; // Фолбэк в случае сломанной строки
        }
        
        return 0;
    }
}