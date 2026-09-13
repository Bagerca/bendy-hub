import { Icons } from '../icons.js';

export class CustomSelect {
    static instances = [];

    constructor(containerId, config) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        if (typeof config === 'function') {
            this.onChange = config;
            this.isMultiple = false;
            this.placeholder = '';
            this.keepPlaceholder = false;
            this.triggerIcon = null;
        } else {
            this.onChange = config.onChange || null;
            this.isMultiple = config.multiple || false;
            this.placeholder = config.placeholder || '';
            this.keepPlaceholder = config.keepPlaceholder || false;
            this.triggerIcon = config.triggerIcon || null;
        }

        if (!this.container.querySelector('.custom-select-trigger')) {
            this.container.innerHTML = `
                <button class="custom-select-trigger" aria-haspopup="listbox" aria-expanded="false">
                    <div class="custom-select-value">
                        <div class="custom-select-icon svg-icon"></div>
                        <span class="custom-select-text-value"></span>
                    </div>
                    <svg class="chevron-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <ul class="custom-select-dropdown" role="listbox"></ul>
            `;
        }

        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.iconContainer = this.container.querySelector('.custom-select-icon');
        this.textContainer = this.container.querySelector('.custom-select-text-value');
        
        this.isOpen = false;
        this.selectedValues = new Set();
        this.optionsData = []; 

        this.trigger.setAttribute('tabindex', '0');

