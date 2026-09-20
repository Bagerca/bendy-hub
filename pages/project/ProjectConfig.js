// FILE: pages/project/ProjectConfig.js

export const ProjectConfig = {
    dependencies: ['translators', 'records', 'characters'],

    layouts: {
        game: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['dlc', 'tags', 'languages', 'translators', 'specs'] },
            // Добавили sidebarStyle: 'wide' для Летописи
            { id: 'lore', label: 'Летопись', main: ['story', 'chapters'], sidebar: ['characters'], sidebarStyle: 'wide' },
            { id: 'gameplay', label: 'Геймплей', main: ['mechanics', 'controls', 'achievements'], sidebar: [] },
            { id: 'secrets', label: 'Секреты', main: ['arsenal', 'events', 'easter_eggs'], sidebar: [] },
            { id: 'extras', label: 'Архивы', main: ['development', 'credits', 'trivia', 'records'], sidebar: [] }
        ],
        book: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['tags', 'languages', 'translators', 'specs'] },
            { id: 'lore', label: 'Летопись', main: ['story', 'chapters'], sidebar: ['characters'], sidebarStyle: 'wide' },
            { id: 'extras', label: 'Архивы', main: ['development', 'credits', 'trivia', 'records'], sidebar: [] }
        ],
        movie: [
            { id: 'overview', label: 'Обзор', main: ['description', 'gallery', 'reviews'], sidebar: ['tags', 'languages', 'translators', 'specs'] },
            { id: 'lore', label: 'Летопись', main: ['story', 'chapters'], sidebar: ['characters'], sidebarStyle: 'wide' },
            { id: 'extras', label: 'Архивы', main: ['development', 'credits', 'trivia', 'records'], sidebar: [] }
        ]
    },

    getLayout(type) {
        return this.layouts[type] || this.layouts['game'];
    }
};