// FILE: pages/music/FloatingPlayer.js

import { YouTubeService } from './services/YouTubeService.js';
import { DragService } from './services/DragService.js';
import { PlayerUI } from './PlayerUI.js';
import { PlayerStorage } from './PlayerStorage.js';

export class FloatingPlayer {
    constructor() {
        this.currentTrack = null;
        this.isPlaying = false;
        this.isMuted = false;
        this.isScrubbing = false; 
        this.currentVolume = 100;
        this.updateInterval = null;
        this.marqueeInterval = null;

        this.onNextRequest = null;
        this.onPrevRequest = null;
        this.onLocateRequest = null;
        this.onClose = null;
        this.onPlayStateChange = null;

        this.storage = new PlayerStorage();
        this.ui = new PlayerUI({
            onPlayPause: () => this.togglePlay(),
            onMute: () => this.toggleMute(),
            onClose: () => this.close(),
            onLocate: () => this._handleLocate(),
            onPrev: () => { if (this.onPrevRequest) this.onPrevRequest(); },
            onNext: () => { if (this.onNextRequest) this.onNextRequest(); },
            onVolumeChange: (val) => {
                this.isMuted = false;
                this.currentVolume = parseInt(val, 10);
                this.ytService.unMute();
                this.ytService.setVolume(this.currentVolume);
                this.ui.updateVolumeUI(this.currentVolume, this.isMuted);
                this._saveState();
            },
            onScrubStart: () => { 
                this.isScrubbing = true; 
                if (this.ambientYtService.isReady && !this._isMobile()) {
                    this.ambientYtService.pause();
                }
                document.getElementById('ambient-wrapper')?.classList.remove('is-playing');
            },
            onSeek: (seconds) => {
                this.ytService.seekTo(seconds);
                if (this.ambientYtService.isReady && !this._isMobile()) {
                    this.ambientYtService.seekTo(seconds);
                    if (this.isPlaying) {
                        this.ambientYtService.play();
                        document.getElementById('ambient-wrapper')?.classList.add('is-playing');
                    }
                }
                this.isScrubbing = false;
            }
        });

        this.ytService = new YouTubeService('fp-iframe-container');
        this.ambientYtService = new YouTubeService('ambient-video-container'); 

        this.dragService = new DragService(this.ui.container, this.ui.els.header);
        
        this.ytService.onReady = () => this._restoreState();
        this.dragService.onStateSaveRequest = () => this._saveState();

        this._bindYouTubeEvents();
        this._initMarqueeLoop();
    }

    _isMobile() {
        return window.innerWidth <= 768; // Отключаем видео-фон на мобильных устройствах
    }

    _handleLocate() {
        if (this.onLocateRequest && this.currentTrack && window.location.pathname.includes('music.html')) {
            this.onLocateRequest(this.currentTrack);
        } else if (this.currentTrack) {
            const url = `music.html?locate=${this.currentTrack.id}`;
            if (window.router) window.router.navigate(url);
            else window.location.href = url;
        }
    }

