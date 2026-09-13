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

        options.forEach(opt => {
            const li = document.createElement('li');
            li.className = 'custom-select-option';
            li.dataset.id = opt.id;
            
            // Если это не дуал-тоггл, устанавливаем класс selected
            if (opt.type !== 'dual-toggle' && this.selectedValues.has(opt.id)) {
                li.classList.add('selected');
            }

            // --- ДВОЙНОЙ ПЕРЕКЛЮЧАТЕЛЬ ---
            if (opt.type === 'dual-toggle') {
                li.classList.add('is-dual-toggle');
                
                // Проверяем, какой из двух стейтов сейчас активен в Set
                const isActiveState2 = this.selectedValues.has(opt.state2.id);
                const currentStateClass = isActiveState2 ? 'state-2' : 'state-1';
                
                li.innerHTML = `
                    <div class="cs-dual-switch ${currentStateClass}">
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
                // СТАНДАРТНАЯ ОТРИСОВКА ИЛИ МУЛЬТИ-СЕЛЕКТ С ГАЛОЧКОЙ
                let extraUI = '';
                if (this.isMultiple) {
                    extraUI = `<div class="cs-checkbox"><svg viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"></polyline></svg></div>`;
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
        if (this.isMultiple) {
            if (this.selectedValues.has(option.id)) {
                this.selectedValues.delete(option.id);
            } else {
                this.selectedValues.add(option.id);
            }

            this.dropdown.querySelectorAll('li').forEach(li => {
                li.classList.toggle('selected', this.selectedValues.has(li.dataset.id));
            });

            this._updateTriggerUI();
            if (this.onChange) this.onChange(Array.from(this.selectedValues));

        } else if (option.type === 'dual-toggle') {
            const switchEl = liElement.querySelector('.cs-dual-switch');
            const isState2 = switchEl.classList.contains('state-2');
            
            // Если сейчас State 2, переключаем на State 1, и наоборот
            const newStateId = isState2 ? option.state1.id : option.state2.id;
            
            // Удаляем оба возможных значения из Set и добавляем новое
            this.selectedValues.delete(option.state1.id);
            this.selectedValues.delete(option.state2.id);
            this.selectedValues.add(newStateId);
            
            // Анимируем переключатель
            switchEl.classList.toggle('state-1', isState2);
            switchEl.classList.toggle('state-2', !isState2);
            
            const btns = liElement.querySelectorAll('.cs-dual-btn');
            btns[0].classList.toggle('active', isState2);
            btns[1].classList.toggle('active', !isState2);

            this._updateTriggerUI(); 
            // Отправляем массив текущих состояний всех селектов внутри дропдауна
            if (this.onChange) this.onChange(Array.from(this.selectedValues));

        } else {
            this.selectedValues.clear();
            this.selectedValues.add(option.id);
            
            this.dropdown.querySelectorAll('li').forEach(opt => opt.classList.remove('selected'));
            liElement.classList.add('selected');
            
            this._updateTriggerUI();
            this.close();
            if (this.onChange) this.onChange(option.id);
        }
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
            if (this.selectedValues.size === 1) {
                const id = Array.from(this.selectedValues)[0];
                const opt = this.optionsData.find(o => o.id === id);
                if (opt) {
                    if (this.textContainer) this.textContainer.innerHTML = opt.label;
                    if (this.iconContainer && opt.iconHtml) this.iconContainer.innerHTML = opt.iconHtml;
                }
            } else {
                if (this.textContainer) this.textContainer.innerHTML = `Выбрано: ${this.selectedValues.size}`;
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