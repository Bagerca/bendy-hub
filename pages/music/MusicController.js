import { Icons } from '../../shared/js/icons.js';

export class MusicController {
    constructor(model, view, player) {
        this.model = model;
        this.view = view;
        this.player = player;
        this.authorSelect = null; 

        this._bindEvents();
    }

    _bindEvents() {
        this.view.onTrackClick = (trackId) => this._handleTrackClick(trackId);

        this.player.onNextRequest = () => {
            const nextTrack = this.model.getNextTrack();
            if (nextTrack) {
                this.view.updateActiveCard(nextTrack.id, true);
                this.player.loadTrack(nextTrack);
            }
        };

        this.player.onPrevRequest = () => {
            const prevTrack = this.model.getPrevTrack();
            if (prevTrack) {
                this.view.updateActiveCard(prevTrack.id, true);
                this.player.loadTrack(prevTrack);
            }
        };

        this.player.onLocateRequest = (track) => {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.value = '';
            
            // Сбрасываем фильтры. Включаем всех авторов обратно.
            const allAuthorIds = this.model.authors.map(a => a.id);
            this.handleFilterChange({ search: '', authors: allAuthorIds });
            
            if (this.authorSelect) {
                this.authorSelect.selectedValues.clear();
                allAuthorIds.forEach(id => this.authorSelect.selectedValues.add(id));
                this.authorSelect.dropdown.querySelectorAll('li').forEach(li => li.classList.add('selected'));
                this.authorSelect._updateTriggerUI();
            }
            
            setTimeout(() => {
                const card = document.querySelector(`.song-card[data-id="${track.id}"]`);
                if (card) {
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    card.style.transition = 'transform 0.3s, box-shadow 0.3s';
                    card.style.transform = 'scale(1.05)';
                    card.style.boxShadow = '0 0 30px rgba(210, 168, 80, 0.6)';
                    
                    setTimeout(() => {
                        card.style.transform = '';
                        card.style.boxShadow = '';
                    }, 1000);
                }
            }, 100);
        };
        
        this.player.onClose = () => {
            this.view.updateActiveCard(null, false); 
        };

        this.player.onPlayStateChange = (isPlaying) => {
            if (this.player.currentTrack) {
                this.view.updateActiveCard(this.player.currentTrack.id, isPlaying);
            }
        };
    }

    async init() {
        try {
            await this.model.fetchTracks();
            
            let initialAuthorIds = [];
            
            if (this.authorSelect) {
                const fallbackUrl = Icons.avatar_fallback;
                const authorOptions = [];

                this.model.authors.forEach(author => {
                    const avatarSrc = author.assets?.avatar ? `assets/music_authors/${author.id}/${author.assets.avatar}` : fallbackUrl;
                    authorOptions.push({
                        id: author.id,
                        label: author.name,
                        iconHtml: `<img src="${avatarSrc}" alt="${author.name}" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackUrl}';">`
                    });
                });

                initialAuthorIds = authorOptions.map(o => o.id);
                this.authorSelect.populate(authorOptions, initialAuthorIds);
                
                // Передаем правильный список выбранных авторов, чтобы грид обновился
                this.handleFilterChange({ authors: initialAuthorIds });
            } else {
                this.view.renderGrid(this.model.filteredTracks);
            }

            if (this.player.currentTrack) {
                this.model.syncCurrentTrack(this.player.currentTrack.id);
                this.view.updateActiveCard(this.player.currentTrack.id, this.player.isPlaying);
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const locateId = urlParams.get('locate');
            if (locateId && this.player.currentTrack && this.player.currentTrack.id === locateId) {
                urlParams.delete('locate');
                const newSearch = urlParams.toString() ? `?${urlParams.toString()}` : '';
                window.history.replaceState({}, '', window.location.pathname + newSearch);
                this.player.onLocateRequest(this.player.currentTrack);
            }
            
        } catch (error) {
            this.view.renderErrorState('Не удалось загрузить музыкальную базу.');
        }
    }

    handleFilterChange(updates) {
        const filtered = this.model.applyFilters(updates);
        this.view.renderGrid(filtered);

        if (this.player.currentTrack) {
            this.model.syncCurrentTrack(this.player.currentTrack.id);
            this.view.updateActiveCard(this.player.currentTrack.id, this.player.isPlaying);
        }
    }

    _handleTrackClick(trackId) {
        if (this.player.currentTrack && this.player.currentTrack.id === trackId) {
            this.player.togglePlay();
            return;
        }

        this.model.setCurrentIndexById(trackId);
        const track = this.model.getTrackById(trackId);
        
        if (track && track.youtubeUrl) {
            this.view.updateActiveCard(trackId, true);
            this.player.loadTrack(track);
        }
    }
}