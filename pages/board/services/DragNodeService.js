export class DragNodeService {
    constructor(nodesContainer, panZoomInstance, callbacks) {
        this.container = nodesContainer; 
        this.panZoom = panZoomInstance;
        this.onNodeMoved = callbacks.onNodeMoved;       
        this.onNodeDragging = callbacks.onNodeDragging; 

        this.activeNode = null;
        this.startMouseX = 0;
        this.startMouseY = 0;
        this.startNodeX = 0;
        this.startNodeY = 0;

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);

        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', this._handleMouseDown);
    }

    destroy() {
        this.container.removeEventListener('mousedown', this._handleMouseDown);
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
    }

    _handleMouseDown(e) {
        const handle = e.target.closest('.node-drag-handle');
        if (!handle || e.target.closest('.ndh-action')) return;

        e.stopPropagation();
        e.preventDefault(); // Убиваем выделение

        this.activeNode = handle.closest('.board-node');
        if (!this.activeNode) return;

        this.activeNode.classList.add('is-dragging');
        this.container.appendChild(this.activeNode);

        // Запрещаем выделение текста глобально
        document.body.classList.add('is-board-interacting');

        this.startMouseX = e.clientX;
        this.startMouseY = e.clientY;
        
        this.startNodeX = parseFloat(this.activeNode.style.left || 0);
        this.startNodeY = parseFloat(this.activeNode.style.top || 0);

        document.addEventListener('mousemove', this._handleMouseMove);
        document.addEventListener('mouseup', this._handleMouseUp);
    }

    _handleMouseMove(e) {
        if (!this.activeNode) return;

        const dx = (e.clientX - this.startMouseX) / this.panZoom.scale;
        const dy = (e.clientY - this.startMouseY) / this.panZoom.scale;

        const newX = this.startNodeX + dx;
        const newY = this.startNodeY + dy;

        this.activeNode.style.left = `${newX}px`;
        this.activeNode.style.top = `${newY}px`;

        if (this.onNodeDragging) {
            this.onNodeDragging(this.activeNode.dataset.nodeId);
        }
    }

    _handleMouseUp() {
        if (!this.activeNode) return;

        this.activeNode.classList.remove('is-dragging');
        document.body.classList.remove('is-board-interacting'); // Возвращаем выделение
        
        const finalX = parseFloat(this.activeNode.style.left);
        const finalY = parseFloat(this.activeNode.style.top);
        const nodeId = this.activeNode.dataset.nodeId;

        if (this.onNodeMoved) {
            this.onNodeMoved(nodeId, finalX, finalY);
        }

        this.activeNode = null;
        document.removeEventListener('mousemove', this._handleMouseMove);
        document.removeEventListener('mouseup', this._handleMouseUp);
    }
}