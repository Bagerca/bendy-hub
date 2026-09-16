export class BoardContextMenu {
    constructor() {
        this.element = null;
    }

    show(edgeId, clientX, clientY, currentEdgeData, callbacks) {
        this.close(); 

        this.element = document.createElement('div');
        this.element.className = 'edge-context-menu';
        
        const colors = ['#ff4444', '#3b82f6', '#10b981', '#D2A850', '#ffffff', '#8B949E'];
        
        this.element.innerHTML = `
            <button class="ecm-btn ecm-delete">Удалить нить</button>
            <div class="ecm-divider"></div>
            <div class="ecm-label">Цвет линии:</div>
            <div class="ecm-colors">
                ${colors.map(c => `
                    <div class="ecm-color ${currentEdgeData.color === c ? 'active' : ''}" 
                         data-color="${c}" style="background-color: ${c};"></div>
                `).join('')}
            </div>
            <div class="ecm-divider"></div>
            <div class="ecm-label">Тип линии:</div>
            <button class="ecm-btn ecm-style ${currentEdgeData.style === 'dashed' ? 'active' : ''}" data-style="dashed">Прерывистая</button>
            <button class="ecm-btn ecm-style ${currentEdgeData.style === 'solid' ? 'active' : ''}" data-style="solid">Сплошная</button>
        `;

        document.body.appendChild(this.element);

        const rect = this.element.getBoundingClientRect();
        let x = clientX;
        let y = clientY;
        
        if (x + rect.width > window.innerWidth) x -= rect.width;
        if (y + rect.height > window.innerHeight) y -= rect.height;

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.opacity = '1';
        this.element.style.transform = 'scale(1)';

        this.element.querySelector('.ecm-delete').addEventListener('click', () => {
            callbacks.onDelete(edgeId);
        });

        this.element.querySelectorAll('.ecm-color').forEach(btn => {
            btn.addEventListener('click', (e) => {
                callbacks.onChangeColor(edgeId, e.target.dataset.color);
                this.element.querySelectorAll('.ecm-color').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        this.element.querySelectorAll('.ecm-style').forEach(btn => {
            btn.addEventListener('click', (e) => {
                callbacks.onChangeStyle(edgeId, e.target.dataset.style);
                this.element.querySelectorAll('.ecm-style').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }

    close() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }

    contains(target) {
        return this.element && this.element.contains(target);
    }
}