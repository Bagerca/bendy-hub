import { Logger } from '../../shared/js/Logger.js';
import { Icons } from '../../shared/js/icons.js';
import { YouTubeService } from './services/YouTubeService.js';
import { DragService } from './services/DragService.js';

export class FloatingPlayer {
    constructor() {
        this.container = document.getElementById('floating-player');
        if (!this.container) this._injectPlayerHTML();
        
        this.els = {
            header: document.getElementById('fp-drag-handle'),
            titleWrapper: document.querySelector('.fp-title-wrapper'),
            title: document.getElementById('fp-title'),
            closeBtn: document.getElementById('fp-close'),
            btnLocate: document.getElementById('fp-locate'),
            
            iframeContainer: document.getElementById('fp-iframe-container'),
            cover: document.getElementById('fp-cover'), // НОВОЕ: Обложка
            
            timeCurrent: document.getElementById('fp-time-current'),
            timeTotal: document.getElementById('fp-time-total'),
            progressSlider: document.getElementById('fp-progress-slider'),

            btnPrev: document.getElementById('fp-prev'),
            btnNext: document.getElementById('fp-next'),
            btnPlayPause: document.getElementById('fp-playpause'),
            
            volumeWrapper: document.getElementById('fp-volume-wrapper'),
            btnMute: document.getElementById('fp-mute'),
            volumeSlider: document.getElementById('fp-volume-slider'),
            
            dockPlayPause: document.getElementById('fp-dock-playpause'),
            dockMute: document.getElementById('fp-dock-mute'),
            dockLocate: document.getElementById('fp-dock-locate'),
            dockClose: document.getElementById('fp-dock-close'),
        };

        this.currentTrack = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.isScrubbing = false; 
        this.currentVolume = 100; 
        this.updateInterval = null;
        
        this.onNextRequest = null;
        this.onPrevRequest = null;
        this.onLocateRequest = null;
        this.onClose = null;
        this.onPlayStateChange = null;

        this.ytService = new YouTubeService('fp-iframe-container');
        this.dragService = new DragService(this.container, this.els.header);
        
        this.ytService.onReady = () => this._restoreState();
        this.dragService.onStateSaveRequest = () => this._saveState();

        this._initEvents();
        this._bindYouTubeEvents();
        this._startTitleMarquee();
    }

