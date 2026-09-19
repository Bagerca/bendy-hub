import { Icons } from '../../shared/js/icons.js';

export class WikiBlockRenderer {
    static isValid(val) {
        return val && val !== '...' && (Array.isArray(val) ? val.length > 0 : true);
    }

    // ДОБАВЛЕНО: recordsData как 5-й параметр
    static renderBlock(blockId, data, projectId, teamsData, recordsData) {
        switch (blockId) {
            case 'description': return this.renderText(data.description);
            case 'reviews': return this.renderReviews(data.reviews);
            case 'gallery': return `<div id="project-screenshots"></div>`; 
            
            case 'tags': return this.renderTags(data.tags);
            case 'languages': return this.renderLanguages(data.languages);
            case 'specs': return this.renderSpecs(data.specs);
            case 'translators': return this.renderTranslators(teamsData, data.type, projectId);
            
            case 'chapters': return this.renderChapters(data.wiki?.chapters);
            case 'story': return this.renderText(data.wiki?.story);
            
            case 'characters': return `<div class="bento-box" style="padding: 1.5rem;"><div id="wiki-characters-list" class="project-chars-list"></div></div>`; 
            
            case 'mechanics': return this.renderList(data.wiki?.gameplay, 'gameplay-list');
            case 'controls': return this.renderControls(data.wiki?.controls);
            case 'achievements': return this.renderAchievements(data.achievements);
            
            case 'development': return this.renderTimeline(data.wiki?.development);
            case 'trivia': return this.renderList(data.wiki?.trivia, 'trivia-list');
            
            // НОВЫЙ БЛОК: Записи архива
            case 'records': return this.renderRecords(recordsData);
            
            default: return null;
        }
    }

    // НОВЫЙ МЕТОД
    static renderRecords(records) {
        if (!records || records.length === 0) return null;

        return `<div class="bento-box">
            <h3>Записи Архива</h3>
            <div class="wiki-records-grid">
            ${records.map((record, index) => {
                const isAudio = record.categoryId?.includes('audio') || record.categoryId?.includes('radio');
                const iconHtml = isAudio ? Icons.archive_audio : Icons.archive_notes;

                return `
                <div class="wiki-record-card" data-index="${index}">
                    <div class="crc-icon">${iconHtml || Icons.stat_book}</div>
                    <div class="crc-info">
                        <h4 class="crc-title">${record.title}</h4>
                        <p class="crc-preview">${record.text}</p>
                    </div>
                </div>`;
            }).join('')}
            </div>
        </div>`;
    }

    static renderText(text) {
        if (!this.isValid(text)) return null;
        return `<div class="bento-box"><p class="project-desc">${text}</p></div>`;
    }

    static renderReviews(reviews) {
        if (!this.isValid(reviews)) return null; 
        return `<div class="reviews-container">
            ${reviews.map(rev => `
                <div class="review-card">
                    <div class="review-text">${rev.text}</div>
                    <div class="review-author">${rev.author}</div>
                </div>
            `).join('')}
        </div>`;
    }

