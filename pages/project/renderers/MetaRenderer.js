// FILE: pages/project/renderers/MetaRenderer.js

import { Icons } from '../../../shared/js/icons.js';
import { RenderUtils } from './RenderUtils.js';

export class MetaRenderer {
    static renderTags(tags) {
        if (RenderUtils.isEmpty(tags)) return null;
        if (RenderUtils.isPlaceholder(tags)) return RenderUtils.renderPlaceholder('Жанры и Теги');

        const getTagIcon = (tagName) => {
            const lowerTag = tagName.toLowerCase();
            if (lowerTag.includes('хоррор') || lowerTag.includes('horror')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle><path d="M8 20v2h8v-2"></path><path d="M12.5 17l-.5-1-.5 1h1z"></path><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"></path></svg>`;
            }
            if (lowerTag.includes('первого лица') || lowerTag.includes('first person')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
            if (lowerTag.includes('головоломка') || lowerTag.includes('puzzle')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 0-.253.902l.331 1.46c.159.703-.097 1.439-.636 1.978l-1.558 1.559c-.54.54-1.275.795-1.978.636l-1.46-.331a.98.98 0 0 0-.902.252l-1.61 1.611c-.471.47-1.088.706-1.705.706-.616 0-1.233-.235-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29l-1.427.323c-.705.158-1.44-.098-1.98-.637l-1.558-1.558c-.539-.54-.795-1.275-.636-1.978l.322-1.428a1.026 1.026 0 0 0-.29-.877l-1.568-1.568c-.94-.94-.94-2.469 0-3.408l1.611-1.611c.264-.264.381-.634.253-.902l-.331-1.46c-.159-.703.097-1.439.636-1.978l1.559-1.559c.54-.539 1.275-.795 1.978-.636l1.46.331c.268.061.543-.01.761-.176L9.61 3.292c.47-.47 1.088-.706 1.705-.706.616 0 1.233.235 1.704.706l1.568 1.568c.23.23.556.338.878.289l1.427-.322c.705-.159 1.44.097 1.98.636l1.558 1.558c.539.54.795 1.275.636 1.978l-.323 1.427z"></path></svg>`;
            }
            if (lowerTag.includes('экшен') || lowerTag.includes('action')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`;
            }
            if (lowerTag.includes('инди') || lowerTag.includes('indie')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"></path><path d="M11 3 8 9l4 13"></path><path d="M12 15V3"></path></svg>`;
            }
            if (lowerTag.includes('атмосфер') || lowerTag.includes('atmospheric')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`;
            }
            if (lowerTag.includes('ретро') || lowerTag.includes('retro')) {
                return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 17 17 22 7 22 7 17"></polyline><line x1="7" y1="7" x2="7" y2="12"></line><line x1="17" y1="7" x2="17" y2="12"></line><line x1="2" y1="12" x2="22" y2="12"></line></svg>`;
            }
            return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="9" x2="20" y2="9"></line><line x1="4" y1="15" x2="20" y2="15"></line><line x1="10" y1="3" x2="8" y2="21"></line><line x1="16" y1="3" x2="14" y2="21"></line></svg>`;
        };

        return `<div class="bento-box"><div class="tags-cloud">
            ${tags.slice(0, 15).map(tag => `
                <div class="game-tag">
                    <span class="tag-icon">${getTagIcon(tag)}</span>
                    <span class="tag-text">${tag}</span>
                </div>
            `).join('')}
        </div></div>`;
    }

    static renderLanguages(languages) {
        if (RenderUtils.isEmpty(languages)) return null; 
        if (RenderUtils.isPlaceholder(languages)) return RenderUtils.renderPlaceholder('Локализация');
        
        return `
        <div class="languages-list">
            ${languages.map(l => `
                <div class="lang-row">
                    <span class="lang-name">${l.lang}</span>
                    <div class="lang-flags">
                        ${l.interface ? `<div class="lang-flag" title="Интерфейс">${Icons.check} INT</div>` : ''}
                        ${l.audio ? `<div class="lang-flag" title="Озвучка">${Icons.check} AUD</div>` : ''}
                        ${l.subtitles ? `<div class="lang-flag" title="Субтитры">${Icons.check} SUB</div>` : ''}
                    </div>
                </div>
            `).join('')}
        </div>`;
    }

    static renderSpecs(specsArray) {
        if (RenderUtils.isEmpty(specsArray)) return null;
        if (RenderUtils.isPlaceholder(specsArray)) return RenderUtils.renderPlaceholder('Системные требования');
        
        if (!Array.isArray(specsArray)) return null;
        
        const randomId = Math.random().toString(36).substring(2, 9);
        let navHtml = `<div class="inner-tabs-wrapper"><div class="inner-tabs-nav">`;
        let contentHtml = '';

        specsArray.forEach((spec, index) => {
            const isActive = index === 0 ? 'active' : '';
            const tabId = `spec-tab-${randomId}-${index}`;
            
            // Вкладки OS (Windows, Mac OS X)
            navHtml += `<button class="inner-tab-btn ${isActive}" data-target="${tabId}">${spec.os}</button>`;
            
            const parseReqs = (list) => {
                if (RenderUtils.isEmpty(list)) return '<div class="req-empty">Нет данных</div>';
                return `
                    <ul class="req-list">
                        ${list.map(p => {
                            const colon = p.indexOf(':');
                            if (colon !== -1 && colon < 25) {
                                return `<li><span class="req-label">${p.substring(0, colon + 1)}</span>${p.substring(colon + 1).trim()}</li>`;
                            }
                            return `<li>${p}</li>`;
                        }).join('')}
                    </ul>
                `;
            };

            const hasMin = !RenderUtils.isEmpty(spec.minimum);
            const hasRec = !RenderUtils.isEmpty(spec.recommended);
            
            // Двойной переключатель для Минималок и Рекомендованных (работает через те же inner-tabs)
            const subRandomId = Math.random().toString(36).substring(2, 9);
            const minTabId = `req-min-${subRandomId}`;
            const recTabId = `req-rec-${subRandomId}`;
            
            let reqNavHtml = `<div class="req-switch-nav">`;
            let reqContentHtml = `<div class="req-switch-contents">`;
            
            if (hasMin) {
                reqNavHtml += `<button class="req-switch-btn active" data-target="${minTabId}">Минимальные</button>`;
                reqContentHtml += `<div id="${minTabId}" class="req-switch-content active">${parseReqs(spec.minimum)}</div>`;
            }
            if (hasRec) {
                // Если минималок нет, активируем рекомендованные сразу
                const activeClass = !hasMin ? 'active' : '';
                reqNavHtml += `<button class="req-switch-btn ${activeClass}" data-target="${recTabId}">Рекомендованные</button>`;
                reqContentHtml += `<div id="${recTabId}" class="req-switch-content ${activeClass}">${parseReqs(spec.recommended)}</div>`;
            }

            reqNavHtml += `</div>`;
            reqContentHtml += `</div>`;

            contentHtml += `
                <div id="${tabId}" class="inner-tab-content ${isActive}">
                    <div class="req-bento-grid">
                        ${(hasMin || hasRec) ? reqNavHtml + reqContentHtml : '<div class="req-empty">Нет данных</div>'}
                    </div>
                </div>
            `;
        });

        navHtml += `</div></div>`;
        return `<div class="bento-box">${navHtml}${contentHtml}</div>`;
    }

    static renderTranslators(teams, type, projectId) {
        if (RenderUtils.isEmpty(teams)) return null;
        
        const validTeams = teams.filter(t => t && t !== '...' && t.title !== '...');
        if (validTeams.length === 0) return RenderUtils.renderPlaceholder(type === 'book' ? 'Любительские переводы' : (type === 'movie' ? 'Озвучка / Сабы' : 'Команды локализаторов'));

        return `<div class="bento-box">
            <h3>${type === 'book' ? 'Любительские переводы' : (type === 'movie' ? 'Озвучка / Сабы' : 'Команды локализаторов')}</h3>
            <div class="translators-list">
            ${validTeams.map(team => {
                const trData = team.translations ? team.translations[projectId] : null;
                const isLegacy = !team.translations;
                const url = isLegacy ? team.url : (trData?.url || '#');
                const tType = isLegacy ? team.description : (trData?.type || 'Перевод');
                const tName = isLegacy ? team.title : team.name;
                const avatar = isLegacy 
                    ? (team.avatar ? `assets/teams/${team.avatar}` : Icons.avatar_fallback)
                    : (team.assets?.avatar ? `assets/teams/${team.id}/${team.assets.avatar}` : Icons.avatar_fallback);

                return `
                <a href="${url}" target="_blank" class="rus-card">
                    <img src="${avatar}" alt="Avatar" class="rus-avatar" onerror="this.src='${Icons.avatar_fallback}'">
                    <div class="rus-info">
                        <div class="rus-title">${tName}</div>
                        <div class="rus-badge-wrapper">
                            <span class="rus-badge">${tType}</span>
                        </div>
                    </div>
                    <div class="rus-action-btn">
                        ${Icons.link_external}
                    </div>
                </a>`;
            }).join('')}
        </div></div>`;
    }
}