// FILE: pages/project/WikiBlockRenderer.js

import { RenderUtils } from './renderers/RenderUtils.js';
import { MetaRenderer } from './renderers/MetaRenderer.js';
import { LoreRenderer } from './renderers/LoreRenderer.js';
import { GameplayRenderer } from './renderers/GameplayRenderer.js';
import { MiscRenderer } from './renderers/MiscRenderer.js';
import { SecretsRenderer } from './renderers/SecretsRenderer.js';

export class WikiBlockRenderer {
    static renderBlock(blockId, data, projectId, teamsData, recordsData) {
        switch (blockId) {
            case 'description': return RenderUtils.renderText(data.description, 'Описание');
            case 'story': return RenderUtils.renderText(data.wiki?.story, 'Сюжет');
            
            case 'gallery': 
                if (RenderUtils.isEmpty(data.assets?.screenshots) && RenderUtils.isEmpty(data.assets?.videos)) return null;
                if (RenderUtils.isPlaceholder(data.assets?.screenshots) && RenderUtils.isPlaceholder(data.assets?.videos)) return RenderUtils.renderPlaceholder('Медиа галерея');
                return `<div id="project-screenshots"></div>`; 
            
            case 'reviews': return MiscRenderer.renderReviews(data.reviews);
            case 'development': return MiscRenderer.renderTimeline(data.wiki?.development);
            case 'credits': return MiscRenderer.renderCredits(data.wiki?.credits);
            case 'trivia': return RenderUtils.renderList(data.wiki?.trivia, 'trivia-list', 'Интересные факты');
            case 'dlc': return MiscRenderer.renderDLC(data.dlc, projectId);
            
            // ВАЖНО: Добавили projectId третьим параметром
            case 'arsenal': return SecretsRenderer.renderArsenal(data.wiki?.weapons, data.wiki?.items, projectId);
            
            case 'easter_eggs': return SecretsRenderer.renderEasterEggs(data.wiki?.easter_eggs);
            case 'events': return SecretsRenderer.renderEvents(data.wiki?.events, projectId);
            
            case 'tags': return MetaRenderer.renderTags(data.tags);
            case 'languages': return MetaRenderer.renderLanguages(data.languages);
            case 'specs': return MetaRenderer.renderSpecs(data.specs);
            case 'translators': return MetaRenderer.renderTranslators(teamsData, data.type, projectId);
            
            case 'mechanics': return RenderUtils.renderList(data.wiki?.gameplay, 'gameplay-list', 'Игровые механики');
            case 'controls': return GameplayRenderer.renderControls(data.wiki?.controls);
            case 'achievements': return GameplayRenderer.renderAchievements(data.achievements, projectId);
            
            case 'chapters': return LoreRenderer.renderChapters(data.wiki?.chapters, projectId);
            case 'records': return LoreRenderer.renderRecords(recordsData, data.wiki?.records);
            
            case 'characters': 
                if (RenderUtils.isEmpty(data.wiki?.characters)) return null;
                if (RenderUtils.isPlaceholder(data.wiki?.characters)) return RenderUtils.renderPlaceholder('Персонажи');
                return `<div id="wiki-characters-list" class="project-chars-list"></div>`; 
            
            default: return null;
        }
    }
}