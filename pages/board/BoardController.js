import { PanZoomService } from './services/PanZoomService.js';
import { DragNodeService } from './services/DragNodeService.js';
import { EdgeService } from './services/EdgeService.js'; 

export class BoardController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
        this.panZoom = null;
        this.dragNodeService = null;
        this.edgeService = null; 
        
        this.hoverAnimFrames = {};
        
        this._handleEvidenceRemoved = this._handleEvidenceRemoved.bind(this);
    }

    async init() {
        this.panZoom = new PanZoomService(
            this.view.els.container, 
            this.view.els.viewport,
            (state) => {
                this.model.updateCamera(state.x, state.y, state.scale);
                this.view.updateZoomText(state.scale);
                this.view.closeEdgeContextMenu(); // Закрываем меню при скролле
            }
        );

        const savedCamera = this.model.getCamera();
        this.panZoom.setState(savedCamera.x, savedCamera.y, savedCamera.scale);
        this.view.updateZoomText(savedCamera.scale);

        this.dragNodeService = new DragNodeService(
            this.view.els.nodesContainer,
            this.panZoom,
            {
                onNodeMoved: (id, x, y) => {
                    this.model.addOrUpdateNode(id, x, y);
                    this._animateEdgeRedraw(id);
                }
            }
        );

        this.edgeService = new EdgeService(
            this.view.els.edgesContainer,
            this.view.els.nodesContainer,
            this.panZoom,
            {
                onEdgeCreated: (fromId, fromSide, toId, toSide) => {
                    const newEdgeId = this.model.addEdge(fromId, fromSide, toId, toSide);
                    if (newEdgeId) {
                        this.view.updateNodePins(fromId, this.model.getEdges());
                        this.view.updateNodePins(toId, this.model.getEdges());
                        
                        this._animateEdgeRedraw(fromId);
                        this._animateEdgeRedraw(toId);
                        
                        requestAnimationFrame(() => {
                            const newEdge = this.model.getEdges().find(e => e.id === newEdgeId);
                            this.edgeService.addAndDrawEdge(newEdge);
                        });
                    }
                },
                // Вызов контекстного меню
                onEdgeContextMenu: (edgeId, clientX, clientY) => {
                    const edgeData = this.model.getEdges().find(e => e.id === edgeId);
                    if (!edgeData) return;
                    
                    this.view.showEdgeContextMenu(edgeId, clientX, clientY, edgeData, {
                        onDelete: (id) => this._removeEdgeById(id),
                        onChangeColor: (id, color) => {
                            const updated = this.model.updateEdge(id, { color });
                            this.edgeService.updateEdgeStyle(updated);
                            // Немедленно обновляем цвета пинов на обеих карточках
                            this.view.updateNodePins(updated.from, this.model.getEdges());
                            this.view.updateNodePins(updated.to, this.model.getEdges());
                        },
                        onChangeStyle: (id, style) => {
                            const updated = this.model.updateEdge(id, { style });
                            this.edgeService.updateEdgeStyle(updated);
                        }
                    });
                }
            }
        );

        this._restoreNodesAndEdges();
        this._initZoomControls();
        this._initDropZone();

        window.addEventListener('evidenceRemoved', this._handleEvidenceRemoved);

        if (window.globalInvestigation) {
            window.globalInvestigation.open();
        }
    }

    _removeEdgeById(edgeId) {
        const edge = this.model.getEdges().find(e => e.id === edgeId);
        if (!edge) return;

        this.model.removeEdge(edgeId);
        this.edgeService.removeEdgeDOM(edgeId);
        this.view.closeEdgeContextMenu();
        
        this.view.updateNodePins(edge.from, this.model.getEdges());
        this.view.updateNodePins(edge.to, this.model.getEdges());

        this._animateEdgeRedraw(edge.from);
        this._animateEdgeRedraw(edge.to);
    }

    _removeNodeById(id) {
        this.model.removeNode(id);
        this.view.removeNodeDOM(id);
        
        const remainingEdges = this.model.getEdges();
        this.edgeService.cleanupDeadEdges(remainingEdges);
        this.view.closeEdgeContextMenu();
        
        this.model.getNodes().forEach(n => {
            this.view.updateNodePins(n.id, remainingEdges);
            this._animateEdgeRedraw(n.id);
        });
        
        requestAnimationFrame(() => {
            this.edgeService.renderAllEdges(remainingEdges);
        });
    }

    _animateEdgeRedraw(nodeId) {
        if (!this.edgeService) return;
        
        if (this.hoverAnimFrames[nodeId]) {
            cancelAnimationFrame(this.hoverAnimFrames[nodeId]);
        }

        const start = Date.now();
        const duration = 400; 
        
        const step = () => {
            this.edgeService.redrawEdgesForNode(nodeId, this.model.getEdges());
            if (Date.now() - start < duration) { 
                this.hoverAnimFrames[nodeId] = requestAnimationFrame(step);
            } else {
                this.edgeService.redrawEdgesForNode(nodeId, this.model.getEdges());
                delete this.hoverAnimFrames[nodeId];
            }
        };
        
        this.hoverAnimFrames[nodeId] = requestAnimationFrame(step);
    }

    _restoreNodesAndEdges() {
        const nodes = this.model.getNodes();
        if (!window.globalInvestigation) return;

        const inventory = window.globalInvestigation.evidenceList;

        nodes.forEach(node => {
            const evidence = inventory.find(e => e.id === node.id);
            if (evidence && evidence.htmlSnapshot) {
                this.view.createNodeDOM(node.id, node.x, node.y, evidence.htmlSnapshot, evidence.data, {
                    onCloseClick: (id) => this._removeNodeById(id),
                    onHoverStateChange: (id) => this._animateEdgeRedraw(id)
                });
            } else {
                this.model.removeNode(node.id);
            }
        });

        requestAnimationFrame(() => {
            nodes.forEach(node => this.view.updateNodePins(node.id, this.model.getEdges()));
            requestAnimationFrame(() => {
                this.edgeService.renderAllEdges(this.model.getEdges());
            });
        });
    }

    _initDropZone() {
        const container = this.view.els.container;

        container.addEventListener('dragover', (e) => {
            e.preventDefault(); 
            e.dataTransfer.dropEffect = 'copy';
        });

        container.addEventListener('drop', (e) => {
            e.preventDefault();
            try {
                const data = JSON.parse(e.dataTransfer.getData('application/json'));
                if (data.source !== 'inventory') return;

                const evidenceId = data.id;
                if (this.model.getNodes().some(n => n.id === evidenceId)) return;

                const inventoryItem = window.globalInvestigation.evidenceList.find(ev => ev.id === evidenceId);
                if (!inventoryItem) return;

                const rect = container.getBoundingClientRect();
                const clientX = e.clientX - rect.left;
                const clientY = e.clientY - rect.top;

                const worldX = (clientX - this.panZoom.x) / this.panZoom.scale;
                const worldY = (clientY - this.panZoom.y) / this.panZoom.scale;

                this.model.addOrUpdateNode(evidenceId, worldX, worldY);

                this.view.createNodeDOM(evidenceId, worldX, worldY, inventoryItem.htmlSnapshot, inventoryItem.data, {
                    onCloseClick: (id) => this._removeNodeById(id),
                    onHoverStateChange: (id) => this._animateEdgeRedraw(id)
                });
                
                this.view.updateNodePins(evidenceId, this.model.getEdges());

            } catch (err) {
                console.warn('Невалидные данные при Drag&Drop', err);
            }
        });
    }

    _initZoomControls() {
        this.view.els.btnZoomIn.addEventListener('click', () => {
            const currentScale = this.model.getCamera().scale;
            const rect = this.view.els.container.getBoundingClientRect();
            this._zoomFromCenter(currentScale + 0.2, rect);
        });

        this.view.els.btnZoomOut.addEventListener('click', () => {
            const currentScale = this.model.getCamera().scale;
            const rect = this.view.els.container.getBoundingClientRect();
            this._zoomFromCenter(currentScale - 0.2, rect);
        });

        this.view.els.btnZoomReset.addEventListener('click', () => {
            this.panZoom.resetCamera();
            this.model.updateCamera(0, 0, 1);
            this.view.updateZoomText(1);
        });
    }

    _zoomFromCenter(targetScale, containerRect) {
        targetScale = Math.max(this.panZoom.minScale, Math.min(this.panZoom.maxScale, targetScale));
        const centerX = containerRect.width / 2;
        const centerY = containerRect.height / 2;
        const currentScale = this.panZoom.scale;
        
        const x = centerX - (centerX - this.panZoom.x) * (targetScale / currentScale);
        const y = centerY - (centerY - this.panZoom.y) * (targetScale / currentScale);

        this.panZoom.setState(x, y, targetScale);
        this.model.updateCamera(x, y, targetScale);
        this.view.updateZoomText(targetScale);
    }

    _handleEvidenceRemoved(e) {
        this._removeNodeById(e.detail.id);
    }

    destroy() {
        if (this.panZoom) this.panZoom.destroy();
        if (this.dragNodeService) this.dragNodeService.destroy();
        if (this.edgeService) this.edgeService.destroy();
        
        window.removeEventListener('evidenceRemoved', this._handleEvidenceRemoved);
        Object.keys(this.hoverAnimFrames).forEach(key => cancelAnimationFrame(this.hoverAnimFrames[key]));
        
        if (window.globalInvestigation && window.globalInvestigation.isOpen) {
            window.globalInvestigation.close();
        }
    }
}