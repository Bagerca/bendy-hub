import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class LibraryModel {
    constructor() {
        this.games = [];
    }

    /**
     * Загружает индекс, а затем данные всех игр параллельно.
     */
    async fetchAllGames() {
        try {
            const gameFolders = await fetchData('data/games_index.json'); 
            
            const gamePromises = gameFolders.map(folderId => 
                fetchData(`assets/games/${folderId}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить данные для игры: ${folderId}`, err);
                    return null; 
                })
            );
            
            const results = await Promise.all(gamePromises);
            
            // Фильтруем битые файлы и сохраняем
            this.games = results.filter(game => game !== null);
            return this.games;
        } catch (error) {
            Logger.error('Сбой доступа к индексу архивов', error);
            throw error;
        }
    }

    getGameById(id) {
        return this.games.find(g => g.id === id);
    }
}