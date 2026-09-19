import { fetchData } from '../../shared/js/api.js';

export class CommunityModel {
    constructor() {
        this.allTracks = [];
        this.queue = [];
        this.sorted = {}; // { trackId: category }
    }

    async loadData() {
        const data = await fetchData('data/music_list.json');
        this.allTracks = data;
        
        // Пытаемся восстановить прогресс
        const savedProgress = localStorage.getItem('music_sort_progress');
        if (savedProgress) {
            this.sorted = JSON.parse(savedProgress);
        }

        // В очередь добавляем только те, которых нет в sorted
        this.queue = this.allTracks.filter(t => !this.sorted.hasOwnProperty(t.id));
    }

    getCurrentTrack() {
        return this.queue.length > 0 ? this.queue[0] : null;
    }

    categorizeCurrent(category) {
        if (this.queue.length === 0) return;
        const track = this.queue.shift();
        this.sorted[track.id] = category;
        this._saveProgress();
    }

    skipCurrent() {
        if (this.queue.length === 0) return;
        // Просто пропускаем (удаляем из очереди, но помечаем как "skipped" в сейв, чтобы не показывался снова)
        const track = this.queue.shift();
        this.sorted[track.id] = "skipped";
        this._saveProgress();
    }

    undoTrack(trackId) {
        delete this.sorted[trackId];
        const track = this.allTracks.find(t => t.id === trackId);
        if (track) {
            this.queue.unshift(track); // Возвращаем в начало очереди
        }
        this._saveProgress();
    }

    _saveProgress() {
        localStorage.setItem('music_sort_progress', JSON.stringify(this.sorted));
    }

    resetProgress() {
        this.sorted = {};
        this.queue = [...this.allTracks];
        localStorage.removeItem('music_sort_progress');
    }

    getSortedData() {
        // Фильтруем skipped при экспорте
        const exportData = {};
        for (const [id, cat] of Object.entries(this.sorted)) {
            if (cat !== 'skipped') exportData[id] = cat;
        }
        return exportData;
    }

    getHistory() {
        // Возвращаем массив отсортированных (для рендера в UI)
        return Object.entries(this.sorted).map(([id, cat]) => {
            const trackInfo = this.allTracks.find(t => t.id === id);
            return {
                id,
                cat,
                title: trackInfo ? trackInfo.title : id,
                artist: trackInfo ? trackInfo.artist : ''
            };
        }).reverse(); // Последние сверху
    }

    getStats() {
        return {
            left: this.queue.length,
            done: Object.keys(this.sorted).length,
            total: this.allTracks.length
        };
    }
}