// FILE: shared/js/InvestigationManager.js

import { InvestigationStorage } from './InvestigationStorage.js';
import { InvestigationView } from './InvestigationView.js';

export class InvestigationManager {
    constructor() {
        this.storage = new InvestigationStorage();
        this.view = new InvestigationView(this);
        this.isOpen = false;
        
        this.view.renderInitial(this.storage.getAll());
    }

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

    // rawDomElement нам больше не нужен, но оставляем в сигнатуре 
    // для обратной совместимости с вызовами из Feed/Catalog.
    addEvidence(type, id, data, rawDomElement = null) {
        if (this.storage.exists(type, id)) {
            this.view.shakeExistingItem(id);
            return;
        }

        // Сохраняем ТОЛЬКО чистые JSON-метаданные!
        const newEvidence = { type, id, data, timestamp: Date.now() };

        this.storage.add(newEvidence);
        this.view.removeEmptyState();

        const newElement = this.view.createDOMElement(newEvidence);
        this.view.prependItem(newElement);

        document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
            el.classList.add('is-collected');
        });
        
        window.dispatchEvent(new CustomEvent('syncCursorState'));
    }

    removeEvidence(type, id) {
        this.storage.remove(type, id);
        this.view.removeItemDOM(id);
        
        window.dispatchEvent(new CustomEvent('evidenceRemoved', { detail: { id } }));

        document.querySelectorAll(`[data-id="${id}"]`).forEach(el => {
            el.classList.remove('is-collected');
        });
        
        window.dispatchEvent(new CustomEvent('syncCursorState'));
    }
}