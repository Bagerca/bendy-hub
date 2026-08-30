export class CustomSelect {
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

        // Делаем триггер фокусируемым для A11y
        this.trigger.setAttribute('tabindex', '0');

        CustomSelect.instances.push(this);

        this.trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggle();
        });

        // Поддержка навигации с клавиатуры
        this.trigger.addEventListener('keydown', (e) => this._handleKeydown(e));

        document.addEventListener('click', (e) => {
            if (!this.container.contains(e.target) && this.isOpen) this.close();
        });
    }

    _handleKeydown(e) {
        if (!this.isOpen) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.toggle();
                setTimeout(() => {
                    const firstOpt = this.dropdown.querySelector('.custom-select-option');
                    if (firstOpt) firstOpt.focus();
                }, 50);
            }
            return;
        }

        const options = Array.from(this.dropdown.querySelectorAll('.custom-select-option'));
        if (options.length === 0) return;

        const currentIndex = options.indexOf(document.activeElement);

        if (e.key === 'Escape') {
            this.close();
            this.trigger.focus();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            const nextIndex = currentIndex < options.length - 1 ? currentIndex + 1 : 0;
            options[nextIndex].focus();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            const prevIndex = currentIndex > 0 ? currentIndex - 1 : options.length - 1;
            options[prevIndex].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            if (currentIndex !== -1) {
                options[currentIndex].click();
                this.trigger.focus();
            }
        }
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

    populate(options, defaultId) {
        this.dropdown.innerHTML = '';
        
        options.forEach(opt => {
            const li = document.createElement('li');
            li.className = 'custom-select-option';
            li.setAttribute('tabindex', '-1'); // Делаем фокусируемым программно
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

window.CustomSelect = CustomSelect;