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
            btnLyrics: document.getElementById('btn-lyrics'),
            progress: document.getElementById('progress-bar'),
            progressContainer: document.getElementById('progress-container'),
            timeCur: document.getElementById('time-current'),
            timeTot: document.getElementById('time-total')
        };

        this.currentTrack = null;
        this.isPlaying = false;

        // Коллбэки (События), на которые подпишется Контроллер
        this.onStateChange = null; // Передает (trackId, isPlaying)
        this.onNextRequest = null;
        this.onPrevRequest = null;
        this.onLyricsRequest = null;

        this._initEvents();
    }

    _initEvents() {
        this.els.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.els.btnNext.addEventListener('click', () => { if (this.onNextRequest) this.onNextRequest(); });
        this.els.btnPrev.addEventListener('click', () => { if (this.onPrevRequest) this.onPrevRequest(); });
        this.els.btnLyrics.addEventListener('click', () => { if (this.onLyricsRequest && this.currentTrack) this.onLyricsRequest(this.currentTrack.id); });

        this.audio.addEventListener('timeupdate', () => this._updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.els.timeTot.textContent = this._formatTime(this.audio.duration);
        });
        
        // Автоматически играем следующий трек по завершении
        this.audio.addEventListener('ended', () => { if (this.onNextRequest) this.onNextRequest(); });
        
        this.els.progressContainer.addEventListener('click', (e) => {
            const rect = this.els.progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
    }

    loadTrack(track, autoPlay = true) {
        if (!track || !track.audioUrl) {
            Logger.error('Ошибка загрузки трека: нет аудио файла.');
            return;
        }

        this.container.classList.add('active');
        this.currentTrack = track;
        this.audio.src = track.audioUrl;
        
        this.els.title.textContent = track.title;
        this.els.artist.textContent = track.artist;
        this.els.cover.src = track.cover;

        if (autoPlay) this.play();
    }

    togglePlay() {
        if (!this.currentTrack) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        if (!this.audio.src) return; // Защита от пустых вызовов

        const playPromise = this.audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                this.isPlaying = true;
                this.els.iconPlay.style.display = 'none';
                this.els.iconPause.style.display = 'block';
                this._notifyStateChange();
            }).catch(err => {
                Logger.error('Воспроизведение заблокировано браузером или произошел сбой сети:', err);
                
                // Сбрасываем UI в состояние "Пауза", чтобы сетка (View) убрала анимацию эквалайзера
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
            this.onStateChange(this.currentTrack.id, this.isPlaying);
        }
    }

    _updateProgress() {
        if (!this.audio.duration) return;
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.els.progress.style.width = `${percent}%`;
        this.els.timeCur.textContent = this._formatTime(this.audio.currentTime);
    }

    _formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
}