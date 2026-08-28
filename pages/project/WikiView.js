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

    render(data, projectId, teamsData = []) {
        const assets = data.assets || {};
        const wiki = data.wiki || {};
        const type = data.type || 'game';

        // Обзор
        this.els.desc.textContent = data.description && data.description !== '...' ? data.description : 'Информация отсутствует.';
        
        this.els.tags.innerHTML = '';
        (data.tags || []).slice(0, 15).forEach(tag => {
            if(tag === '...') return;
            const span = document.createElement('span');
            span.className = 'game-tag'; span.textContent = tag;
            this.els.tags.appendChild(span);
        });

        // Переводы (передаем новый параметр teamsData и ID текущего проекта)
        this._renderTranslators(teamsData, type, projectId);

        // Интерактивная Медиа-Галерея (БЕЗ автоплея)
        this._renderMediaGallery(assets, projectId);

        // Системные требования 
        if (type === 'game') this._renderSpecs(data.specs);

        // Сюжет, Геймплей, Разработка
        this._renderStaticWiki(wiki, type);
    }

    // НОВЫЙ МЕТОД ОТОБРАЖЕНИЯ ПЕРЕВОДОВ ИЗ ОБЪЕКТОВ КОМАНД
    _renderTranslators(teams, type, projectId) {
        // ЖЕСТКАЯ ФИЛЬТРАЦИЯ: убираем null, пустые строки и заглушки с '...'
        const validTeams = (teams || []).filter(team => {
            if (!team) return false;
            if (typeof team === 'string' && team === '...') return false;
            if (team.title === '...') return false; // Защита от старых ручных шаблонов
            return true;
        });

        if (validTeams.length > 0) {
            this.els.translatorsContainer.style.display = 'block';
            this.els.translatorsTitle.textContent = type === 'book' ? 'Любительские переводы' : (type === 'movie' ? 'Озвучка / Сабы' : 'Русификаторы');
            this.els.translatorsList.innerHTML = '';
            
            const fallbackAvatar = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' fill='none' stroke='%2365676B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2'/%3E%3Ccircle cx='9' cy='7' r='4'/%3E%3Cpath d='M23 21v-2a4 4 0 0 0-3-3.87'/%3E%3Cpath d='M16 3.13a4 4 0 0 1 0 7.75'/%3E%3C/svg%3E";

            validTeams.forEach(team => {
                // Ищем перевод именно для текущей игры
                const translationData = team.translations ? team.translations[projectId] : null;
                
                // Fallback для старых данных
                const isLegacy = !team.translations;
                const url = isLegacy ? team.url : (translationData?.url || '#');
                const tType = isLegacy ? team.description : (translationData?.type || 'Перевод');
                const tName = isLegacy ? team.title : team.name;
                const avatarSrc = isLegacy 
                    ? (team.avatar ? `assets/teams/${team.avatar}` : fallbackAvatar)
                    : (team.assets?.avatar ? `assets/teams/${team.id}/${team.assets.avatar}` : fallbackAvatar);

                const a = document.createElement('a');
                a.href = url;
                a.target = '_blank';
                a.className = 'rus-card';

                a.innerHTML = `
                    <img src="${avatarSrc}" alt="Avatar" class="rus-avatar" onerror="this.onerror=null; this.src='${fallbackAvatar}';">
                    <div class="rus-info">
                        <div class="rus-title">
                            <span>${tName}</span>
                            <svg class="rus-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
                        </div>
                        <span class="rus-team">${tType}</span>
                    </div>
                `;
                this.els.translatorsList.appendChild(a);
            });
        } else {
            // Если реальных команд нет — полностью скрываем блок
            this.els.translatorsContainer.style.display = 'none';
        }
    }

    _renderMediaGallery(assets, projectId) {
        this.els.screens.innerHTML = '';
        
        const mediaItems = [];

        if (assets.videos && assets.videos.length > 0) {
            assets.videos.forEach(url => {
                if(url === '...') return;
                const videoId = this._extractYouTubeId(url);
                if (videoId) {
                    mediaItems.push({
                        type: 'video',
                        src: `https://www.youtube.com/embed/${videoId}?rel=0`, 
                        thumb: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
                    });
                }
            });
        }

        if (assets.screenshots && assets.screenshots.length > 0) {
            assets.screenshots.forEach(src => {
                if(src === '...') return;
                const fullUrl = `${this.baseAssetPath}${projectId}/${src}`;
                mediaItems.push({
                    type: 'image',
                    src: fullUrl,
                    thumb: fullUrl
                });
            });
        }

        if (mediaItems.length === 0) {
            this.els.screens.style.display = 'none';
            return;
        } else {
            this.els.screens.style.display = 'block';
        }

        const galleryHtml = `
            <div class="media-gallery">
                <div class="gallery-main-view" id="gallery-main-view"></div>
                
                ${mediaItems.length > 1 ? `
                <div class="gallery-nav">
                    <button class="gallery-arrow left" id="gallery-prev" aria-label="Назад">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
                    </button>
                    
                    <div class="gallery-thumbnails" id="gallery-thumbnails">
                        ${mediaItems.map((item, idx) => `
                            <button class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                                <img src="${item.thumb}" alt="Thumbnail" loading="lazy">
                                ${item.type === 'video' ? '<div class="play-indicator"><svg viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg></div>' : ''}
                            </button>
                        `).join('')}
                    </div>
                    
                    <button class="gallery-arrow right" id="gallery-next" aria-label="Вперед">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        this.els.screens.innerHTML = galleryHtml;

        let currentIndex = 0;
        const mainView = document.getElementById('gallery-main-view');
        const thumbnailsWrapper = document.getElementById('gallery-thumbnails');
        const thumbs = document.querySelectorAll('.gallery-thumb-btn');

        const updateMainView = (index) => {
            const item = mediaItems[index];
            
            if (item.type === 'image') {
                mainView.innerHTML = `<img src="${item.src}" alt="Screenshot" class="gallery-main-img">`;
                const imgEl = mainView.querySelector('.gallery-main-img');
                imgEl.onclick = () => this.lightbox.open(item.src);
            } 
            else if (item.type === 'video') {
                mainView.innerHTML = `
                    <div class="video-wrapper">
                        <iframe src="${item.src}" title="YouTube video" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                `;
            }

            if (thumbs.length > 0) {
                thumbs.forEach(t => t.classList.remove('active'));
                const activeThumb = thumbs[index];
                activeThumb.classList.add('active');
                
                if (thumbnailsWrapper) {
                    const scrollLeft = activeThumb.offsetLeft - (thumbnailsWrapper.offsetWidth / 2) + (activeThumb.offsetWidth / 2);
                    thumbnailsWrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            }
        };

        if (mediaItems.length > 1) {
            const btnPrev = document.getElementById('gallery-prev');
            const btnNext = document.getElementById('gallery-next');

            btnPrev.addEventListener('click', () => {
                currentIndex = currentIndex === 0 ? mediaItems.length - 1 : currentIndex - 1;
                updateMainView(currentIndex);
            });

            btnNext.addEventListener('click', () => {
                currentIndex = currentIndex === mediaItems.length - 1 ? 0 : currentIndex + 1;
                updateMainView(currentIndex);
            });

            thumbs.forEach(thumb => {
                thumb.addEventListener('click', () => {
                    currentIndex = parseInt(thumb.dataset.index);
                    updateMainView(currentIndex);
                });
            });
        }

        updateMainView(0);
    }

    _extractYouTubeId(url) {
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        return match ? match[1] : null;
    }

    _renderSpecs(specs) {
        if (!specs) {
            this.els.specs.innerHTML = '<div class="empty-state">Нет данных</div>';
            return;
        }
        let reqHtml = '';
        if (specs.minimum && specs.minimum !== '...' && specs.minimum.length > 5) {
            reqHtml += `<div class="bento-box"><h3>Минимальные</h3>${this._parseSpecsString(specs.minimum)}</div>`;
        }
        if (specs.recommended && specs.recommended !== '...' && specs.recommended.length > 5) {
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
        if (wiki.story && wiki.story !== '...') {
            document.getElementById('wiki-story-empty').style.display = 'none';
            document.getElementById('wiki-story-content').style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story;
        }
        
        if (type === 'game' && wiki.gameplay && wiki.gameplay.length > 0 && wiki.gameplay[0] !== '...') {
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

        if (wiki.development && wiki.development.length > 0 && wiki.development[0].text !== '...') {
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
            if (!char || char === '...') {
                const invalidId = requestedIds[index];
                if (invalidId !== '...') {
                    this.els.charList.innerHTML += `<li style="color: var(--text-muted); font-size: 0.9rem;">[Архив поврежден: ${invalidId}]</li>`;
                }
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