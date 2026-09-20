// FILE: pages/project/renderers/MiscRenderer.js

import { RenderUtils } from './RenderUtils.js';
import { Icons } from '../../../shared/js/icons.js';

export class MiscRenderer {
    static renderReviews(reviews) {
        if (RenderUtils.isEmpty(reviews)) return null; 
        if (RenderUtils.isPlaceholder(reviews)) return null; 
        
        return `<div class="reviews-container">
            ${reviews.map(rev => `
                <div class="review-card">
                    <div class="review-text">${rev.text}</div>
                    <div class="review-author">${rev.author}</div>
                </div>
            `).join('')}
        </div>`;
    }

    static renderTimeline(events) {
        if (RenderUtils.isEmpty(events)) return null;
        if (RenderUtils.isPlaceholder(events)) return RenderUtils.renderPlaceholder('Разработка');
        
        return `<div class="bento-box large">
            <div class="wiki-timeline-container">
                <div class="wiki-timeline-line"></div>
                ${events.map((stage, index) => {
                    let datePart = '';
                    let titlePart = stage.title;
                    
                    const colonIndex = stage.title.indexOf(':');
                    if (colonIndex !== -1) {
                        datePart = stage.title.substring(0, colonIndex).trim();
                        titlePart = stage.title.substring(colonIndex + 1).trim();
                    }

                    return `
                    <div class="wiki-timeline-item" style="animation-delay: ${index * 0.1}s">
                        <div class="wiki-timeline-node"></div>
                        <div class="wiki-timeline-card">
                            ${datePart ? `<span class="wt-date">${datePart}</span>` : ''}
                            <h4 class="wt-title">${titlePart}</h4>
                            <p class="wt-desc">${stage.text}</p>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }

    static renderCredits(creditsGroups) {
        if (RenderUtils.isEmpty(creditsGroups)) return null;
        if (RenderUtils.isPlaceholder(creditsGroups)) return RenderUtils.renderPlaceholder('Команда разработки');

        return `<div class="bento-box">
            <div class="credits-container">
                ${creditsGroups.map(group => `
                    <div class="credit-group">
                        <h4 class="credit-department">${group.department}</h4>
                        <ul class="credit-roles">
                            ${group.roles.map(role => `
                                <li>
                                    <span class="credit-job">${role.title}</span>
                                    <span class="credit-names">${role.names.join(', ')}</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    // НОВЫЙ ПРОКАЧАННЫЙ ДИЗАЙН DLC (Без заголовка, как виджет магазина)
    static renderDLC(dlcArray, projectId) {
        if (RenderUtils.isEmpty(dlcArray)) return null;

        return `<div class="dlc-list">
            ${dlcArray.map(dlc => {
                const imgSrc = dlc.image && dlc.image !== '...' ? `assets/catalog/${projectId}/${dlc.image}` : null;
                
                return `
                <a href="${dlc.url}" target="_blank" rel="noopener noreferrer" class="dlc-card">
                    ${imgSrc ? `
                    <div class="dlc-image-wrapper">
                        <img src="${imgSrc}" alt="${dlc.title}" loading="lazy">
                    </div>` : ''}
                    <div class="dlc-content">
                        <div class="dlc-header">
                            <span class="dlc-badge">${dlc.type || 'DLC'}</span>
                            ${Icons.plat_steam}
                        </div>
                        <div class="dlc-title">${dlc.title}</div>
                        <div class="dlc-price">${dlc.price || 'Купить'}</div>
                    </div>
                </a>`;
            }).join('')}
        </div>`;
    }
}