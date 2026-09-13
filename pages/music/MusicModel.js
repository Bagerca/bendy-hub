import { fetchData } from '../../shared/js/api.js';
import { Logger } from '../../shared/js/Logger.js';
import { SmartSearch } from '../../shared/js/SmartSearch.js';

export class MusicModel {
    constructor() {
        this.tracks = []; 
        this.authors = []; 
        this.filteredTracks = []; 
        this.playbackQueue = []; 
        this.currentIndex = -1; 
        this.isShuffle = false;
        this.filters = { search: '', sort: 'date_desc', authors: null };
    }

    async fetchTracks() {
        try {
            // Всего 2 запроса вместо 500+
            const [tracksRes, authorsRes] = await Promise.all([
                fetchData('data/music_list.json').catch(() => []),
                fetchData('data/music_authors_list.json').catch(() => [])
            ]);
            
            this.tracks = tracksRes;
            
            this.authors = authorsRes.sort((a, b) => 
                a.name.localeCompare(b.name, 'ru', { sensitivity: 'base' })
            );
            
            return this.applyFilters({});
        } catch (error) {
            Logger.error('Ошибка загрузки музыкальных архивов.', error);
            throw error;
        }
    }

    getSuggestions(query) {
        const pool = (this.filters.authors !== null && this.filters.authors.length > 0) 
            ? this.tracks.filter(t => this.filters.authors.includes(t.authorId))
            : this.tracks;

        const results = SmartSearch.execute(query, pool, ['title', 'artist']);
        return results.slice(0, 5).map(t => ({ 
            label: `${t.title} <span style="opacity:0.5; font-size:0.85em; font-weight: normal;">— ${t.artist}</span>`, 
            value: t.title 
        }));
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, sort, authors } = this.filters;

        let result = SmartSearch.execute(search, this.tracks, ['title', 'artist']);

        if (authors !== null) {
            if (authors.length > 0) {
                result = result.filter(t => authors.includes(t.authorId));
            } else {
                result = []; 
            }
        }

        const naturalCompare = (t1, t2) => {
            const str1 = t1 || '';
            const str2 = t2 || '';
            return str1.localeCompare(str2, 'ru', { numeric: true, ignorePunctuation: true });
        };

        const [sortType, sortDir] = sort.split('_');
        const isDesc = sortDir === 'desc';

        result.sort((a, b) => {
            if (sortType === 'alpha') {
                const cmp = naturalCompare(a.title, b.title);
                return isDesc ? -cmp : cmp; 
            } else {
                const yearA = a.year ? parseInt(a.year, 10) : 0;
                const yearB = b.year ? parseInt(b.year, 10) : 0;
                if (yearA === yearB) return naturalCompare(a.title, b.title);
                return isDesc ? yearB - yearA : yearA - yearB;
            }
        });

        this.filteredTracks = result;
        this._updateQueue();
        return this.filteredTracks;
    }

    toggleShuffle() {
        this.isShuffle = !this.isShuffle;
        const currentTrackId = this.playbackQueue[this.currentIndex]?.id;
        this._updateQueue(currentTrackId);
        return this.isShuffle;
    }

    _updateQueue(preserveTrackId = null) {
        const activeId = preserveTrackId || (this.currentIndex >= 0 ? this.playbackQueue[this.currentIndex]?.id : null);

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
        
        if (activeId) {
            const newIndex = this.playbackQueue.findIndex(t => t.id === activeId);
            this.currentIndex = newIndex !== -1 ? newIndex : 0;
        } else {
            this.currentIndex = 0;
        }
    }

    syncCurrentTrack(trackId) {
        if (!trackId) return;
        const index = this.playbackQueue.findIndex(t => t.id === trackId);
        if (index !== -1) this.currentIndex = index;
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