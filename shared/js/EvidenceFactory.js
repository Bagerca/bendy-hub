// FILE: shared/js/EvidenceFactory.js

import { PostView } from '../../pages/feed/PostView.js';
import { CatalogCardView } from '../../pages/catalog/views/CatalogCardView.js';

export class EvidenceFactory {
    /**
     * Создает живой DOM-элемент улики со всеми работающими событиями.
     * @param {Object} evidence - Объект улики { id, type, data }
     * @param {string} context - 'sidebar' (для инвентаря) или 'board' (для доски)
     */
    static create(evidence, context = 'sidebar') {
        let el = null;

        if (evidence.type === 'post') {
            // Создаем экземпляр PostView. Передаем глобальные зависимости.
            // authorNamesMap оставляем пустым, т.к. data уже содержит имя автора.
            const postView = new PostView('post-template', window.globalLightbox, window.globalTranslator, {});
            const clone = postView.render(evidence.data);
            if (clone) {
                el = clone.querySelector('.post-card');
                if (context === 'sidebar') el.classList.add('inv-mini-post');
            }
        } 
        else if (evidence.type === 'catalog') {
            // Создаем экземпляр CatalogCardView.
            const catalogView = new CatalogCardView('template-card-horizontal', 'template-card-vertical');
            
            // Умное определение режима отображения (чтобы книги были вертикальными)
            let viewMode = 'horizontal';
            if (evidence.data.type === 'book') {
                viewMode = 'vertical';
            } else if (evidence.data.type === 'movie') {
                viewMode = 'mixed';
            }

            const clone = catalogView.render(evidence.data, viewMode);
            if (clone) {
                el = clone.firstElementChild;
                if (context === 'sidebar') el.classList.add('inv-mini-catalog');
            }
        }

        if (el) {
            // Вычищаем классы оверлеев и выделения, чтобы карточка была "чистой"
            const overlay = el.querySelector('.investigation-overlay');
            if (overlay) overlay.remove();
            el.classList.remove('is-collected', 'is-removing', 'is-hovered-by-inv-cursor');
        } else {
            // Fallback, если что-то пошло не так
            el = document.createElement('div');
            el.className = 'error-card';
            el.textContent = 'Ошибка загрузки данных';
        }

        return el;
    }
}