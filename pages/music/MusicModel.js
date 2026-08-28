import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class MusicModel {
    constructor() {
        this.tracks = []; // Все оригинальные треки
        this.filteredTracks = []; // Отфильтрованные (после поиска)
        
        // Для плейлиста воспроизведения
        this.playbackQueue = []; 
        this.currentIndex = -1; 
        
        this.isShuffle = false;
    }

    async fetchTracks() {
        try {
            this.tracks = await fetchData('data/songs.json');
            this.filteredTracks = [...this.tracks];
            this._updateQueue(); // Инициализируем очередь
            return this.tracks;
        } catch (error) {
            Logger.error('Ошибка загрузки аудио архивов.', error);
            throw error;
        }
    }

    applySearch(term) {
        const query = term.toLowerCase().trim();
        this.filteredTracks = this.tracks.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.artist.toLowerCase().includes(query)
        );
        this._updateQueue();
        return this.filteredTracks;
    }

    // Вкл/Выкл Shuffle
    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        
        const currentTrackId = this.playbackQueue[this.currentIndex]?.id;
        this._updateQueue();
        
        // Восстанавливаем индекс текущего трека в новой очереди
        if (currentTrackId) {
            this.currentIndex = this.playbackQueue.findIndex(t => t.id === currentTrackId);
        }
        return this.isShuffle;
    }

    // Обновляет реальную очередь воспроизведения
    _updateQueue() {
        if (this.isShuffle) {
            // Создаем копию и перемешиваем (Алгоритм Фишера-Йетса)
            let shuffled = [...this.filteredTracks];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            this.playbackQueue = shuffled;
        } else {
            this.playbackQueue = [...this.filteredTracks];
        }
        this.currentIndex = 0;
    }

    getTrackByIndex(index) {
        if (this.playbackQueue.length === 0) return null;
        // Закольцованная логика (бесконечный плейлист)
        this.currentIndex = (index + this.playbackQueue.length) % this.playbackQueue.length;
        return this.playbackQueue[this.currentIndex];
    }

    getNextTrack() {
        return this.getTrackByIndex(this.currentIndex + 1);
    }

    getPrevTrack() {
        return this.getTrackByIndex(this.currentIndex - 1);
    }

    setCurrentIndexById(trackId) {
        this.currentIndex = this.playbackQueue.findIndex(t => t.id === trackId);
    }

    getTrackById(trackId) {
        return this.tracks.find(t => t.id === trackId);
    }
}