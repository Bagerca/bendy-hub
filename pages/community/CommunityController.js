export class CommunityController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        // Получаем настройки
        const config = this.model.getConfig();
        
        // Рендерим виджеты
        this.view.renderWidgets(config);
    }

    // Роутер вызовет это при уходе со страницы, чтобы мы могли убить виджеты (если нужно)
    destroy() {
        const twContainer = document.getElementById('twitch-container');
        if (twContainer) twContainer.innerHTML = '';
    }
}