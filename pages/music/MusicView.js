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

    renderGrid(tracksToRender, currentPlayingId = null, isPlaying = false) {
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
            
            const coverEl = clone.querySelector('.song-cover');
            const coverPath = track.cover ? `assets/music/${track.id}/${track.cover}` : '';
            
            coverEl.src = coverPath;
            coverEl.onerror = () => { 
                coverEl.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%2330363D"%3E%3Crect width="100" height="100"/%3E%3C/svg%3E'; 
            };

            // МАГИЯ "УМНОЙ" КАРТОЧКИ: Делаем скрытый HEAD-запрос для проверки наличия аудио
            if (track.audio) {
                const audioPath = `assets/music/${track.id}/${track.audio}`;
                fetch(audioPath, { method: 'HEAD' }).then(res => {
                    if (!res.ok) this._markCardAsNoAudio(card);
                }).catch(() => this._markCardAsNoAudio(card));
            } else {
                this._markCardAsNoAudio(card);
            }

            card.addEventListener('click', () => {
                if (this.onTrackClick) this.onTrackClick(track.id, card);
            });

            fragment.appendChild(clone);
        });

        this.els.container.appendChild(fragment);
        this.els.container.style.display = 'grid';

        if (currentPlayingId) {
            // Защита: не пытаемся восстановить эмбиент, если его не было
            const currentBg = this.els.ambientBg.style.backgroundImage;
            const cleanCover = currentBg ? currentBg.slice(5, -2) : '';
            this.updateGridStateUI({id: currentPlayingId, cover: cleanCover}, isPlaying);
        }
    }

    _markCardAsNoAudio(cardElement) {
        cardElement.classList.add('no-audio');
        const badge = cardElement.querySelector('.no-audio-badge');
        if (badge) badge.style.display = 'block';
    }

    updateGridStateUI(currentTrack, isPlaying) {
        document.querySelectorAll('.song-card').forEach(card => {
            if (card.dataset.id === currentTrack.id) {
                card.classList.add('playing');
                card.classList.toggle('is-paused', !isPlaying);
            } else {
                card.classList.remove('playing', 'is-paused');
            }
        });

        if (isPlaying && currentTrack.cover) {
            const coverPath = currentTrack.cover.includes('assets/music') 
                ? currentTrack.cover 
                : `assets/music/${currentTrack.id}/${currentTrack.cover}`;
            
            this.els.ambientBg.style.backgroundImage = `url('${coverPath}')`;
            this.els.ambientBg.style.opacity = '1';
        } else if (!isPlaying && !currentTrack.id) {
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
        this.els.container.appendChild(this.templates.empty.content.cloneNode(true));
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