import { Icons } from '../../shared/js/icons.js';

export class BoardContextMenu {
    constructor() {
        this.element = null;
    }

    show(edgeId, clientX, clientY, currentEdgeData, callbacks) {
        this.close(); 

        this.element = document.createElement('div');
        this.element.className = 'edge-context-menu';
        
        // Оставили 5 базовых цветов. Серый убрали.
        const colors = ['#ff4444', '#3b82f6', '#10b981', '#D2A850', '#ffffff'];
        
        const w = currentEdgeData.weight || 3;
        const s = currentEdgeData.style || 'dashed';
        let anim = currentEdgeData.animated || false;

        // Принудительно отключаем анимацию в UI, если линия сплошная
        if (s === 'solid') anim = false;
        
        // Проверяем, кастомный ли цвет сейчас у нити (которого нет в массиве colors)
        const isCustomColor = !colors.includes(currentEdgeData.color);
        const pickerColor = isCustomColor ? currentEdgeData.color : '#bd93f9'; // Дефолт для пикера, если выбран базовый
        
        this.element.innerHTML = `
            <div class="ecm-section-horizontal">
                <div class="ecm-colors">
                    ${colors.map(c => `
                        <div class="ecm-color ${currentEdgeData.color === c && !isCustomColor ? 'active' : ''}" 
                             data-color="${c}" style="background-color: ${c}; color: ${c};"></div>
                    `).join('')}
                    
                    <div class="ecm-color-picker-wrapper ${isCustomColor ? 'active' : ''}" style="color: ${pickerColor};">
                        <input type="color" class="ecm-color-input" value="${pickerColor}">
                        <div class="ecm-color-icon">${Icons.color_picker || '🎨'}</div>
                    </div>
                </div>
                <div class="ecm-v-divider"></div>
                <div class="ecm-segmented is-small">
                    <button class="ecm-seg-btn ecm-weight ${w == 2 ? 'active' : ''}" data-weight="2" title="Тонкая"><div class="ecm-dot sm"></div></button>
                    <button class="ecm-seg-btn ecm-weight ${w == 3 ? 'active' : ''}" data-weight="3" title="Средняя"><div class="ecm-dot md"></div></button>
                    <button class="ecm-seg-btn ecm-weight ${w == 5 ? 'active' : ''}" data-weight="5" title="Жирная"><div class="ecm-dot lg"></div></button>
                </div>
            </div>

            <div class="ecm-divider"></div>

            <div class="ecm-segmented">
                <button class="ecm-seg-btn ecm-style ${s === 'solid' ? 'active' : ''}" data-style="solid" title="Сплошная">${Icons.edge_solid || '▬'}</button>
                <button class="ecm-seg-btn ecm-style ${s === 'dashed' ? 'active' : ''}" data-style="dashed" title="Пунктир">${Icons.edge_dashed || '┈'}</button>
                <button class="ecm-seg-btn ecm-style ${s === 'dotted' ? 'active' : ''}" data-style="dotted" title="Точки">${Icons.edge_dotted || '···'}</button>
                <button class="ecm-seg-btn ecm-style ${s === 'dashdot' ? 'active' : ''}" data-style="dashdot" title="Пунктир-точка">${Icons.edge_dashdot || '-·-'}</button>
            </div>

            <div class="ecm-divider"></div>

            <label class="ecm-switch-row ${s === 'solid' ? 'disabled' : ''}" id="ecm-anim-row">
                <div class="ecm-switch-label">
                    ${Icons.effect_flow || '≈'} Анимировать поток
                </div>
                <input type="checkbox" class="ecm-switch" id="ecm-anim-toggle" ${anim ? 'checked' : ''} ${s === 'solid' ? 'disabled' : ''}>
                <div class="ecm-switch-ui"></div>
            </label>

            <div class="ecm-divider"></div>

            <button class="ecm-btn ecm-delete">
                ${Icons.inv_trash || '🗑️'} Удалить нить
            </button>
        `;

        document.body.appendChild(this.element);

        const rect = this.element.getBoundingClientRect();
        let x = clientX;
        let y = clientY;
        
        if (x + rect.width > window.innerWidth) x -= rect.width;
        if (y + rect.height > window.innerHeight) y -= rect.height;

        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        
        void this.element.offsetWidth;
        this.element.classList.add('active');

        // BINDINGS
        this.element.querySelector('.ecm-delete').addEventListener('click', () => {
            callbacks.onDelete(edgeId);
        });

        // Палитра базовых цветов
        const colorBtns = this.element.querySelectorAll('.ecm-color');
        const colorPickerWrapper = this.element.querySelector('.ecm-color-picker-wrapper');
        const colorInput = this.element.querySelector('.ecm-color-input');

        colorBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                callbacks.onChangeEdge(edgeId, { color: e.target.dataset.color });
                colorBtns.forEach(b => b.classList.remove('active'));
                colorPickerWrapper.classList.remove('active');
                btn.classList.add('active');
            });
        });

        // Нативный Color Picker
        colorInput.addEventListener('input', (e) => {
            const hex = e.target.value;
            callbacks.onChangeEdge(edgeId, { color: hex });
            colorBtns.forEach(b => b.classList.remove('active'));
            colorPickerWrapper.classList.add('active');
            colorPickerWrapper.style.color = hex; 
        });

        // Толщина
        this.element.querySelectorAll('.ecm-weight').forEach(btn => {
            btn.addEventListener('click', (e) => {
                callbacks.onChangeEdge(edgeId, { weight: parseInt(e.currentTarget.dataset.weight) });
                this.element.querySelectorAll('.ecm-weight').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        // Логика стилей и блокировки анимации
        const animRow = this.element.querySelector('#ecm-anim-row');
        const animToggle = this.element.querySelector('#ecm-anim-toggle');

        this.element.querySelectorAll('.ecm-style').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newStyle = e.currentTarget.dataset.style;
                
                // Если выбрали сплошную, выключаем анимацию
                if (newStyle === 'solid') {
                    animRow.classList.add('disabled');
                    animToggle.disabled = true;
                    animToggle.checked = false;
                    callbacks.onChangeEdge(edgeId, { style: newStyle, animated: false });
                } else {
                    animRow.classList.remove('disabled');
                    animToggle.disabled = false;
                    callbacks.onChangeEdge(edgeId, { style: newStyle });
                }

                this.element.querySelectorAll('.ecm-style').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });

        animToggle.addEventListener('change', (e) => {
            callbacks.onChangeEdge(edgeId, { animated: e.target.checked });
        });
    }

    close() {
        if (this.element) {
            this.element.classList.remove('active');
            const el = this.element;
            this.element = null;
            setTimeout(() => el.remove(), 200); 
        }
    }

    contains(target) {
        return this.element && this.element.contains(target);
    }
}