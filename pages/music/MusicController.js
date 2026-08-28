export class MusicController {
    constructor(model, view, player) {
        this.model = model;
        this.view = view;
        this.player = player;

        this._bindEvents();
    }

    _bindEvents() {
        // Сетка
        this.view.onTrackClick = (trackId) => this._handleTrackClick(trackId);

        // Плеер
        this.player.onStateChange = (track, isPlaying) => {
            this.view.updateGridStateUI(track, isPlaying);
        };
        
        this.player.onNextRequest = () => {
            const nextTrack = this.model.getNextTrack();
            if (nextTrack) this.player.loadTrack(nextTrack);
        };

        this.player.onPrevRequest = () => {
            const prevTrack = this.model.getPrevTrack();
            if (prevTrack) this.player.loadTrack(prevTrack);
        };

        this.player.onShuffleToggle = () => {
            return this.model.toggleShuffle();
        };

        this.player.onLyricsRequest = (trackId) => {
            const track = this.model.getTrackById(trackId);
            if (track) this.view.openLyrics(track);
        };
    }

    async init() {
        try {
            await this.model.fetchTracks();
            this.view.renderGrid(this.model.filteredTracks);
        } catch (error) {
            this.view.renderErrorState('Файл data/songs.json не найден. Музыкальная база недоступна.');
        }
    }

    handleSearch(searchTerm) {
        const filtered = this.model.applySearch(searchTerm);
        const currentPlayingId = this.player.currentTrack ? this.player.currentTrack.id : null;
        this.view.renderGrid(filtered, currentPlayingId, this.player.isPlaying);
    }

    _handleTrackClick(trackId) {
        if (this.player.currentTrack && this.player.currentTrack.id === trackId) {
            this.player.togglePlay();
        } else {
            this.model.setCurrentIndexById(trackId);
            const track = this.model.getTrackById(trackId);
            this.player.loadTrack(track);
        }
    }
}