    _bindYouTubeEvents() {
        this.ytService.onStateChange = (stateCode, States) => {
            const wrapper = document.getElementById('ambient-wrapper');

            // 1 = PLAYING
            if (stateCode === States.PLAYING) {
                this.isPlaying = true;
                this.ui.setPlayState(true);
                
                if (wrapper && !this._isMobile()) {
                    wrapper.classList.add('is-playing'); // Прячем обложку, показываем видео
                }
                
                if(this.ambientYtService.isReady && !this.isScrubbing && !this._isMobile()) {
                    this.ambientYtService.play();
                    // Жесткая синхронизация времени
                    const mainTime = this.ytService.getCurrentTime();
                    const ambientTime = this.ambientYtService.getCurrentTime();
                    if (Math.abs(mainTime - ambientTime) > 0.5) {
                        this.ambientYtService.seekTo(mainTime);
                    }
                }

                if (!this.updateInterval) {
                    this.updateInterval = setInterval(() => {
                        this._saveState();
                        this._updateProgress();
                    }, 500);
                }
                if (this.onPlayStateChange) this.onPlayStateChange(true);

            // 3 = BUFFERING
            } else if (stateCode === States.BUFFERING) {
                this.isPlaying = true; 
                this.ui.setPlayState(true);
                if (wrapper) wrapper.classList.remove('is-playing'); // Показываем обложку на время загрузки
                if(this.ambientYtService.isReady && !this._isMobile()) this.ambientYtService.pause();

            // 2 = PAUSED, 0 = ENDED, 5 = CUED
            } else if (stateCode === States.PAUSED || stateCode === States.ENDED || stateCode === States.CUED) {
                this.isPlaying = false;
                this.ui.setPlayState(false);
                
                if (wrapper) wrapper.classList.remove('is-playing'); // Возвращаем обложку

                if(this.ambientYtService.isReady && !this._isMobile()) this.ambientYtService.pause();

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
        this.ui.updateProgressUI(this.ytService.getCurrentTime(), this.ytService.getDuration());
    }

    togglePlay() {
        if (!this.ytService.isReady || !this.ytService.player) return;
        const state = this.ytService.getState();
        
        if (state === 1 || state === 3) {
            this.ytService.pause();
        } else {
            this.ytService.play();
        }
    }

    toggleMute() {
        if (this.isMuted) {
            this.isMuted = false;
            this.ytService.unMute();
            if (this.currentVolume === 0) this.currentVolume = 50;
            this.ytService.setVolume(this.currentVolume);
        } else {
            this.isMuted = true;
            this.ytService.mute();
        }
        this.ui.updateVolumeUI(this.currentVolume, this.isMuted);
        this._saveState();
    }

    loadTrack(track, startSeconds = 0, autoplay = true) {
        if (!track || !track.youtubeUrl) return;
        this.currentTrack = track;
        
        this.ui.updateTrackInfo(track);
        
        const videoId = this.ytService.extractId(track.youtubeUrl);
        if (videoId) {
            this.ytService.loadVideo(videoId, startSeconds, this.currentVolume, this.isMuted, autoplay);
            
            // Если НЕ мобильный, грузим видео на фон
            if (this.ambientYtService && !this._isMobile()) {
                this.ambientYtService.loadVideo(videoId, startSeconds, 0, true, autoplay);
            }
        }
        
        this._updateAmbientBackground();
        this.ui.open();
        this._saveState();
    }

    close() {
        this.ui.close();
        
        if (this.dragService.isDocked) {
            this.dragService.undock();
        }

        clearInterval(this.updateInterval);
        this.storage.clear();
        
        const wrapper = document.getElementById('ambient-wrapper');
        if (wrapper) wrapper.classList.remove('is-active', 'is-playing');
        
        setTimeout(() => {
            this.ytService.destroy();
            if (this.ambientYtService) this.ambientYtService.destroy();

            this.currentTrack = null;
            this.isPlaying = false;
            if (this.onClose) this.onClose();
        }, 500);
    }

    _updateAmbientBackground() {
        const wrapper = document.getElementById('ambient-wrapper');
        const cover = document.getElementById('ambient-cover');
        
        if (wrapper && cover && this.currentTrack && this.currentTrack.cover) {
            cover.style.backgroundImage = `url('assets/music/${this.currentTrack.id}/${this.currentTrack.cover}')`;
            wrapper.classList.add('is-active');
            wrapper.classList.remove('is-playing'); // Начинаем с показа обложки
        }
    }

    _saveState() {
        if (!this.currentTrack) return;
        this.storage.save({
            track: this.currentTrack,
            time: this.ytService.getCurrentTime(),
            volume: this.currentVolume,
            isMuted: this.isMuted,
            isDocked: this.dragService.isDocked,
            dockSide: this.dragService.dockSide,
            top: this.ui.container.style.top,
            left: this.ui.container.style.left,
            right: this.ui.container.style.right
        });
    }

    _restoreState() {
        const state = this.storage.load();
        if (state && this.ytService.isReady) {
            if (state.top) this.ui.container.style.top = state.top;
            if (state.left) this.ui.container.style.left = state.left;
            if (state.right) this.ui.container.style.right = state.right;
            
            if (state.isDocked) this.dragService.dock(state.dockSide || 'right', parseFloat(state.top));

            if (state.volume !== undefined) this.currentVolume = state.volume;
            if (state.isMuted) this.isMuted = true;
            
            this.ui.updateVolumeUI(this.currentVolume, this.isMuted);
            this.loadTrack(state.track, state.time || 0, false);
        }
    }

    _initMarqueeLoop() {
        this.marqueeInterval = setInterval(() => {
            this.ui.startMarquee(this.dragService.isDocked);
        }, 8000); 
    }
}