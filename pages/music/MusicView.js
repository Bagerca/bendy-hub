import { Icons } from '../../shared/js/icons.js';
import { SmartMarquee } from '../../shared/js/SmartMarquee.js';

export class MusicView {
    constructor() {
        this.els = {
            container: document.getElementById('music-content'),
            loader: document.getElementById('music-loader'),
            btnGrid: document.getElementById('btn-view-grid'),
            btnList: document.getElementById('btn-view-list')
        };
        
        this.templates = {
            card: document.getElementById('song-card-template'),
            empty: document.getElementById('empty-state-template'),
            error: document.getElementById('error-state-template')
        };

        this.onTrackClick = null; 
        this._initEvents();
    }

    _initEvents() {
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

    renderGrid(tracksToRender) {
        this.els.container.innerHTML = '';
        this.els.loader.style.display = 'none';

        if (tracksToRender.length === 0) {
            this._renderEmptyState();
            return;
        }

        const groups = {
            'song': { title: 'Оригинальные песни', tracks: [] },
            'animation': { title: 'Анимации и Клипы', tracks: [] },
            'remix': { title: 'Ремиксы и Каверы', tracks: [] },
            'instrumental': { title: 'Инструментал', tracks: [] },
            'other': { title: 'Прочее', tracks: [] }
        };

        tracksToRender.forEach(track => {
            const t = track.type || 'other';
            if (t === 'fan_song' || t === 'song') {
                groups['song'].tracks.push(track);
            } else if (groups[t]) {
                groups[t].tracks.push(track);
            } else {
                groups['other'].tracks.push(track);
            }
        });

        const fragment = document.createDocumentFragment();

        Object.keys(groups).forEach(key => {
            const group = groups[key];
            
            if (group.tracks.length > 0) {
                const section = document.createElement('section');
                section.className = 'music-section';
                
                const title = document.createElement('h2');
                title.className = 'music-section-title';
                title.textContent = group.title;
                section.appendChild(title);

                const grid = document.createElement('div');
                grid.className = 'music-grid';

                group.tracks.forEach(track => {
                    const clone = this.templates.card.content.cloneNode(true);
                    const card = clone.querySelector('.song-card');
                    
                    card.dataset.id = track.id; 
                    clone.querySelector('.song-title').textContent = track.title;
                    clone.querySelector('.song-artist').textContent = track.artist;
                    clone.querySelector('.song-year').textContent = track.year || '';
                    
                    const playBtn = clone.querySelector('.dyn-icon-play');
                    if (playBtn) {
                        playBtn.innerHTML = `
                            <div class="icon-state-play">${Icons.player_play}</div>
                            <div class="icon-state-pause">${Icons.player_pause}</div>
                        `;
                    }

                    const cardColor = track.color || '210, 168, 80';
                    card.style.setProperty('--card-hover-rgb', cardColor);
                    
                    const coverContainer = clone.querySelector('.song-cover-wrapper');
                    coverContainer.style.background = `linear-gradient(135deg, rgba(${cardColor}, 0.3) 0%, var(--bg-body) 100%)`;

                    const coverEl = clone.querySelector('.song-cover');
                    const coverPath = track.cover ? `assets/music/${track.id}/${track.cover}` : '';
                    
                    coverEl.src = coverPath;
                    coverEl.onerror = () => { 
                        coverEl.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="160" height="90" fill="%2330363D"%3E%3Crect width="160" height="90"/%3E%3C/svg%3E'; 
                        coverContainer.style.background = 'var(--bg-body)';
                    };

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

                    SmartMarquee.apply(card, '.smart-marquee-text');
                    grid.appendChild(clone);
                });

                section.appendChild(grid);
                fragment.appendChild(section);
            }
        });

        this.els.container.appendChild(fragment);
        this.els.container.style.display = 'flex';
    }

    updateActiveCard(trackId, isPlaying = true) {
        document.querySelectorAll('.song-card').forEach(card => {
            if (card.dataset.id === trackId) {
                card.classList.add('playing');
                card.classList.toggle('is-paused', !isPlaying);
            } else {
                card.classList.remove('playing', 'is-paused');
            }
        });
        
        if (!trackId) {
            const ambientBg = document.getElementById('ambient-bg');
            if (ambientBg) ambientBg.style.opacity = '0';
        }
    }

    _renderEmptyState() {
        this.els.container.style.display = 'block';
        const clone = this.templates.empty.content.cloneNode(true);
        clone.querySelector('.empty-state-silent').innerHTML = Icons.error_404;
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