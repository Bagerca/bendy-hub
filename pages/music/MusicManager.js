import { Logger } from '../../shared/js/Logger.js';

export class MusicManager {
    constructor(playerRefContainer) {
        this.container = document.getElementById('music-grid');
        this.loader = document.getElementById('music-loader');
        this.emptyState = document.getElementById('empty-state');
        this.template = document.getElementById('song-card-template');
        
        this.modal = document.getElementById('lyrics-modal');
        this.closeBtn = this.modal.querySelector('.modal-close');

        this.player = null; // Инжектируется снаружи
        this.tracks = [];
        this.filteredTracks = [];
        this.currentIndex = -1; // Индекс текущего трека в отфильтрованном списке
    }

    setPlayer(playerInstance) {
        this.player = playerInstance;
    }

    setTracks(tracksData) {
        this.tracks = tracksData;
        this.filteredTracks = [...this.tracks];
        this.renderGrid(this.filteredTracks);
    }

    applySearch(term) {
        const query = term.toLowerCase().trim();
        this.filteredTracks = this.tracks.filter(t => 
            t.title.toLowerCase().includes(query) || 
            t.artist.toLowerCase().includes(query)
        );
        this.renderGrid(this.filteredTracks);
    }

    renderGrid(tracksToRender) {
        this.container.innerHTML = '';
        this.loader.style.display = 'none';

        if (tracksToRender.length === 0) {
            this.container.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }

        this.emptyState.style.display = 'none';
        const fragment = document.createDocumentFragment();

        tracksToRender.forEach((track, index) => {
            const clone = this.template.content.cloneNode(true);
            const card = clone.querySelector('.song-card');
            
            card.dataset.id = track.id; // Для связи с плеером
            card.querySelector('.song-title').textContent = track.title;
            card.querySelector('.song-artist').textContent = track.artist;
            card.querySelector('.song-year').textContent = track.year || '';
            card.querySelector('.song-game').textContent = track.game || 'Bendy';
            
            const coverEl = clone.querySelector('.song-cover');
            coverEl.src = track.cover;
            coverEl.onerror = () => { coverEl.src = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" fill="%2330363D"%3E%3Crect width="100" height="100"/%3E%3C/svg%3E'; };

            // Клик по карточке -> Воспроизведение
            card.addEventListener('click', () => {
                // Если кликнули на ту же песню, что сейчас играет - ставим на паузу/снимаем с паузы
                if (this.player.currentTrack && this.player.currentTrack.id === track.id) {
                    this.player.togglePlay();
                } else {
                    this.currentIndex = index; // Сохраняем индекс для кнопок Next/Prev
                    this.player.loadTrack(track);
                }
            });

            fragment.appendChild(clone);
        });

        this.container.appendChild(fragment);
        this.container.style.display = 'grid';
        
        // Синхронизируем UI, если плеер уже играет при рендере
        if (this.player && this.player.currentTrack) {
            this.updateGridUI(this.player.currentTrack.id, this.player.isPlaying);
        }
    }

    updateGridUI(trackId, isPlaying) {
        document.querySelectorAll('.song-card').forEach(card => {
            const icon = card.querySelector('.play-icon');
            const eq = card.querySelector('.eq-animation');
            
            if (card.dataset.id === trackId) {
                card.classList.add('playing');
                if (isPlaying) {
                    icon.style.display = 'none';
                    eq.style.display = 'flex';
                } else {
                    icon.style.display = 'block';
                    eq.style.display = 'none';
                }
            } else {
                card.classList.remove('playing');
                icon.style.display = 'block';
                eq.style.display = 'none';
            }
        });
    }

    // Методы для плеера
    playNext() {
        if (this.filteredTracks.length === 0) return;
        this.currentIndex = (this.currentIndex + 1) % this.filteredTracks.length;
        this.player.loadTrack(this.filteredTracks[this.currentIndex]);
    }

    playPrev() {
        if (this.filteredTracks.length === 0) return;
        this.currentIndex = (this.currentIndex - 1 + this.filteredTracks.length) % this.filteredTracks.length;
        this.player.loadTrack(this.filteredTracks[this.currentIndex]);
    }

    // Модалка с текстом
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

        this.modal.showModal();
        requestAnimationFrame(() => this.modal.classList.add('active'));
    }

    closeLyrics() {
        this.modal.classList.remove('active');
        setTimeout(() => this.modal.close(), 300);
    }
}