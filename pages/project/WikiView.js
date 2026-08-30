import { Icons } from '../../shared/js/icons.js';

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

        if (data.description && data.description !== '...') {
            this.els.desc.className = 'project-desc';
            this.els.desc.textContent = data.description;
        } else {
            this.els.desc.className = ''; 
            this.els.desc.innerHTML = `
                <div class="empty-state compact" style="margin-top: 0;">
                    <div class="empty-state-icon">${Icons.error_404}</div>
                    <h3 class="empty-state-title">Архивные данные отсутствуют</h3>
                </div>
            `;
        }
        
        this.els.tags.innerHTML = '';
        (data.tags || []).slice(0, 15).forEach(tag => {
            if(tag === '...') return;
            const span = document.createElement('span');
            span.className = 'game-tag'; span.textContent = tag;
            this.els.tags.appendChild(span);
        });

        this._renderTranslators(teamsData, type, projectId);
        this._renderMediaGallery(assets, projectId);
        if (type === 'game') this._renderSpecs(data.specs);
        this._renderStaticWiki(wiki, type);
    }

    _renderTranslators(teams, type, projectId) {
        const validTeams = (teams || []).filter(team => {
            if (!team) return false;
            if (typeof team === 'string' && team === '...') return false;
            if (team.title === '...') return false; 
            return true;
        });

        if (validTeams.length > 0) {
            this.els.translatorsContainer.style.display = 'block';
            this.els.translatorsTitle.textContent = type === 'book' ? 'Любительские переводы' : (type === 'movie' ? 'Озвучка / Сабы' : 'Русификаторы');
            this.els.translatorsList.innerHTML = '';
            
            const fallbackAvatar = Icons.avatar_fallback;

            validTeams.forEach(team => {
                const translationData = team.translations ? team.translations[projectId] : null;
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
                            <div class="rus-icon">${Icons.link_external}</div>
                        </div>
                        <span class="rus-team">${tType}</span>
                    </div>
                `;
                this.els.translatorsList.appendChild(a);
            });
        } else {
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
                    <button class="gallery-arrow left" id="gallery-prev" aria-label="Назад">${Icons.gallery_prev}</button>
                    
                    <div class="gallery-thumbnails" id="gallery-thumbnails">
                        ${mediaItems.map((item, idx) => `
                            <button class="gallery-thumb-btn ${idx === 0 ? 'active' : ''}" data-index="${idx}">
                                <img src="${item.thumb}" alt="Thumbnail" loading="lazy">
                                ${item.type === 'video' ? `<div class="play-indicator">${Icons.play_indicator}</div>` : ''}
                            </button>
                        `).join('')}
                    </div>
                    
                    <button class="gallery-arrow right" id="gallery-next" aria-label="Вперед">${Icons.gallery_next}</button>
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
        const specsEmptyHtml = `
            <div class="empty-state compact" style="grid-column: 1/-1;">
                <div class="empty-state-icon">${Icons.error_404}</div>
                <h3 class="empty-state-title">Системные требования неизвестны</h3>
            </div>`;

        if (!specs) {
            this.els.specs.innerHTML = specsEmptyHtml;
            return;
        }

        let reqHtml = '';
        if (specs.minimum && specs.minimum !== '...' && specs.minimum.length > 5) {
            reqHtml += `<div class="bento-box"><h3>Минимальные</h3>${this._parseSpecsString(specs.minimum)}</div>`;
        }
        if (specs.recommended && specs.recommended !== '...' && specs.recommended.length > 5) {
            reqHtml += `<div class="bento-box"><h3>Рекомендованные</h3>${this._parseSpecsString(specs.recommended)}</div>`;
        }
        
        if (!reqHtml) {
             this.els.specs.innerHTML = specsEmptyHtml;
        } else {
             this.els.specs.innerHTML = reqHtml;
        }
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
        const storyEmpty = document.getElementById('wiki-story-empty');
        const storyContent = document.getElementById('wiki-story-content');
        
        if (wiki.story && wiki.story !== '...') {
            storyEmpty.style.display = 'none';
            storyContent.style.display = 'block';
            document.getElementById('wiki-story-text').textContent = wiki.story;
        } else {
            storyEmpty.querySelector('.empty-state-icon').innerHTML = Icons.error_404;
            storyEmpty.style.display = 'flex'; 
            storyContent.style.display = 'none';
        }
        
        if (type === 'game') {
            const gpEmpty = document.getElementById('wiki-gameplay-empty');
            const gpContent = document.getElementById('wiki-gameplay-content');
            
            if (wiki.gameplay && wiki.gameplay.length > 0 && wiki.gameplay[0] !== '...') {
                gpEmpty.style.display = 'none';
                gpContent.style.display = 'block';
                
                const list = document.getElementById('wiki-gameplay-list');
                list.innerHTML = '';
                wiki.gameplay.forEach(item => {
                    const li = document.createElement('li');
                    li.textContent = item;
                    list.appendChild(li);
                });
            } else {
                gpEmpty.querySelector('.empty-state-icon').innerHTML = Icons.error_404;
                gpEmpty.style.display = 'flex'; 
                gpContent.style.display = 'none';
            }
        }

        const devEmpty = document.getElementById('wiki-dev-empty');
        const devContent = document.getElementById('wiki-dev-content');
        
        if (wiki.development && wiki.development.length > 0 && wiki.development[0].text !== '...') {
            devEmpty.style.display = 'none';
            devContent.style.display = 'flex';
            devContent.innerHTML = '';
            
            wiki.development.forEach(stage => {
                const item = document.createElement('div');
                item.className = 'timeline-item';
                item.innerHTML = `<h3>${stage.title}</h3><p>${stage.text}</p>`;
                devContent.appendChild(item);
            });
        } else {
            devEmpty.querySelector('.empty-state-icon').innerHTML = Icons.error_404;
            devEmpty.style.display = 'flex'; 
            devContent.style.display = 'none';
        }
    }

    renderCharacters(charactersData, requestedIds) {
        this.els.charList.innerHTML = '';
        const fallback = Icons.avatar_fallback;

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
            
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (window.router) {
                    window.router.navigate(a.href);
                } else {
                    window.location.href = a.href;
                }
            });
            
            const avatar = char.assets?.avatar ? `assets/characters/${char.id}/${char.assets.avatar}` : fallback;
            a.innerHTML = `
                <img src="${avatar}" alt="${char.name}" class="char-avatar" onerror="this.src='${fallback}'">
                <span class="char-name">${char.name}</span>
                <div class="char-arrow">${Icons.chevron_right}</div>
            `;
            this.els.charList.appendChild(a);
        });
    }
    
    showCharLoader() {
        this.els.charList.innerHTML = '<div class="spinner" style="margin: 20px auto;"></div>';
    }
}