export class RecordsView {
    constructor() {
        this.els = {
            nav: document.getElementById('category-nav'),
            loader: document.getElementById('records-loader'),
            grid: document.getElementById('records-grid'),
            title: document.getElementById('current-category-title'),
            count: document.getElementById('current-category-count'),
            
            modal: document.getElementById('record-modal'),
            closeBtn: document.querySelector('#record-modal .modal-close'),
            mImage: document.getElementById('reader-image'),
            mTitle: document.getElementById('reader-title'),
            mAuthor: document.getElementById('reader-author'),
            mText: document.getElementById('reader-text')
        };

        this.templates = {
            navBtn: document.getElementById('category-btn-template'),
            card: document.getElementById('record-card-template'),
            error: document.getElementById('error-state-template')
        };

        this._initModalEvents();
        this._initDragToScroll();
    }

    // Умный метод для очистки длинных названий из JSON
    _cleanTitle(title) {
        return title
            .replace(/^Все\s+/i, '')       // Убираем слово "Все " в начале
            .replace(/\s+из\s+/i, ' | ');  // Меняем " из " на разделитель " | "
    }

    _initModalEvents() {
        const closeModal = () => {
            this.els.modal.classList.remove('active');
            setTimeout(() => this.els.modal.close(), 300);
        };

        this.els.closeBtn.addEventListener('click', closeModal);
        
        this.els.modal.addEventListener('click', (e) => {
            const rect = this.els.modal.getBoundingClientRect();
            const isInDialog = (
                rect.top <= e.clientY && 
                e.clientY <= rect.top + rect.height && 
                rect.left <= e.clientX && 
                e.clientX <= rect.left + rect.width
            );
            if (!isInDialog) closeModal();
        });
    }

    _initDragToScroll() {
        const nav = this.els.nav;
        let isMouseDown = false;
        let startY;
        let scrollTop;

        nav.addEventListener('mousedown', (e) => {
            isMouseDown = true;
            startY = e.pageY - nav.offsetTop;
            scrollTop = nav.scrollTop;
        });

        nav.addEventListener('mousemove', (e) => {
            if (!isMouseDown) return;
            e.preventDefault(); 
            
            const y = e.pageY - nav.offsetTop;
            const walk = (y - startY) * 1.5; 
            
            if (Math.abs(walk) > 3) {
                nav.classList.add('is-dragging');
            }
            
            nav.scrollTop = scrollTop - walk;
        });

        const stopDragging = () => {
            isMouseDown = false;
            requestAnimationFrame(() => {
                nav.classList.remove('is-dragging');
            });
        };

        nav.addEventListener('mouseleave', stopDragging);
        nav.addEventListener('mouseup', stopDragging);
    }

    showLoader() {
        this.els.loader.style.display = 'block';
        this.els.grid.style.display = 'none';
    }

    hideLoader() {
        this.els.loader.style.display = 'none';
        this.els.grid.style.display = 'grid';
    }

    renderSidebar(categories, onCategoryClick) {
        this.els.nav.innerHTML = '';
        const fragment = document.createDocumentFragment();

        categories.forEach(category => {
            const clone = this.templates.navBtn.content.cloneNode(true);
            const btn = clone.querySelector('.cat-btn');
            
            // Применяем очистку и к боковому меню!
            const cleanName = this._cleanTitle(category.title);
            btn.textContent = cleanName;
            btn.title = cleanName;
            btn.dataset.id = category.title; // ID оставляем оригинальным для логики
            
            btn.addEventListener('click', () => onCategoryClick(category));
            fragment.appendChild(clone);
        });

        this.els.nav.appendChild(fragment);
    }

    updateActiveCategoryBtn(categoryTitle) {
        this.els.nav.querySelectorAll('.cat-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.id === categoryTitle);
        });
    }

    renderGrid(category, onRecordClick) {
        // Применяем очистку к главному заголовку
        this.els.title.textContent = this._cleanTitle(category.title);
        this.els.count.textContent = `${category.items.length} ЗАПИСЕЙ`;
        this.els.count.style.display = 'inline-block';
        
        this.els.grid.innerHTML = '';
        const fragment = document.createDocumentFragment();

        category.items.forEach((item, index) => {
            const clone = this.templates.card.content.cloneNode(true);
            const card = clone.querySelector('.record-card');
            
            card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;

            clone.querySelector('.card-title').textContent = item.title;
            clone.querySelector('.card-author').textContent = item.author || 'Неизвестный';

            item.categoryId = category.id;

            const imgEl = clone.querySelector('.card-image');
            const fallbackEl = clone.querySelector('.card-fallback-icon');
            
            if (item.image) {
                imgEl.src = `assets/records/${category.id}/${item.image}`;
                imgEl.style.display = 'block';
                fallbackEl.style.display = 'none';
            } else {
                imgEl.style.display = 'none';
                fallbackEl.style.display = 'flex';
                if (category.type === 'audio') {
                    clone.querySelector('.icon-audio').style.display = 'block';
                } else {
                    clone.querySelector('.icon-document').style.display = 'block';
                }
            }

            card.addEventListener('click', () => onRecordClick(item));
            fragment.appendChild(clone);
        });

        this.els.grid.appendChild(fragment);
        this.hideLoader();
    }

    openModal(record) {
        this.els.mTitle.textContent = record.title;
        this.els.mAuthor.textContent = record.author || 'Неизвестный автор';
        this.els.mText.textContent = record.text;

        if (record.image) {
            this.els.mImage.src = `assets/records/${record.categoryId}/${record.image}`;
            this.els.mImage.style.display = 'block';
        } else {
            this.els.mImage.style.display = 'none';
        }

        this.els.modal.showModal();
        requestAnimationFrame(() => this.els.modal.classList.add('active'));
    }

    renderError(message) {
        this.hideLoader();
        this.els.title.textContent = 'Архив недоступен';
        this.els.count.style.display = 'none';
        
        const clone = this.templates.error.content.cloneNode(true);
        clone.querySelector('.error-message').textContent = message;
        
        this.els.grid.innerHTML = '';
        this.els.grid.style.display = 'block';
        this.els.grid.appendChild(clone);
    }
}