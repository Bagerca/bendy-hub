import { Logger } from '../../shared/js/Logger.js';
import { Icons } from '../../shared/js/icons.js';

export class FloatingPlayer {
    constructor() {
        this.container = document.getElementById('floating-player');
        if (!this.container) {
            this._injectPlayerHTML();
        }
        
        this.els = {
            header: document.getElementById('fp-drag-handle'),
            titleWrapper: document.querySelector('.fp-title-wrapper'),
            title: document.getElementById('fp-title'),
            closeBtn: document.getElementById('fp-close'),
            btnLocate: document.getElementById('fp-locate'),
            iframeContainer: document.getElementById('fp-iframe-container'),
            dragOverlay: document.getElementById('fp-drag-overlay'),
            btnPrev: document.getElementById('fp-prev'),
            btnNext: document.getElementById('fp-next')
        };

        this.currentTrack = null;
        this.isDocked = false;
        this.dockSide = null; 
        
        this.onNextRequest = null;
        this.onPrevRequest = null;
        this.onLocateRequest = null;
        this.onClose = null;

        this._initEvents();
        this._initDragAndDrop();
        this._startTitleMarquee();
        this._restoreState(); 
    }

    _injectPlayerHTML() {
        const html = `
            <div id="floating-player" class="floating-player">
                <div class="fp-header" id="fp-drag-handle">
                    <div class="fp-header-left">
                        <div class="fp-title-wrapper"><span class="fp-title" id="fp-title">Воспроизведение...</span></div>
                    </div>
                    <div class="fp-actions">
                        <button class="fp-action-btn" id="fp-locate" title="Найти в плейлисте">
                            ${Icons.player_locate}
                        </button>
                        <button class="fp-action-btn fp-close" id="fp-close" title="Закрыть">
                            ${Icons.close}
                        </button>
                    </div>
                </div>
                <div class="fp-body">
                    <div class="fp-drag-overlay" id="fp-drag-overlay"></div>
                    <div id="fp-iframe-container" style="width: 100%; height: 100%;"></div>
                </div>
                <div class="fp-controls">
                    <div class="fp-controls-center">
                        <button id="fp-prev" class="fp-btn" title="Предыдущий трек">
                            ${Icons.player_prev}
                        </button>
                        <button id="fp-next" class="fp-btn" title="Следующий трек">
                            ${Icons.player_next}
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
        this.container = document.getElementById('floating-player');
    }

    _initEvents() {
        this.els.closeBtn.addEventListener('click', () => this.close());
        this.els.btnNext.addEventListener('click', () => { if (this.onNextRequest) this.onNextRequest(); });
        this.els.btnPrev.addEventListener('click', () => { if (this.onPrevRequest) this.onPrevRequest(); });
        
        this.els.btnLocate.addEventListener('click', () => {
            if (this.onLocateRequest && this.currentTrack) {
                // Если мы на странице музыки (контроллер подключен)
                this.onLocateRequest(this.currentTrack);
            } else if (this.currentTrack) {
                // Мы на другой странице, кидаем пользователя в музыку с параметром
                if (window.router) {
                    window.router.navigate(`music.html?locate=${this.currentTrack.id}`);
                } else {
                    window.location.href = `music.html?locate=${this.currentTrack.id}`;
                }
            }
        });
    }

    _startTitleMarquee() {
        setInterval(() => {
            if (this.isDocked || this.container.classList.contains('is-dragging')) return;
            
            const title = this.els.title;
            const wrapper = this.els.titleWrapper;
            
            title.style.transition = 'none';
            title.style.transform = 'translateX(0)';
            
            if (title.scrollWidth > wrapper.clientWidth) {
                setTimeout(() => {
                    if (this.isDocked || this.container.classList.contains('is-dragging')) return;
                    
                    const distance = title.scrollWidth - wrapper.clientWidth + 30;
                    const duration = Math.max(distance / 25, 2); 
                    
                    title.style.transition = `transform ${duration}s linear`;
                    title.style.transform = `translateX(-${distance}px)`;
                }, 1500); 
            }
        }, 8000); 
    }

    _initDragAndDrop() {
        let isDragging = false;
        let hasMoved = false; 
        let startX, startY, initialLeft, initialTop;

        const startDrag = (e) => {
            if (e.target.closest('.fp-actions') || e.target.closest('.fp-controls')) return;
            
            isDragging = true;
            hasMoved = false;
            this.container.classList.add('is-dragging');
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            startX = clientX; startY = clientY;
            const rect = this.container.getBoundingClientRect();
            initialLeft = rect.left; initialTop = rect.top;
        };

        const doDrag = (e) => {
            if (!isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;

            if (Math.abs(clientX - startX) > 3 || Math.abs(clientY - startY) > 3) {
                hasMoved = true;
            }

            if (!hasMoved) return;

            e.preventDefault(); 
            let newLeft = initialLeft + (clientX - startX);
            let newTop = initialTop + (clientY - startY);

            const maxLeft = window.innerWidth - this.container.offsetWidth;
            const maxTop = window.innerHeight - this.container.offsetHeight;

            this.container.style.left = `${Math.max(-30, Math.min(newLeft, maxLeft + 30))}px`;
            this.container.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
            this.container.style.bottom = 'auto';
            this.container.style.right = 'auto';
        };

        const endDrag = () => {
            if (!isDragging) return;
            isDragging = false;
            this.container.classList.remove('is-dragging');

            if (!hasMoved) {
                if (this.isDocked) this.undock();
            } else {
                const rect = this.container.getBoundingClientRect();
                const threshold = 60; 

                if (rect.left <= threshold) {
                    this.dock('left', rect.top);
                } else if (rect.right >= window.innerWidth - threshold) {
                    this.dock('right', rect.top);
                } else if (this.isDocked) {
                    this.undock();
                } else {
                    this._keepInBounds();
                }
            }
            this._saveState();
        };

        this.els.header.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);

        this.els.header.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    dock(side, topPos) {
        this.isDocked = true;
        this.dockSide = side;
        this.container.classList.add('is-docked');
        this.container.classList.toggle('docked-left', side === 'left');
        this.container.classList.toggle('docked-right', side === 'right');
        
        this.container.style.bottom = 'auto';
        this.container.style.top = `${Math.max(20, topPos)}px`;

        if (side === 'left') {
            this.container.style.left = '-12px'; 
            this.container.style.right = 'auto';
        } else {
            this.container.style.left = 'auto';
            this.container.style.right = '-12px';
        }
    }

    undock() {
        this.isDocked = false;
        this.dockSide = null;
        this.container.classList.remove('is-docked', 'docked-left', 'docked-right');
        this._keepInBounds();
    }

    _keepInBounds() {
        const rect = this.container.getBoundingClientRect();
        const expectedWidth = 380; 
        const maxLeft = window.innerWidth - expectedWidth - 20;
        const maxTop = window.innerHeight - this.container.offsetHeight - 20;

        let newLeft = rect.left;
        let newTop = rect.top;

        if (this.container.style.left === 'auto') {
            newLeft = window.innerWidth - expectedWidth - 20;
        }

        if (newLeft < 20) newLeft = 20;
        if (newLeft > maxLeft) newLeft = maxLeft;
        if (newTop < 20) newTop = 20;
        if (newTop > maxTop) newTop = maxTop;

        this.container.style.left = `${newLeft}px`;
        this.container.style.top = `${newTop}px`;
        this.container.style.right = 'auto';
    }

    _extractYouTubeId(url) {
        if (!url) return null;
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }

    loadTrack(track) {
        if (!track || !track.youtubeUrl) return;

        this.currentTrack = track;
        this.els.title.textContent = track.title;
        
        const videoId = this._extractYouTubeId(track.youtubeUrl);
        if (videoId) {
            this.els.iframeContainer.innerHTML = `
                <iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>
            `;
        }
        
        this.open();
        this._saveState();
    }

    open() {
        this.container.classList.add('active');
    }

    close() {
        this.container.classList.remove('active');
        localStorage.removeItem('bendy_player_state');
        setTimeout(() => {
            this.els.iframeContainer.innerHTML = '';
            if (this.onClose) this.onClose();
        }, 300);
    }

    _saveState() {
        if (!this.currentTrack) return;
        const state = {
            track: this.currentTrack,
            isDocked: this.isDocked,
            dockSide: this.dockSide,
            top: this.container.style.top,
            left: this.container.style.left,
            right: this.container.style.right
        };
        localStorage.setItem('bendy_player_state', JSON.stringify(state));
    }

    _restoreState() {
        const saved = localStorage.getItem('bendy_player_state');
        if (saved) {
            try {
                const state = JSON.parse(saved);
                
                if (state.top) this.container.style.top = state.top;
                if (state.left) this.container.style.left = state.left;
                if (state.right) this.container.style.right = state.right;
                
                if (state.isDocked) {
                    this.dock(state.dockSide || 'right', parseFloat(state.top) || window.innerHeight - 300);
                }
                
                this.currentTrack = state.track;
                this.els.title.textContent = state.track.title;
                const videoId = this._extractYouTubeId(state.track.youtubeUrl);
                if (videoId) {
                    this.els.iframeContainer.innerHTML = `<iframe width="100%" height="100%" src="https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
                }
                this.open();
            } catch (e) {
                Logger.warn("Не удалось восстановить состояние плеера", e);
            }
        }
    }
}