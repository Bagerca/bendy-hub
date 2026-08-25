export class HomeController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        try {
            const data = await this.model.fetchHomeData();
            
            // Если данные загружены, передаем их в View
            this.view.renderManifesto(data.manifesto);
            this.view.renderTeam(data.team);
        } catch (error) {
            // В случае ошибки показываем fallback
            this.view.renderErrorState();
        }
    }
}