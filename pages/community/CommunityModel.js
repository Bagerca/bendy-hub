export class CommunityModel {
    constructor() {
        this.config = {
            // Конфигурация для каналов. 
            // Добавляем параметр ?dark=1, чтобы ТГ принудительно отдавал тёмную тему,
            // которая идеально впишется в наш дизайн.
            tgChannels: [
                { 
                    id: 'tg-children-container', 
                    url: 'https://t.me/s/Children_of_the_Machine?dark=1' 
                },
                { 
                    id: 'tg-theories-container', 
                    url: 'https://t.me/s/batimtheories?dark=1' 
                }
            ]
        };
    }

    getConfig() {
        return this.config;
    }
}