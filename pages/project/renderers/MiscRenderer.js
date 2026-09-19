// FILE: pages/project/renderers/MiscRenderer.js

import { RenderUtils } from './RenderUtils.js';

export class MiscRenderer {
    static renderReviews(reviews) {
        if (RenderUtils.isEmpty(reviews)) return null; 
        if (RenderUtils.isPlaceholder(reviews)) return null; // Для отзывов лучше просто скрыть, а не рисовать заглушку
        
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
        
        return `<div class="bento-box large"><div class="timeline-container">
            ${events.map(stage => `
                <div class="timeline-item">
                    <h3>${stage.title}</h3>
                    <p>${stage.text}</p>
                </div>
            `).join('')}
        </div></div>`;
    }
}