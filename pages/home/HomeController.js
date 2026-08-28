export class HomeController {
    constructor(model, view) {
        this.model = model;
        this.view = view;
    }

    async init() {
        try {
            const data = await this.model.fetchHomeData();
            
            // Передаем данные в View
            this.view.renderManifesto(data.manifesto);
            this.view.renderStats(data.stats);
            this.view.renderTeam(data.team);
            this.view.renderJoinTeam(data.joinTeam);
            
        } catch (error) {
            this.view.renderErrorState();
        }
    }
}