    static renderList(items, className) {
        if (!this.isValid(items)) return null; 
        return `<div class="bento-box"><ul class="${className}">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
    }

    static renderTimeline(events) {
        if (!this.isValid(events) || events[0]?.text === '...') return null;
        return `<div class="bento-box large"><div class="timeline-container">
            ${events.map(stage => `
                <div class="timeline-item">
                    <h3>${stage.title}</h3>
                    <p>${stage.text}</p>
                </div>
            `).join('')}
        </div></div>`;
    }

    static renderChapters(chapters) {
        if (!this.isValid(chapters)) return null; 
        return `<div class="bento-box"><div class="chapters-list">
            ${chapters.map(c => `
                <div class="chapter-card">
                    <div class="chapter-title">${c.title}</div>
                    <div class="chapter-desc">${c.description}</div>
                </div>
            `).join('')}
        </div></div>`;
    }

    static renderAchievements(achievements) {
        if (!this.isValid(achievements)) return null;
        return `<div class="bento-box"><div class="achievements-grid">
            ${achievements.map(ach => `
                <div class="achievement-card">
                    <div class="ach-icon">
                        ${ach.icon && ach.icon !== '...' ? `<img src="assets/achievements/${ach.icon}" alt="Ach" style="width:100%; height:100%; object-fit:cover; border-radius:8px;">` : Icons.stat_gamepad}
                    </div>
                    <div class="ach-info">
                        <div class="ach-title" title="${ach.title}">${ach.title}</div>
                        <div class="ach-desc" title="${ach.description}">${ach.description}</div>
                    </div>
                </div>
            `).join('')}
        </div></div>`;
    }

    static renderLanguages(languages) {
        if (!this.isValid(languages)) return null; 
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

    static renderTags(tags) {
        if (!this.isValid(tags)) return null;

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

    static renderSpecs(specsArray) {
        if (!this.isValid(specsArray) || !Array.isArray(specsArray)) return null;
        
        const randomId = Math.random().toString(36).substring(2, 9);
        let navHtml = `<div class="inner-tabs-wrapper"><div class="inner-tabs-nav">`;
        let contentHtml = '';

        specsArray.forEach((spec, index) => {
            const isActive = index === 0 ? 'active' : '';
            const tabId = `spec-tab-${randomId}-${index}`;
            
            navHtml += `<button class="inner-tab-btn ${isActive}" data-target="${tabId}">${spec.os}</button>`;
            
            const parseReqs = (list, label) => {
                if (!this.isValid(list)) return '';
                return `
                    <div style="flex: 1; min-width: 180px;">
                        <span class="req-block-title">${label}</span>
                        <ul class="req-list">
                            ${list.map(p => {
                                const colon = p.indexOf(':');
                                if (colon !== -1 && colon < 25) {
                                    return `<li><span class="req-label">${p.substring(0, colon + 1)}</span>${p.substring(colon + 1).trim()}</li>`;
                                }
                                return `<li>${p}</li>`;
                            }).join('')}
                        </ul>
                    </div>
                `;
            };

            contentHtml += `
                <div id="${tabId}" class="inner-tab-content ${isActive}">
                    <div style="display: flex; flex-direction: column; gap: 1.5rem;">
                        ${parseReqs(spec.minimum, 'Минимальные')}
                        ${parseReqs(spec.recommended, 'Рекомендованные')}
                    </div>
                </div>
            `;
        });

        navHtml += `</div></div>`;
        return `<div class="bento-box">${navHtml}${contentHtml}</div>`;
    }

    static renderControls(controlsArray) {
        if (!this.isValid(controlsArray) || !Array.isArray(controlsArray)) return null;
        
        const randomId = Math.random().toString(36).substring(2, 9);
        let navHtml = `<div class="inner-tabs-wrapper"><div class="inner-tabs-nav">`;
        let contentHtml = '';

        const stylizeKeys = (text) => {
            return text.replace(/^([^—-]+)(—|-)/, (match, keysGroup, dash) => {
                const parts = keysGroup.split(/(\s+|\+|или|,)/i);
                
                const stylizedKeys = parts.map(part => {
                    const cleanPart = part.trim();
                    if (!cleanPart) return part; 
                    
                    const lower = cleanPart.toLowerCase();
                    
                    if (cleanPart === '+' || lower === 'или' || cleanPart === ',') {
                        return `<span style="color:var(--text-muted); font-size:0.85rem; font-weight:700;">${cleanPart}</span>`;
                    }
                    if (['кнопка', 'кнопки', 'джойстик', 'мышь', 'триггер', 'экран', 'левый', 'правый', 'сенсорный'].includes(lower)) {
                        return `<span style="color:var(--accent-color); font-weight:700;">${cleanPart}</span>`;
                    }
                    return `<kbd class="control-key">${cleanPart}</kbd>`;
                }).join('');

                return `<div class="ctrl-keys-wrap">${stylizedKeys}</div> <span class="ctrl-dash">—</span> <div class="ctrl-desc">`;
            }) + `</div>`; 
        };

        controlsArray.forEach((ctrl, index) => {
            const isActive = index === 0 ? 'active' : '';
            const tabId = `ctrl-tab-${randomId}-${index}`;
            
            navHtml += `<button class="inner-tab-btn ${isActive}" data-target="${tabId}">${ctrl.platform}</button>`;
            
            contentHtml += `
                <div id="${tabId}" class="inner-tab-content ${isActive}">
                    <ul class="controls-list">
                        ${ctrl.mapping.map(m => `<li>${stylizeKeys(m)}</li>`).join('')}
                    </ul>
                </div>
            `;
        });

        navHtml += `</div></div>`;
        return `<div class="bento-box"><h3>Управление</h3>${navHtml}${contentHtml}</div>`;
    }

    static renderTranslators(teams, type, projectId) {
        const validTeams = (teams || []).filter(t => t && t !== '...' && t.title !== '...');
        if (validTeams.length === 0) return null;

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