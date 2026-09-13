import { Icons } from './icons.js';
import { formatRichText } from './utils.js';

export class InvestigationManager {
    constructor() {
        this.storageKey = 'bendy_investigation_board';
        this.evidenceList = this._loadData();
        this.isOpen = false;
        
        this._injectHTML();
        this._bindElements();
        this._initEvents();
        this._renderPanel();
    }

    _loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.warn('InvestigationStorage error:', e);
            return [];
        }
    }

    _saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.evidenceList));
    }

    _injectHTML() {
        const html = `
            <aside class="investigation-panel" id="investigation-panel">
                <div class="inv-header">
                    <div class="inv-header-title">
                        ${Icons.board || ''}
                        <h2>Инвентарь улик</h2>
                    </div>
                    <button class="inv-close-btn" id="inv-close-btn" title="Закрыть режим">${Icons.close || 'X'}</button>
                </div>
                <div class="inv-content" id="inv-content">
                    <!-- Сюда падают улики -->
                </div>
                <div class="inv-footer">
                    <button class="inv-board-btn" disabled>Открыть доску (В разработке)</button>
                </div>
            </aside>
        `;
        document.body.insertAdjacentHTML('beforeend', html);
    }

    _bindElements() {
        this.panel = document.getElementById('investigation-panel');
        this.content = document.getElementById('inv-content');
        this.closeBtn = document.getElementById('inv-close-btn');
        this.postTemplate = document.getElementById('post-template');
    }

    _initEvents() {
        this.closeBtn.addEventListener('click', () => this.close());
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    }

    toggle() {
        this.isOpen ? this.close() : this.open();
    }

    open() {
        this.isOpen = true;
        this.panel.classList.add('active');
        document.body.classList.add('investigation-mode-active');
        
        const headerBtn = document.getElementById('open-investigation-btn');
        if (headerBtn) headerBtn.classList.add('is-active');
    }

    close() {
        this.isOpen = false;
        this.panel.classList.remove('active');
        document.body.classList.remove('investigation-mode-active');
        
        const headerBtn = document.getElementById('open-investigation-btn');
        if (headerBtn) headerBtn.classList.remove('is-active');
    }

    // ТЕПЕРЬ МЫ ПРИНИМАЕМ HTML-СЛЕПОК ЧЕТВЕРТЫМ АРГУМЕНТОМ!
    addEvidence(type, id, data, htmlSnapshot = null) {
        const exists = this.evidenceList.some(item => item.type === type && item.id === id);
        
        if (exists) {
            const existingEl = this.content.querySelector(`[data-inv-id="${id}"]`);
            if (existingEl) {
                existingEl.classList.add('shake');
                setTimeout(() => existingEl.classList.remove('shake'), 400);
            }
            return;
        }

        this.evidenceList.unshift({ type, id, data, htmlSnapshot, timestamp: Date.now() });
        this._saveData();
        this._renderPanel();
    }

    removeEvidence(type, id) {
        this.evidenceList = this.evidenceList.filter(item => !(item.type === type && item.id === id));
        this._saveData();
        this._renderPanel();
    }

    _renderPanel() {
        this.content.innerHTML = '';

        if (this.evidenceList.length === 0) {
            this.content.innerHTML = `
                <div class="empty-state compact" style="border: none; background: transparent;">
                    <div class="empty-state-icon" style="background: rgba(255,255,255,0.05);">${Icons.pin || ''}</div>
                    <h3 class="empty-state-title" style="font-size: 1rem;">Инвентарь пуст</h3>
                    <p class="empty-state-desc" style="font-size: 0.85rem;">Кликайте по постам и карточкам, чтобы добавить их сюда.</p>
                </div>
            `;
            return;
        }

        const fragment = document.createDocumentFragment();

        this.evidenceList.forEach(evidence => {
            const wrapper = document.createElement('div');
            wrapper.className = 'inv-item-wrapper';
            wrapper.dataset.invId = evidence.id;

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'inv-item-delete';
            deleteBtn.innerHTML = Icons.close || 'X';
            deleteBtn.title = 'Убрать с доски';
            deleteBtn.addEventListener('click', () => this.removeEvidence(evidence.type, evidence.id));
            
            wrapper.appendChild(deleteBtn);

            if (evidence.type === 'post') {
                let card;
                
                // ЕСЛИ ЕСТЬ СЛЕПОК HTML - ПРОСТО ВСТАВЛЯЕМ ЕГО!
                if (evidence.htmlSnapshot) {
                    card = document.createElement('article');
                    card.className = 'post-card';
                    card.innerHTML = evidence.htmlSnapshot;
                    
                    // Отключаем интерактивность и выравниваем стили для панели
                    card.style.pointerEvents = 'none';
                    card.style.transform = 'none';
                    card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
                    card.style.margin = '0';
                } else {
                    // Фоллбек для старых сохранений
                    card = this._renderPostMiniature(evidence.data);
                }
                
                if (card) wrapper.appendChild(card);
            }

            fragment.appendChild(wrapper);
        });

        this.content.appendChild(fragment);
    }

    // Оставляем как запасной вариант, если у старых юзеров в localStorage нет htmlSnapshot
    _renderPostMiniature(post) {
        if (!this.postTemplate) return null;
        const clone = this.postTemplate.content.cloneNode(true);
        const card = clone.querySelector('.post-card');
        
        const overlay = card.querySelector('.investigation-overlay');
        if (overlay) overlay.remove();

        card.querySelector('.post-author-name').textContent = post.resolvedAuthorName || post.authorName;
        card.querySelector('.post-author-handle').textContent = post.authorHandle;
        
        const avatarClean = (post.authorHandle || '').replace('@', '').toLowerCase();
        const avatarEl = card.querySelector('.post-avatar');
        avatarEl.src = `assets/developers/${avatarClean}/avatar.jpg`;
        avatarEl.onerror = () => { avatarEl.src = Icons.avatar_fallback; };

        if (post.timestamp) {
            card.querySelector('.post-date').textContent = new Date(post.timestamp).toLocaleString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
        }

        const textContainer = card.querySelector('.post-text');
        if (post.content) {
            textContainer.innerHTML = formatRichText(post.content);
        } else {
            textContainer.style.display = 'none';
        }

        const actions = card.querySelector('.post-actions');
        const headerAction = card.querySelector('.post-header-action');
        if (actions) actions.style.display = 'none';
        if (headerAction) headerAction.style.display = 'none';

        card.style.pointerEvents = 'none';
        card.style.transform = 'none';
        card.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';

        return card;
    }
}