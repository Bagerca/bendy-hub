import { Icons } from './icons.js';
import { PostActionsHelper } from './PostActionsHelper.js';

export class InvestigationView {
    constructor(controller) {
        this.controller = controller;
        this._injectHTML();
        this._bindElements();
        this._initEvents();
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
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    _bindElements() {
        this.panel = document.getElementById('investigation-panel');
        this.content = document.getElementById('inv-content');
        this.closeBtn = document.getElementById('inv-close-btn');
        this.boardBtn = document.getElementById('inv-go-to-board');
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

    open() {
        this.panel.classList.add('active');
        document.body.classList.add('investigation-mode-active');
        const headerBtn = document.getElementById('open-investigation-btn');
        if (headerBtn) headerBtn.classList.add('is-active');
    }

    close() {
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
            this.content.innerHTML = `<div class="empty-state compact" style="border: none; background: transparent; padding-top: 4rem;"><div class="empty-state-icon" style="background: rgba(210, 168, 80, 0.1); color: var(--accent-color);">${Icons.pin || ''}</div><h3 class="empty-state-title" style="font-size: 1.1rem;">Инвентарь пуст</h3><p class="empty-state-desc" style="font-size: 0.85rem; opacity: 0.7;">ЛКМ: добавить улику.<br>ПКМ: убрать улику.</p></div>`;
        }
    }

    removeEmptyState() {
        const emptyState = this.content.querySelector('.empty-state');
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
        // ИСПОЛЬЗУЕМ НОВУЮ ИКОНКУ КОРЗИНЫ
        deleteBtn.innerHTML = Icons.inv_trash || 'X';
        deleteBtn.title = 'Убрать улику';
        deleteBtn.addEventListener('click', () => this.controller.removeEvidence(evidence.type, evidence.id));
        wrapper.appendChild(deleteBtn);

        if (evidence.type === 'post' || evidence.type === 'catalog') {
            const temp = document.createElement('div');
            temp.innerHTML = evidence.htmlSnapshot || '<article class="post-card"><p>Данные устарели.</p></article>';
            
            const card = temp.firstElementChild; 
            if (card) {
                card.classList.remove('is-collected');
                
                if (evidence.type === 'post') {
                    card.classList.add('inv-mini-post'); 
                    PostActionsHelper.bindActions(card, evidence.data);
                    PostActionsHelper.bindSliders(card);
                } else {
                    card.classList.add('inv-mini-catalog');
                }
                wrapper.appendChild(card);
            }
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