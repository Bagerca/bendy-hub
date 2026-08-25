export class TimelineView {
    constructor() {
        this.els = {
            loader: document.getElementById('timeline-loader'),
            container: document.getElementById('timeline-content'),
            eventsContainer: document.getElementById('events-container'),
            nav: document.getElementById('era-nav'),
            modeButtons: document.querySelectorAll('.mode-btn')
        };

        this.templates = {
            navBtn: document.getElementById('era-nav-template'),
            marker: document.getElementById('era-marker-template'),
            card: document.getElementById('event-card-template'),
            error: document.getElementById('error-state-template')
        };
    }

    showLoader() {
        this.els.container.style.display = 'none';
        this.els.eventsContainer.innerHTML = '';
        this.els.nav.innerHTML = '';
        this.els.loader.style.display = 'block';
    }

    renderTimeline(data, onNavClickCallback) {
        const navFragment = document.createDocumentFragment();
        const eventsFragment = document.createDocumentFragment();
        let globalEventIndex = 0;

        data.forEach((era, eraIndex) => {
            // 1. Рендер кнопки навигации
            const navClone = this.templates.navBtn.content.cloneNode(true);
            const btn = navClone.querySelector('.era-btn');
            btn.textContent = era.title;
            btn.dataset.target = era.id;
            
            if (eraIndex === 0) btn.classList.add('active'); // Активируем первую кнопку
            
            btn.addEventListener('click', () => onNavClickCallback(era.id));
            navFragment.appendChild(navClone);

            // 2. Рендер разделителя (Эпохи)
            const markerClone = this.templates.marker.content.cloneNode(true);
            const marker = markerClone.querySelector('.timeline-era-marker');
            marker.id = era.id;
            marker.querySelector('.era-title').textContent = era.title;
            eventsFragment.appendChild(markerClone);

            // 3. Рендер карточек событий
            era.events.forEach(event => {
                const cardClone = this.templates.card.content.cloneNode(true);
                const wrapper = cardClone.querySelector('.timeline-event-wrapper');
                
                // Класс для "змейки"
                wrapper.classList.add(globalEventIndex % 2 === 0 ? 'left' : 'right');

                cardClone.querySelector('.event-date').textContent = event.date;
                cardClone.querySelector('.event-title').textContent = event.title;
                cardClone.querySelector('.event-desc').textContent = event.description;

                const imgEl = cardClone.querySelector('.event-image');
                if (event.image) {
                    imgEl.src = `assets/timeline/${event.image}`;
                    imgEl.style.display = 'block';
                } else {
                    imgEl.remove(); // Удаляем тег img, если картинки нет
                }

                eventsFragment.appendChild(cardClone);
                globalEventIndex++;
            });
        });

        this.els.nav.appendChild(navFragment);
        this.els.eventsContainer.appendChild(eventsFragment);
        
        this.els.loader.style.display = 'none';
        this.els.container.style.display = 'block';
    }

    renderErrorState(message) {
        this.els.loader.style.display = 'none';
        this.els.container.style.display = 'block';
        this.els.container.innerHTML = '';
        
        const clone = this.templates.error.content.cloneNode(true);
        clone.querySelector('.error-message').textContent = message;
        this.els.container.appendChild(clone);
    }

    updateActiveModeBtn(activeMode) {
        this.els.modeButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === activeMode);
        });
    }

    updateActiveNavBtn(activeEraId) {
        const buttons = this.els.nav.querySelectorAll('.era-btn');
        buttons.forEach(btn => {
            if (btn.dataset.target === activeEraId) {
                btn.classList.add('active');
                btn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
            } else {
                btn.classList.remove('active');
            }
        });
    }

    markEventAsVisible(element) {
        element.classList.add('is-visible');
    }

    getEventWrappers() {
        return this.els.eventsContainer.querySelectorAll('.timeline-event-wrapper');
    }

    getEraMarkers() {
        return this.els.eventsContainer.querySelectorAll('.timeline-era-marker');
    }
}