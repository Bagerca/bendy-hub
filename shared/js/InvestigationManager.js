import { InvestigationStorage } from './InvestigationStorage.js';
import { InvestigationView } from './InvestigationView.js';

export class InvestigationManager {
    constructor() {
        this.storage = new InvestigationStorage();
        this.view = new InvestigationView(this);
        this.isOpen = false;
        
        // Выдаем данные хранилища вьюшке для первоначального рендера
        this.view.renderInitial(this.storage.getAll());
    }

    // Для совместимости со старым кодом
    get evidenceList() { return this.storage.getAll(); }

    toggle() { this.isOpen ? this.close() : this.open(); }

    open() {
        this.isOpen = true;
        this.view.open();
    }

    close() {
        this.isOpen = false;
        this.view.close();
    }

    _createCleanSnapshot(rawDomElement) {
        if (!rawDomElement) return null;
        const snapClone = rawDomElement.cloneNode(true);
        const overlays = snapClone.querySelectorAll('.investigation-overlay');
        overlays.forEach(el => el.remove());
        return snapClone.outerHTML;
    }

    addEvidence(type, id, data, rawDomElement = null) {
        if (this.storage.exists(type, id)) {
            this.view.shakeExistingItem(id);
            return;
        }

        const htmlSnapshot = this._createCleanSnapshot(rawDomElement);
        const newEvidence = { type, id, data, htmlSnapshot, timestamp: Date.now() };

        this.storage.add(newEvidence);
        this.view.removeEmptyState();

        const newElement = this.view.createDOMElement(newEvidence);
        this.view.prependItem(newElement);

        // УМНОЕ ОБНОВЛЕНИЕ: Зажигаем иконку "Галочка" на всех карточках с этим ID на странице
        document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
            el.classList.add('is-collected');
        });
    }

    removeEvidence(type, id) {
        this.storage.remove(type, id);
        this.view.removeItemDOM(id);
        
        // Отправляем ивент, чтобы доска могла отреагировать
        window.dispatchEvent(new CustomEvent('evidenceRemoved', { detail: { id } }));

        // УМНОЕ ОБНОВЛЕНИЕ: Гасим иконку "Галочка" на всех карточках с этим ID на странице
        document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
            el.classList.remove('is-collected');
        });
    }
}