export class CommunityView {
    constructor() {}

    renderWidgets(config) {
        if (!config || !config.tgChannels) return;

        config.tgChannels.forEach(channel => {
            const container = document.getElementById(channel.id);
            if (!container) return;
            
            // Очищаем спиннер загрузки
            container.innerHTML = '';

            // Создаем IFrame. 
            // Используем t.me/s/ (Web Preview), который позволяет скроллить весь канал.
            const iframe = document.createElement('iframe');
            iframe.src = channel.url;
            iframe.setAttribute('allowfullscreen', 'true');
            // Добавляем песочницу для безопасности, но разрешаем скрипты и скроллинг внутри ТГ
            iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups');
            
            container.appendChild(iframe);
        });
    }
}