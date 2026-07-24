import { fetchData } from '../../shared/js/api.js';

export class GameManager {
    constructor(lightbox) {
        this.lightbox = lightbox;
        this.baseAssetPath = 'assets/games/';
        
        this.els = {
            loader: document.getElementById('game-loader'),
            content: document.getElementById('game-content'),
            
            bg: document.getElementById('hero-bg'),
            logo: document.getElementById('game-logo'),
            title: document.getElementById('game-title'),
            date: document.getElementById('game-date'),
            status: document.getElementById('game-status'),
            dev: document.getElementById('game-dev'),
            
            desc: document.getElementById('game-description'),
            screens: document.getElementById('game-screenshots'),
            storeLink: document.getElementById('store-link-container'),
            tags: document.getElementById('game-tags'),
            specs: document.getElementById('game-requirements')
        };

        this.initTabs();
    }

    initTabs() {
        const tabs = document.querySelectorAll('.wiki-tab');
        const sections = document.querySelectorAll('.wiki-section');

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                sections.forEach(s => s.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(tab.dataset.target).classList.add('active');
            });
        });
    }

    parseSpecs(specStr) {
        if (!specStr) return '';
        const parts = specStr.split('|').map(s => s.trim()).filter(s => s);
        if (parts.length > 0 && (parts[0].includes('Минимальные') || parts[0].includes('Рекомендованные'))) {
            parts.shift(); 
        }
        
        return `<ul class="req-list">` + parts.map(p => {
            const colonIndex = p.indexOf(':');
            if (colonIndex !== -1 && colonIndex < 25) { 
                const label = p.substring(0, colonIndex + 1);
                const value = p.substring(colonIndex + 1);
                return `<li><span class="req-label">${label}</span>${value}</li>`;
            }
            return `<li>${p}</li>`;
        }).join('') + `</ul>`;
    }

    render(game, gameId) {
        document.title = `${game.title} | Bendy Wiki`;

        const basePath = `assets/games/${gameId}/`;
        const assets = game.assets || {};
        const bgImage = assets.hero_bg || assets.banner || assets.cover;
        
        if (bgImage) {
            this.els.bg.style.backgroundImage = `url('${basePath}${bgImage}')`;
        }

        if (assets.logo) {
            this.els.logo.src = `${basePath}${assets.logo}`;
        } else {
            this.els.logo.style.display = 'none';
            this.els.title.textContent = game.title;
            this.els.title.style.display = 'block';
        }

        this.els.date.textContent = `Релиз: ${game.release_date || 'TBA'}`;
        this.els.dev.textContent = `Разработчик: ${game.developer}`;
        
        const lowerDate = (game.release_date || '').toLowerCase();
        this.els.status.textContent = (lowerDate.includes('скоро') || lowerDate.includes('не объявлена') || lowerDate.includes('2025') || lowerDate.includes('2026')) 
            ? 'В разработке' : 'Вышла';

        if (game.steam_id) {
            this.els.storeLink.innerHTML = `
                <a href="https://store.steampowered.com/app/${game.steam_id}/" target="_blank" rel="noopener noreferrer" class="store-btn">
                    <svg width="24" height="24" viewBox="0 0 496 512" fill="currentColor"><path d="M496 256c0 137-111.2 248-248.4 248-113.8 0-209.6-76.3-239-180.4l95.2 39.3c6.4 32.1 34.9 56.4 68.9 56.4 39.2 0 71.9-32.4 70.2-73.5l84.5-60.2c52.1 1.3 95.8-40.9 95.8-93.5 0-51.6-42-93.5-93.7-93.5s-93.7 42-93.7 93.5v1.2L176.6 279c-15.5-.9-30.7 3.4-43.5 12.1L0 236.1C10.2 108.4 117.1 8 247.6 8 384.8 8 496 119 496 256zM155.7 384.3l-30.5-12.6a52.79 52.79 0 0 0 27.2 25.8c26.9 11.2 57.8-1.6 69-28.4 5.4-13 5.5-27.3.1-40.3-5.4-13-15.5-23.2-28.5-28.6-12.9-5.4-26.7-5.2-38.9-.6l31.5 13c19.8 8.2 29.2 30.9 20.9 50.7-8.3 19.9-31 29.2-50.8 21zM356.1 163.6c-27.4 0-49.8 22.3-49.8 49.8s22.4 49.8 49.8 49.8 49.8-22.3 49.8-49.8-22.4-49.8-49.8-49.8zm-8.6 77.1c-15.1 0-27.3-12.2-27.3-27.3s12.2-27.3 27.3-27.3 27.3 12.2 27.3 27.3-12.2 27.3-27.3 27.3z"/></svg> 
                    Страница в Steam
                </a>
            `;
        }

        this.els.desc.textContent = game.description || 'Информация отсутствует.';
        this.els.tags.innerHTML = '';
        if (game.tags) {
            game.tags.slice(0, 15).forEach(tag => {
                const span = document.createElement('span');
                span.className = 'game-tag'; span.textContent = tag;
                this.els.tags.appendChild(span);
            });
        }
        
        this.els.screens.innerHTML = '';
        if (assets.screenshots && assets.screenshots.length > 0) {
            assets.screenshots.forEach(src => {
                const img = document.createElement('img');
                img.src = `${basePath}${src}`;
                img.loading = 'lazy';
                img.onclick = () => this.lightbox.open(img.src);
                this.els.screens.appendChild(img);
            });
        }

        // Вызываем асинхронный рендер вики
        this.renderWikiData(game.wiki);

        if (game.specs) {
            let reqHtml = '';
            if (game.specs.minimum && game.specs.minimum.length > 15) {
                reqHtml += `<div class="bento-box"><h3>Минимальные</h3>${this.parseSpecs(game.specs.minimum)}</div>`;
            }
            if (game.specs.recommended && game.specs.recommended.length > 15) {
                reqHtml += `<div class="bento-box"><h3>Рекомендованные</h3>${this.parseSpecs(game.specs.recommended)}</div>`;
            }
            this.els.specs.innerHTML = reqHtml || '<div class="empty-state">Нет данных</div>';
        }

        this.els.loader.style.display = 'none';
        this.els.content.style.display = 'block';
    }

    // ТЕПЕРЬ ФУНКЦИЯ АСИНХРОННАЯ И САМА ПОДТЯГИВАЕТ ДАННЫЕ ПЕРСОНАЖЕЙ
    async renderWikiData(wiki) {
        if (wiki && (wiki.story || wiki.characters)) {
            document.getElementById('wiki-story-empty').style.display = 'none';
            document.getElementById('wiki-story-content').style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story || 'Сюжет неизвестен.';
            
            const charList = document.getElementById('wiki-characters-list');
            
            if (wiki.characters && wiki.characters.length > 0) {
                // Показываем лоадер, пока грузятся карточки
                charList.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
                
                try {
                    // Асинхронно стучимся в папку каждого персонажа
                    const charPromises = wiki.characters.map(charId => 
                        fetchData(`assets/characters/${charId}/data.json`).catch(() => null) // Если файла нет - вернет null
                    );
                    
                    const charactersData = await Promise.all(charPromises);
                    charList.innerHTML = ''; // Очищаем лоадер
                    
                    const fallbackAvatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="%2365676B" stroke-width="2"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';

                    charactersData.forEach((char, index) => {
                        if (!char) {
                            // Если файла персонажа еще не существует в проекте
                            charList.innerHTML += `<li style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 5px;">[Архив поврежден: ${wiki.characters[index]}]</li>`;
                            return;
                        }

                        const a = document.createElement('a');
                        a.href = `character.html?id=${char.id}`;
                        a.className = 'character-card';
                        
                        const avatarPath = char.assets && char.assets.avatar 
                            ? `assets/characters/${char.id}/${char.assets.avatar}` 
                            : fallbackAvatar;
                        
                        a.innerHTML = `
                            <img src="${avatarPath}" alt="${char.name}" class="char-avatar" onerror="this.src='${fallbackAvatar}'">
                            <span class="char-name">${char.name}</span>
                            <svg class="char-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        `;
                        charList.appendChild(a);
                    });
                } catch (e) {
                    charList.innerHTML = '<li style="color: var(--error-color);">Ошибка загрузки личных дел</li>';
                }
            } else {
                charList.innerHTML = '<li style="color: var(--text-muted);">Данные отсутствуют</li>';
            }
        }

        if (wiki && wiki.gameplay && wiki.gameplay.length > 0) {
            document.getElementById('wiki-gameplay-empty').style.display = 'none';
            const gameplayContainer = document.getElementById('wiki-gameplay-content');
            gameplayContainer.style.display = 'block';
            
            const gameplayList = document.getElementById('wiki-gameplay-list');
            gameplayList.innerHTML = '';
            wiki.gameplay.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                gameplayList.appendChild(li);
            });
        }

        if (wiki && wiki.development && wiki.development.length > 0) {
            document.getElementById('wiki-dev-empty').style.display = 'none';
            const devContainer = document.getElementById('wiki-dev-content');
            devContainer.style.display = 'flex';
            
            devContainer.innerHTML = '';
            wiki.development.forEach(stage => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `<h3>${stage.title}</h3><p>${stage.text}</p>`;
                devContainer.appendChild(item);
            });
        }
    }

    showError(msg) {
        this.els.loader.style.display = 'none';
        this.els.content.style.display = 'block';
        this.els.content.innerHTML = `<div class="error-card" style="margin: 4rem auto; max-width: 600px;"><p>${msg}</p><a href="library.html" style="color:var(--accent-color);">Вернуться назад</a></div>`;
    }
}