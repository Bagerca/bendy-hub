import { Logger } from '../../shared/js/Logger.js';

export class TimelineController {
    constructor(model, view) {
        this.model = model;
        this.view = view;

        this.scrollObserver = null;
        this.trackingObserver = null;
    }

    init() {
        this._bindEvents();
        this.loadMode(this.model.getCurrentMode());
        return this; // Важно для сборщика мусора в Роутере
    }

    _bindEvents() {
        this.view.els.modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedMode = btn.dataset.mode;
                if (selectedMode === this.model.getCurrentMode()) return;
                
                this.model.setMode(selectedMode);
                this.view.updateActiveModeBtn(selectedMode);
                this.loadMode(selectedMode);
            });
        });
    }

    async loadMode(mode) {
        this.view.showLoader();
        this._cleanupObservers();

        try {
            const data = await this.model.getTimelineData(mode);
            
            this.view.renderTimeline(data, (eraId) => this._scrollToEra(eraId));
            
            this._setupScrollAnimations();
            this._setupActiveEraTracking();

        } catch (error) {
            this.view.renderErrorState('Архивы повреждены. Невозможно загрузить хронологию.');
        }
    }

    _scrollToEra(eraId) {
        const target = document.getElementById(eraId);
        if (target) {
            // Увеличили offset: учитывает шапку сайта (70px) + новую двойную sticky-панель (~160px)
            const offset = 230; 
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = target.getBoundingClientRect().top;
            window.scrollTo({
                top: (elementRect - bodyRect) - offset,
                behavior: 'smooth'
            });
        }
    }

    _setupScrollAnimations() {
        this.scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.view.markEventAsVisible(entry.target);
                    observer.unobserve(entry.target); 
                }
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

        this.view.getEventWrappers().forEach(event => this.scrollObserver.observe(event));
    }

    _setupActiveEraTracking() {
        // Слегка смещаем область трекинга, так как липкая шапка стала шире
        this.trackingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const eraId = entry.target.id;
                    this.view.updateActiveNavBtn(eraId);
                }
            });
        }, { rootMargin: '-30% 0px -70% 0px' });

        this.view.getEraMarkers().forEach(marker => this.trackingObserver.observe(marker));
    }

    _cleanupObservers() {
        if (this.scrollObserver) this.scrollObserver.disconnect();
        if (this.trackingObserver) this.trackingObserver.disconnect();
    }

    // ВАЖНО: Метод вызывается роутером при уходе со страницы
    destroy() {
        this._cleanupObservers();
    }
}   