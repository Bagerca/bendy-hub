import { Icons } from '../../shared/js/icons.js';
import { GalleryRenderer } from './GalleryRenderer.js';

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

        // Инициализируем новый класс галереи
        this.galleryRenderer = new GalleryRenderer(this.lightbox, this.baseAssetPath, this.els.screens);
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

        // 1. Описание
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
        
        // 2. Теги
        this._renderTags(data.tags);

        // 3. Русификаторы и переводы
        this._renderTranslators(teamsData, type, projectId);

        // 4. Галерея (Делегируем работу отдельному классу!)
        this.galleryRenderer.render(assets, projectId);

        // 5. Остальные данные
        if (type === 'game') this._renderSpecs(data.specs);
        this._renderStaticWiki(wiki, type);
    }

    _renderTags(tags) {
        this.els.tags.innerHTML = '';
        const validTags = (tags || []).filter(t => t && t !== '...');
        const tagsHeader = this.els.tags.previousElementSibling; 
        
        if (validTags.length > 0) {
            if (tagsHeader) tagsHeader.style.textAlign = 'left';
            
            validTags.slice(0, 15).forEach(tag => {
                const span = document.createElement('span');
                span.className = 'game-tag'; 
                span.textContent = tag;
                this.els.tags.appendChild(span);
            });
        } else {
            if (tagsHeader) tagsHeader.style.textAlign = 'center';
            this.els.tags.innerHTML = `
                <div style="width: 100%; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 1rem 0 0.5rem;">
                    <div style="width: 48px; height: 48px; background: var(--bg-body); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); margin-bottom: 0.85rem; border: 1px solid var(--border-color); box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                        <div style="width: 24px; height: 24px; opacity: 0.8;">${Icons.error_404}</div>
                    </div>
                    <span style="color: var(--text-muted); font-size: 0.9rem; font-weight: 700;">Жанры не указаны</span>
                </div>
            `;
        }
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
        
        this.els.specs.innerHTML = reqHtml || specsEmptyHtml;
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