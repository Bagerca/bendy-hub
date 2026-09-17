export class BoardModel {
    constructor() {
        this.storageKey = 'bendy_board_state';
        this.state = this._loadState() || this._getDefaultState();
    }

    _getDefaultState() {
        return {
            camera: { x: 0, y: 0, scale: 1 },
            nodes: [], 
            edges: [] 
        };
    }

    _loadState() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.warn('Board storage error:', e);
            return null;
        }
    }

    _saveState() {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
    }

    updateCamera(x, y, scale) {
        this.state.camera = { x, y, scale };
        this._saveState();
    }

    getCamera() { return this.state.camera; }
    getNodes() { return this.state.nodes; }

    addOrUpdateNode(id, x, y) {
        const existingNode = this.state.nodes.find(n => n.id === id);
        if (existingNode) {
            existingNode.x = x;
            existingNode.y = y;
        } else {
            this.state.nodes.push({ id, x, y });
        }
        this._saveState();
    }

    removeNode(id) {
        this.state.nodes = this.state.nodes.filter(n => n.id !== id);
        this.state.edges = this.state.edges.filter(e => e.from !== id && e.to !== id);
        this._saveState();
    }

    // --- СВЯЗИ (КРАСНЫЕ НИТИ) ---
    getEdges() {
        return this.state.edges;
    }

    addEdge(fromId, fromSide, toId, toSide) {
        if (fromId === toId) return null;

        const id = 'edge_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
        
        // По дефолту: красная, ПУНКТИРНАЯ (dashed), без анимации
        this.state.edges.push({ 
            id, from: fromId, fromSide, to: toId, toSide,
            color: '#ff4444', 
            style: 'dashed', 
            weight: 3, 
            animated: false
        });
        this._saveState();
        return id;
    }

    updateEdge(id, updates) {
        const edge = this.state.edges.find(e => e.id === id);
        if (edge) {
            Object.assign(edge, updates);
            this._saveState();
        }
        return edge;
    }

    removeEdge(id) {
        this.state.edges = this.state.edges.filter(e => e.id !== id);
        this._saveState();
    }
}