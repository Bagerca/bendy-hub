import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class RecordsModel {
    constructor() {
        this.archives = [];
    }

    async loadArchives() {
        try {
            // Читаем индексный файл
            const indexFiles = await fetchData('data/records_index.json');
            
            // Скачиваем все data.json из новых атомарных папок в assets/
            const promises = indexFiles.map(folderName => 
                fetchData(`assets/records/${folderName}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить архив: ${folderName}`, err);
                    return null; // Игнорируем битые файлы
                })
            );
            
            const results = await Promise.all(promises);
            this.archives = results.filter(cat => cat !== null);
            
            if (this.archives.length === 0) {
                throw new Error("База архивов пуста");
            }

            return this.archives;

        } catch (error) {
            Logger.error('Критическая ошибка загрузки архивов', error);
            throw error;
        }
    }

    getCategories() {
        return this.archives;
    }
}