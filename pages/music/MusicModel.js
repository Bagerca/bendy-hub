import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class MusicModel {
    constructor() {
        this.tracks = []; 
        this.filteredTracks = []; 
        this.playbackQueue = []; 
        this.currentIndex = -1; 
        this.isShuffle = false;
    }

    async fetchTracks() {
        try {
            // 1. Загружаем индексный файл (как у персонажей и каталога)
            const trackIds = await fetchData('data/music_index.json');
            
            // 2. Параллельно загружаем все data.json треков
            const trackPromises = trackIds.map(id => 
                fetchData(`assets/music/${id}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить трек: ${id}`, err);
                    return null;
                })
            );
            
            const results = await Promise.all(trackPromises);
            this.tracks = results.filter(t => t !== null);
            this.filteredTracks = [...this.tracks];
            
            this._updateQueue(); 
            return this.tracks;
        } catch (error) {
            Logger.error('Ошибка загрузки музыкальных архивов.', error);
            throw error;
        }
    }

    getSuggestions(query) {
        const results = SmartSearch.execute(query, this.tracks, ['title', 'artist']);
        return results.slice(0, 5).map(t => ({ 
            label: `${t.title} <span style="opacity:0.5; font-size:0.85em; font-weight: normal;">— ${t.artist}</span>`, 
            value: t.title 
        }));
    }

    applySearch(term) {
        this.filteredTracks = SmartSearch.execute(term, this.tracks, ['title', 'artist']);
        this._updateQueue();
        return this.filteredTracks;
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const currentTrackId = this.playbackQueue[this.currentIndex]?.id;
        this._updateQueue();
        if (currentTrackId) {
            this.currentIndex = this.playbackQueue.findIndex(t => t.id === currentTrackId);
        }
        return this.isShuffle;
    }

    _updateQueue() {
        if (this.isShuffle) {
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
        this.currentIndex = (index + this.playbackQueue.length) % this.playbackQueue.length;
        return this.playbackQueue[this.currentIndex];
    }

    getNextTrack() { return this.getTrackByIndex(this.currentIndex + 1); }
    getPrevTrack() { return this.getTrackByIndex(this.currentIndex - 1); }
    setCurrentIndexById(trackId) { this.currentIndex = this.playbackQueue.findIndex(t => t.id === trackId); }
    getTrackById(trackId) { return this.tracks.find(t => t.id === trackId); }
}