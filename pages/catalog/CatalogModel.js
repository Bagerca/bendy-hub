import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class CatalogModel {
    constructor() {
        this.allItems = [];
        this.filteredItems = [];
        // Дефолтная сортировка: Сначала новые
        this.filters = { search: '', type: 'all', sort: 'date_desc' };
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
            
            return this.applyFilters({});
        } catch (error) {
            Logger.error('Сбой доступа к индексу каталога', error);
            throw error;
        }
    }

    getSuggestions(query) {
        const results = SmartSearch.execute(query, this.allItems, ['title']);
        return results.slice(0, 5).map(item => ({ label: item.title, value: item.title }));
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, type, sort } = this.filters;

        let result = SmartSearch.execute(search, this.allItems, ['title']);

        result = result.filter(item => {
            const itemType = item.type || 'game';
            return type === 'all' || itemType === type;
        });

        // Функция натурального сравнения строк (понимает цифры "2" < "10" и игнорирует пунктуацию)
        const naturalCompare = (t1, t2) => {
            const str1 = t1 || '';
            const str2 = t2 || '';
            return str1.localeCompare(str2, 'ru', { numeric: true, ignorePunctuation: true });
        };

        result.sort((a, b) => {
            if (sort.startsWith('alpha')) {
                const cmp = naturalCompare(a.title, b.title);
                return sort === 'alpha_asc' ? cmp : -cmp;
            } else {
                const timeA = this._parseRussianDate(a.release_date);
                const timeB = this._parseRussianDate(b.release_date);
                
                // Тай-брейкер: если даты одинаковые (или обе TBA), сортируем по алфавиту от А до Я
                if (timeA === timeB) {
                    return naturalCompare(a.title, b.title);
                }
                
                return sort === 'date_desc' ? timeB - timeA : timeA - timeB;
            }
        });

        this.filteredItems = result;
        return result;
    }

    _parseRussianDate(dateStr) {
        // Проекты без даты (TBA / ...) получают Infinity, чтобы всегда быть "в будущем" (наверху в новых)
        if (!dateStr || dateStr === '...' || dateStr.toUpperCase() === 'TBA') return Infinity; 
        try {
            const months = { 'янв':0, 'фев':1, 'мар':2, 'апр':3, 'мая':4, 'май':4, 'июн':5, 'июл':6, 'авг':7, 'сен':8, 'окт':9, 'ноя':10, 'дек':11 };
            const cleanStr = dateStr.replace(/г\.?/g, '').trim();
            const parts = cleanStr.split(/\s+/);
            if (parts.length >= 3) {
                const day = parseInt(parts[0], 10);
                const monthStr = parts[1].replace('.', '').toLowerCase();
                const year = parseInt(parts[2], 10);
                return new Date(year, months[monthStr] || 0, day).getTime();
            }
        } catch (err) { return 0; }
        return 0;
    }
}