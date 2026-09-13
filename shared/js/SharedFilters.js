import { Icons } from './icons.js';

/**
 * Фабрика общих фильтров. 
 * Устраняет дублирование кода селектов на разных страницах.
 */
export const SharedFilters = {
    
    /**
     * Создает стандартный двойной переключатель сортировки (Дата / Алфавит)
     * Используется в Каталоге и Музыке
     */
    initSortFilter(containerId, defaultState, onChangeCallback) {
        const select = new window.CustomSelect(containerId, {
            keepPlaceholder: true,
            placeholder: 'Сортировка',
            triggerIcon: `<div class="svg-icon">${Icons.filter_sort}</div>`,
            onChange: (selectedIds) => {
                const type = selectedIds.includes('alpha') ? 'alpha' : 'date';
                const dir = selectedIds.includes('asc') ? 'asc' : 'desc';
                if (onChangeCallback) onChangeCallback(`${type}_${dir}`);
            }
        });

        select.populate([
            {
                id: 'sort_type',
                type: 'dual-toggle',
                state1: { id: 'date', label: 'По дате', iconHtml: `<div class="svg-icon">${Icons.sort_date}</div>` },
                state2: { id: 'alpha', label: 'По алфавиту', iconHtml: `<div class="svg-icon">${Icons.sort_alpha}</div>` }
            },
            {
                id: 'sort_dir',
                type: 'dual-toggle',
                state1: { id: 'desc', label: 'Убывание', iconHtml: `<div class="svg-icon">${Icons.sort_desc}</div>` },
                state2: { id: 'asc', label: 'Возрастание', iconHtml: `<div class="svg-icon">${Icons.sort_asc}</div>` }
            }
        ], defaultState);

        return select;
    },

    /**
     * Создает переключатель сортировки только по времени (Новые / Старые)
     * Идеально подходит для Ленты (Feed)
     */
    initDateSortFilter(containerId, defaultState, onChangeCallback) {
        const select = new window.CustomSelect(containerId, {
            keepPlaceholder: true,
            placeholder: 'Сортировка',
            triggerIcon: `<div class="svg-icon">${Icons.filter_sort}</div>`,
            onChange: (selectedIds) => {
                const dir = selectedIds.includes('asc') ? 'asc' : 'desc';
                if (onChangeCallback) onChangeCallback(dir);
            }
        });

        select.populate([
            {
                id: 'sort_dir',
                type: 'dual-toggle',
                state1: { id: 'desc', label: 'Сначала новые', iconHtml: `<div class="svg-icon">${Icons.sort_desc}</div>` },
                state2: { id: 'asc', label: 'Сначала старые', iconHtml: `<div class="svg-icon">${Icons.sort_asc}</div>` }
            }
        ], defaultState);

        return select;
    }
};