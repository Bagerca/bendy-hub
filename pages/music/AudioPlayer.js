import { Logger } from '../../shared/js/Logger.js';

export class AudioPlayer {
    constructor(musicManager) {
        this.manager = musicManager; // Ссылка на менеджер для обновления UI карточек
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

        this.initEvents();
    }

    initEvents() {
        // Управление воспроизведением
        this.els.playPauseBtn.addEventListener('click', () => this.togglePlay());
        this.els.btnNext.addEventListener('click', () => this.manager.playNext());
        this.els.btnPrev.addEventListener('click', () => this.manager.playPrev());

        // Прогресс бар и время
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => {
            this.els.timeTot.textContent = this.formatTime(this.audio.duration);
        });
        this.audio.addEventListener('ended', () => this.manager.playNext()); // Автовоспроизведение след. трека
        
        // Клик по полосе перемотки
        this.els.progressContainer.addEventListener('click', (e) => {
            const rect = this.els.progressContainer.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });

        // Модалка текста
        this.els.btnLyrics.addEventListener('click', () => {
            if (this.currentTrack) this.manager.openLyrics(this.currentTrack);
        });
    }

    loadTrack(track) {
        if (!track || !track.audioUrl) {
            Logger.error('Ошибка загрузки трека: нет аудио файла.');
            return;
        }

        // Показываем плеер, если скрыт
        this.container.classList.add('active');

        this.currentTrack = track;
        this.audio.src = track.audioUrl;
        
        this.els.title.textContent = track.title;
        this.els.artist.textContent = track.artist;
        this.els.cover.src = track.cover;

        this.play();
    }

    togglePlay() {
        if (!this.currentTrack) return;
        if (this.isPlaying) this.pause();
        else this.play();
    }

    play() {
        this.audio.play().then(() => {
            this.isPlaying = true;
            this.els.iconPlay.style.display = 'none';
            this.els.iconPause.style.display = 'block';
            this.manager.updateGridUI(this.currentTrack.id, true);
        }).catch(err => Logger.error('Ошибка автоплея (CORS/Политики браузера):', err));
    }

    pause() {
        this.audio.pause();
        this.isPlaying = false;
        this.els.iconPlay.style.display = 'block';
        this.els.iconPause.style.display = 'none';
        this.manager.updateGridUI(this.currentTrack.id, false);
    }

    updateProgress() {
        if (!this.audio.duration) return;
        const percent = (this.audio.currentTime / this.audio.duration) * 100;
        this.els.progress.style.width = `${percent}%`;
        this.els.timeCur.textContent = this.formatTime(this.audio.currentTime);
    }

    formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    }
}