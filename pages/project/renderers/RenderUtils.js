export class RenderUtils {
    // Умная проверка на пустоту (Скрывает блок полностью)
    static isEmpty(val) {
        if (val === null || val === undefined || val === '') return true;
        if (Array.isArray(val) && val.length === 0) return true;
        if (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0) return true;
        return false;
    }

    // Умная проверка на заглушки "..." (Показывает карточку с замочком)
    static isPlaceholder(val) {
        if (val === '...') return true;
        
        // Если это массив заглушек
        if (Array.isArray(val) && val.length > 0) {
            const first = val[0];
            
            if (first === '...') return true;
            
            if (typeof first === 'object' && first !== null) {
                // Проверка для стандартных блоков (история, главы)
                if (first.title === '...' || first.text === '...') return true;
                
                // Проверка для системных требований (specs)
                if (Array.isArray(first.minimum) && first.minimum[0] === '...') return true;
                if (Array.isArray(first.recommended) && first.recommended[0] === '...') return true;
                
                // Проверка для языков (languages)
                if (first.lang === '...') return true;
            }
        }
        
        // Если это объект-заглушка
        if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
            const values = Object.values(val);
            if (values.length > 0 && values[0] === '...') return true;
        }
        
        return false;
    }

    // Генерация красивой карточки-заглушки
    static renderPlaceholder(title) {
        return `
        <div class="bento-box wiki-placeholder-box">
            <div class="wiki-placeholder-content">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                <div class="wp-texts">
                    <span class="wp-title">${title}</span>
                    <span class="wp-desc">Информация засекречена или собирается архивариусом.</span>
                </div>
            </div>
        </div>`;
    }

    static renderText(text, blockTitle) {
        if (this.isEmpty(text)) return null;
        if (this.isPlaceholder(text)) return this.renderPlaceholder(blockTitle);
        return `<div class="bento-box"><p class="project-desc">${text}</p></div>`;
    }

    static renderList(items, className, blockTitle) {
        if (this.isEmpty(items)) return null;
        if (this.isPlaceholder(items)) return this.renderPlaceholder(blockTitle);
        return `<div class="bento-box"><ul class="${className}">${items.map(i => `<li>${i}</li>`).join('')}</ul></div>`;
    }
}