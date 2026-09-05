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

    handleSearchOrFilter(searchTerm, authorId, postType) {
        this.model.applyFilters(searchTerm, authorId, postType);
        this.renderInitial();
    }

    renderInitial() {
        this.container.innerHTML = ''; 
        
        if (this.model.isEmpty()) {
            this.scroller.stop();
            this.renderEmptyState();
            return;
        }

        this._renderSkeletons(3);

        requestAnimationFrame(() => {
            this.container.innerHTML = '';
            this.appendNextChunk();
            this.scroller.start(); 
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
            ? `По запросу «${term}» ничего не найдено. Попробуйте изменить фильтры.` 
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