// FILE: pages/music/PlayerUI.js
import { Icons } from '../../shared/js/icons.js';

/**
 * Отвечает за создание HTML, управление DOM элементами и анимациями плеера.
 */
export class PlayerUI {
    constructor(callbacks) {
        this.callbacks = callbacks; // { onPlayPause, onMute, onClose, onLocate, onPrev, onNext, onVolumeChange, onScrubStart, onSeek }
        this.container = document.getElementById('floating-player');
        
        if (!this.container) {
            this._injectHTML();
        }
        
        this._bindElements();
        this._initEvents();
        
        this.marqueeAnimation = null;
    }

    _injectHTML() {
        const html = `
            <div id="floating-player" class="floating-player">
                <div class="fp-header" id="fp-drag-handle">
                    <div class="fp-header-left">
                        <div class="smart-marquee-wrapper"><span class="fp-title smart-marquee-text" id="fp-title">Воспроизведение...</span></div>
                    </div>
                    <div class="fp-actions">
                        <button class="fp-action-btn" id="fp-locate" title="Найти в плейлисте">${Icons.player_locate}</button>
                        <button class="fp-action-btn fp-close" id="fp-close" title="Закрыть">${Icons.close}</button>
                    </div>
                </div>
                <div class="fp-body">
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
                    <div class="fp-youtube-wrapper">
                        <a href="#" target="_blank" rel="noopener noreferrer" id="fp-youtube" class="fp-btn fp-youtube" title="Смотреть на YouTube">${Icons.plat_youtube}</a>
                    </div>
                </div>
                
                <div class="fp-docked-controls">
                    <!-- Визуальный индикатор для перетаскивания (Grip) -->
                    <div class="fp-dock-drag-handle" id="fp-dock-drag-handle">
                        <span></span><span></span><span></span>
                    </div>

                    <button id="fp-dock-playpause" class="fp-btn fp-btn-playpause" title="Плей/Пауза">${Icons.player_pause}</button>
                    
                    <div class="fp-dock-volume-wrapper" id="fp-dock-volume-wrapper">
                        <button id="fp-dock-mute" class="fp-btn" title="Громкость">${Icons.player_volume_full}</button>
                        <div class="fp-dock-slider-panel" id="fp-dock-slider-panel">
                            <input type="range" id="fp-dock-volume-slider" class="fp-volume-slider-vertical" min="0" max="100" value="100" style="--vol: 100%;">
                        </div>
                    </div>

                    <a href="#" target="_blank" rel="noopener noreferrer" id="fp-dock-youtube" class="fp-btn fp-dock-youtube" title="На YouTube">${Icons.plat_youtube}</a>
                    <button id="fp-dock-locate" class="fp-btn" title="Найти">${Icons.player_locate}</button>
                    <button id="fp-dock-close" class="fp-btn" title="Закрыть" style="color: var(--error-color);">${Icons.close}</button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this.container = document.getElementById('floating-player');
    }

    _bindElements() {
        this.els = {
            header: document.getElementById('fp-drag-handle'),
            titleWrapper: document.querySelector('.fp-title-wrapper'),
            title: document.getElementById('fp-title'),
            closeBtn: document.getElementById('fp-close'),
            btnLocate: document.getElementById('fp-locate'),
            btnYoutube: document.getElementById('fp-youtube'),
            
            iframeContainer: document.getElementById('fp-iframe-container'),
            cover: document.getElementById('fp-cover'),
            
            timeCurrent: document.getElementById('fp-time-current'),
            timeTotal: document.getElementById('fp-time-total'),
            progressSlider: document.getElementById('fp-progress-slider'),

            btnPrev: document.getElementById('fp-prev'),
            btnNext: document.getElementById('fp-next'),
            btnPlayPause: document.getElementById('fp-playpause'),
            
            volumeWrapper: document.getElementById('fp-volume-wrapper'),
            btnMute: document.getElementById('fp-mute'),
            volumeSlider: document.getElementById('fp-volume-slider'),
            
            dockDragHandle: document.getElementById('fp-dock-drag-handle'),
            dockPlayPause: document.getElementById('fp-dock-playpause'),
            dockMute: document.getElementById('fp-dock-mute'),
            dockLocate: document.getElementById('fp-dock-locate'),
            dockYoutube: document.getElementById('fp-dock-youtube'),
            dockClose: document.getElementById('fp-dock-close'),
            dockVolumeWrapper: document.getElementById('fp-dock-volume-wrapper'),
            dockVolumeSlider: document.getElementById('fp-dock-volume-slider'),
        };
    }

    _initEvents() {
        // Базовые кнопки
        this.els.closeBtn.addEventListener('click', () => this.callbacks.onClose());
        this.els.btnLocate.addEventListener('click', () => this.callbacks.onLocate());
        this.els.btnNext.addEventListener('click', () => this.callbacks.onNext());
        this.els.btnPrev.addEventListener('click', () => this.callbacks.onPrev());
        this.els.btnPlayPause.addEventListener('click', () => this.callbacks.onPlayPause());
        this.els.btnMute.addEventListener('click', () => this.callbacks.onMute());

        // Горизонтальный ползунок громкости
        this.els.volumeSlider.addEventListener('input', (e) => {
            this.callbacks.onVolumeChange(e.target.value);
        });
        this.els.volumeSlider.addEventListener('mousedown', e => e.stopPropagation());
        this.els.volumeSlider.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });

        // Ползунок прогресса трека
        this.els.progressSlider.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            this.callbacks.onScrubStart();
        });
        this.els.progressSlider.addEventListener('touchstart', (e) => {
            e.stopPropagation();
            this.callbacks.onScrubStart();
        }, { passive: true });

        this.els.progressSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            const max = e.target.max || 100;
            const pct = (val / max) * 100;
            e.target.style.setProperty('--prog', `${pct}%`);
            this.els.timeCurrent.textContent = this.formatTime(val);
        });

        this.els.progressSlider.addEventListener('change', (e) => {
            this.callbacks.onSeek(e.target.value);
        });

        // Защита кнопок док-панели от драга
        [this.els.dockPlayPause, this.els.dockMute, this.els.dockLocate, this.els.dockYoutube, this.els.dockClose, this.els.dockVolumeSlider].forEach(el => {
            if (!el) return;
            el.addEventListener('mousedown', e => e.stopPropagation());
            el.addEventListener('touchstart', e => e.stopPropagation(), { passive: true });
        });

        // Кнопки док-панели
        this.els.dockPlayPause.addEventListener('click', () => this.callbacks.onPlayPause());
        this.els.dockLocate.addEventListener('click', () => this.callbacks.onLocate());
        this.els.dockClose.addEventListener('click', () => this.callbacks.onClose());

        // Открытие вертикальной панели громкости
        this.els.dockMute.addEventListener('click', (e) => {
            e.stopPropagation();
            this.els.dockVolumeWrapper.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (this.els.dockVolumeWrapper && !this.els.dockVolumeWrapper.contains(e.target)) {
                this.els.dockVolumeWrapper.classList.remove('active');
            }
        });

        // Вертикальный ползунок громкости
        if (this.els.dockVolumeSlider) {
            this.els.dockVolumeSlider.addEventListener('input', (e) => {
                this.callbacks.onVolumeChange(e.target.value);
            });
        }
    }

    updateTrackInfo(track) {
        this.stopMarquee();
        const wrapper = this.els.title.parentElement;
        wrapper.classList.remove('is-scrolling');
        this.els.title.style.transform = 'translateX(0)';
        
        this.els.title.textContent = track.title;
        this.els.progressSlider.value = 0;
        this.els.progressSlider.style.setProperty('--prog', `0%`);
        this.els.timeCurrent.textContent = '0:00';
        this.els.timeTotal.textContent = '0:00';
        
        // Подставляем ссылку на ютуб
        if (track.youtubeUrl) {
            this.els.btnYoutube.href = track.youtubeUrl;
            this.els.btnYoutube.style.display = 'flex';
            if (this.els.dockYoutube) {
                this.els.dockYoutube.href = track.youtubeUrl;
                this.els.dockYoutube.style.display = 'flex';
            }
        } else {
            this.els.btnYoutube.style.display = 'none';
            if (this.els.dockYoutube) this.els.dockYoutube.style.display = 'none';
        }

        this.container.classList.remove('is-playing');
        if (track.cover) {
            this.els.cover.style.backgroundImage = `url('assets/music/${track.id}/${track.cover}')`;
        } else {
            this.els.cover.style.backgroundImage = 'none';
        }
    }

    setPlayState(isPlaying) {
        if (isPlaying) {
            this.container.classList.add('is-playing');
            this.els.btnPlayPause.innerHTML = Icons.player_pause;
            this.els.dockPlayPause.innerHTML = Icons.player_pause;
        } else {
            this.container.classList.remove('is-playing');
            this.els.btnPlayPause.innerHTML = Icons.player_play;
            this.els.dockPlayPause.innerHTML = Icons.player_play;
        }
    }

    updateVolumeUI(volume, isMuted) {
        this.els.volumeSlider.value = isMuted ? 0 : volume;
        this.els.volumeSlider.style.setProperty('--vol', `${isMuted ? 0 : volume}%`);
        
        if (this.els.dockVolumeSlider) {
            this.els.dockVolumeSlider.value = isMuted ? 0 : volume;
            this.els.dockVolumeSlider.style.setProperty('--vol', `${isMuted ? 0 : volume}%`);
        }

        let icon = Icons.player_volume_full;
        const isMutedVisual = isMuted || volume == 0;

        if (isMutedVisual) icon = Icons.player_mute;
        else if (volume < 30) icon = Icons.player_volume_low;
        else if (volume < 70) icon = Icons.player_volume_mid;

        this.els.btnMute.innerHTML = icon;
        this.els.dockMute.innerHTML = icon;
        this.els.btnMute.classList.toggle('muted-red', isMutedVisual);
        this.els.dockMute.classList.toggle('muted-red', isMutedVisual);
    }

    updateProgressUI(current, total) {
        if (total > 0) {
            this.els.progressSlider.max = total;
            this.els.progressSlider.value = current;
            const pct = (current / total) * 100;
            this.els.progressSlider.style.setProperty('--prog', `${pct}%`);
            
            this.els.timeCurrent.textContent = this.formatTime(current);
            this.els.timeTotal.textContent = this.formatTime(total);
        }
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return "0:00";
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        if (h > 0) {
            return `${h}:${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
        }
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    }