        CustomSelect.instances.push(this);

        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) this.close();
        });
    }

    toggle() {
        if (!this.isOpen) {
            CustomSelect.instances.forEach(instance => {
                if (instance !== this && instance.isOpen) instance.close();
            });
        }
        this.isOpen = !this.isOpen;
        this.container.classList.toggle('active', this.isOpen);
        this.trigger.setAttribute('aria-expanded', this.isOpen);
    }

    close() {
        this.isOpen = false;
        this.container.classList.remove('active');
        this.trigger.setAttribute('aria-expanded', 'false');
    }

    populate(options, defaultIds) {
        this.dropdown.innerHTML = '';
        this.optionsData = options;
        this.selectedValues.clear();

        let activeIds = [];
        if (Array.isArray(defaultIds)) {
            activeIds = defaultIds;
        } else if (defaultIds) {
            activeIds = [defaultIds];
        }

        activeIds.forEach(id => this.selectedValues.add(id));

        // Панель быстрых действий (Мультиселект)
        if (this.isMultiple) {
            const actionBar = document.createElement('div');
            actionBar.className = 'cs-action-bar';
            actionBar.innerHTML = `
                <button class="cs-action-btn" data-action="all">Выбрать всё</button>
                <button class="cs-action-btn" data-action="none">Сбросить</button>
            `;
            this.dropdown.appendChild(actionBar);

            actionBar.addEventListener('click', (e) => {
                e.stopPropagation();
                if (e.target.dataset.action === 'all') {
                    // УМНОЕ ВЫДЕЛЕНИЕ: Добавляем только чекбоксы, не трогая dual-toggle
                    this.optionsData.forEach(o => {
                        if (o.type !== 'dual-toggle') this.selectedValues.add(o.id);
                    });
                } else if (e.target.dataset.action === 'none') {
                    // УМНЫЙ СБРОС: Удаляем только чекбоксы, сохраняя состояния сортировки (dual-toggle)
                    this.optionsData.forEach(o => {
                        if (o.type !== 'dual-toggle') this.selectedValues.delete(o.id);
                    });
                }
                this._updateListUI();
                this._updateTriggerUI();
                if (this.onChange) this.onChange(Array.from(this.selectedValues));
            });
        }

        options.forEach(opt => {
            const li = document.createElement('li');
            li.className = 'custom-select-option';
            li.dataset.id = opt.id;
            
            if (opt.type !== 'dual-toggle' && this.selectedValues.has(opt.id)) {
                li.classList.add('selected');
            }

            if (opt.type === 'dual-toggle') {
                li.classList.add('is-dual-toggle');
                
                const isActiveState2 = this.selectedValues.has(opt.state2.id);
                const currentStateClass = isActiveState2 ? 'state-2' : 'state-1';
                
                // Добавлен стиль padding-bottom для визуального отступа от чекбоксов
                li.innerHTML = `
                    <div class="cs-dual-switch ${currentStateClass}" style="margin-bottom: 0.5rem;">
                        <div class="cs-dual-indicator"></div>
                        <div class="cs-dual-btn ${!isActiveState2 ? 'active' : ''}" data-target="${opt.state1.id}">
                            ${opt.state1.iconHtml} <span>${opt.state1.label}</span>
                        </div>
                        <div class="cs-dual-btn ${isActiveState2 ? 'active' : ''}" data-target="${opt.state2.id}">
                            ${opt.state2.iconHtml} <span>${opt.state2.label}</span>
                        </div>
                    </div>
                `;

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this._handleSelection(opt, li);
                });
                
            } else {
                let extraUI = '';
                if (this.isMultiple) {
                    extraUI = `
                        <div class="cs-checkbox">
                            <div class="cs-icon-check">${Icons.check || ''}</div>
                            <div class="cs-icon-cross">${Icons.cross || ''}</div>
                        </div>`;
                }

                li.innerHTML = `
                    ${opt.iconHtml || ''}
                    <div class="custom-select-text"><span>${opt.label}</span></div>
                    ${extraUI}
                `;

                li.addEventListener('click', (e) => {
                    e.stopPropagation(); 
                    this._handleSelection(opt, li);
                });
            }
            
            this.dropdown.appendChild(li);
        });

        this._updateTriggerUI();
    }

    _handleSelection(option, liElement) {
        if (this.isMultiple && option.type !== 'dual-toggle') {
            if (this.selectedValues.has(option.id)) {
                this.selectedValues.delete(option.id);
            } else {
                this.selectedValues.add(option.id);
            }
            this._updateListUI();
            this._updateTriggerUI();
            if (this.onChange) this.onChange(Array.from(this.selectedValues));

        } else if (option.type === 'dual-toggle') {
            const switchEl = liElement.querySelector('.cs-dual-switch');
            const isState2 = switchEl.classList.contains('state-2');
            
            const newStateId = isState2 ? option.state1.id : option.state2.id;
            
            this.selectedValues.delete(option.state1.id);
            this.selectedValues.delete(option.state2.id);
            this.selectedValues.add(newStateId);
            
            switchEl.classList.toggle('state-1', isState2);
            switchEl.classList.toggle('state-2', !isState2);
            
            const btns = liElement.querySelectorAll('.cs-dual-btn');
            btns[0].classList.toggle('active', isState2);
            btns[1].classList.toggle('active', !isState2);

            this._updateTriggerUI(); 
            if (this.onChange) this.onChange(Array.from(this.selectedValues));

        } else {
            this.selectedValues.clear();
            this.selectedValues.add(option.id);
            this._updateListUI();
            this._updateTriggerUI();
            this.close();
            if (this.onChange) this.onChange(option.id);
        }
    }

    _updateListUI() {
        this.dropdown.querySelectorAll('li.custom-select-option').forEach(li => {
            if (li.dataset.id && !li.classList.contains('is-dual-toggle')) {
                li.classList.toggle('selected', this.selectedValues.has(li.dataset.id));
            }
        });
    }

    _updateTriggerUI() {
        if (this.keepPlaceholder) {
            if (this.textContainer && this.placeholder) {
                this.textContainer.innerHTML = this.placeholder;
            }
            if (this.iconContainer && this.triggerIcon) {
                this.iconContainer.innerHTML = this.triggerIcon;
                this.iconContainer.classList.toggle('svg-icon', this.triggerIcon.includes('<svg'));
            }
            return;
        }

        if (this.selectedValues.size === 0) {
            if (this.textContainer) this.textContainer.innerHTML = this.placeholder;
            if (this.iconContainer) this.iconContainer.innerHTML = '';
            return;
        }

        if (this.isMultiple) {
            // Исключаем dual-toggle из подсчета выбранных элементов для UI
            const normalSelections = Array.from(this.selectedValues).filter(val => 
                this.optionsData.some(o => o.id === val && o.type !== 'dual-toggle')
            );

            if (normalSelections.length === 1) {
                const opt = this.optionsData.find(o => o.id === normalSelections[0]);
                if (opt) {
                    if (this.textContainer) this.textContainer.innerHTML = opt.label;
                    if (this.iconContainer && opt.iconHtml) this.iconContainer.innerHTML = opt.iconHtml;
                }
            } else {
                if (this.textContainer) this.textContainer.innerHTML = `Выбрано: ${normalSelections.length}`;
                if (this.iconContainer) {
                    this.iconContainer.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>`;
                }
            }
        } else {
            const opt = this.optionsData.find(o => o.id === Array.from(this.selectedValues)[0]);
            if (opt) {
                if (this.textContainer) this.textContainer.innerHTML = opt.label;
                if (this.iconContainer && opt.iconHtml) {
                    this.iconContainer.innerHTML = opt.iconHtml;
                    this.iconContainer.classList.toggle('svg-icon', opt.iconHtml.includes('<svg'));
                }
            }
        }
    }
}

window.CustomSelect = CustomSelect;