import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class CatalogModel {
    constructor() {
        this.items = [];
    }

    async fetchAllItems() {
        try {
            // Изменен путь на catalog_index
            const folders = await fetchData('data/catalog_index.json'); 
            
            const promises = folders.map(folderId => 
                fetchData(`assets/catalog/${folderId}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить данные проекта: ${folderId}`, err);
                    return null; 
                })
            );
            
            const results = await Promise.all(promises);
            this.items = results.filter(item => item !== null);
            return this.items;
        } catch (error) {
            Logger.error('Сбой доступа к индексу каталога', error);
            throw error;
        }
    }

    filterItems(searchTerm, type) {
        const term = searchTerm.toLowerCase().trim();
        return this.items.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(term);
            const itemType = item.type || 'game'; // Фолбэк для старых JSON
            const matchType = type === 'all' || itemType === type;
            return matchSearch && matchType;
        });
    }
}