import { getAverageRGB } from '../../../shared/js/utils.js';
import { Icons } from '../../../shared/js/icons.js';

export class CatalogCardView {
    constructor(horizontalTemplateId, verticalTemplateId) {
        this.horizontalTemplate = document.getElementById(horizontalTemplateId);
        this.verticalTemplate = document.getElementById(verticalTemplateId);
        
        // ОБНОВЛЕНО: Используем новые иконки категорий для заглушек
        this.fallbackIcons = {
            game: Icons.stat_gamepad,
            book: Icons.stat_book,
            movie: Icons.cat_movie
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
        
        const statusKey = item.status || 'released';
        const statusConfig = this.statusMap[statusKey] || this.statusMap.released;
        const statusBadge = clone.querySelector('.status-badge');
        statusBadge.textContent = statusConfig.text;
        statusBadge.classList.add(statusConfig.class);

        const fallbackContainer = clone.querySelector('.card-cover-fallback');
        // Вставляем правильную иконку на основе типа проекта
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

        card.addEventListener('click', (e) => {
            e.preventDefault();
            const url = `project.html?id=${item.id}`;
            if (window.router) {
                window.router.navigate(url);
            } else {
                window.location.href = url;
            }
        });

        return clone;
    }
}