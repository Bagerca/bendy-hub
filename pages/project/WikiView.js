export class WikiView {
    constructor(lightboxManager) {
        this.lightbox = lightboxManager;
        this.baseAssetPath = 'assets/catalog/';
        
        this.els = {
            tabsContainer: document.getElementById('dynamic-tabs'),
            desc: document.getElementById('project-description'),
            tags: document.getElementById('project-tags'),
            screens: document.getElementById('project-screenshots'),
            specs: document.getElementById('project-requirements'),
            charList: document.getElementById('wiki-characters-list'),
            
            translatorsContainer: document.getElementById('translators-container'),
            translatorsList: document.getElementById('project-translators'),
            translatorsTitle: document.getElementById('translators-title')
        };
    }

    setupTabs(type) {
        // Динамически строим табы. Книгам и мультфильмам не нужен геймплей и сис.требования
        let tabsHtml = `<button class="wiki-tab active" data-target="tab-overview">Обзор</button>
                        <button class="wiki-tab" data-target="tab-story">Сюжет и Персонажи</button>`;
        
        if (type === 'game') {
            tabsHtml += `<button class="wiki-tab" data-target="tab-gameplay">Геймплей</button>`;
        }
        
        tabsHtml += `<button class="wiki-tab" data-target="tab-dev">Создание</button>`;
        
        if (type === 'game') {
            tabsHtml += `<button class="wiki-tab" data-target="tab-specs">Системные требования</button>`;
        }

        this.els.tabsContainer.innerHTML = tabsHtml;

        // Вешаем логику переключения
        const tabs = this.els.tabsContainer.querySelectorAll('.wiki-tab');
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

    render(data, projectId) {
        const assets = data.assets || {};
        const wiki = data.wiki || {};
        const type = data.type || 'game';

        // Обзор
        this.els.desc.textContent = data.description || 'Информация отсутствует.';
        
        this.els.tags.innerHTML = '';
        (data.tags || []).slice(0, 15).forEach(tag => {
            const span = document.createElement('span');
            span.className = 'game-tag'; span.textContent = tag;
            this.els.tags.appendChild(span);
        });

        // Переводы (для игр — русификаторы, для книг/фильмов — переводы)
        this._renderTranslators(data.russifiers, type);

        // Медиа (Видео и Скриншоты)
        this._renderMedia(assets, projectId);

        // Системные требования (только для игр)
        if (type === 'game') this._renderSpecs(data.specs);

        // Сюжет, Геймплей, Разработка
        this._renderStaticWiki(wiki, type);
    }

    // НОВЫЙ МЕТОД: Рендер Видео и Скриншотов
    _renderMedia(assets, projectId) {
        this.els.screens.innerHTML = '';
        let hasMedia = false;

        // 1. Рендерим YouTube Видео
        if (assets.videos && assets.videos.length > 0) {
            assets.videos.forEach(videoUrl => {
                const videoId = this._extractYouTubeId(videoUrl);
                if (videoId) {
                    const wrapper = document.createElement('div');
                    wrapper.className = 'video-wrapper';
                    wrapper.innerHTML = `<iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
                    this.els.screens.appendChild(wrapper);
                    hasMedia = true;
                }
            });
        }

        // 2. Рендерим Скриншоты
        if (assets.screenshots && assets.screenshots.length > 0) {
            assets.screenshots.forEach(src => {
                const img = document.createElement('img');
                img.src = `${this.baseAssetPath}${projectId}/${src}`;
                img.loading = 'lazy';
                img.className = 'screenshot-img';
                img.onclick = () => this.lightbox.open(img.src);
                this.els.screens.appendChild(img);
                hasMedia = true;
            });
        }

        if (!hasMedia) {
            this.els.screens.innerHTML = '<span style="color: var(--text-muted); font-size: 0.95rem;">Медиафайлы отсутствуют.</span>';
        }
    }

    // Парсер ссылок YouTube (Достает ID видео из любой ссылки)
    _extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }

    _renderTranslators(translators, type) {
        if (translators && translators.length > 0) {
            this.els.translatorsContainer.style.display = 'block';
            this.els.translatorsTitle.textContent = type === 'book' ? 'Любительские переводы' : (type === 'movie' ? 'Озвучка / Сабы' : 'Русификаторы');
            this.els.translatorsList.innerHTML = '';
            
            const fallbackAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2365676B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E";

            translators.forEach(rus => {
                const a = document.createElement('a');
                a.href = rus.url;
                a.target = '_blank';
                a.className = 'rus-card';
                
                const descText = rus.description || rus.team || '';
                const avatarSrc = rus.avatar ? `assets/teams/${rus.avatar}` : fallbackAvatar;

                a.innerHTML = `
                    <img src="${avatarSrc}" alt="Avatar" class="rus-avatar" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
                    <div class="rus-info">
                        <div class="rus-title">
                            <span>${rus.title}</span>
                            <svg class="rus-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </div>
                        <span class="rus-team">${descText}</span>
                    </div>
                `;
                this.els.translatorsList.appendChild(a);
            });
        } else {
            this.els.translatorsContainer.style.display = 'none';
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

    _renderStaticWiki(wiki, type) {
        if (wiki.story) {
            document.getElementById('wiki-story-empty').style.display = 'none';
            document.getElementById('wiki-story-content').style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story;
        }
        
        if (type === 'game' && wiki.gameplay && wiki.gameplay.length > 0) {
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