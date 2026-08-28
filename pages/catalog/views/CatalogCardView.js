import { getAverageRGB } from '../../../shared/js/utils.js';

export class CatalogCardView {
    constructor(horizontalTemplateId, verticalTemplateId) {
        this.horizontalTemplate = document.getElementById(horizontalTemplateId);
        this.verticalTemplate = document.getElementById(verticalTemplateId);
        
        this.fallbackIcons = {
            game: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
            book: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>',
            movie: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>'
        };

        this.statusMap = {
            released: { text: 'Вышел', class: 'status-released' },
            development: { text: 'В разработке', class: 'status-dev' },
            frozen: { text: 'Заморожен', class: 'status-frozen' },
            cancelled: { text: 'Отменен', class: 'status-cancelled' }
        };
    }

    _applySmartMarquee(card) {
        let timers = [];
        card.addEventListener('mouseenter', () => {
            timers.forEach(t => clearTimeout(t));
            timers = [];
            const textElements = card.querySelectorAll('.card-title, .card-year');
            textElements.forEach(el => {
                el.style.width = '100%';
                if (el.scrollWidth > el.clientWidth) {
                    const distance = el.scrollWidth - el.clientWidth;
                    const duration = Math.max(distance / 30, 1.5); 
                    el.style.width = 'max-content';
                    void el.offsetWidth;
                    el.style.transition = `transform ${duration}s linear 0.3s`;
                    el.style.transform = `translateX(-${distance}px)`;
                }
            });
        });

        card.addEventListener('mouseleave', () => {
            const textElements = card.querySelectorAll('.card-title, .card-year');
            textElements.forEach(el => {
                if (el.style.width !== 'max-content') return;
                el.style.transition = `transform 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0s`;
                el.style.transform = `translateX(0)`;
                const t = setTimeout(() => {
                    el.style.width = '100%';
                }, 400);
                timers.push(t);
            });
        });
    }

    render(item, viewMode = 'horizontal') {
        const type = item.type || 'game';
        let isVertical = false;

        if (viewMode === 'vertical') {
            isVertical = true;
        } else if (viewMode === 'horizontal') {
            isVertical = false;
        } else if (viewMode === 'mixed') {
            const hasBanner = !!(item.assets && item.assets.banner && item.assets.banner !== '...');
            const hasCover = !!(item.assets && item.assets.cover && item.assets.cover !== '...');
            isVertical = (hasCover && !hasBanner);
        }

        const activeTemplate = isVertical ? this.verticalTemplate : this.horizontalTemplate;
        const clone = activeTemplate.content.cloneNode(true);
        const card = clone.querySelector(isVertical ? '.card-vertical' : '.card-horizontal');
        
        clone.querySelector('.card-title').textContent = item.title === '...' ? 'Без названия' : item.title;
        clone.querySelector('.card-year').textContent = item.release_date === '...' ? '' : item.release_date;
        
        // Маппинг статусов
        const statusKey = item.status || 'released';
        const statusConfig = this.statusMap[statusKey] || this.statusMap.released;
        const statusBadge = clone.querySelector('.status-badge');
        statusBadge.textContent = statusConfig.text;
        statusBadge.classList.add(statusConfig.class);

        const fallbackContainer = clone.querySelector('.card-cover-fallback');
        fallbackContainer.innerHTML = this.fallbackIcons[type] || this.fallbackIcons.game;

        const imgEl = clone.querySelector('.card-cover-img');
        
        let cardImageFile;
        if (isVertical) {
            cardImageFile = (item.assets?.cover !== '...') ? item.assets?.cover : null;
            if (!cardImageFile && item.assets?.banner !== '...') cardImageFile = item.assets?.banner;
        } else {
            cardImageFile = (item.assets?.banner !== '...') ? item.assets?.banner : null;
            if (!cardImageFile && item.assets?.cover !== '...') cardImageFile = item.assets?.cover;
        }

        if (cardImageFile) {
            const imgSrc = `assets/catalog/${item.id}/${cardImageFile}`;
            imgEl.src = imgSrc;
            fallbackContainer.style.display = 'none';
            
            getAverageRGB(imgSrc, (color) => {
                card.style.setProperty('--card-hover-rgb', color || '210, 168, 80');
            });

            imgEl.onerror = () => {
                imgEl.style.display = 'none';
                fallbackContainer.style.display = 'flex';
            };
        } else {
            imgEl.style.display = 'none';
            fallbackContainer.style.display = 'flex';
        }

        this._applySmartMarquee(card);

        card.addEventListener('click', () => {
            window.location.href = `project.html?id=${item.id}`;
        });

        return clone;
    }
}