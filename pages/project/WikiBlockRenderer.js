// FILE: pages/project/WikiBlockRenderer.js

import { RenderUtils } from './renderers/RenderUtils.js';
import { MetaRenderer } from './renderers/MetaRenderer.js';
import { LoreRenderer } from './renderers/LoreRenderer.js';
import { GameplayRenderer } from './renderers/GameplayRenderer.js';
import { MiscRenderer } from './renderers/MiscRenderer.js';

export class WikiBlockRenderer {
    static renderBlock(blockId, data, projectId, teamsData, recordsData) {
        switch (blockId) {
            // --- РАЗНОЕ ---
            case 'description': return RenderUtils.renderText(data.description, 'Описание');
            case 'story': return RenderUtils.renderText(data.wiki?.story, 'Сюжет');
            
            case 'gallery': 
                if (RenderUtils.isEmpty(data.assets?.screenshots) && RenderUtils.isEmpty(data.assets?.videos)) return null;
                if (RenderUtils.isPlaceholder(data.assets?.screenshots) && RenderUtils.isPlaceholder(data.assets?.videos)) return RenderUtils.renderPlaceholder('Медиа галерея');
                return `<div id="project-screenshots"></div>`; 
            
            case 'reviews': return MiscRenderer.renderReviews(data.reviews);
            case 'development': return MiscRenderer.renderTimeline(data.wiki?.development);
            case 'trivia': return RenderUtils.renderList(data.wiki?.trivia, 'trivia-list', 'Интересные факты');
            
            // --- МЕТАДАННЫЕ ---
            case 'tags': return MetaRenderer.renderTags(data.tags);
            case 'languages': return MetaRenderer.renderLanguages(data.languages);
            case 'specs': return MetaRenderer.renderSpecs(data.specs);
            case 'translators': return MetaRenderer.renderTranslators(teamsData, data.type, projectId);
            
            // --- ГЕЙМПЛЕЙ ---
            case 'mechanics': return RenderUtils.renderList(data.wiki?.gameplay, 'gameplay-list', 'Игровые механики');
            case 'controls': return GameplayRenderer.renderControls(data.wiki?.controls);
            case 'achievements': return GameplayRenderer.renderAchievements(data.achievements);
            
            // --- ИСТОРИЯ ---
            case 'chapters': return LoreRenderer.renderChapters(data.wiki?.chapters);
            case 'records': return LoreRenderer.renderRecords(recordsData, data.wiki?.records);
            
            case 'characters': 
                if (RenderUtils.isEmpty(data.wiki?.characters)) return null;
                if (RenderUtils.isPlaceholder(data.wiki?.characters)) return RenderUtils.renderPlaceholder('Персонажи');
                return `<div class="bento-box" style="padding: 1.5rem;"><div id="wiki-characters-list" class="project-chars-list"></div></div>`; 
            
            default: return null;
        }
    }
}