    open() { this.container.classList.add('active'); }

    close() {
        this.container.classList.remove('active', 'is-playing');
        if (this.els.dockVolumeWrapper) {
            this.els.dockVolumeWrapper.classList.remove('active');
        }
        this.stopMarquee();
    }

    startMarquee(isDocked) {
        if (isDocked || this.container.classList.contains('is-dragging') || this.marqueeAnimation) return;
        
        const title = this.els.title;
        const wrapper = title.parentElement;
        
        title.style.transition = 'none';
        title.style.transform = 'translateX(0)';
        wrapper.classList.remove('is-scrolling');
        
        if (title.scrollWidth > wrapper.clientWidth) {
            setTimeout(() => {
                if (this.container.classList.contains('is-docked') || this.container.classList.contains('is-dragging')) return;
                
                wrapper.classList.add('is-scrolling');
                const distance = title.scrollWidth - wrapper.clientWidth + 12;
                const duration = Math.max(distance / 25, 2) * 1000; 

                title.style.width = 'max-content';

                this.marqueeAnimation = title.animate([
                    { transform: 'translateX(0)' },
                    { transform: `translateX(-${distance}px)` }
                ], {
                    duration: duration,
                    delay: 1500,
                    direction: 'alternate',
                    iterations: 2, 
                    easing: 'linear'
                });

                this.marqueeAnimation.onfinish = () => {
                    title.style.transform = 'translateX(0)';
                    wrapper.classList.remove('is-scrolling');
                    this.marqueeAnimation = null;
                };
            }, 1500); 
        }
    }

    stopMarquee() {
        if (this.marqueeAnimation) {
            this.marqueeAnimation.cancel();
            this.marqueeAnimation = null;
        }
    }
}