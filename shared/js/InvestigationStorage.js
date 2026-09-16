export class InvestigationStorage {
    constructor(storageKey = 'bendy_investigation_board') {
        this.storageKey = storageKey;
        this.evidenceList = this._loadData();
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

    saveData() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.evidenceList));
    }

    getAll() {
        return this.evidenceList;
    }

    exists(type, id) {
        return this.evidenceList.some(item => item.type === type && item.id === id);
    }

    add(newEvidence) {
        this.evidenceList.unshift(newEvidence);
        this.saveData();
    }

    remove(type, id) {
        this.evidenceList = this.evidenceList.filter(item => !(item.type === type && item.id === id));
        this.saveData();
    }
}