export class DragService {
    constructor(containerElement, handleElement) {
        this.container = containerElement;
        this.handle = handleElement;
        
        this.isDragging = false;
        this.hasMoved = false;
        this.isDocked = false;
        this.dockSide = null;
        
        this.onStateSaveRequest = null; // Коллбэк для сохранения в localStorage

        this._startX = 0;
        this._startY = 0;
        this._initialLeft = 0;
        this._initialTop = 0;

        this._initEvents();
    }

    _initEvents() {
        const startDrag = (e) => {
            if (e.target.closest('.fp-actions') || e.target.closest('.fp-controls') || e.target.closest('input')) return;
            this.isDragging = true;
            this.hasMoved = false;
            this.container.classList.add('is-dragging');
            
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            this._startX = clientX; this._startY = clientY;
            const rect = this.container.getBoundingClientRect();
            this._initialLeft = rect.left; this._initialTop = rect.top;
        };

        const doDrag = (e) => {
            if (!this.isDragging) return;
            const clientX = e.touches ? e.touches[0].clientX : e.clientX;
            const clientY = e.touches ? e.touches[0].clientY : e.clientY;
            
            if (Math.abs(clientX - this._startX) > 3 || Math.abs(clientY - this._startY) > 3) {
                this.hasMoved = true;
            }
            if (!this.hasMoved) return;

            e.preventDefault(); 
            let newLeft = this._initialLeft + (clientX - this._startX);
            let newTop = this._initialTop + (clientY - this._startY);
            const maxLeft = window.innerWidth - this.container.offsetWidth;
            const maxTop = window.innerHeight - this.container.offsetHeight;

            this.container.style.left = `${Math.max(-30, Math.min(newLeft, maxLeft + 30))}px`;
            this.container.style.top = `${Math.max(0, Math.min(newTop, maxTop))}px`;
            this.container.style.bottom = 'auto';
            this.container.style.right = 'auto';
        };

        const endDrag = () => {
            if (!this.isDragging) return;
            this.isDragging = false;
            this.container.classList.remove('is-dragging');

            if (!this.hasMoved) {
                if (this.isDocked) this.undock();
            } else {
                const rect = this.container.getBoundingClientRect();
                const threshold = 60; 

                if (rect.left <= threshold) this.dock('left', rect.top);
                else if (rect.right >= window.innerWidth - threshold) this.dock('right', rect.top);
                else if (this.isDocked) this.undock();
                else this.keepInBounds();
            }
            if (this.onStateSaveRequest) this.onStateSaveRequest();
        };

        this.handle.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', doDrag);
        document.addEventListener('mouseup', endDrag);

        this.handle.addEventListener('touchstart', startDrag, { passive: false });
        document.addEventListener('touchmove', doDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
        
        // Для свернутого режима
        this.container.addEventListener('mousedown', (e) => { if (this.isDocked) startDrag(e); });
        this.container.addEventListener('touchstart', (e) => { if (this.isDocked) startDrag(e); }, { passive: false });
    }

    dock(side, topPos) {
        this.isDocked = true;
        this.dockSide = side;
        this.container.classList.add('is-docked');
        this.container.classList.toggle('docked-left', side === 'left');
        this.container.classList.toggle('docked-right', side === 'right');
        
        this.container.style.bottom = 'auto';
        this.container.style.top = `${Math.max(20, topPos)}px`;
        if (side === 'left') {
            this.container.style.left = '-12px'; this.container.style.right = 'auto';
        } else {
            this.container.style.left = 'auto'; this.container.style.right = '-12px';
        }
    }

    undock() {
        this.isDocked = false;
        this.dockSide = null;
        this.container.classList.remove('is-docked', 'docked-left', 'docked-right');
        this.keepInBounds();
    }

    keepInBounds() {
        const rect = this.container.getBoundingClientRect();
        const expectedWidth = 380; 
        const maxLeft = window.innerWidth - expectedWidth - 20;
        const maxTop = window.innerHeight - this.container.offsetHeight - 20;

        let newLeft = this.container.style.left === 'auto' ? window.innerWidth - expectedWidth - 20 : rect.left;
        let newTop = rect.top;

        this.container.style.left = `${Math.max(20, Math.min(newLeft, maxLeft))}px`;
        this.container.style.top = `${Math.max(20, Math.min(newTop, maxTop))}px`;
        this.container.style.right = 'auto';
    }
}