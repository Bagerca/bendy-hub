import { getAverageRGB } from '../../shared/js/utils.js';
import { Icons } from '../../shared/js/icons.js';

export class MusicView {
    constructor() {
        this.els = {
            container: document.getElementById('music-grid'),
            loader: document.getElementById('music-loader'),
            ambientBg: document.getElementById('ambient-bg'),
            btnGrid: document.getElementById('btn-view-grid'),
            btnList: document.getElementById('btn-view-list'),
            panel: document.getElementById('lyrics-panel'),
            overlay: document.getElementById('lyrics-overlay'),
            closeBtn: document.querySelector('.panel-close')
        };
        
        this.templates = {
            card: document.getElementById('song-card-template'),
            empty: document.getElementById('empty-state-template'),
            error: document.getElementById('error-state-template')
        };

        if (this.els.closeBtn) this.els.closeBtn.innerHTML = Icons.close;

        this.onTrackClick = null; 
        this._initEvents();
    }

    _initEvents() {
        const closePanel = () => {
            this.els.panel.classList.remove('active');
            this.els.overlay.classList.remove('active');
        };
        this.els.closeBtn.addEventListener('click', closePanel);
        this.els.overlay.addEventListener('click', closePanel);

        this.els.btnGrid.addEventListener('click', () => this.setViewMode('grid'));
        this.els.btnList.addEventListener('click', () => this.setViewMode('list'));
    }

    setViewMode(mode) {
        if (mode === 'list') {
            this.els.container.classList.add('list-view');
            this.els.btnList.classList.add('active');
            this.els.btnGrid.classList.remove('active');
        } else {
            this.els.container.classList.remove('list-view');
            this.els.btnGrid.classList.add('active');
            this.els.btnList.classList.remove('active');
        }
    }

    _applySmartMarquee(card) {
        let timers = [];
        card.addEventListener('mouseenter', () => {
            timers.forEach(t => clearTimeout(t));
            timers = [];
            const title = card.querySelector('.song-title');
            if (!title) return;
            
            title.style.width = '100%';
            if (title.scrollWidth > title.clientWidth) {
                const distance = title.scrollWidth - title.clientWidth;
                const duration = Math.max(distance / 30, 1.5); 
                title.style.width = 'max-content';
                void title.offsetWidth;
                title.style.transition = `transform ${duration}s linear 0.3s`;
                title.style.transform = `translateX(-${distance}px)`;
            }
        });

        card.addEventListener('mouseleave', () => {
            const title = card.querySelector('.song-title');
            if (!title || title.style.width !== 'max-content') return;
            
            title.style.transition = `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0s`;
            title.style.transform = `translateX(0)`;
            const t = setTimeout(() => {
                title.style.width = '100%';
            }, 400);
            timers.push(t);
        });
    }

    renderGrid(tracksToRender) {
        this.els.container.innerHTML = '';
        this.els.loader.style.display = 'none';

        if (tracksToRender.length === 0) {
            this._renderEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        tracksToRender.forEach(track => {
            const clone = this.templates.card.content.cloneNode(true);
            const card = clone.querySelector('.song-card');
            
            card.dataset.id = track.id; 
            clone.querySelector('.song-title').textContent = track.title;
            clone.querySelector('.song-artist').textContent = track.artist;
            clone.querySelector('.song-year').textContent = track.year || '';
            clone.querySelector('.song-game').textContent = track.game || 'Bendy';
            
            // Вставка иконки Плея в карточку трека
            const playBtn = clone.querySelector('.dyn-icon-play');
            if (playBtn) playBtn.innerHTML = Icons.play_btn;

            const coverEl = clone.querySelector('.song-cover');
            const coverPath = track.cover ? `assets/music/${track.id}/${track.cover}` : '';
            
            coverEl.src = coverPath;
            coverEl.onerror = () => { 
                coverEl.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="90" fill="%2330363D"%3E%3Crect width="160" height="90"/%3E%3C/svg%3E'; 
            };

            if (coverPath) {
                getAverageRGB(coverPath, (color) => {
                    if (color) card.style.setProperty('--card-hover-rgb', color);
                });
            }

            if (!track.youtubeUrl) {
                card.classList.add('no-audio');
                const badge = card.querySelector('.no-audio-badge');
                if (badge) {
                    badge.textContent = 'Нет медиа';
                    badge.style.display = 'block';
                }
            } else {
                card.addEventListener('click', () => {
                    if (this.onTrackClick) this.onTrackClick(track.id);
                });
            }

            this._applySmartMarquee(card);
            fragment.appendChild(clone);
        });

        this.els.container.appendChild(fragment);
        this.els.container.style.display = 'grid';
    }

    updateActiveCard(trackId) {
        document.querySelectorAll('.song-card').forEach(card => {
            if (card.dataset.id === trackId) {
                card.classList.add('playing');
                const img = card.querySelector('.song-cover');
                if (img && img.src && !img.src.includes('data:image')) {
                    this.els.ambientBg.style.backgroundImage = `url('${img.src}')`;
                    this.els.ambientBg.style.opacity = '1';
                }
            } else {
                card.classList.remove('playing');
            }
        });
        
        if (!trackId) {
            this.els.ambientBg.style.opacity = '0';
        }
    }

    openLyrics(track) {
        document.getElementById('lyrics-title').textContent = track.title;
        document.getElementById('lyrics-original').textContent = track.lyrics?.original || 'Текст недоступен.';
        document.getElementById('lyrics-translation').textContent = track.lyrics?.translation || 'Перевод недоступен.';
        
        const ytBtn = document.getElementById('lyrics-youtube');
        if (track.youtubeUrl) {
            ytBtn.href = track.youtubeUrl;
            ytBtn.style.display = 'inline-flex';
        } else {
            ytBtn.style.display = 'none';
        }

        this.els.overlay.classList.add('active');
        this.els.panel.classList.add('active');
    }

    _renderEmptyState() {
        this.els.container.style.display = 'block';
        const clone = this.templates.empty.content.cloneNode(true);
        this.els.container.appendChild(clone);
    }

    renderErrorState(message) {
        this.els.loader.style.display = 'none';
        this.els.container.innerHTML = '';
        this.els.container.style.display = 'block';
        
        const clone = this.templates.error.content.cloneNode(true);
        clone.querySelector('.error-message').textContent = message;
        this.els.container.appendChild(clone);
    }
}