export class MusicView {
    constructor() {
        this.els = {
            container: document.getElementById('music-grid'),
            loader: document.getElementById('music-loader'),
            modal: document.getElementById('lyrics-modal'),
            closeBtn: document.querySelector('#lyrics-modal .modal-close')
        };
        
        this.templates = {
            card: document.getElementById('song-card-template'),
            empty: document.getElementById('empty-state-template'),
            error: document.getElementById('error-state-template')
        };

        this.onTrackClick = null; // Коллбэк для Контроллера
        this._initEvents();
    }

    _initEvents() {
        this.els.closeBtn.addEventListener('click', () => this.closeLyrics());
        this.els.modal.addEventListener('click', (e) => {
            const rect = this.els.modal.getBoundingClientRect();
            if (!(rect.top <= e.clientY && e.clientY <= rect.top + rect.height && rect.left <= e.clientX && e.clientX <= rect.left + rect.width)) {
                this.closeLyrics();
            }
        });
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
            coverEl.src = track.cover;
            coverEl.onerror = () => { 
                coverEl.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%2330363D"%3E%3Crect width="100" height="100"/%3E%3C/svg%3E'; 
            };

            card.addEventListener('click', () => {
                if (this.onTrackClick) this.onTrackClick(track.id);
            });

            fragment.appendChild(clone);
        });

        this.els.container.appendChild(fragment);
        this.els.container.style.display = 'grid';

        if (currentPlayingId) {
            this.updateGridStateUI(currentPlayingId, isPlaying);
        }
    }

    updateGridStateUI(trackId, isPlaying) {
        document.querySelectorAll('.song-card').forEach(card => {
            const icon = card.querySelector('.play-icon');
            const eq = card.querySelector('.eq-animation');
            
            if (card.dataset.id === trackId) {
                card.classList.add('playing');
                icon.style.display = isPlaying ? 'none' : 'block';
                eq.style.display = isPlaying ? 'flex' : 'none';
            } else {
                card.classList.remove('playing');
                icon.style.display = 'block';
                eq.style.display = 'none';
            }
        });
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

        this.els.modal.showModal();
        requestAnimationFrame(() => this.els.modal.classList.add('active'));
    }

    closeLyrics() {
        this.els.modal.classList.remove('active');
        setTimeout(() => this.els.modal.close(), 300);
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