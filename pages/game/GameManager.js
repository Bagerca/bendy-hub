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

        // ИДЕАЛЬНЫЕ ИКОНКИ: Строго viewBox="0 0 24 24"
        this.platformData = {
            steam: { name: 'Steam', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.979 0C5.353 0 0 5.353 0 11.979c0 4.678 2.658 8.749 6.551 10.741l3.52-5.111c-.046-.275-.072-.556-.072-.843 0-3.327 2.697-6.024 6.024-6.024 3.327 0 6.024 2.697 6.024 6.024 0 3.327-2.697 6.024-6.024 6.024-1.144 0-2.204-.336-3.111-.89l-5.32 3.614c1.44.606 3.01.94 4.65.94 6.626 0 11.979-5.353 11.979-11.979C24 5.353 18.605 0 11.979 0zM16.025 8.799c-1.464 0-2.655 1.191-2.655 2.655 0 1.464 1.191 2.655 2.655 2.655 1.464 0 2.655-1.191 2.655-2.655 0-1.464-1.191-2.655-2.655-2.655zm0 1.062c.878 0 1.593.715 1.593 1.593 0 .878-.715 1.593-1.593 1.593-.878 0-1.593-.715-1.593-1.593 0-.878.715-1.593 1.593-1.593zm-8.318 4.678c-1.897 0-3.447 1.55-3.447 3.447 0 1.897 1.55 3.447 3.447 3.447 1.897 0 3.447-1.55 3.447-3.447 0-1.897-1.55-3.447-3.447-3.447zm0 1.062c1.31 0 2.384 1.074 2.384 2.385 0 1.31-1.074 2.384-2.384 2.384-1.31 0-2.384-1.074-2.384-2.384 0-1.31 1.074-2.385 2.384-2.385z"/></svg>' },
            xbox: { name: 'Xbox', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm-5.976 5.892c1.322-.693 2.934-1.082 4.626-1.176-1.982.703-3.97 2.085-5.521 4-2.4 2.953-4.64 6.046-6.42 10.36 1.579-5.484 4.546-10.453 7.315-13.184zm11.952 0c-2.769 2.73-5.736 7.7-7.315 13.184 1.78-4.314 4.02-7.407 6.42-10.36 1.551-1.915 3.539-3.297 5.521-4-1.692.094-3.304.483-4.626 1.176zM4.148 12.012c0-2.122.56-4.14 1.52-5.918 3.562 4.316 7.777 8.356 12.983 11.233-1.85 1.564-4.195 2.508-6.732 2.508-5.834 0-10.569-4.735-10.569-10.569z"/></svg>' },
            playstation: { name: 'PlayStation', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.111 16.486c0 1.636-3.87 3.327-9.524 4.091v-2.345c4.146-.545 6.491-1.636 6.491-2.564 0-.873-2.182-1.909-5.946-2.455v-2.345c5.346 1.091 8.979 2.891 8.979 5.618zM14.053 17.85c-3.164.545-5.346.491-5.346-1.582V7.705c0-.818.273-1.091 1.091-1.091h1.582V3.45c-1.582 0-3.327.218-4.255.873v13.364c0 2.782 3.873 3.491 6.928 3.164v-2.95zm-6.546-4.636c-2.727-.545-4.855-1.091-4.855-2.182 0-1.091 2.236-2.182 5.509-2.727V6.014C4.343 6.614.416 8.086.416 10.486c0 2.455 4.364 4.255 7.091 4.964v-2.236z"/></svg>' },
            nintendo: { name: 'Nintendo Switch', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.915 2.051C4.195 2.051 2 4.246 2 6.966v10.068C2 19.754 4.195 21.949 6.915 21.949H9.05V2.051H6.915zM7.568 6.406a2.034 2.034 0 1 1 0 4.068 2.034 2.034 0 0 1 0-4.068zM11.95 2.051v19.898h5.135c2.72 0 4.915-2.195 4.915-4.915V6.966c0-2.72-2.195-4.915-4.915-4.915H11.95zm5.797 8.272a2.034 2.034 0 1 1 0-4.068 2.034 2.034 0 0 1 0 4.068z"/></svg>' },
            epic: { name: 'Epic Games', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0L2 5v14l10 5 10-5V5L12 0zm0 3.3L19 6.5v11L12 20.7 5 17.5v-11L12 3.3zm-3 4.4v8.6l6-4.3-6-4.3z"/></svg>' },
            ios: { name: 'App Store', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.502 3.833c.843-1.012 1.4-2.427 1.245-3.833-1.207.052-2.662.805-3.532 1.818-.68.827-1.303 2.281-1.13 3.687 1.34.104 2.684-.693 3.417-1.672z"/></svg>' },
            android: { name: 'Google Play', icon: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4483-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997zm-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993s-.4482.9997-.9993.9997zm11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0218 3.503C15.5902 8.244 13.8533 7.85 12 7.85s-3.5902.394-5.1373 1.0997L4.841 5.4467a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.44z"/></svg>' },
            website: { name: 'Сайт игры', icon: '<svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>' }
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

        // ГЕНЕРАЦИЯ КНОПОК ПЛАТФОРМ
        this.els.storeLink.innerHTML = '';
        if (game.platforms) {
            Object.entries(game.platforms).forEach(([key, url]) => {
                const pData = this.platformData[key] || { name: key, icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"></rect><circle cx="16" cy="12" r="2"></circle><line x1="6" y1="12" x2="10" y2="12"></line><line x1="8" y1="10" x2="8" y2="14"></line></svg>' };
                
                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = `store-btn platform-${key}`;
                a.innerHTML = `${pData.icon} <span>${pData.name}</span>`;
                
                this.els.storeLink.appendChild(a);
            });
        } else if (game.steam_id) {
            // Фолбэк для старого формата (если забыли обновить JSON)
            const pData = this.platformData.steam;
            this.els.storeLink.innerHTML = `<a href="https://store.steampowered.com/app/${game.steam_id}/" target="_blank" class="store-btn platform-steam">${pData.icon} <span>${pData.name}</span></a>`;
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

    async renderWikiData(wiki) {
        if (wiki && (wiki.story || wiki.characters)) {
            document.getElementById('wiki-story-empty').style.display = 'none';
            document.getElementById('wiki-story-content').style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story || 'Сюжет неизвестен.';
            
            const charList = document.getElementById('wiki-characters-list');
            
            if (wiki.characters && wiki.characters.length > 0) {
                charList.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
                
                try {
                    const charPromises = wiki.characters.map(charId => 
                        fetchData(`assets/characters/${charId}/data.json`).catch(() => null)
                    );
                    
                    const charactersData = await Promise.all(charPromises);
                    charList.innerHTML = ''; 
                    
                    const fallbackAvatar = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="%2365676B" stroke-width="2"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';

                    charactersData.forEach((char, index) => {
                        if (!char) {
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