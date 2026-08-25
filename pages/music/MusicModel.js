import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';

export class MusicModel {
    constructor() {
        this.tracks = [];
        this.filteredTracks = [];
        this.currentIndex = -1; 
    }

    async fetchTracks() {
        try {
            this.tracks = await fetchData('data/songs.json');
            this.filteredTracks = [...this.tracks];
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
        return this.filteredTracks;
    }

    getTrackByIndex(index) {
        if (this.filteredTracks.length === 0) return null;
        // Закольцованная логика (если индекс выходит за пределы, начинаем с начала/конца)
        this.currentIndex = (index + this.filteredTracks.length) % this.filteredTracks.length;
        return this.filteredTracks[this.currentIndex];
    }

    getNextTrack() {
        return this.getTrackByIndex(this.currentIndex + 1);
    }

    getPrevTrack() {
        return this.getTrackByIndex(this.currentIndex - 1);
    }

    setCurrentIndexById(trackId) {
        this.currentIndex = this.filteredTracks.findIndex(t => t.id === trackId);
    }

    getTrackById(trackId) {
        return this.tracks.find(t => t.id === trackId);
    }
}