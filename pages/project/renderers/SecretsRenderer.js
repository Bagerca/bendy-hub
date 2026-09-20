import { RenderUtils } from './RenderUtils.js';

export class SecretsRenderer {
    
    static renderArsenal(weapons, items, projectId) {
        if (RenderUtils.isEmpty(weapons) && RenderUtils.isEmpty(items)) return null;

        const equipment = [];
        const storyItems = [];

        const allItems = [...(weapons || []), ...(items || [])];

        // Умная сортировка
        allItems.forEach(item => {
            const t = (item.type || '').toLowerCase();
            if (t.includes('бой') || t.includes('оружие') || t.includes('устройство') || t.includes('снаряжение')) {
                equipment.push(item);
            } else {
                storyItems.push(item);
            }
        });

        // Уникальные ID для вкладок
        const randomId = Math.random().toString(36).substring(2, 9);
        const equipTabId = `ars-equip-${randomId}`;
        const storyTabId = `ars-story-${randomId}`;

        // Рендер карточки с поддержкой картинок
        const renderCard = (item) => {
            const hasImage = item.image && item.image !== '...';
            const imageHtml = hasImage 
                ? `<div class="ac-image">
                       <img src="assets/catalog/${projectId}/${item.image}" alt="${item.name}" loading="lazy">
                   </div>`
                : '';
                
            return `
            <div class="arsenal-card">
                ${imageHtml}
                <div class="ac-body">
                    <div class="ac-header">
                        <span class="ac-title">${item.name}</span>
                        <span class="ac-badge">${item.type}</span>
                    </div>
                    <div class="ac-desc">${item.desc}</div>
                </div>
            </div>`;
        };

        // Обертка "req-bento-grid" нужна, чтобы WikiView.js понял, что тут есть табы-переключатели
        let html = `<div class="bento-box"><div class="req-bento-grid">`;
        
        const hasEquip = equipment.length > 0;
        const hasStory = storyItems.length > 0;

        let navHtml = `<div class="req-switch-nav">`;
        let contentHtml = `<div class="req-switch-contents">`;

        if (hasEquip) {
            navHtml += `<button class="req-switch-btn active" data-target="${equipTabId}">Снаряжение и Оружие</button>`;
            contentHtml += `<div id="${equipTabId}" class="req-switch-content active">
                                <div class="arsenal-grid">${equipment.map(renderCard).join('')}</div>
                            </div>`;
        }
        if (hasStory) {
            const activeClass = !hasEquip ? 'active' : '';
            navHtml += `<button class="req-switch-btn ${activeClass}" data-target="${storyTabId}">Сюжетные Предметы</button>`;
            contentHtml += `<div id="${storyTabId}" class="req-switch-content ${activeClass}">
                                <div class="arsenal-grid">${storyItems.map(renderCard).join('')}</div>
                            </div>`;
        }

        navHtml += `</div>`;
        contentHtml += `</div>`;

        // Если есть и то и другое - рисуем табы. Если что-то одно - просто выводим сетку без кнопок.
        if (hasEquip && hasStory) {
            html += navHtml + contentHtml;
        } else {
            html += contentHtml; 
        }

        html += `</div></div>`;
        return html;
    }

    static renderEasterEggs(eggs) {
        if (RenderUtils.isEmpty(eggs)) return null;

        return `<div class="bento-box">
            <h3>Пасхалки и Секреты (Easter Eggs)</h3>
            <div class="easter-eggs-list">
                ${eggs.map(egg => `
                    <div class="easter-egg-item">
                        <div class="ee-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22C16 22 20 18 20 12C20 6 16 2 12 2C8 2 4 6 4 12C4 18 8 22 12 22Z"></path><path d="M8 12C8 12 9.5 14 12 14C14.5 14 16 12 16 12"></path></svg></div>
                        <div class="ee-content">
                            <span class="ee-title">${egg.title}</span>
                            <span class="ee-desc">${egg.desc}</span>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>`;
    }

    static renderEvents(events, projectId) {
        if (RenderUtils.isEmpty(events)) return null;

        return `<div class="bento-box">
            <h3>Сезонные Ивенты и Кроссоверы</h3>
            <div class="events-container">
                ${events.map(ev => {
                    const hasImage = ev.image && ev.image !== '...';
                    
                    const imageHtml = hasImage 
                        ? `<div class="ev-image-wrapper">
                               <img src="assets/catalog/${projectId}/${ev.image}" alt="${ev.title}" class="ev-image" loading="lazy">
                           </div>`
                        : '';
                    
                    return `
                    <div class="event-card">
                        ${imageHtml}
                        <div class="ev-content">
                            ${ev.date ? `<div class="ev-date">${ev.date}</div>` : ''}
                            <div class="ev-title">${ev.title}</div>
                            <div class="ev-desc">${ev.desc}</div>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </div>`;
    }
}