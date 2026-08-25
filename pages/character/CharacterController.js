export class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const charId = urlParams.get('id');

        if (!charId) {
            this.view.renderErrorState('Персонаж не найден. Некорректная ссылка.');
            return;
        }

        try {
            // 1. Загружаем и рендерим основные данные персонажа
            const charData = await this.model.fetchCharacter(charId);
            this.view.render(charData, charId);
            
            // 2. Показываем интерфейс (чтобы юзер не ждал загрузки связей с играми)
            this.view.hideLoader();

            // 3. Фоновая подгрузка связей с играми
            this.view.renderAppearancesLoading();
            try {
                const games = await this.model.findAppearances(charId);
                this.view.renderAppearances(games);
            } catch (err) {
                this.view.renderAppearancesError();
            }

        } catch (error) {
            this.view.renderErrorState('Личное дело засекречено или файл поврежден.');
        }
    }
}