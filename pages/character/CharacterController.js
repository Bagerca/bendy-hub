export class CharacterController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const charId = urlParams.get('id');
        const versionParam = urlParams.get('v'); // Читаем параметр версии

        if (!charId) {
            this.view.renderErrorState('Персонаж не найден. Некорректная ссылка.');
            return;
        }

        try {
            const charData = await this.model.fetchCharacter(charId);
            
            // Передаем параметр версии во View, чтобы он сразу включил нужную вкладку
            const initialVersionIndex = versionParam ? parseInt(versionParam, 10) : 0;
            this.view.render(charData, charId, initialVersionIndex);
            
            this.view.hideLoader();

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