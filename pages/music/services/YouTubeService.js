// FILE: pages/music/services/YouTubeService.js
import { Logger } from '../../../shared/js/Logger.js';

// Глобальные переменные для управления загрузкой YouTube API для всех инстансов
let isYtApiLoaded = false;
let isYtApiLoading = false;
const ytReadyCallbacks = [];

// Единственный глобальный обработчик (не будет перезаписан)
window.onYouTubeIframeAPIReady = () => {
    isYtApiLoaded = true;
    ytReadyCallbacks.forEach(cb => cb());
    ytReadyCallbacks.length = 0;
};

export class YouTubeService {
    constructor(containerId) {
        this.containerId = containerId;
        this.player = null;
        this.isReady = false;

        this.onStateChange = null;
        this.onReady = null;
        
        this._loadApi();
    }

    _loadApi() {
        if (isYtApiLoaded || (window.YT && window.YT.Player)) {
            this.isReady = true;
            setTimeout(() => { if (this.onReady) this.onReady(); }, 0);
            return;
        }

        ytReadyCallbacks.push(() => {
            this.isReady = true;
            if (this.onReady) this.onReady();
        });

        if (!isYtApiLoading) {
            isYtApiLoading = true;
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
        }
    }

    extractId(url) {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }

    loadVideo(videoId, startSeconds = 0, volume = 100, isMuted = false, autoplay = true) {
        if (!this.isReady) return;

        if (this.player) {
            if (autoplay) {
                this.player.loadVideoById({ videoId, startSeconds });
            } else {
                this.player.cueVideoById({ videoId, startSeconds });
            }
        } else {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            
            // Динамический ID, чтобы плееры не перезаписывали друг друга
            const placeholderId = `${this.containerId}-api-placeholder`;
            container.innerHTML = `<div id="${placeholderId}"></div>`;
            
            this.player = new YT.Player(placeholderId, {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: { 
                    'autoplay': autoplay ? 1 : 0, 
                    'controls': 0,           
                    'rel': 0,                
                    'modestbranding': 1,     
                    'iv_load_policy': 3,     
                    'disablekb': 1,          
                    'fs': 0                  
                },
                events: {
                    'onReady': (event) => {
                        event.target.setVolume(volume);
                        if (isMuted) event.target.mute();
                        
                        if (!autoplay) {
                            event.target.cueVideoById({ videoId, startSeconds });
                        } else if (startSeconds > 0) {
                            event.target.seekTo(startSeconds, true);
                        }
                    },
                    'onStateChange': (e) => {
                        if (this.onStateChange) this.onStateChange(e.data, YT.PlayerState);
                    }
                }
            });
        }
    }

    play() { if (this.player && typeof this.player.playVideo === 'function') this.player.playVideo(); }
    pause() { if (this.player && typeof this.player.pauseVideo === 'function') this.player.pauseVideo(); }
    setVolume(vol) { if (this.player && typeof this.player.setVolume === 'function') this.player.setVolume(vol); }
    mute() { if (this.player && typeof this.player.mute === 'function') this.player.mute(); }
    unMute() { if (this.player && typeof this.player.unMute === 'function') this.player.unMute(); }
    
    getState() { return this.player && typeof this.player.getPlayerState === 'function' ? this.player.getPlayerState() : -1; }
    
    getCurrentTime() { return this.player && typeof this.player.getCurrentTime === 'function' ? this.player.getCurrentTime() : 0; }
    getDuration() { return this.player && typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0; }
    seekTo(seconds) { if (this.player && typeof this.player.seekTo === 'function') this.player.seekTo(seconds, true); }
    
    destroy() {
        if (this.player && typeof this.player.destroy === 'function') {
            this.player.destroy();
            this.player = null;
        }
    }
}