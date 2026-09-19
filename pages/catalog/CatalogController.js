import { Icons } from '../../shared/js/icons.js';

export class CatalogController {
    constructor(model, cardView) {
        this.model = model;
        this.cardView = cardView;
        
        this.container = document.getElementById('catalog-content');
        this.loader = document.getElementById('catalog-loader');
        this.emptyTemplate = document.getElementById('empty-state-template');
    }

    async init() {
        try {
            const items = await this.model.fetchAllItems();
            this.renderSections(items);
        } catch (error) {
            this.showError('Сбой доступа к индексу архивов.');
        }
    }

    handleFilterChange(updates) {
        const filtered = this.model.applyFilters(updates);
        this.renderSections(filtered);
    }

    renderSections(items) {
        this.container.innerHTML = '';
        this.loader.style.display = 'none';
        this.container.style.display = 'block';

        if (items.length === 0) {
            const clone = this.emptyTemplate.content.cloneNode(true);
            clone.querySelector('.empty-state-silent').innerHTML = Icons.error_404;
            this.container.appendChild(clone);
            return;
        }

        const sectionsData = [
            { title: 'Игры', layout: 'grid-horizontal', viewMode: 'horizontal', data: items.filter(i => i.type === 'game' || !i.type) },
            { title: 'Книги и Комиксы', layout: 'grid-vertical', viewMode: 'vertical', data: items.filter(i => i.type === 'book') },
            { title: 'Анимация и Фильмы', layout: 'grid-mixed', viewMode: 'mixed', data: items.filter(i => i.type === 'movie') }
        ];

        const fragment = document.createDocumentFragment();

        sectionsData.forEach(section => {
            if (section.data.length > 0) {
                const sectionWrapper = document.createElement('section');
                sectionWrapper.className = 'catalog-section';

                const title = document.createElement('h2');
                title.className = 'catalog-section-title';
                title.textContent = section.title;
                sectionWrapper.appendChild(title);

                const grid = document.createElement('div');
                grid.className = section.layout;
                
                section.data.forEach(item => {
                    grid.appendChild(this.cardView.render(item, section.viewMode));
                });

                sectionWrapper.appendChild(grid);
                fragment.appendChild(sectionWrapper);
            }
        });
        
        this.container.appendChild(fragment);
    }

    showError(msg) {
        this.loader.style.display = 'none';
        this.container.innerHTML = `<div class="error-card" style="grid-column: 1/-1"><p>${msg}</p></div>`;
        this.container.style.display = 'block';
    }
}