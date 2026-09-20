export class EdgeService {
    constructor(svgContainer, nodesContainer, panZoom, callbacks) {
        this.svg = svgContainer;
        this.nodesContainer = nodesContainer;
        this.panZoom = panZoom;
        this.callbacks = callbacks; 

        this.isDrawing = false;
        this.tempPath = null;
        this.startNodeId = null;
        this.startSide = null;
        this.startCoords = null;

        this.currentMouseX = 0;
        this.currentMouseY = 0;

        this.drawnEdges = new Map();  
        this.edgeDataMap = new Map(); 

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleContextMenu = this._handleContextMenu.bind(this);
        this._renderLoop = this._renderLoop.bind(this);

        this.init();
    }

    init() {
        this.nodesContainer.addEventListener('mousedown', this._handleMouseDown);
        this.svg.addEventListener('contextmenu', this._handleContextMenu);
        
        this.isRendering = true;
        requestAnimationFrame(this._renderLoop);
    }

    destroy() {
        this.isRendering = false;
        this.nodesContainer.removeEventListener('mousedown', this._handleMouseDown);
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
        this.svg.removeEventListener('contextmenu', this._handleContextMenu);
    }

    _renderLoop() {
        if (!this.isRendering) return;

        if (this.isDrawing && this.tempPath && this.startCoords) {
            const worldX = (this.currentMouseX - this.panZoom.x) / this.panZoom.scale;
            const worldY = (this.currentMouseY - this.panZoom.y) / this.panZoom.scale;
            
            const pathData = this._calculateCubicBezier(
                this.startCoords.x, this.startCoords.y, this.startSide, 
                worldX, worldY, this._getOppositeSide(this.startSide)
            );
            this.tempPath.setAttribute('d', pathData);
        }

        this.drawnEdges.forEach((groupEl, edgeId) => {
            const edge = this.edgeDataMap.get(edgeId);
            if (edge) {
                const coords = this._getEdgeCoords(edge);
                if (coords) {
                    const newD = this._calculateCubicBezier(coords.x1, coords.y1, edge.fromSide, coords.x2, coords.y2, edge.toSide);
                    
                    if (groupEl.__lastD !== newD) {
                        const hitbox = groupEl.querySelector('.board-edge-hitbox');
                        const path = groupEl.querySelector('.board-edge-path');
                        if (hitbox) hitbox.setAttribute('d', newD);
                        if (path) path.setAttribute('d', newD);
                        groupEl.__lastD = newD;
                    }
                }
            }
        });

        requestAnimationFrame(this._renderLoop);
    }

    _handleMouseDown(e) {
        if (e.button !== 0) return; 

        const pinEl = e.target.closest('.node-pin');
        if (!pinEl) return;

        e.stopPropagation(); 
        e.preventDefault(); 

        this.isDrawing = true;
        
        const nodeEl = pinEl.closest('.board-node');
        this.startNodeId = nodeEl.dataset.nodeId;
        this.startSide = pinEl.dataset.side;
        this.startCoords = this._getSpecificPinCoords(pinEl);

        const rect = this.panZoom.container.getBoundingClientRect();
        this.currentMouseX = e.clientX - rect.left;
        this.currentMouseY = e.clientY - rect.top;

        document.body.classList.add('is-board-interacting');

        this.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        // Анимация притягивания (пунктир бежит к мышке)
        this.tempPath.setAttribute('class', 'board-edge-path temp');
        this.svg.appendChild(this.tempPath);

        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
    }

    _handleMouseMove(e) {
        if (!this.isDrawing) return;
        const rect = this.panZoom.container.getBoundingClientRect();
        this.currentMouseX = e.clientX - rect.left;
        this.currentMouseY = e.clientY - rect.top;
    }

    _handleMouseUp(e) {
        if (!this.isDrawing) return;

        this.isDrawing = false;
        document.body.classList.remove('is-board-interacting');

        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);

        if (this.tempPath) {
            this.tempPath.remove();
            this.tempPath = null;
        }

        const pinOrZone = e.target.closest('.node-pin, .pin-zone');
        if (pinOrZone) {
            const targetNode = pinOrZone.closest('.board-node');
            const endNodeId = targetNode.dataset.nodeId;
            const endSide = pinOrZone.dataset.side;
            
            if (endNodeId && endNodeId !== this.startNodeId) {
                if (this.callbacks.onEdgeCreated) {
                    this.callbacks.onEdgeCreated(this.startNodeId, this.startSide, endNodeId, endSide);
                }
            }
        }

        this.startNodeId = null;
        this.startSide = null;
    }

    _handleContextMenu(e) {
        const group = e.target.closest('.board-edge-group');
        if (group) {
            e.preventDefault();
            e.stopPropagation();
            const edgeId = group.getAttribute('data-edge-id');
            if (this.callbacks.onEdgeContextMenu) {
                this.callbacks.onEdgeContextMenu(edgeId, e.clientX, e.clientY);
            }
        }
    }

    renderAllEdges(edgesList) {
        this.svg.innerHTML = '';
        this.drawnEdges.clear();
        this.edgeDataMap.clear();

        edgesList.forEach(edge => {
            this.edgeDataMap.set(edge.id, edge);
            this._drawFinalEdge(edge);
        });
    }

    addAndDrawEdge(edge) {
        this.edgeDataMap.set(edge.id, edge);
        this._drawFinalEdge(edge);
    }

    updateEdgeStyle(edge) {
        this.edgeDataMap.set(edge.id, edge);
        const groupEl = this.drawnEdges.get(edge.id);
        if (groupEl) {
            const pathEl = groupEl.querySelector('.board-edge-path');
            if (pathEl) this._applyStylesToPath(pathEl, edge);
        }
    }

    removeEdgeDOM(edgeId) {
        const groupEl = this.drawnEdges.get(edgeId);
        if (groupEl) {
            groupEl.remove();
            this.drawnEdges.delete(edgeId);
            this.edgeDataMap.delete(edgeId);
        }
    }

    cleanupDeadEdges(validEdgesList) {
        const validIds = new Set(validEdgesList.map(e => e.id));
        for (const [edgeId, groupEl] of this.drawnEdges.entries()) {
            if (!validIds.has(edgeId)) {
                groupEl.remove();
                this.drawnEdges.delete(edgeId);
                this.edgeDataMap.delete(edgeId);
            }
        }
    }

    _applyStylesToPath(pathEl, edge) {
        // Цвет и толщина
        pathEl.style.setProperty('--edge-color', edge.color || '#ff4444');
        pathEl.style.strokeWidth = `${edge.weight || 3}px`;
        
        // Установка стилей пунктиров (Математически синхронизировано для бесшовной анимации)
        if (edge.style === 'dashed') {
            pathEl.style.setProperty('--edge-style', '12 12'); // Сумма 24
            pathEl.style.strokeLinecap = 'butt';
        } else if (edge.style === 'dotted') {
            pathEl.style.setProperty('--edge-style', '0 12'); // Сумма 12
            pathEl.style.strokeLinecap = 'round'; // Круглые точки
        } else if (edge.style === 'dashdot') {
            pathEl.style.setProperty('--edge-style', '12 8 0 10'); // Сумма 30
            pathEl.style.strokeLinecap = 'round';
        } else {
            // solid
            pathEl.style.setProperty('--edge-style', 'none');
            pathEl.style.strokeLinecap = 'butt';
        }

        // Анимация (если не solid)
        if (edge.animated && edge.style !== 'solid') {
            pathEl.classList.add('is-animated');
        } else {
            pathEl.classList.remove('is-animated');
        }
        
        // Очищаем хвосты от прошлых стрелок
        pathEl.removeAttribute('marker-end');
        pathEl.removeAttribute('marker-start');
    }

    _drawFinalEdge(edge) {
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        group.setAttribute('class', 'board-edge-group');
        group.setAttribute('data-edge-id', edge.id);

        const hitbox = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        hitbox.setAttribute('class', 'board-edge-hitbox');

        const pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        pathEl.setAttribute('class', 'board-edge-path');
        this._applyStylesToPath(pathEl, edge);

        const title = document.createElementNS('http://www.w3.org/2000/svg', 'title');
        title.textContent = 'ПКМ для настройки';
        group.appendChild(title);

        group.appendChild(hitbox);
        group.appendChild(pathEl);

        this.svg.appendChild(group);
        this.drawnEdges.set(edge.id, group);
    }

    redrawEdgesForNode(nodeId, allEdgesList) {
        const connectedEdges = allEdgesList.filter(e => e.from === nodeId || e.to === nodeId);
        connectedEdges.forEach(edge => {
            const groupEl = this.drawnEdges.get(edge.id);
            if (groupEl) {
                const coords = this._getEdgeCoords(edge);
                if (coords) {
                    const newD = this._calculateCubicBezier(coords.x1, coords.y1, edge.fromSide, coords.x2, coords.y2, edge.toSide);
                    const hitbox = groupEl.querySelector('.board-edge-hitbox');
                    const path = groupEl.querySelector('.board-edge-path');
                    if (hitbox) hitbox.setAttribute('d', newD);
                    if (path) path.setAttribute('d', newD);
                    groupEl.__lastD = newD;
                }
            }
        });
    }

    _getEdgeCoords(edge) {
        let pinFrom = this.nodesContainer.querySelector(`.board-node[data-node-id="${edge.from}"] .node-pin[data-edge-id="${edge.id}"]`);
        let pinTo = this.nodesContainer.querySelector(`.board-node[data-node-id="${edge.to}"] .node-pin[data-edge-id="${edge.id}"]`);

        if (!pinFrom) pinFrom = this.nodesContainer.querySelector(`.board-node[data-node-id="${edge.from}"] .pin-zone.${edge.fromSide}`);
        if (!pinTo) pinTo = this.nodesContainer.querySelector(`.board-node[data-node-id="${edge.to}"] .pin-zone.${edge.toSide}`);

        if (!pinFrom || !pinTo) return null;

        const fromCoords = this._getSpecificPinCoords(pinFrom);
        const toCoords = this._getSpecificPinCoords(pinTo);

        return { x1: fromCoords.x, y1: fromCoords.y, x2: toCoords.x, y2: toCoords.y };
    }

    _getSpecificPinCoords(element) {
        const rect = element.getBoundingClientRect();
        const boardRect = this.panZoom.container.getBoundingClientRect();
        const screenX = rect.left + (rect.width / 2);
        const screenY = rect.top + (rect.height / 2);
        const worldX = (screenX - boardRect.left - this.panZoom.x) / this.panZoom.scale;
        const worldY = (screenY - boardRect.top - this.panZoom.y) / this.panZoom.scale;
        return { x: worldX, y: worldY };
    }

    _calculateCubicBezier(x1, y1, side1, x2, y2, side2) {
        const getControlPoint = (x, y, side, dist) => {
            switch(side) {
                case 'top': return { x, y: y - dist };
                case 'bottom': return { x, y: y + dist };
                case 'left': return { x: x - dist, y };
                case 'right': return { x: x + dist, y };
                default: return { x, y };
            }
        };

        const dist = Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1)) * 0.4;
        const cpDist = Math.max(dist, 40); 

        const cp1 = getControlPoint(x1, y1, side1, cpDist);
        const cp2 = getControlPoint(x2, y2, side2, cpDist);

        return `M ${x1} ${y1} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${x2} ${y2}`;
    }

    _getOppositeSide(side) {
        switch(side) {
            case 'top': return 'bottom';
            case 'bottom': return 'top';
            case 'left': return 'right';
            case 'right': return 'left';
            default: return 'right';
        }
    }
}