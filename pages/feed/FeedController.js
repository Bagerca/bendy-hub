/**
 * Controller: Связывает UI, Данные (Model), Рендер (View) и Скролл.
 */
export class FeedController {
    constructor(model, view, scroller) {
        this.model = model;
        this.view = view;
        this.scroller = scroller;
        
        this.container = document.getElementById('feed-content');
        
        // Шаблоны состояний
        this.emptyTemplate = document.getElementById('empty-state-template');
        this.errorTemplate = document.getElementById('error-state-template');
        this.skeletonTemplate = document.getElementById('skeleton-template');
    }

    start() {
        this.renderInitial();
    }

    handleSearchOrFilter(searchTerm, authorId) {
        this.model.applyFilters(searchTerm, authorId);
        this.renderInitial();
    }

    renderInitial() {
        this.container.innerHTML = ''; // Чистим контейнер
        
        if (this.model.isEmpty()) {
            this.scroller.stop();
            this.renderEmptyState();
            return;
        }

        // Показываем скелетоны при первой отрисовке для красоты UX (Опционально)
        this._renderSkeletons(3);

        // Даем браузеру отрисовать скелетоны, затем рендерим реальные посты
        requestAnimationFrame(() => {
            this.container.innerHTML = '';
            this.appendNextChunk();
            this.scroller.start(); // Запускаем слушатель скролла
        });
    }

    appendNextChunk() {
        if (!this.model.hasMore()) {
            this.scroller.stop();
            return;
        }

        const chunk = this.model.getNextChunk();
        const fragment = document.createDocumentFragment();
        const searchTerm = this.model.getSearchTerm();

        chunk.forEach(post => {
            const el = this.view.render(post, searchTerm);
            if (el) fragment.appendChild(el);
        });

        this.container.appendChild(fragment);

        if (!this.model.hasMore()) {
            this.scroller.stop();
        }
    }

    renderEmptyState() {
        const clone = this.emptyTemplate.content.cloneNode(true);
        const term = this.model.getSearchTerm();
        const desc = clone.querySelector('.empty-state-desc');
        desc.textContent = term 
            ? `По запросу «${term}» ничего не найдено. Попробуйте изменить ключевые слова.` 
            : `В базе данных пока нет записей по выбранным критериям.`;
            
        this.container.appendChild(clone);
    }

    renderErrorState(message) {
        this.container.innerHTML = '';
        this.scroller.stop();
        const clone = this.errorTemplate.content.cloneNode(true);
        clone.querySelector('.error-message').textContent = message;
        this.container.appendChild(clone);
    }

    _renderSkeletons(count) {
        const fragment = document.createDocumentFragment();
        for (let i = 0; i < count; i++) {
            fragment.appendChild(this.skeletonTemplate.content.cloneNode(true));
        }
        this.container.appendChild(fragment);
    }
}