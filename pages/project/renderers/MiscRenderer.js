// FILE: pages/project/renderers/MiscRenderer.js

import { RenderUtils } from './RenderUtils.js';

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
        
        // Убрали <h3>Разработка</h3>, оставили только сам таймлайн внутри bento-box
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
}