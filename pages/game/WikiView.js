export class WikiView {
    constructor(lightboxManager) {
        this.lightbox = lightboxManager;
        this.baseAssetPath = 'assets/games/';
        
        this.els = {
            desc: document.getElementById('game-description'),
            tags: document.getElementById('game-tags'),
            screens: document.getElementById('game-screenshots'),
            specs: document.getElementById('game-requirements'),
            charList: document.getElementById('wiki-characters-list'),
            
            // Новые элементы для русификаторов
            rusContainer: document.getElementById('russifiers-container'),
            rusList: document.getElementById('game-russifiers')
        };

        this._initTabs();
    }

    _initTabs() {
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

    render(game, gameId) {
        const assets = game.assets || {};
        const wiki = game.wiki || {};

        // Обзор
        this.els.desc.textContent = game.description || 'Информация отсутствует.';
        
        this.els.tags.innerHTML = '';
        (game.tags || []).slice(0, 15).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'game-tag'; span.textContent = tag;
            this.els.tags.appendChild(span);
        });

        // Русификаторы
        this._renderRussifiers(game.russifiers);

        // Скриншоты
        this.els.screens.innerHTML = '';
        if (assets.screenshots && assets.screenshots.length > 0) {
            assets.screenshots.forEach(src => {
                const img = document.createElement('img');
                img.src = `${this.baseAssetPath}${gameId}/${src}`;
                img.loading = 'lazy';
                img.onclick = () => this.lightbox.open(img.src);
                this.els.screens.appendChild(img);
            });
        }

        // Системные требования
        this._renderSpecs(game.specs);

        // Wiki: Сюжет, Геймплей, Разработка
        this._renderStaticWiki(wiki);
    }

    _renderRussifiers(russifiers) {
        if (russifiers && russifiers.length > 0) {
            this.els.rusContainer.style.display = 'block';
            this.els.rusList.innerHTML = '';
            
            // Заглушка, если аватарки нет (Иконка "Команда/Люди")
            const fallbackAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2365676B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E";

            russifiers.forEach(rus => {
                const a = document.createElement('a');
                a.href = rus.url;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                a.className = 'rus-card';
                
                const descText = rus.description || rus.team || '';
                const avatarSrc = rus.avatar ? `assets/teams/${rus.avatar}` : fallbackAvatar;

                a.innerHTML = `
                    <img src="${avatarSrc}" alt="Avatar" class="rus-avatar" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
                    <div class="rus-info">
                        <div class="rus-title">
                            <span>${rus.title}</span>
                            <svg class="rus-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                                <polyline points="15 3 21 3 21 9"></polyline>
                                <line x1="10" y1="14" x2="21" y2="3"></line>
                            </svg>
                        </div>
                        <span class="rus-team">${descText}</span>
                    </div>
                `;
                this.els.rusList.appendChild(a);
            });
        } else {
            this.els.rusContainer.style.display = 'none';
        }
    }

    _renderSpecs(specs) {
        if (!specs) {
            this.els.specs.innerHTML = '<div class="empty-state">Нет данных</div>';
            return;
        }
        let reqHtml = '';
        if (specs.minimum && specs.minimum.length > 15) {
            reqHtml += `<div class="bento-box"><h3>Минимальные</h3>${this._parseSpecsString(specs.minimum)}</div>`;
        }
        if (specs.recommended && specs.recommended.length > 15) {
            reqHtml += `<div class="bento-box"><h3>Рекомендованные</h3>${this._parseSpecsString(specs.recommended)}</div>`;
        }
        this.els.specs.innerHTML = reqHtml || '<div class="empty-state">Нет данных</div>';
    }

    _parseSpecsString(specStr) {
        const parts = specStr.split('|').map(s => s.trim()).filter(s => s);
        if (parts.length > 0 && (parts[0].includes('Минимальные') || parts[0].includes('Рекомендованные'))) parts.shift(); 
        
        return `<ul class="req-list">` + parts.map(p => {
            const colonIndex = p.indexOf(':');
            if (colonIndex !== -1 && colonIndex < 25) { 
                return `<li><span class="req-label">${p.substring(0, colonIndex + 1)}</span>${p.substring(colonIndex + 1)}</li>`;
            }
            return `<li>${p}</li>`;
        }).join('') + `</ul>`;
    }

    _renderStaticWiki(wiki) {
        if (wiki.story) {
            document.getElementById('wiki-story-empty').style.display = 'none';
            document.getElementById('wiki-story-content').style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story;
        }
        
        if (wiki.gameplay && wiki.gameplay.length > 0) {
            document.getElementById('wiki-gameplay-empty').style.display = 'none';
            const container = document.getElementById('wiki-gameplay-content');
            container.style.display = 'block';
            
            const list = document.getElementById('wiki-gameplay-list');
            list.innerHTML = '';
            wiki.gameplay.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
        }

        if (wiki.development && wiki.development.length > 0) {
            document.getElementById('wiki-dev-empty').style.display = 'none';
            const container = document.getElementById('wiki-dev-content');
            container.style.display = 'flex';
            container.innerHTML = '';
            
            wiki.development.forEach(stage => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `<h3>${stage.title}</h3><p>${stage.text}</p>`;
                container.appendChild(item);
            });
        }
    }

    // Динамический рендер персонажей
    renderCharacters(charactersData, requestedIds) {
        this.els.charList.innerHTML = '';
        const fallback = 'data:image/svg+xml;charset=UTF-8,%3Csvg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" stroke="%2365676B" stroke-width="2"%3E%3Cpath d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/%3E%3Ccircle cx="12" cy="7" r="4"/%3E%3C/svg%3E';

        charactersData.forEach((char, index) => {
            if (!char) {
                this.els.charList.innerHTML += `<li style="color: var(--text-muted); font-size: 0.9rem;">[Архив поврежден: ${requestedIds[index]}]</li>`;
                return;
            }
            
            const a = document.createElement('a');
            a.href = `character.html?id=${char.id}`;
            a.className = 'character-card';
            
            const avatar = char.assets?.avatar ? `assets/characters/${char.id}/${char.assets.avatar}` : fallback;
            
            a.innerHTML = `
                <img src="${avatar}" alt="${char.name}" class="char-avatar" onerror="this.src='${fallback}'">
                <span class="char-name">${char.name}</span>
                <svg class="char-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
            `;
            this.els.charList.appendChild(a);
        });
    }
    
    showCharLoader() {
        this.els.charList.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
    }
}