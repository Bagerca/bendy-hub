import { getAverageRGB } from '../../../shared/js/utils.js';

export class GameCardView {
    constructor(templateId) {
        this.template = document.getElementById(templateId);
    }

    _determineStatus(releaseDate) {
        if (!releaseDate) return { text: 'В разработке', class: 'status-dev' };
        const lower = releaseDate.toLowerCase();
        if (lower.includes('скоро') || lower.includes('не объявлена') || lower.includes('2025') || lower.includes('2026')) {
            return { text: 'В разработке', class: 'status-dev' };
        }
        return { text: 'Вышла', class: 'status-released' };
    }

    render(game) {
        const clone = this.template.content.cloneNode(true);
        const card = clone.querySelector('.game-card');
        
        clone.querySelector('.game-title').textContent = game.title;
        clone.querySelector('.game-year').textContent = game.release_date || '';
        
        const badge = clone.querySelector('.game-status-badge');
        const statusConfig = this._determineStatus(game.release_date);
        badge.textContent = statusConfig.text;
        badge.classList.add(statusConfig.class);

        const imgEl = clone.querySelector('.game-cover-img');
        const fallbackEl = clone.querySelector('.game-cover-fallback');
        const cardImageFile = (game.assets && game.assets.banner) ? game.assets.banner : (game.assets && game.assets.cover);

        if (cardImageFile) {
            const imgSrc = `assets/games/${game.id}/${cardImageFile}`;
            imgEl.src = imgSrc;
            fallbackEl.style.display = 'none';
            
            getAverageRGB(imgSrc, (color) => {
                card.style.setProperty('--card-hover-rgb', color || '210, 168, 80');
            });

            imgEl.onerror = () => {
                imgEl.style.display = 'none';
                fallbackEl.style.display = 'flex';
            };
        } else {
            imgEl.style.display = 'none';
            fallbackEl.style.display = 'flex';
        }

        // ВОТ ОНО: Просто переходим на страницу игры!
        card.addEventListener('click', () => {
            window.location.href = `game.html?id=${game.id}`;
        });

        return clone;
    }
}