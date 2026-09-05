import { Icons } from '../../shared/js/icons.js';

export class MusicController {
    constructor(model, view, player) {
        this.model = model;
        this.view = view;
        this.player = player;
        this.authorSelect = null; // Привязывается из app.js

        this._bindEvents();
    }

    _bindEvents() {
        this.view.onTrackClick = (trackId) => this._handleTrackClick(trackId);

        this.player.onNextRequest = () => {
            const nextTrack = this.model.getNextTrack();
            if (nextTrack) {
                this.view.updateActiveCard(nextTrack.id);
                this.player.loadTrack(nextTrack);
            }
        };

        this.player.onPrevRequest = () => {
            const prevTrack = this.model.getPrevTrack();
            if (prevTrack) {
                this.view.updateActiveCard(prevTrack.id);
                this.player.loadTrack(prevTrack);
            }
        };

        this.player.onLocateRequest = (track) => {
            const searchInput = document.querySelector('.search-input');
            if (searchInput) searchInput.value = '';
            
            // Сбрасываем фильтры, чтобы найти играющий трек наверняка
            this.handleFilterChange({ search: '', author: 'all' });
            
            if (this.authorSelect) {
                this.authorSelect.selectValue({ id: 'all', label: 'Все авторы' }, this.authorSelect.dropdown.firstElementChild);
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
            this.view.updateActiveCard(null); 
        };
    }

    async init() {
        try {
            await this.model.fetchTracks();
            
            // Заполняем выпадающий список авторов
            if (this.authorSelect) {
                const allIcon = `<div class="svg-icon">${Icons.cat_all}</div>`;
                const fallbackUrl = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%238B949E' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='12' cy='7' r='4'/%3E%3C/svg%3E";
                
                const authorOptions = [
                    { id: 'all', label: 'Все авторы', iconHtml: allIcon }
                ];

                this.model.authors.forEach(author => {
                    const avatarSrc = author.assets?.avatar ? `assets/music_authors/${author.id}/${author.assets.avatar}` : fallbackUrl;
                    authorOptions.push({
                        id: author.id,
                        label: author.name,
                        iconHtml: `<img src="${avatarSrc}" alt="${author.name}" class="custom-select-icon" onerror="this.onerror=null; this.src='${fallbackUrl}';">`
                    });
                });

                this.authorSelect.populate(authorOptions, 'all');
            }

            this.view.renderGrid(this.model.filteredTracks);

            if (this.player.currentTrack) {
                this.model.syncCurrentTrack(this.player.currentTrack.id);
                this.view.updateActiveCard(this.player.currentTrack.id);
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
            this.view.updateActiveCard(this.player.currentTrack.id);
        }
    }

    _handleTrackClick(trackId) {
        this.model.setCurrentIndexById(trackId);
        const track = this.model.getTrackById(trackId);
        
        if (track && track.youtubeUrl) {
            this.view.updateActiveCard(trackId);
            this.player.loadTrack(track);
        }
    }
}