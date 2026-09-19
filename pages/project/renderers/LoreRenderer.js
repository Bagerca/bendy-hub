// FILE: pages/project/renderers/LoreRenderer.js

import { Icons } from '../../../shared/js/icons.js';
import { RenderUtils } from './RenderUtils.js';

export class LoreRenderer {
    static renderChapters(chapters) {
        if (RenderUtils.isEmpty(chapters)) return null; 
        if (RenderUtils.isPlaceholder(chapters)) return RenderUtils.renderPlaceholder('Главы');

        return `<div class="bento-box"><div class="chapters-list">
            ${chapters.map(c => `
                <div class="chapter-card">
                    <div class="chapter-title">${c.title}</div>
                    <div class="chapter-desc">${c.description}</div>
                </div>
            `).join('')}
        </div></div>`;
    }

    static renderRecords(recordsData, originalIdsArray) {
        if (RenderUtils.isEmpty(originalIdsArray)) return null;
        if (RenderUtils.isPlaceholder(originalIdsArray)) return RenderUtils.renderPlaceholder('Записи Архива');
        
        if (!recordsData || recordsData.length === 0) return null;

        return `<div class="bento-box">
            <h3>Записи Архива</h3>
            <div class="wiki-records-grid">
            ${recordsData.map((record, index) => {
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
}