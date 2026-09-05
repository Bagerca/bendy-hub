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
        
        this.filters = { search: '', sort: 'date_desc', author: 'all' };
    }

    async fetchTracks() {
        try {
            const [trackIds, authorIds] = await Promise.all([
                fetchData('data/music_index.json'),
                fetchData('data/music_authors_index.json').catch(() => [])
            ]);
            
            const trackPromises = trackIds.map(id => 
                fetchData(`assets/music/${id}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить трек: ${id}`, err);
                    return null;
                })
            );

            const authorPromises = authorIds.map(id => 
                fetchData(`assets/music_authors/${id}/data.json`).catch(err => {
                    Logger.warn(`Не удалось загрузить автора: ${id}`, err);
                    return null;
                })
            );
            
            const [tracksRes, authorsRes] = await Promise.all([
                Promise.all(trackPromises),
                Promise.all(authorPromises)
            ]);
            
            this.tracks = tracksRes.filter(t => t !== null);
            this.authors = authorsRes.filter(a => a !== null).sort((a, b) => b.tracks.length - a.tracks.length);
            
            return this.applyFilters({});
        } catch (error) {
            Logger.error('Ошибка загрузки музыкальных архивов.', error);
            throw error;
        }
    }

    getSuggestions(query) {
        const pool = this.filters.author === 'all' 
            ? this.tracks 
            : this.tracks.filter(t => t.authorId === this.filters.author);

        const results = SmartSearch.execute(query, pool, ['title', 'artist']);
        return results.slice(0, 5).map(t => ({ 
            label: `${t.title} <span style="opacity:0.5; font-size:0.85em; font-weight: normal;">— ${t.artist}</span>`, 
            value: t.title 
        }));
    }

    applyFilters(updates) {
        this.filters = { ...this.filters, ...updates };
        const { search, sort, author } = this.filters;

        let result = SmartSearch.execute(search, this.tracks, ['title', 'artist']);

        if (author && author !== 'all') {
            result = result.filter(t => t.authorId === author);
        }

        // Функция натурального сравнения строк
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
                // Если года нет, считаем трек старым (год 0), чтобы он падал вниз списка
                const yearA = a.year ? parseInt(a.year, 10) : 0;
                const yearB = b.year ? parseInt(b.year, 10) : 0;
                
                // Тай-брейкер: если года совпадают, сортируем по алфавиту
                if (yearA === yearB) {
                    return naturalCompare(a.title, b.title);
                }
                
                return sort === 'date_desc' ? yearB - yearA : yearA - yearB;
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
        if (index !== -1) {
            this.currentIndex = index;
        }
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