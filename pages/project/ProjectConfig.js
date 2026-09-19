// FILE: pages/project/ProjectConfig.js

export const ProjectConfig = {
    // Список внешних зависимостей, которые Модель должна автоматически загрузить,
    // если найдет соответствующие ключи в data.json проекта.
    dependencies: ['translators', 'records', 'characters'],

    // Конфигурация вкладок и блоков в зависимости от типа проекта
    layouts: {
        game: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['tags', 'languages', 'translators', 'specs'] },
            { id: 'lore', label: 'Летопись', main: ['chapters', 'story'], sidebar: ['characters'] },
            { id: 'gameplay', label: 'Геймплей', main: ['mechanics', 'controls', 'achievements'], sidebar: [] },
            { id: 'extras', label: 'Архивы', main: ['development', 'trivia', 'records'], sidebar: [] }
        ],
        book: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['tags', 'languages', 'translators', 'specs'] },
            { id: 'lore', label: 'Летопись', main: ['chapters', 'story'], sidebar: ['characters'] },
            { id: 'extras', label: 'Архивы', main: ['development', 'trivia', 'records'], sidebar: [] }
        ],
        movie: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['tags', 'languages', 'translators', 'specs'] },
            { id: 'lore', label: 'Летопись', main: ['chapters', 'story'], sidebar: ['characters'] },
            { id: 'extras', label: 'Архивы', main: ['development', 'trivia', 'records'], sidebar: [] }
        ]
    },

    getLayout(type) {
        return this.layouts[type] || this.layouts['game'];
    }
};