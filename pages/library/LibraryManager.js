import { Logger } from '../../shared/js/Logger.js';
import { getAverageRGB } from '../../shared/js/utils.js';

export class LibraryManager {
    constructor() {
        this.container = document.getElementById('games-content');
        this.loader = document.getElementById('games-loader');
        this.template = document.getElementById('game-card-template');
    }

    determineStatus(releaseDate) {
        if (!releaseDate) return { text: 'В разработке', class: 'status-dev' };
        const lowerDate = releaseDate.toLowerCase();
        if (lowerDate.includes('скоро') || lowerDate.includes('не объявлена') || lowerDate.includes('2025') || lowerDate.includes('2026')) {
            return { text: 'В разработке', class: 'status-dev' };
        }
        return { text: 'Вышла', class: 'status-released' };
    }

    render(games) {
        const fragment = document.createDocumentFragment();

        games.forEach(game => {
            const clone = this.template.content.cloneNode(true);
            const card = clone.querySelector('.game-card');
            
            clone.querySelector('.game-title').textContent = game.title;
            clone.querySelector('.game-year').textContent = game.release_date || '';
            
            const badge = clone.querySelector('.game-status-badge');
            const statusConfig = this.determineStatus(game.release_date);
            badge.textContent = statusConfig.text;
            badge.classList.add(statusConfig.class);

            const imgEl = clone.querySelector('.game-cover-img');
            const fallbackEl = clone.querySelector('.game-cover-fallback');

            const cardImageFile = (game.assets && game.assets.banner) ? game.assets.banner : (game.assets && game.assets.cover);

            if (cardImageFile) {
                // ПУТЬ ТЕПЕРЬ СТРОИТСЯ ЧЕРЕЗ ПАПКУ ИГРЫ
                const imgSrc = `assets/games/${game.id}/${cardImageFile}`;
                imgEl.src = imgSrc;
                imgEl.alt = game.title;
                fallbackEl.style.display = 'none';
                
                getAverageRGB(imgSrc, (color) => {
                    if (color) card.style.setProperty('--card-hover-rgb', color);
                    else card.style.setProperty('--card-hover-rgb', '210, 168, 80');
                });

                imgEl.onerror = () => {
                    imgEl.style.display = 'none';
                    fallbackEl.style.display = 'flex';
                };
            } else {
                imgEl.style.display = 'none';
                fallbackEl.style.display = 'flex';
            }

            card.addEventListener('click', () => {
                window.location.href = `game.html?id=${game.id}`;
            });

            fragment.appendChild(clone);
        });

        this.loader.style.display = 'none';
        this.container.appendChild(fragment);
        this.container.style.display = 'grid';
        Logger.info(`Библиотека отрендерена: ${games.length} игр`);
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.container.innerHTML = `<div class="error-card" style="grid-column: 1/-1"><p>${msg}</p></div>`;
        this.container.style.display = 'block';
        Logger.error('Ошибка рендеринга библиотеки:', msg);
    }
}