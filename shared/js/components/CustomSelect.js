export class CustomSelect {
    // Храним ссылки на все инстансы для глобального управления
    static instances = [];

    constructor(containerId, onChangeCallback) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.trigger = this.container.querySelector('.custom-select-trigger');
        this.dropdown = this.container.querySelector('.custom-select-dropdown');
        this.iconContainer = this.container.querySelector('.custom-select-icon');
        this.textContainer = this.container.querySelector('.custom-select-text-value');
        
        this.onChange = onChangeCallback;
        this.isOpen = false;

        // Регистрируем этот компонент в глобальном массиве
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
            // Если мы пытаемся открыть селект, сначала закрываем все остальные
            CustomSelect.instances.forEach(instance => {
                if (instance !== this && instance.isOpen) {
                    instance.close();
                }
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

    populate(options, defaultId) {
        this.dropdown.innerHTML = '';
        
        options.forEach(opt => {
            const li = document.createElement('li');
            li.className = 'custom-select-option';
            if (opt.id === defaultId) li.classList.add('selected');

            li.innerHTML = `
                ${opt.iconHtml || ''}
                <div class="custom-select-text"><span>${opt.label}</span></div>
            `;

            li.addEventListener('click', () => this.selectValue(opt, li));
            this.dropdown.appendChild(li);
        });

        const defaultOpt = options.find(o => o.id === defaultId);
        if (defaultOpt) this.updateTriggerUI(defaultOpt);
    }

    selectValue(option, liElement) {
        this.updateTriggerUI(option);
        this.dropdown.querySelectorAll('li').forEach(opt => opt.classList.remove('selected'));
        liElement.classList.add('selected');
        this.close();
        if (this.onChange) this.onChange(option.id);
    }

    updateTriggerUI(option) {
        if (this.textContainer) this.textContainer.textContent = option.label;
        if (this.iconContainer && option.iconHtml) {
            this.iconContainer.innerHTML = option.iconHtml;
            this.iconContainer.classList.toggle('svg-icon', option.iconHtml.includes('<svg'));
        }
    }
}