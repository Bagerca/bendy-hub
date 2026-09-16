import { Icons } from '../../../shared/js/icons.js';
import { SmartMarquee } from '../../../shared/js/SmartMarquee.js';
import { prefetchData } from '../../../shared/js/api.js';

export class CatalogCardView {
    constructor(horizontalTemplateId, verticalTemplateId, callbacks = {}) {
        this.horizontalTemplate = document.getElementById(horizontalTemplateId);
        this.verticalTemplate = document.getElementById(verticalTemplateId);
        
        this.onEvidenceCollect = callbacks.onEvidenceCollect || null;

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
        
        card.dataset.id = item.id;

        const overlay = document.createElement('div');
        overlay.className = 'investigation-overlay';
        
        const isCollected = window.globalInvestigation && window.globalInvestigation.storage.exists('catalog', item.id);
        if (isCollected) {
            card.classList.add('is-collected');
        }

        overlay.innerHTML = `
            <div class="inv-overlay-icon icon-add">${Icons.inv_add || ''}</div>
            <div class="inv-overlay-icon icon-check">${Icons.inv_check || ''}</div>
            <div class="inv-overlay-icon icon-remove">${Icons.inv_remove || ''}</div>
        `;
        card.prepend(overlay);

        clone.querySelector('.card-title').textContent = item.title === '...' ? 'Без названия' : item.title;
        clone.querySelector('.card-year').textContent = item.release_date === '...' ? '' : item.release_date;
        
        const statusKey = item.status || 'released';
        const statusConfig = this.statusMap[statusKey] || this.statusMap.released;
        const statusBadge = clone.querySelector('.status-badge');
        statusBadge.textContent = statusConfig.text;
        statusBadge.classList.add(statusConfig.class);

        const fallbackContainer = clone.querySelector('.card-cover-fallback');
        fallbackContainer.innerHTML = this.fallbackIcons[type] || this.fallbackIcons.game;

        const imgEl = clone.querySelector('.card-cover-img');
        const coverContainer = clone.querySelector('.card-cover-container');
        
        const cardColor = item.color || '210, 168, 80';
        card.style.setProperty('--card-hover-rgb', cardColor);
        coverContainer.style.background = `linear-gradient(135deg, rgba(${cardColor}, 0.3) 0%, var(--bg-body) 100%)`;

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
            
            imgEl.onerror = () => {
                imgEl.style.display = 'none';
                fallbackContainer.style.display = 'flex';
                coverContainer.style.background = 'var(--bg-body)';
            };
        } else {
            imgEl.style.display = 'none';
            fallbackContainer.style.display = 'flex';
            coverContainer.style.background = 'var(--bg-body)';
        }

        SmartMarquee.apply(card, '.smart-marquee-text');

        let hoverTimeout;
        card.addEventListener('pointerenter', () => {
            hoverTimeout = setTimeout(() => {
                prefetchData(`assets/catalog/${item.id}/data.json`);
            }, 100);
        });
        card.addEventListener('pointerleave', () => clearTimeout(hoverTimeout));

        // ЛЕВЫЙ КЛИК
        card.addEventListener('click', (e) => {
            if (document.body.classList.contains('investigation-mode-active')) {
                e.preventDefault();
                e.stopPropagation();
                if (this.onEvidenceCollect) this.onEvidenceCollect(item, card);
                return;
            }

            e.preventDefault();
            const url = `project.html?id=${item.id}`;
            if (window.router) window.router.navigate(url);
            else window.location.href = url;
        });

        // ПРАВЫЙ КЛИК: Удалить улику
        card.addEventListener('contextmenu', (e) => {
            if (document.body.classList.contains('investigation-mode-active')) {
                e.preventDefault();
                e.stopPropagation();

                if (card.classList.contains('is-collected')) {
                    if (window.globalInvestigation) {
                        window.globalInvestigation.removeEvidence('catalog', item.id);
                    }
                    card.classList.add('is-removing');
                    setTimeout(() => {
                        card.classList.remove('is-removing');
                    }, 1000);
                }
            }
        });

        return clone;
    }
}