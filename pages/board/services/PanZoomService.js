export class PanZoomService {
    constructor(containerElement, viewportElement, onStateChange = null) {
        this.container = containerElement; 
        this.viewport = viewportElement;   
        
        this.onStateChange = onStateChange;

        this.x = 0;
        this.y = 0;
        this.scale = 1;

        this.minScale = 0.2;
        this.maxScale = 3;
        this.zoomSensitivity = 0.1;

        this.isPanning = false;
        this.startX = 0;
        this.startY = 0;
        this.startPanX = 0;
        this.startPanY = 0;

        this._handleMouseDown = this._handleMouseDown.bind(this);
        this._handleMouseMove = this._handleMouseMove.bind(this);
        this._handleMouseUp = this._handleMouseUp.bind(this);
        this._handleWheel = this._handleWheel.bind(this);

        this.init();
    }

    init() {
        this.container.addEventListener('mousedown', this._handleMouseDown);
        window.addEventListener('mousemove', this._handleMouseMove);
        window.addEventListener('mouseup', this._handleMouseUp);
        this.container.addEventListener('wheel', this._handleWheel, { passive: false });
        
        this._applyTransform();
    }

    destroy() {
        this.container.removeEventListener('mousedown', this._handleMouseDown);
        window.removeEventListener('mousemove', this._handleMouseMove);
        window.removeEventListener('mouseup', this._handleMouseUp);
        this.container.removeEventListener('wheel', this._handleWheel);
    }

    _handleMouseDown(e) {
        // Игнорируем клики по карточкам и UI
        if (e.target.closest('button') || e.target.closest('.post-card') || e.target.closest('.ndh-action')) {
            return;
        }

        if (e.button === 0 || e.button === 1) {
            e.preventDefault(); // Убиваем стандартное выделение браузера
            
            this.isPanning = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startPanX = this.x;
            this.startPanY = this.y;
            
            // Запрещаем выделение текста на всей странице!
            document.body.classList.add('is-board-interacting');
        }
    }

    _handleMouseMove(e) {
        if (!this.isPanning) return;

        const dx = e.clientX - this.startX;
        const dy = e.clientY - this.startY;

        this.x = this.startPanX + dx;
        this.y = this.startPanY + dy;

        this._applyTransform();
    }

    _handleMouseUp() {
        if (this.isPanning) {
            this.isPanning = false;
            document.body.classList.remove('is-board-interacting'); // Возвращаем выделение
            this._notifyStateChange();
        }
    }

    _handleWheel(e) {
        e.preventDefault(); 

        const direction = Math.sign(e.deltaY);
        const scaleMultiplier = 1 - (direction * this.zoomSensitivity);
        
        let newScale = this.scale * scaleMultiplier;
        newScale = Math.max(this.minScale, Math.min(this.maxScale, newScale));

        const rect = this.container.getBoundingClientRect();
        const cursorX = e.clientX - rect.left;
        const cursorY = e.clientY - rect.top;

        this.x = cursorX - (cursorX - this.x) * (newScale / this.scale);
        this.y = cursorY - (cursorY - this.y) * (newScale / this.scale);
        this.scale = newScale;

        this._applyTransform();
        this._notifyStateChange();
    }

    _applyTransform() {
        this.viewport.style.transform = `translate3d(${this.x}px, ${this.y}px, 0) scale(${this.scale})`;
        this.container.style.setProperty('--bg-pos-x', `${this.x}px`);
        this.container.style.setProperty('--bg-pos-y', `${this.y}px`);
        this.container.style.setProperty('--bg-scale', `${30 * this.scale}px`);
    }

    _notifyStateChange() {
        if (this.onStateChange) {
            this.onStateChange({ x: this.x, y: this.y, scale: this.scale });
        }
    }

    setState(x, y, scale) {
        this.x = x;
        this.y = y;
        this.scale = Math.max(this.minScale, Math.min(this.maxScale, scale));
        this._applyTransform();
    }

    resetCamera() {
        this.setState(0, 0, 1);
        this._notifyStateChange();
    }
}