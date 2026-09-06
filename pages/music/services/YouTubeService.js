import { Logger } from '../../../shared/js/Logger.js';

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
        if (window.YT && window.YT.Player) {
            this.isReady = true;
            if (this.onReady) this.onReady();
            return;
        }

        window.onYouTubeIframeAPIReady = () => {
            this.isReady = true;
            if (this.onReady) this.onReady();
        };

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
    }

    extractId(url) {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }

    loadVideo(videoId, startSeconds = 0, volume = 100, isMuted = false) {
        if (!this.isReady) return;

        if (this.player) {
            this.player.loadVideoById({ videoId, startSeconds });
            if (startSeconds > 0) {
                setTimeout(() => this.player.pauseVideo(), 200);
            }
        } else {
            const container = document.getElementById(this.containerId);
            if (!container) return;
            container.innerHTML = '<div id="yt-api-placeholder"></div>';
            
            this.player = new YT.Player('yt-api-placeholder', {
                height: '100%',
                width: '100%',
                videoId: videoId,
                playerVars: { 
                    'autoplay': startSeconds === 0 ? 1 : 0, 
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
                        if (startSeconds > 0) {
                            event.target.seekTo(startSeconds);
                            event.target.pauseVideo();
                        }
                    },
                    'onStateChange': (e) => {
                        if (this.onStateChange) this.onStateChange(e.data, YT.PlayerState);
                    }
                }
            });
        }
    }

    play() { if (this.player) this.player.playVideo(); }
    pause() { if (this.player) this.player.pauseVideo(); }
    setVolume(vol) { if (this.player) this.player.setVolume(vol); }
    mute() { if (this.player) this.player.mute(); }
    unMute() { if (this.player) this.player.unMute(); }
    
    // Новые методы для перемотки
    getCurrentTime() { return this.player && typeof this.player.getCurrentTime === 'function' ? this.player.getCurrentTime() : 0; }
    getDuration() { return this.player && typeof this.player.getDuration === 'function' ? this.player.getDuration() : 0; }
    seekTo(seconds) { if (this.player) this.player.seekTo(seconds, true); }
    
    destroy() {
        if (this.player) {
            this.player.destroy();
            this.player = null;
        }
    }
}