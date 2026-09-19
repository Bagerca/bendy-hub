import { Icons } from './icons.js';
import { EvidenceFactory } from './EvidenceFactory.js';

export class InvestigationView {
    constructor(controller) {
        this.controller = controller;
        this.customCursor = null;
        this.hoveredCard = null; 
        
        this.lastMouseX = -1;
        this.lastMouseY = -1;
        this.isScrollTicking = false; 
        
        this._injectHTML();
        this._bindElements();
        this._initEvents();
        this._initCustomCursor();
    }

    _injectHTML() {
        const html = `
            <aside class="investigation-panel" id="investigation-panel">
                <div class="inv-header">
                    <div class="inv-header-title">
                        ${Icons.pin || ''}
                        <h2>Инвентарь улик</h2>
                    </div>
                    <button class="inv-close-btn" id="inv-close-btn" title="Закрыть панель">${Icons.close || 'X'}</button>
                </div>
                <div class="inv-content" id="inv-content"></div>
                <div class="inv-footer">
                    <button class="inv-board-btn" id="inv-go-to-board">Перейти к доске расследований</button>
                </div>
            </aside>

            <div id="inv-custom-cursor" class="inv-custom-cursor">
                <div class="icc-wrapper">
                    <div class="icc-text left">ЛКМ Взять</div>
                    <div class="icc-mouse-icon">${Icons.cursor_investigation || ''}</div>
                    <div class="icc-text right">ПКМ Убрать</div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    _bindElements() {
        this.panel = document.getElementById('investigation-panel');
        this.content = document.getElementById('inv-content');
        this.closeBtn = document.getElementById('inv-close-btn');
        this.boardBtn = document.getElementById('inv-go-to-board');
        this.customCursor = document.getElementById('inv-custom-cursor'); 
    }

    _initEvents() {
        this.closeBtn.addEventListener('click', () => this.controller.close());
        
        this.boardBtn.addEventListener('click', () => {
            if (window.router) {
                window.router.navigate('board.html');
            } else {
                window.location.href = 'board.html';
            }
            if (!window.location.href.includes('board.html')) {
                this.controller.close();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.controller.isOpen) this.controller.close();
        });
    }

    _initCustomCursor() {
        document.addEventListener('mousemove', (e) => {
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;

            if (!this.controller.isOpen) return;

            if (this.customCursor) {
                this.customCursor.style.setProperty('--x', `${e.clientX}px`);
                this.customCursor.style.setProperty('--y', `${e.clientY}px`);
            }

            this._updateCardHoverState(e.target);
        });

        document.addEventListener('scroll', () => {
            if (!this.controller.isOpen || this.lastMouseX < 0 || this.lastMouseY < 0) return;

            if (!this.isScrollTicking) {
                window.requestAnimationFrame(() => {
                    const elementUnderCursor = document.elementFromPoint(this.lastMouseX, this.lastMouseY);
                    this._updateCardHoverState(elementUnderCursor);
                    this.isScrollTicking = false;
                });
                this.isScrollTicking = true;
            }
        }, { passive: true, capture: true });

        document.addEventListener('mouseleave', () => {
            if (this.controller.isOpen) this._clearHoverState();
        });

        window.addEventListener('syncCursorState', () => {
            this._syncCursorState();
        });
    }

    _updateCardHoverState(targetElement) {
        if (targetElement && targetElement.closest('.board-page-wrapper')) {
            this._clearHoverState();
            return;
        }

        const newHoveredCard = targetElement ? targetElement.closest('.post-card:not(.inv-mini-post), .card-horizontal:not(.inv-mini-catalog), .card-vertical:not(.inv-mini-catalog)') : null;

        if (this.hoveredCard !== newHoveredCard) {
            if (this.hoveredCard) {
                this.hoveredCard.classList.remove('is-hovered-by-inv-cursor');
            }

            this.hoveredCard = newHoveredCard; 

            if (this.hoveredCard) {
                this.hoveredCard.classList.add('is-hovered-by-inv-cursor');
                this.customCursor.classList.add('visible'); 
                this._syncCursorState(); 
            } else {
                this.customCursor.classList.remove('visible', 'state-add', 'state-remove');
            }
        } else if (this.hoveredCard) {
            this._syncCursorState();
        }
    }

    _clearHoverState() {
        if (this.hoveredCard) {
            this.hoveredCard.classList.remove('is-hovered-by-inv-cursor');
            this.hoveredCard = null;
        }
        if (this.customCursor) {
            this.customCursor.classList.remove('visible', 'state-add', 'state-remove');
        }
    }

    _syncCursorState() {
        if (!this.customCursor || !this.hoveredCard) return;

        if (this.hoveredCard.classList.contains('is-collected')) {
            this.customCursor.classList.remove('state-add');
            this.customCursor.classList.add('state-remove');
        } else {
            this.customCursor.classList.remove('state-remove');
            this.customCursor.classList.add('state-add');
        }
    }

    open() {
        this.panel.classList.add('active');
        document.body.classList.add('investigation-mode-active');
        const headerBtn = document.getElementById('open-investigation-btn');
        if (headerBtn) headerBtn.classList.add('is-active');

        if (this.lastMouseX >= 0 && this.lastMouseY >= 0) {
            const elementUnderCursor = document.elementFromPoint(this.lastMouseX, this.lastMouseY);
            this._updateCardHoverState(elementUnderCursor);
        }
    }

    close() {
        this._clearHoverState();

        this.panel.classList.remove('active');
        document.body.classList.remove('investigation-mode-active');
        const headerBtn = document.getElementById('open-investigation-btn');
        if (headerBtn) headerBtn.classList.remove('is-active');
    }

    renderInitial(evidenceList) {
        this.content.innerHTML = '';
        if (evidenceList.length === 0) { 
            this.checkEmptyState(); 
            return; 
        }
        const fragment = document.createDocumentFragment();
        evidenceList.forEach(evidence => { 
            fragment.appendChild(this.createDOMElement(evidence)); 
        });
        this.content.appendChild(fragment);
    }

    checkEmptyState() {
        if (this.content.children.length === 0) {
            this.content.innerHTML = `<div class="empty-state-silent" style="margin-top: 2rem;">${Icons.pin || ''}</div>`;
        }
    }

    removeEmptyState() {
        const emptyState = this.content.querySelector('.empty-state-silent');
        if (emptyState) emptyState.remove();
    }

    createDOMElement(evidence) {
        const wrapper = document.createElement('div');
        wrapper.className = 'inv-item-wrapper';
        wrapper.dataset.invId = evidence.id;
        wrapper.setAttribute('draggable', 'true');
        
        wrapper.addEventListener('dragstart', (e) => {
            wrapper.style.opacity = '0.5';
            e.dataTransfer.setData('application/json', JSON.stringify({ source: 'inventory', id: evidence.id }));
            e.dataTransfer.effectAllowed = 'copy';
        });

        wrapper.addEventListener('dragend', () => { wrapper.style.opacity = '1'; });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'inv-item-delete';
        deleteBtn.innerHTML = Icons.inv_trash || 'X';
        deleteBtn.title = 'Убрать улику';
        deleteBtn.addEventListener('click', () => this.controller.removeEvidence(evidence.type, evidence.id));
        wrapper.appendChild(deleteBtn);

        // ВОТ ОНО: Вся магия генерации DOM теперь спрятана в Фабрике!
        const cardEl = EvidenceFactory.create(evidence, 'sidebar');
        if (cardEl) {
            wrapper.appendChild(cardEl);
        }

        return wrapper;
    }

    shakeExistingItem(id) {
        const existingWrapper = this.content.querySelector(`[data-inv-id="${id}"]`);
        if (existingWrapper) {
            existingWrapper.scrollIntoView({ behavior: 'smooth', block: 'center' });
            const cardEl = existingWrapper.firstElementChild;
            if (cardEl) {
                cardEl.classList.remove('shake');
                void cardEl.offsetWidth; 
                cardEl.classList.add('shake');
                setTimeout(() => cardEl.classList.remove('shake'), 400);
            }
        }
    }

    prependItem(domElement) {
        this.content.prepend(domElement);
    }

    removeItemDOM(id) {
        const elToRemove = this.content.querySelector(`[data-inv-id="${id}"]`);
        if (elToRemove) {
            elToRemove.classList.add('is-deleting');
            setTimeout(() => {
                elToRemove.remove();
                this.checkEmptyState();
            }, 300);
        }
    }
}