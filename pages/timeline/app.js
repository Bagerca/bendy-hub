import { SiteHeader } from '../../shared/js/components/SiteHeader.js';
import { fetchData } from '../../shared/js/api.js';

customElements.define('site-header', SiteHeader);

document.addEventListener('DOMContentLoaded', () => {
    const els = {
        loader: document.getElementById('timeline-loader'),
        container: document.getElementById('timeline-content'),
        eventsContainer: document.getElementById('events-container'),
        nav: document.getElementById('era-nav'),
        modeButtons: document.querySelectorAll('.mode-btn')
    };

    // Кэшируем данные, чтобы не скачивать их каждый раз при клике
    const dataCache = {
        lore: null,
        dev: null
    };

    // Глобальные обзерверы (нужно очищать при переключении)
    let scrollObserver = null;
    let trackingObserver = null;
    let currentMode = 'lore';

    // Функция загрузки и перерисовки
    async function loadTimeline(mode) {
        els.container.style.display = 'none';
        els.eventsContainer.innerHTML = ''; // Чистим старые события
        els.nav.innerHTML = ''; // Чистим старую навигацию
        els.loader.style.display = 'block';

        // Чистим старые обзерверы
        if (scrollObserver) scrollObserver.disconnect();
        if (trackingObserver) trackingObserver.disconnect();

        try {
            // Если нет в кэше — качаем, если есть — берем из кэша
            if (!dataCache[mode]) {
                const filename = mode === 'lore' ? 'data/timeline_lore.json' : 'data/timeline_dev.json';
                dataCache[mode] = await fetchData(filename);
            }
            
            renderTimeline(dataCache[mode], els);

            els.loader.style.display = 'none';
            els.container.style.display = 'block';

            initScrollAnimations();
            initActiveEraTracking();

        } catch (error) {
            els.loader.style.display = 'none';
            els.container.style.display = 'block';
            els.container.innerHTML = `<div class="error-card"><p>Архивы повреждены. Невозможно загрузить хронологию.</p></div>`;
            console.error(error);
        }
    }

    // Слушатели для переключателя
    els.modeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const selectedMode = btn.getAttribute('data-mode');
            if (selectedMode === currentMode) return; // Если уже на этой вкладке - игнор

            // Меняем активный класс
            els.modeButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            currentMode = selectedMode;
            loadTimeline(currentMode);
        });
    });

    // Функция рендера DOM
    function renderTimeline(data, els) {
        let globalEventIndex = 0; 

        data.forEach(era => {
            // 1. Кнопки навигации
            const navBtn = document.createElement('button');
            navBtn.className = 'era-btn';
            navBtn.textContent = era.title;
            navBtn.addEventListener('click', () => {
                const target = document.getElementById(era.id);
                if (target) {
                    const offset = 140; 
                    const bodyRect = document.body.getBoundingClientRect().top;
                    const elementRect = target.getBoundingClientRect().top;
                    window.scrollTo({
                        top: (elementRect - bodyRect) - offset,
                        behavior: 'smooth'
                    });
                }
            });
            els.nav.appendChild(navBtn);

            // 2. Разделитель Эпохи
            const eraMarker = document.createElement('div');
            eraMarker.className = 'timeline-era-marker';
            eraMarker.id = era.id; 
            eraMarker.innerHTML = `<h2>${era.title}</h2>`;
            els.eventsContainer.appendChild(eraMarker);

            // 3. Карточки событий
            era.events.forEach(event => {
                const sideClass = globalEventIndex % 2 === 0 ? 'left' : 'right';
                
                const eventWrapper = document.createElement('div');
                eventWrapper.className = `timeline-event-wrapper ${sideClass}`;
                
                const imageHtml = event.image ? `<img src="assets/timeline/${event.image}" class="event-image" loading="lazy" alt="Event">` : '';

                eventWrapper.innerHTML = `
                    <div class="timeline-node"></div>
                    <div class="timeline-card">
                        <span class="event-date">${event.date}</span>
                        <h3 class="event-title">${event.title}</h3>
                        <p class="event-desc">${event.description}</p>
                        ${imageHtml}
                    </div>
                `;
                
                els.eventsContainer.appendChild(eventWrapper);
                globalEventIndex++;
            });
        });
        
        const firstBtn = els.nav.querySelector('.era-btn');
        if (firstBtn) firstBtn.classList.add('active');
    }

    function initScrollAnimations() {
        scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); 
                }
            });
        }, { rootMargin: '0px 0px -15% 0px', threshold: 0 });

        document.querySelectorAll('.timeline-event-wrapper').forEach(event => scrollObserver.observe(event));
    }

    function initActiveEraTracking() {
        const navButtons = document.querySelectorAll('.era-btn');

        trackingObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    navButtons.forEach(btn => btn.classList.remove('active'));
                    const title = entry.target.querySelector('h2').textContent;
                    const activeBtn = Array.from(navButtons).find(btn => btn.textContent === title);
                    if (activeBtn) {
                        activeBtn.classList.add('active');
                        activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                    }
                }
            });
        }, { rootMargin: '-20% 0px -80% 0px' });

        document.querySelectorAll('.timeline-era-marker').forEach(marker => trackingObserver.observe(marker));
    }

    // Запускаем изначальную загрузку
    loadTimeline('lore');
});