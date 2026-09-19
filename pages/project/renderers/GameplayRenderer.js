// FILE: pages/project/renderers/GameplayRenderer.js

import { Icons } from '../../../shared/js/icons.js';
import { RenderUtils } from './RenderUtils.js';

export class GameplayRenderer {
    static renderAchievements(achievements) {
        if (RenderUtils.isEmpty(achievements)) return null;
        if (RenderUtils.isPlaceholder(achievements)) return RenderUtils.renderPlaceholder('Достижения');
        
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

    static renderControls(controlsArray) {
        if (RenderUtils.isEmpty(controlsArray)) return null;
        if (RenderUtils.isPlaceholder(controlsArray)) return RenderUtils.renderPlaceholder('Управление');
        
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
        
        // Убрали <h3>Управление</h3>
        return `<div class="bento-box">${navHtml}${contentHtml}</div>`;
    }
}