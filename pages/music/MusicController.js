// FILE: pages/music/MusicController.js
export class MusicController {
    constructor(model, view, player) {
        this.model = model;
        this.view = view;
        this.player = player;

        this._bindEvents();
    }

    _bindEvents() {
        this.view.onTrackClick = (trackId) => this._handleTrackClick(trackId);

        // Навигация из плавающего окна
        this.player.onNextRequest = () => {
            const nextTrack = this.model.getNextTrack();
            if (nextTrack) {
                this.view.updateActiveCard(nextTrack.id);
                this.player.loadTrack(nextTrack);
            }
        };

        this.player.onPrevRequest = () => {
            const prevTrack = this.model.getPrevTrack();
            if (prevTrack) {
                this.view.updateActiveCard(prevTrack.id);
                this.player.loadTrack(prevTrack);
            }
        };

        this.player.onLyricsRequest = (trackId) => {
            const track = this.model.getTrackById(trackId);
            if (track) this.view.openLyrics(track);
        };
        
        // Когда пользователь закрывает плеер по крестику
        this.player.onClose = () => {
            this.view.updateActiveCard(null); // Снимаем подсветку
        };
    }

    async init() {
        try {
            await this.model.fetchTracks();
            this.view.renderGrid(this.model.filteredTracks);
        } catch (error) {
            this.view.renderErrorState('Файл data/music_index.json не найден. Музыкальная база недоступна.');
        }
    }

    handleFilterChange(updates) {
        const filtered = this.model.applyFilters(updates);
        // При фильтрации снимаем выделение активного трека
        this.view.renderGrid(filtered);
    }

    _handleTrackClick(trackId) {
        this.model.setCurrentIndexById(trackId);
        const track = this.model.getTrackById(trackId);
        
        if (track && track.youtubeUrl) {
            this.view.updateActiveCard(trackId);
            this.player.loadTrack(track);
        }
    }
}