    _injectPlayerHTML() {
        const html = `
            <div id="floating-player" class="floating-player">
                <div class="fp-header" id="fp-drag-handle">
                    <div class="fp-header-left">
                        <div class="fp-title-wrapper"><span class="fp-title" id="fp-title">Воспроизведение...</span></div>
                    </div>
                    <div class="fp-actions">
                        <button class="fp-action-btn" id="fp-locate" title="Найти в плейлисте">${Icons.player_locate}</button>
                        <button class="fp-action-btn fp-close" id="fp-close" title="Закрыть">${Icons.close}</button>
                    </div>
                </div>
                <div class="fp-body">
                    <!-- Обложка поверх видео до момента плей -->
                    <div class="fp-cover" id="fp-cover"></div>
                    <div class="fp-drag-overlay" id="fp-drag-overlay"></div>
                    <div id="fp-iframe-container"></div>
                </div>
                
                <div class="fp-progress-wrapper" id="fp-progress-wrapper">
                    <span id="fp-time-current" class="fp-time">0:00</span>
                    <input type="range" id="fp-progress-slider" class="fp-progress-slider" min="0" max="100" value="0" step="1" style="--prog: 0%;">
                    <span id="fp-time-total" class="fp-time">0:00</span>
                </div>

                <div class="fp-controls">
                    <div class="fp-volume-wrapper" id="fp-volume-wrapper">
                        <button id="fp-mute" class="fp-btn" title="Звук">${Icons.player_volume_full}</button>
                        <input type="range" id="fp-volume-slider" class="fp-volume-slider" min="0" max="100" value="100" style="--vol: 100%;">
                    </div>
                    <div class="fp-controls-center">
                        <button id="fp-prev" class="fp-btn" title="Предыдущий">${Icons.player_prev}</button>
                        <button id="fp-playpause" class="fp-btn fp-btn-playpause" title="Пауза">${Icons.player_pause}</button>
                        <button id="fp-next" class="fp-btn" title="Следующий">${Icons.player_next}</button>
                    </div>
                    <div></div>
                </div>
                <div class="fp-docked-controls">
                    <button id="fp-dock-playpause" class="fp-btn fp-btn-playpause" title="Плей/Пауза">${Icons.player_pause}</button>
                    <button id="fp-dock-mute" class="fp-btn" title="Звук">${Icons.player_volume_full}</button>
                    <button id="fp-dock-locate" class="fp-btn" title="Найти">${Icons.player_locate}</button>
                    <button id="fp-dock-close" class="fp-btn" title="Закрыть" style="color: var(--error-color);">${Icons.close}</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this.container = document.getElementById('floating-player');
    }

    _initEvents() {
        const closeHandler = () => this.close();
        const locateHandler = () => {
            if (this.onLocateRequest && this.currentTrack && window.location.pathname.includes('music.html')) {
                this.onLocateRequest(this.currentTrack);
            } else if (this.currentTrack) {
                const url = `music.html?locate=${this.currentTrack.id}`;
                if (window.router) window.router.navigate(url);
                else window.location.href = url;
            }
        };

        const playPauseHandler = () => this.togglePlay();
        const muteHandler = () => this.toggleMute();

        this.els.closeBtn.addEventListener('click', closeHandler);
        this.els.btnLocate.addEventListener('click', locateHandler);
        this.els.btnNext.addEventListener('click', () => { if (this.onNextRequest) this.onNextRequest(); });
        this.els.btnPrev.addEventListener('click', () => { if (this.onPrevRequest) this.onPrevRequest(); });
        this.els.btnPlayPause.addEventListener('click', playPauseHandler);
        this.els.btnMute.addEventListener('click', muteHandler);

        this.els.volumeSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            e.target.style.setProperty('--vol', `${val}%`);
            this.setVolume(val);
        });
        this.els.volumeSlider.addEventListener('mousedown', e => e.stopPropagation());
        this.els.volumeSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

        this.els.progressSlider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.isScrubbing = true;
        });
        this.els.progressSlider.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.isScrubbing = true;
        }, { passive: true });

        this.els.progressSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            const max = e.target.max || 100;
            const pct = (val / max) * 100;
            e.target.style.setProperty('--prog', `${pct}%`);
            this.els.timeCurrent.textContent = this._formatTime(val);
        });

        this.els.progressSlider.addEventListener('change', (e) => {
            this.ytService.seekTo(e.target.value);
            this.isScrubbing = false;
        });

        [this.els.dockPlayPause, this.els.dockMute, this.els.dockLocate, this.els.dockClose].forEach(btn => {
            btn.addEventListener('mousedown', e => e.stopPropagation());
            btn.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
        });

        this.els.dockPlayPause.addEventListener('click', playPauseHandler);
        this.els.dockMute.addEventListener('click', muteHandler);
        this.els.dockLocate.addEventListener('click', locateHandler);
        this.els.dockClose.addEventListener('click', closeHandler);
    }

    _bindYouTubeEvents() {
        this.ytService.onStateChange = (stateCode, States) => {
            if (stateCode === States.PLAYING) {
                this.isPlaying = true;
                this.container.classList.add('is-playing'); // НОВОЕ: Скрывает обложку!
                this._setPlayIcon(Icons.player_pause);
                
                if (!this.updateInterval) {
                    this.updateInterval = setInterval(() => {
                        this._saveState();
                        this._updateProgress();
                    }, 500);
                }
                if (this.onPlayStateChange) this.onPlayStateChange(true);

            } else if (stateCode === States.PAUSED || stateCode === States.ENDED) {
                this.isPlaying = false;
                this._setPlayIcon(Icons.player_play);
                
                clearInterval(this.updateInterval);
                this.updateInterval = null;
                
                this._saveState();
                this._updateProgress(); 
                
                if (this.onPlayStateChange) this.onPlayStateChange(false);
                if (stateCode === States.ENDED && this.onNextRequest) this.onNextRequest();
            }
        };
    }

    _updateProgress() {
        if (!this.ytService.isReady || this.isScrubbing) return;
        
        const current = this.ytService.getCurrentTime();
        const total = this.ytService.getDuration();
        
        if (total > 0) {
            this.els.progressSlider.max = total;
            this.els.progressSlider.value = current;
            const pct = (current / total) * 100;
            this.els.progressSlider.style.setProperty('--prog', `${pct}%`);
            
            this.els.timeCurrent.textContent = this._formatTime(current);
            this.els.timeTotal.textContent = this._formatTime(total);
        }
    }

    _formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    _setPlayIcon(icon) {
        this.els.btnPlayPause.innerHTML = icon;
        this.els.dockPlayPause.innerHTML = icon;
    }

    togglePlay() {
        if (this.isPlaying) this.ytService.pause();
        else this.ytService.play();
    }

    setVolume(value) {
        const vol = parseInt(value, 10);
        this.currentVolume = vol;
        if (vol === 0) {
            this.isMuted = true;
            this.ytService.mute();
        } else {
            this.isMuted = false;
            this.ytService.unMute();
            this.ytService.setVolume(vol);
        }
        this._updateVolumeIcon();
        this._saveState();
    }

    toggleMute() {
        if (this.isMuted) {
            this.isMuted = false;
            this.ytService.unMute();
            if (this.currentVolume === 0) {
                this.currentVolume = 50;
                this.ytService.setVolume(50);
                this.els.volumeSlider.value = 50;
                this.els.volumeSlider.style.setProperty('--vol', '50%');
            }
        } else {
            this.isMuted = true;
            this.ytService.mute();
        }
        this._updateVolumeIcon();
        this._saveState();
    }

    _updateVolumeIcon() {
        let icon = Icons.player_volume_full;
        if (this.isMuted || this.currentVolume === 0) icon = Icons.player_mute;
        else if (this.currentVolume < 30) icon = Icons.player_volume_low;
        else if (this.currentVolume < 70) icon = Icons.player_volume_mid;

        this.els.btnMute.innerHTML = icon;
        this.els.dockMute.innerHTML = icon;
    }

    loadTrack(track, startSeconds = 0) {
        if (!track || !track.youtubeUrl) return;
        this.currentTrack = track;
        this.els.title.textContent = track.title;
        
        this.els.progressSlider.value = 0;
        this.els.progressSlider.style.setProperty('--prog', `0%`);
        this.els.timeCurrent.textContent = '0:00';
        this.els.timeTotal.textContent = '0:00';
        
        // ВАЖНО: При загрузке трека возвращаем обложку (скрываем видео)
        this.container.classList.remove('is-playing');
        if (track.cover) {
            this.els.cover.style.backgroundImage = `url('assets/music/${track.id}/${track.cover}')`;
        } else {
            this.els.cover.style.backgroundImage = 'none';
        }
        
        const videoId = this.ytService.extractId(track.youtubeUrl);
        if (videoId) this.ytService.loadVideo(videoId, startSeconds, this.currentVolume, this.isMuted);
        
        this._updateAmbientBackground();
        this.open();
        this._saveState();
    }

    open() { this.container.classList.add('active'); }

    close() {
        this.container.classList.remove('active', 'is-playing');
        clearInterval(this.updateInterval);
        localStorage.removeItem('bendy_player_state');
        const ambientBg = document.getElementById('ambient-bg');
        if (ambientBg) ambientBg.style.opacity = '0';
        
        setTimeout(() => {
            this.ytService.destroy();
            this.currentTrack = null;
            this.isPlaying = false;
            if (this.onClose) this.onClose();
        }, 300);
    }

    _updateAmbientBackground() {
        const ambientBg = document.getElementById('ambient-bg');
        if (ambientBg && this.currentTrack && this.currentTrack.cover) {
            ambientBg.style.backgroundImage = `url('assets/music/${this.currentTrack.id}/${this.currentTrack.cover}')`;
            ambientBg.style.opacity = '1';
        }
    }

    _saveState() {
        if (!this.currentTrack) return;
        const state = {
            track: this.currentTrack,
            time: this.ytService.getCurrentTime(),
            volume: this.currentVolume,
            isMuted: this.isMuted,
            isDocked: this.dragService.isDocked,
            dockSide: this.dragService.dockSide,
            top: this.container.style.top,
            left: this.container.style.left,
            right: this.container.style.right
        };
        localStorage.setItem('bendy_player_state', JSON.stringify(state));
    }

    _restoreState() {
        const saved = localStorage.getItem('bendy_player_state');
        if (saved && this.ytService.isReady) {
            try {
                const state = JSON.parse(saved);
                
                if (state.top) this.container.style.top = state.top;
                if (state.left) this.container.style.left = state.left;
                if (state.right) this.container.style.right = state.right;
                
                if (state.isDocked) this.dragService.dock(state.dockSide || 'right', parseFloat(state.top));

                if (state.volume !== undefined) {
                    this.currentVolume = state.volume;
                    this.els.volumeSlider.value = state.volume;
                    this.els.volumeSlider.style.setProperty('--vol', `${state.volume}%`);
                }

                if (state.isMuted) this.isMuted = true;
                
                this._updateVolumeIcon();
                this.loadTrack(state.track, state.time || 0);
            } catch (e) {
                Logger.warn("Не удалось восстановить состояние плеера", e);
            }
        }
    }

    _startTitleMarquee() {
        setInterval(() => {
            if (this.dragService.isDocked || this.container.classList.contains('is-dragging')) return;
            const title = this.els.title;
            const wrapper = this.els.titleWrapper;
            title.style.transition = 'none';
            title.style.transform = 'translateX(0)';
            if (title.scrollWidth > wrapper.clientWidth) {
                setTimeout(() => {
                    if (this.dragService.isDocked || this.container.classList.contains('is-dragging')) return;
                    const distance = title.scrollWidth - wrapper.clientWidth + 30;
                    const duration = Math.max(distance / 25, 2); 
                    title.style.transition = `transform ${duration}s linear`;
                    title.style.transform = `translateX(-${distance}px)`;
                }, 1500); 
            }
        }, 8000); 
    }
}