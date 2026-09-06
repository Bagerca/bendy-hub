// FILE: pages/music/PlayerStorage.js
import { Logger } from '../../shared/js/Logger.js';

/**
 * Отвечает за сохранение и загрузку состояния плеера из LocalStorage
 */
export class PlayerStorage {
    constructor(storageKey = 'bendy_player_state') {
        this.key = storageKey;
    }

    save(state) {
        try {
            localStorage.setItem(this.key, JSON.stringify(state));
        } catch (e) {
            Logger.warn("Не удалось сохранить состояние плеера", e);
        }
    }

    load() {
        try {
            const saved = localStorage.getItem(this.key);
            return saved ? JSON.parse(saved) : null;
        } catch (e) {
            Logger.warn("Не удалось прочитать состояние плеера", e);
            return null;
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}