import { Logger } from '../../shared/js/Logger.js';

export class AudioPlayer {
    constructor() {
        this.audio = document.getElementById('html5-audio');
        this.container = document.getElementById('global-player');
        
        this.els = {
            cover: document.getElementById('player-cover'),
            title: document.getElementById('player-title'),
            artist: document.getElementById('player-artist'),
            playPauseBtn: document.getElementById('btn-play-pause'),
            iconPlay: document.getElementById('icon-play'),
            iconPause: document.getElementById('icon-pause'),
            btnPrev: document.getElementById('btn-prev'),
            btnNext: document.getElementById('btn-next'),
            btnShuffle: document.getElementById('btn-shuffle'),
            btnRepeat: document.getElementById('btn-repeat'),
            btnLyrics: document.getElementById('btn-lyrics'),
            progressSlider: document.getElementById('progress-slider'),
            volSlider: document.getElementById('volume-slider'),
            timeCur: document.getElementById('time-current'),
            timeTot: document.getElementById('time-total')
        };

        this.currentTrack = null;
        this.isPlaying = false;
        this.isRepeat = false;

        this.onStateChange = null; 
        this.onNextRequest = null;
        this.onPrevRequest = null;
        this.onShuffleToggle = null;
        this.onLyricsRequest = null;

        this._initEvents();
        this._updateSliderColor(this.els.volSlider); 
    }

    _initEvents() {
        this.els.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.els.btnNext.addEventListener('click', () => { if (this.onNextRequest) this.onNextRequest(); });
        this.els.btnPrev.addEventListener('click', () => { if (this.onPrevRequest) this.onPrevRequest(); });
        
        this.els.btnShuffle.addEventListener('click', () => {
            if (this.onShuffleToggle) {
                const isActive = this.onShuffleToggle();
                this.els.btnShuffle.classList.toggle('active', isActive);
            }
        });

        this.els.btnRepeat.addEventListener('click', () => {
            this.isRepeat = !this.isRepeat;
            this.els.btnRepeat.classList.toggle('active', this.isRepeat);
            this.audio.loop = this.isRepeat; 
        });

        this.els.btnLyrics.addEventListener('click', () => { 
            if (this.onLyricsRequest && this.currentTrack) this.onLyricsRequest(this.currentTrack.id); 
        });

        this.audio.addEventListener('timeupdate', () => this._updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.els.timeTot.textContent = this._formatTime(this.audio.duration);
            this.els.progressSlider.max = this.audio.duration;
        });
        
        this.audio.addEventListener('ended', () => { 
            if (!this.isRepeat && this.onNextRequest) this.onNextRequest(); 
        });
        
        this.els.progressSlider.addEventListener('input', (e) => {
            this.audio.currentTime = e.target.value;
            this._updateSliderColor(e.target);
            this.els.timeCur.textContent = this._formatTime(e.target.value);
        });

        this.els.volSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
            this._updateSliderColor(e.target);
        });
    }

    loadTrack(track, autoPlay = true) {
        if (!track || !track.audio) {
            Logger.warn('Трек не имеет аудиофайла');
            return;
        }

        this.container.classList.add('active');
        this.currentTrack = track;
        
        this.els.progressSlider.value = 0;
        this._updateSliderColor(this.els.progressSlider);
        this.els.timeCur.textContent = "0:00";
        this.els.timeTot.textContent = "0:00";

        // Динамически строим пути (НОВЫЙ СТАНДАРТ)
        this.audio.src = `assets/music/${track.id}/${track.audio}`;
        this.els.cover.src = track.cover ? `assets/music/${track.id}/${track.cover}` : '';
        
        this.els.title.textContent = track.title;
        this.els.artist.textContent = track.artist;

        if (autoPlay) this.play();
    }

    togglePlay() {
        if (!this.currentTrack) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        if (!this.audio.src) return;
        const playPromise = this.audio.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.els.iconPlay.style.display = 'none';
                this.els.iconPause.style.display = 'block';
                this._notifyStateChange();
            }).catch(err => {
                Logger.error('Ошибка воспроизведения:', err);
                this.isPlaying = false;
                this.els.iconPlay.style.display = 'block';
                this.els.iconPause.style.display = 'none';
                this._notifyStateChange();
            });
        }
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.els.iconPlay.style.display = 'block';
        this.els.iconPause.style.display = 'none';
        this._notifyStateChange();
    }

    _notifyStateChange() {
        if (this.onStateChange && this.currentTrack) {
            this.onStateChange(this.currentTrack, this.isPlaying);
        }
    }

    _updateProgress() {
        if (!this.audio.duration) return;
        this.els.progressSlider.value = this.audio.currentTime;
        this._updateSliderColor(this.els.progressSlider);
        this.els.timeCur.textContent = this._formatTime(this.audio.currentTime);
    }

    _updateSliderColor(slider) {
        const min = parseFloat(slider.min) || 0;
        const max = parseFloat(slider.max) || 100;
        const value = ((slider.value - min) / (max - min)) * 100;
        slider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${value}%, rgba(150, 150, 150, 0.2) ${value}%, rgba(150, 150, 150, 0.2) 100%)`;
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
}