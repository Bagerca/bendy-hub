// FILE: pages/project/renderers/LoreRenderer.js

import { Icons } from '../../../shared/js/icons.js';
import { RenderUtils } from './RenderUtils.js';

export class LoreRenderer {
    static renderChapters(chapters, projectId) {
        if (RenderUtils.isEmpty(chapters)) return null; 
        if (RenderUtils.isPlaceholder(chapters)) return RenderUtils.renderPlaceholder('Главы');

        return `<div class="chapters-grid">
            ${chapters.map(c => {
                let statsHtml = '';
                
                // Генерируем инфобокс, если есть статистика. Защита от заглушек "..." внутри массивов.
                const hasStats = c.stats;
                const hasEnemies = c.enemies && c.enemies.length > 0 && c.enemies[0] !== '...';
                const hasWeapons = c.weapons && c.weapons.length > 0 && c.weapons[0] !== '...';

                if (hasStats || hasEnemies || hasWeapons) {
                    statsHtml = `<div class="chapter-infobox">`;
                    
                    if (c.stats) {
                        if (c.stats.audio_logs !== undefined) statsHtml += `<div class="ch-stat"><span class="ch-stat-label">Аудиозаписи:</span> <span class="ch-stat-val">${c.stats.audio_logs}</span></div>`;
                        if (c.stats.bacon_soup !== undefined) statsHtml += `<div class="ch-stat"><span class="ch-stat-label">Суп с беконом:</span> <span class="ch-stat-val">${c.stats.bacon_soup}</span></div>`;
                    }
                    if (hasEnemies) {
                        statsHtml += `<div class="ch-stat"><span class="ch-stat-label">Враги:</span> <span class="ch-stat-val">${c.enemies.join(', ')}</span></div>`;
                    }
                    if (hasWeapons) {
                        statsHtml += `<div class="ch-stat"><span class="ch-stat-label">Оружие:</span> <span class="ch-stat-val">${c.weapons.join(', ')}</span></div>`;
                    }
                    
                    statsHtml += `</div>`;
                }
                
                // Защита: если блок statsHtml оказался пустым внутри (например, все массивы были '...'), очищаем его.
                if (statsHtml === `<div class="chapter-infobox"></div>`) statsHtml = '';

                // Проверяем наличие картинки. Если загрузка сбойнет (картинки нет на диске), сработает onerror:
                // Он скроет обертку с картинкой и добавит класс "no-poster" соседнему блоку с текстом.
                const hasImage = c.image && c.image !== '...';
                const imgHtml = hasImage 
                    ? `<div class="chapter-poster"><img src="assets/catalog/${projectId}/${c.image}" alt="${c.title}" loading="lazy" onerror="this.parentElement.style.display='none'; this.parentElement.nextElementSibling.classList.add('no-poster');"></div>`
                    : '';

                return `
                <div class="bento-box chapter-card">
                    ${imgHtml}
                    <div class="chapter-content ${!hasImage ? 'no-poster' : ''}">
                        <div class="chapter-title">${c.title}</div>
                        <div class="chapter-desc">${c.description}</div>
                        ${statsHtml}
                    </div>
                </div>`;
            }).join('')}
        </div>`;
    }

    static renderRecords(recordsData, originalIdsArray) {
        if (RenderUtils.isEmpty(originalIdsArray)) return null;
        if (RenderUtils.isPlaceholder(originalIdsArray)) return RenderUtils.renderPlaceholder('Записи Архива');
        if (!recordsData || recordsData.length === 0) return null;

        const groups = {};
        recordsData.forEach((record, index) => {
            const catId = record.categoryId || 'unknown';
            
            if (!groups[catId]) {
                let rawTitle = record.categoryTitle || catId;
                let cleanTitle = rawTitle.replace(/^Все\s+/i, '').replace(/\s+из\s+.*$/i, '').replace(/\s+с\s+.*$/i, '').replace(/\s+в\s+.*$/i, '').trim();
                cleanTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);
                
                groups[catId] = {
                    id: catId,
                    title: cleanTitle,
                    items: []
                };
            }
            groups[catId].items.push({ ...record, globalIndex: index });
        });

        const getCategoryIcon = (categoryId) => {
            if (!categoryId) return Icons.stat_book;
            if (categoryId.includes('audio') || categoryId.includes('promo')) return Icons.archive_audio;
            if (categoryId.includes('radio')) return Icons.archive_radio;
            if (categoryId.includes('tour')) return Icons.archive_tour;
            if (categoryId.includes('library') || categoryId.includes('mug')) return Icons.archive_book;
            if (categoryId.includes('notes')) return Icons.archive_notes;
            if (categoryId.includes('exhibits')) return Icons.archive_stands;
            if (categoryId.includes('lines')) return Icons.archive_voice;
            if (categoryId.includes('information') || categoryId.includes('character')) return Icons.archive_info;
            return Icons.archive_general || Icons.stat_book;
        };

        const randomId = Math.random().toString(36).substring(2, 9);
        let navHtml = `<div class="inner-tabs-wrapper"><div class="inner-tabs-nav">`;
        let contentHtml = '';

        Object.values(groups).forEach((group, index) => {
            const isActive = index === 0 ? 'active' : '';
            const tabId = `record-tab-${randomId}-${index}`;
            
            navHtml += `<button class="inner-tab-btn ${isActive}" data-target="${tabId}">${group.title}</button>`;
            
            contentHtml += `
                <div id="${tabId}" class="inner-tab-content ${isActive}">
                    <div class="wiki-records-grid">
                    ${group.items.map(record => {
                        const iconHtml = getCategoryIcon(record.categoryId);
                        
                        const imageHtml = record.image 
                            ? `<img src="assets/records/${record.categoryId}/${record.image}" class="wrc-image" loading="lazy" alt="Обложка">`
                            : `<div class="wrc-fallback-icon">${iconHtml}</div>`;

                        return `
                        <div class="wiki-record-card" data-index="${record.globalIndex}">
                            <div class="wrc-image-wrapper">
                                ${imageHtml}
                            </div>
                            <div class="wrc-content">
                                <div class="smart-marquee-wrapper">
                                    <h3 class="wrc-title smart-marquee-text">${record.title}</h3>
                                </div>
                                <span class="wrc-author">${record.author || 'Неизвестный'}</span>
                            </div>
                        </div>`;
                    }).join('')}
                    </div>
                </div>
            `;
        });

        navHtml += `</div></div>`;

        return `
        <div class="bento-box">
            <h3>Записи Архива</h3>
            ${navHtml}
            ${contentHtml}
        </div>`;
    }
}